import { prisma } from "../db/prisma";
import { AppError } from "../utils/errors";
import { formatMoneyFromCents, parseMoneyToCents } from "../utils/money";
import { periodKey, utcEndOfDay, utcStartOfDay, utcDateFromYmd, type Granularity } from "../utils/period";

export type TransactionDTO = {
  id: string;
  amount: string;
  type: "INCOME" | "EXPENSE";
  category: string;
  date: string; // YYYY-MM-DD
  notes?: string | null;
};

export type ListTransactionsResult = {
  items: TransactionDTO[];
  total: number;
  page: number;
  pageSize: number;
};

export type CategoryTotals = {
  category: string;
  incomeTotal: string;
  expenseTotal: string;
};

export type DashboardTrendPoint = {
  period: string;
  incomeTotal: string;
  expenseTotal: string;
  netBalance: string;
};

export type DashboardSummary = {
  range: { from: string; to: string };
  totals: { totalIncome: string; totalExpenses: string; netBalance: string };
  categoryTotals: CategoryTotals[];
  recentActivity: TransactionDTO[];
  trends: DashboardTrendPoint[];
};

function ymdUTC(d: Date): string {
  return `${d.getUTCFullYear()}-${(d.getUTCMonth() + 1).toString().padStart(2, "0")}-${d
    .getUTCDate()
    .toString()
    .padStart(2, "0")}`;
}

function mapTx(tx: {
  id: string;
  amountCents: number;
  type: "INCOME" | "EXPENSE";
  category: string;
  date: Date;
  notes: string | null;
}): TransactionDTO {
  return {
    id: tx.id,
    amount: formatMoneyFromCents(tx.amountCents),
    type: tx.type,
    category: tx.category,
    date: ymdUTC(tx.date),
    notes: tx.notes,
  };
}

export async function createTransaction(input: {
  amount: unknown;
  type: "INCOME" | "EXPENSE";
  category: string;
  date: string; // YYYY-MM-DD
  notes?: string | null;
  createdByUserId: string;
}) {
  const amountCents = parseMoneyToCents(input.amount);
  const date = utcDateFromYmd(input.date);

  // Small protection against nonsensical empty category.
  const category = input.category.trim();
  if (!category) throw new AppError({ statusCode: 400, code: "INVALID_CATEGORY", message: "Category is required" });

  if (amountCents === 0) {
    throw new AppError({ statusCode: 400, code: "INVALID_AMOUNT", message: "Amount must be non-zero" });
  }

  const tx = await prisma.transaction.create({
    data: {
      amountCents,
      type: input.type,
      category,
      date,
      notes: input.notes ?? null,
      createdByUserId: input.createdByUserId,
    },
    select: { id: true, amountCents: true, type: true, category: true, date: true, notes: true },
  });

  return mapTx(tx);
}

export async function updateTransaction(input: {
  transactionId: string;
  amount?: unknown;
  type?: "INCOME" | "EXPENSE";
  category?: string;
  date?: string; // YYYY-MM-DD
  notes?: string | null;
}) {
  const tx = await prisma.transaction.findFirst({
    where: { id: input.transactionId, deletedAt: null },
    select: { id: true },
  });
  if (!tx) throw new AppError({ statusCode: 404, code: "NOT_FOUND", message: "Transaction not found" });

  const data: Record<string, unknown> = {};
  if (input.amount !== undefined) data.amountCents = parseMoneyToCents(input.amount);
  if (input.type !== undefined) data.type = input.type;
  if (input.category !== undefined) {
    const c = input.category.trim();
    if (!c) throw new AppError({ statusCode: 400, code: "INVALID_CATEGORY", message: "Category is required" });
    data.category = c;
  }
  if (input.date !== undefined) data.date = utcDateFromYmd(input.date);
  if (input.notes !== undefined) data.notes = input.notes;

  if (Object.keys(data).length === 0) {
    throw new AppError({ statusCode: 400, code: "NO_CHANGES", message: "No updates provided" });
  }

  const updated = await prisma.transaction.update({
    where: { id: input.transactionId },
    data: data as any,
    select: { id: true, amountCents: true, type: true, category: true, date: true, notes: true },
  });

  return mapTx(updated);
}

export async function softDeleteTransaction(transactionId: string) {
  const existing = await prisma.transaction.findFirst({
    where: { id: transactionId, deletedAt: null },
    select: { id: true },
  });
  if (!existing) throw new AppError({ statusCode: 404, code: "NOT_FOUND", message: "Transaction not found" });

  await prisma.transaction.update({
    where: { id: transactionId },
    data: { deletedAt: new Date() },
  });
}

export async function getTransaction(transactionId: string) {
  const tx = await prisma.transaction.findFirst({
    where: { id: transactionId, deletedAt: null },
    select: { id: true, amountCents: true, type: true, category: true, date: true, notes: true },
  });
  if (!tx) throw new AppError({ statusCode: 404, code: "NOT_FOUND", message: "Transaction not found" });
  return mapTx(tx);
}

export async function listTransactions(input: {
  type?: "INCOME" | "EXPENSE";
  category?: string;
  from?: string; // YYYY-MM-DD
  to?: string; // YYYY-MM-DD
  search?: string;
  page: number;
  pageSize: number;
}) {
  const where: any = { deletedAt: null };
  if (input.type) where.type = input.type;
  if (input.category) where.category = input.category;
  if (input.from || input.to) {
    const dateFilter: Record<string, Date> = {};
    if (input.from) dateFilter.gte = utcStartOfDay(utcDateFromYmd(input.from));
    if (input.to) dateFilter.lte = utcEndOfDay(utcDateFromYmd(input.to));
    where.date = dateFilter;
  }
  if (input.search) {
    const s = input.search.trim();
    if (s) {
      where.OR = [
        { category: { contains: s, mode: "insensitive" } },
        { notes: { contains: s, mode: "insensitive" } },
      ];
    }
  }

  const total = await prisma.transaction.count({ where });

  const page = Math.max(1, input.page);
  const pageSize = Math.min(100, Math.max(1, input.pageSize));
  const items = await prisma.transaction.findMany({
    where,
    orderBy: [{ date: "desc" }, { createdAt: "desc" }],
    skip: (page - 1) * pageSize,
    take: pageSize,
    select: { id: true, amountCents: true, type: true, category: true, date: true, notes: true },
  });

  return {
    items: items.map(mapTx),
    total,
    page,
    pageSize,
  } satisfies ListTransactionsResult;
}

export async function getDashboardSummary(input: {
  from?: string; // YYYY-MM-DD
  to?: string; // YYYY-MM-DD
  granularity: Granularity;
  recentLimit: number;
}): Promise<DashboardSummary> {
  const now = new Date();
  const defaultTo = utcEndOfDay(now);
  const defaultFrom = new Date(defaultTo.getTime() - 30 * 24 * 60 * 60 * 1000);

  const fromDate = input.from ? utcStartOfDay(utcDateFromYmd(input.from)) : defaultFrom;
  const toDate = input.to ? utcEndOfDay(utcDateFromYmd(input.to)) : defaultTo;

  const txs = await prisma.transaction.findMany({
    where: { deletedAt: null, date: { gte: fromDate, lte: toDate } },
    orderBy: [{ date: "desc" }, { createdAt: "desc" }],
    select: { id: true, amountCents: true, type: true, category: true, date: true, notes: true },
  });

  let totalIncome = 0;
  let totalExpenses = 0;
  const categoryMap = new Map<string, { income: number; expense: number }>();
  const trendMap = new Map<string, { income: number; expense: number }>();

  for (const tx of txs) {
    if (tx.type === "INCOME") totalIncome += tx.amountCents;
    if (tx.type === "EXPENSE") totalExpenses += tx.amountCents;

    const cat = tx.category;
    const catAgg = categoryMap.get(cat) ?? { income: 0, expense: 0 };
    if (tx.type === "INCOME") catAgg.income += tx.amountCents;
    if (tx.type === "EXPENSE") catAgg.expense += tx.amountCents;
    categoryMap.set(cat, catAgg);

    const p = periodKey(tx.date, input.granularity);
    const trendAgg = trendMap.get(p) ?? { income: 0, expense: 0 };
    if (tx.type === "INCOME") trendAgg.income += tx.amountCents;
    if (tx.type === "EXPENSE") trendAgg.expense += tx.amountCents;
    trendMap.set(p, trendAgg);
  }

  const categoryTotals: DashboardSummary["categoryTotals"] = Array.from(categoryMap.entries()).map(([category, v]) => ({
    category,
    incomeTotal: formatMoneyFromCents(v.income),
    expenseTotal: formatMoneyFromCents(v.expense),
  }));

  // Sort categories alphabetically for deterministic output.
  categoryTotals.sort((a, b) => a.category.localeCompare(b.category));

  const trends: DashboardSummary["trends"] = Array.from(trendMap.entries())
    .map(([period, v]) => ({
      period,
      incomeTotal: formatMoneyFromCents(v.income),
      expenseTotal: formatMoneyFromCents(v.expense),
      netBalance: formatMoneyFromCents(v.income - v.expense),
    }))
    .sort((a, b) => a.period.localeCompare(b.period));

  const recentActivity = txs.slice(0, Math.max(1, Math.min(50, input.recentLimit))).map(mapTx);

  return {
    range: { from: ymdUTC(fromDate), to: ymdUTC(toDate) },
    totals: {
      totalIncome: formatMoneyFromCents(totalIncome),
      totalExpenses: formatMoneyFromCents(totalExpenses),
      netBalance: formatMoneyFromCents(totalIncome - totalExpenses),
    },
    categoryTotals,
    recentActivity,
    trends,
  };
}

