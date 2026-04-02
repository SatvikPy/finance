import { type Granularity } from "../utils/period";
export type TransactionDTO = {
    id: string;
    amount: string;
    type: "INCOME" | "EXPENSE";
    category: string;
    date: string;
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
    range: {
        from: string;
        to: string;
    };
    totals: {
        totalIncome: string;
        totalExpenses: string;
        netBalance: string;
    };
    categoryTotals: CategoryTotals[];
    recentActivity: TransactionDTO[];
    trends: DashboardTrendPoint[];
};
export declare function createTransaction(input: {
    amount: unknown;
    type: "INCOME" | "EXPENSE";
    category: string;
    date: string;
    notes?: string | null;
    createdByUserId: string;
}): Promise<TransactionDTO>;
export declare function updateTransaction(input: {
    transactionId: string;
    amount?: unknown;
    type?: "INCOME" | "EXPENSE";
    category?: string;
    date?: string;
    notes?: string | null;
}): Promise<TransactionDTO>;
export declare function softDeleteTransaction(transactionId: string): Promise<void>;
export declare function getTransaction(transactionId: string): Promise<TransactionDTO>;
export declare function listTransactions(input: {
    type?: "INCOME" | "EXPENSE";
    category?: string;
    from?: string;
    to?: string;
    search?: string;
    page: number;
    pageSize: number;
}): Promise<{
    items: TransactionDTO[];
    total: number;
    page: number;
    pageSize: number;
}>;
export declare function getDashboardSummary(input: {
    from?: string;
    to?: string;
    granularity: Granularity;
    recentLimit: number;
}): Promise<DashboardSummary>;
//# sourceMappingURL=transactionService.d.ts.map