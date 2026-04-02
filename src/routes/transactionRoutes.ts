import { Router } from "express";
import { z } from "zod";
import { authRequired } from "../middleware/auth";
import { requireRoles } from "../middleware/rbac";
import { createTransaction, listTransactions, getTransaction, softDeleteTransaction, updateTransaction } from "../services/transactionService";

export const transactionRouter = Router();

const createTxSchema = z.object({
  amount: z.union([z.number(), z.string()]),
  type: z.enum(["INCOME", "EXPENSE"]),
  category: z.string().min(1).max(50),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  notes: z.string().max(500).optional(),
});

const updateTxSchema = z
  .object({
    amount: z.union([z.number(), z.string()]).optional(),
    type: z.enum(["INCOME", "EXPENSE"]).optional(),
    category: z.string().min(1).max(50).optional(),
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
    notes: z.string().max(500).nullable().optional(),
  })
  .refine((v) => Object.keys(v).length > 0, { message: "No updates provided" });

const listQuerySchema = z.object({
  type: z.enum(["INCOME", "EXPENSE"]).optional(),
  category: z.string().min(1).max(50).optional(),
  from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  search: z.string().max(100).optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});

transactionRouter.post("/", authRequired, requireRoles("ADMIN"), async (req, res, next) => {
  try {
    const body = createTxSchema.parse(req.body);
    const userId = req.user!.id;
    const tx = await createTransaction({
      amount: body.amount,
      type: body.type,
      category: body.category,
      date: body.date,
      notes: body.notes ?? null,
      createdByUserId: userId,
    });
    return res.status(201).json({ transaction: tx });
  } catch (err) {
    return next(err);
  }
});

transactionRouter.get("/", authRequired, requireRoles("ANALYST", "ADMIN"), async (req, res, next) => {
  try {
    const q = listQuerySchema.parse(req.query);
    const result = await listTransactions({
      page: q.page,
      pageSize: q.pageSize,
      ...(q.type ? { type: q.type } : {}),
      ...(q.category ? { category: q.category } : {}),
      ...(q.from ? { from: q.from } : {}),
      ...(q.to ? { to: q.to } : {}),
      ...(q.search ? { search: q.search } : {}),
    });
    return res.json(result);
  } catch (err) {
    return next(err);
  }
});

transactionRouter.get("/:id", authRequired, requireRoles("ANALYST", "ADMIN"), async (req, res, next) => {
  try {
    const p = z.object({ id: z.string().min(1) }).parse(req.params);
    const tx = await getTransaction(p.id);
    return res.json({ transaction: tx });
  } catch (err) {
    return next(err);
  }
});

transactionRouter.patch("/:id", authRequired, requireRoles("ADMIN"), async (req, res, next) => {
  try {
    const p = z.object({ id: z.string().min(1) }).parse(req.params);
    const body = updateTxSchema.parse(req.body);

    const tx = await updateTransaction({
      transactionId: p.id,
      ...(body.amount !== undefined ? { amount: body.amount } : {}),
      ...(body.type ? { type: body.type } : {}),
      ...(body.category ? { category: body.category } : {}),
      ...(body.date ? { date: body.date } : {}),
      ...(body.notes === undefined ? {} : { notes: body.notes }),
    });

    return res.json({ transaction: tx });
  } catch (err) {
    return next(err);
  }
});

transactionRouter.delete("/:id", authRequired, requireRoles("ADMIN"), async (req, res, next) => {
  try {
    const p = z.object({ id: z.string().min(1) }).parse(req.params);
    await softDeleteTransaction(p.id);
    return res.status(204).send();
  } catch (err) {
    return next(err);
  }
});

