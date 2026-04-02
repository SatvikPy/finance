"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createTransaction = createTransaction;
exports.updateTransaction = updateTransaction;
exports.softDeleteTransaction = softDeleteTransaction;
exports.getTransaction = getTransaction;
exports.listTransactions = listTransactions;
exports.getDashboardSummary = getDashboardSummary;
const prisma_1 = require("../db/prisma");
const errors_1 = require("../utils/errors");
const money_1 = require("../utils/money");
const period_1 = require("../utils/period");
function ymdUTC(d) {
    return `${d.getUTCFullYear()}-${(d.getUTCMonth() + 1).toString().padStart(2, "0")}-${d
        .getUTCDate()
        .toString()
        .padStart(2, "0")}`;
}
function mapTx(tx) {
    return {
        id: tx.id,
        amount: (0, money_1.formatMoneyFromCents)(tx.amountCents),
        type: tx.type,
        category: tx.category,
        date: ymdUTC(tx.date),
        notes: tx.notes,
    };
}
async function createTransaction(input) {
    const amountCents = (0, money_1.parseMoneyToCents)(input.amount);
    const date = (0, period_1.utcDateFromYmd)(input.date);
    // Small protection against nonsensical empty category.
    const category = input.category.trim();
    if (!category)
        throw new errors_1.AppError({ statusCode: 400, code: "INVALID_CATEGORY", message: "Category is required" });
    if (amountCents === 0) {
        throw new errors_1.AppError({ statusCode: 400, code: "INVALID_AMOUNT", message: "Amount must be non-zero" });
    }
    const tx = await prisma_1.prisma.transaction.create({
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
async function updateTransaction(input) {
    const tx = await prisma_1.prisma.transaction.findFirst({
        where: { id: input.transactionId, deletedAt: null },
        select: { id: true },
    });
    if (!tx)
        throw new errors_1.AppError({ statusCode: 404, code: "NOT_FOUND", message: "Transaction not found" });
    const data = {};
    if (input.amount !== undefined)
        data.amountCents = (0, money_1.parseMoneyToCents)(input.amount);
    if (input.type !== undefined)
        data.type = input.type;
    if (input.category !== undefined) {
        const c = input.category.trim();
        if (!c)
            throw new errors_1.AppError({ statusCode: 400, code: "INVALID_CATEGORY", message: "Category is required" });
        data.category = c;
    }
    if (input.date !== undefined)
        data.date = (0, period_1.utcDateFromYmd)(input.date);
    if (input.notes !== undefined)
        data.notes = input.notes;
    if (Object.keys(data).length === 0) {
        throw new errors_1.AppError({ statusCode: 400, code: "NO_CHANGES", message: "No updates provided" });
    }
    const updated = await prisma_1.prisma.transaction.update({
        where: { id: input.transactionId },
        data: data,
        select: { id: true, amountCents: true, type: true, category: true, date: true, notes: true },
    });
    return mapTx(updated);
}
async function softDeleteTransaction(transactionId) {
    const existing = await prisma_1.prisma.transaction.findFirst({
        where: { id: transactionId, deletedAt: null },
        select: { id: true },
    });
    if (!existing)
        throw new errors_1.AppError({ statusCode: 404, code: "NOT_FOUND", message: "Transaction not found" });
    await prisma_1.prisma.transaction.update({
        where: { id: transactionId },
        data: { deletedAt: new Date() },
    });
}
async function getTransaction(transactionId) {
    const tx = await prisma_1.prisma.transaction.findFirst({
        where: { id: transactionId, deletedAt: null },
        select: { id: true, amountCents: true, type: true, category: true, date: true, notes: true },
    });
    if (!tx)
        throw new errors_1.AppError({ statusCode: 404, code: "NOT_FOUND", message: "Transaction not found" });
    return mapTx(tx);
}
async function listTransactions(input) {
    const where = { deletedAt: null };
    if (input.type)
        where.type = input.type;
    if (input.category)
        where.category = input.category;
    if (input.from || input.to) {
        const dateFilter = {};
        if (input.from)
            dateFilter.gte = (0, period_1.utcStartOfDay)((0, period_1.utcDateFromYmd)(input.from));
        if (input.to)
            dateFilter.lte = (0, period_1.utcEndOfDay)((0, period_1.utcDateFromYmd)(input.to));
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
    const total = await prisma_1.prisma.transaction.count({ where });
    const page = Math.max(1, input.page);
    const pageSize = Math.min(100, Math.max(1, input.pageSize));
    const items = await prisma_1.prisma.transaction.findMany({
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
    };
}
async function getDashboardSummary(input) {
    const now = new Date();
    const defaultTo = (0, period_1.utcEndOfDay)(now);
    const defaultFrom = new Date(defaultTo.getTime() - 30 * 24 * 60 * 60 * 1000);
    const fromDate = input.from ? (0, period_1.utcStartOfDay)((0, period_1.utcDateFromYmd)(input.from)) : defaultFrom;
    const toDate = input.to ? (0, period_1.utcEndOfDay)((0, period_1.utcDateFromYmd)(input.to)) : defaultTo;
    const txs = await prisma_1.prisma.transaction.findMany({
        where: { deletedAt: null, date: { gte: fromDate, lte: toDate } },
        orderBy: [{ date: "desc" }, { createdAt: "desc" }],
        select: { id: true, amountCents: true, type: true, category: true, date: true, notes: true },
    });
    let totalIncome = 0;
    let totalExpenses = 0;
    const categoryMap = new Map();
    const trendMap = new Map();
    for (const tx of txs) {
        if (tx.type === "INCOME")
            totalIncome += tx.amountCents;
        if (tx.type === "EXPENSE")
            totalExpenses += tx.amountCents;
        const cat = tx.category;
        const catAgg = categoryMap.get(cat) ?? { income: 0, expense: 0 };
        if (tx.type === "INCOME")
            catAgg.income += tx.amountCents;
        if (tx.type === "EXPENSE")
            catAgg.expense += tx.amountCents;
        categoryMap.set(cat, catAgg);
        const p = (0, period_1.periodKey)(tx.date, input.granularity);
        const trendAgg = trendMap.get(p) ?? { income: 0, expense: 0 };
        if (tx.type === "INCOME")
            trendAgg.income += tx.amountCents;
        if (tx.type === "EXPENSE")
            trendAgg.expense += tx.amountCents;
        trendMap.set(p, trendAgg);
    }
    const categoryTotals = Array.from(categoryMap.entries()).map(([category, v]) => ({
        category,
        incomeTotal: (0, money_1.formatMoneyFromCents)(v.income),
        expenseTotal: (0, money_1.formatMoneyFromCents)(v.expense),
    }));
    // Sort categories alphabetically for deterministic output.
    categoryTotals.sort((a, b) => a.category.localeCompare(b.category));
    const trends = Array.from(trendMap.entries())
        .map(([period, v]) => ({
        period,
        incomeTotal: (0, money_1.formatMoneyFromCents)(v.income),
        expenseTotal: (0, money_1.formatMoneyFromCents)(v.expense),
        netBalance: (0, money_1.formatMoneyFromCents)(v.income - v.expense),
    }))
        .sort((a, b) => a.period.localeCompare(b.period));
    const recentActivity = txs.slice(0, Math.max(1, Math.min(50, input.recentLimit))).map(mapTx);
    return {
        range: { from: ymdUTC(fromDate), to: ymdUTC(toDate) },
        totals: {
            totalIncome: (0, money_1.formatMoneyFromCents)(totalIncome),
            totalExpenses: (0, money_1.formatMoneyFromCents)(totalExpenses),
            netBalance: (0, money_1.formatMoneyFromCents)(totalIncome - totalExpenses),
        },
        categoryTotals,
        recentActivity,
        trends,
    };
}
//# sourceMappingURL=transactionService.js.map