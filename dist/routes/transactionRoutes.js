"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.transactionRouter = void 0;
const express_1 = require("express");
const zod_1 = require("zod");
const auth_1 = require("../middleware/auth");
const rbac_1 = require("../middleware/rbac");
const transactionService_1 = require("../services/transactionService");
exports.transactionRouter = (0, express_1.Router)();
const createTxSchema = zod_1.z.object({
    amount: zod_1.z.union([zod_1.z.number(), zod_1.z.string()]),
    type: zod_1.z.enum(["INCOME", "EXPENSE"]),
    category: zod_1.z.string().min(1).max(50),
    date: zod_1.z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    notes: zod_1.z.string().max(500).optional(),
});
const updateTxSchema = zod_1.z
    .object({
    amount: zod_1.z.union([zod_1.z.number(), zod_1.z.string()]).optional(),
    type: zod_1.z.enum(["INCOME", "EXPENSE"]).optional(),
    category: zod_1.z.string().min(1).max(50).optional(),
    date: zod_1.z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
    notes: zod_1.z.string().max(500).nullable().optional(),
})
    .refine((v) => Object.keys(v).length > 0, { message: "No updates provided" });
const listQuerySchema = zod_1.z.object({
    type: zod_1.z.enum(["INCOME", "EXPENSE"]).optional(),
    category: zod_1.z.string().min(1).max(50).optional(),
    from: zod_1.z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
    to: zod_1.z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
    search: zod_1.z.string().max(100).optional(),
    page: zod_1.z.coerce.number().int().min(1).default(1),
    pageSize: zod_1.z.coerce.number().int().min(1).max(100).default(20),
});
exports.transactionRouter.post("/", auth_1.authRequired, (0, rbac_1.requireRoles)("ADMIN"), async (req, res, next) => {
    try {
        const body = createTxSchema.parse(req.body);
        const userId = req.user.id;
        const tx = await (0, transactionService_1.createTransaction)({
            amount: body.amount,
            type: body.type,
            category: body.category,
            date: body.date,
            notes: body.notes ?? null,
            createdByUserId: userId,
        });
        return res.status(201).json({ transaction: tx });
    }
    catch (err) {
        return next(err);
    }
});
exports.transactionRouter.get("/", auth_1.authRequired, (0, rbac_1.requireRoles)("ANALYST", "ADMIN"), async (req, res, next) => {
    try {
        const q = listQuerySchema.parse(req.query);
        const result = await (0, transactionService_1.listTransactions)({
            page: q.page,
            pageSize: q.pageSize,
            ...(q.type ? { type: q.type } : {}),
            ...(q.category ? { category: q.category } : {}),
            ...(q.from ? { from: q.from } : {}),
            ...(q.to ? { to: q.to } : {}),
            ...(q.search ? { search: q.search } : {}),
        });
        return res.json(result);
    }
    catch (err) {
        return next(err);
    }
});
exports.transactionRouter.get("/:id", auth_1.authRequired, (0, rbac_1.requireRoles)("ANALYST", "ADMIN"), async (req, res, next) => {
    try {
        const p = zod_1.z.object({ id: zod_1.z.string().min(1) }).parse(req.params);
        const tx = await (0, transactionService_1.getTransaction)(p.id);
        return res.json({ transaction: tx });
    }
    catch (err) {
        return next(err);
    }
});
exports.transactionRouter.patch("/:id", auth_1.authRequired, (0, rbac_1.requireRoles)("ADMIN"), async (req, res, next) => {
    try {
        const p = zod_1.z.object({ id: zod_1.z.string().min(1) }).parse(req.params);
        const body = updateTxSchema.parse(req.body);
        const tx = await (0, transactionService_1.updateTransaction)({
            transactionId: p.id,
            ...(body.amount !== undefined ? { amount: body.amount } : {}),
            ...(body.type ? { type: body.type } : {}),
            ...(body.category ? { category: body.category } : {}),
            ...(body.date ? { date: body.date } : {}),
            ...(body.notes === undefined ? {} : { notes: body.notes }),
        });
        return res.json({ transaction: tx });
    }
    catch (err) {
        return next(err);
    }
});
exports.transactionRouter.delete("/:id", auth_1.authRequired, (0, rbac_1.requireRoles)("ADMIN"), async (req, res, next) => {
    try {
        const p = zod_1.z.object({ id: zod_1.z.string().min(1) }).parse(req.params);
        await (0, transactionService_1.softDeleteTransaction)(p.id);
        return res.status(204).send();
    }
    catch (err) {
        return next(err);
    }
});
//# sourceMappingURL=transactionRoutes.js.map