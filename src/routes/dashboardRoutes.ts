import { Router } from "express";
import { z } from "zod";
import { authRequired } from "../middleware/auth";
import { requireRoles } from "../middleware/rbac";
import { getDashboardSummary } from "../services/transactionService";
import type { Granularity } from "../utils/period";

export const dashboardRouter = Router();

const querySchema = z.object({
  from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  granularity: z.enum(["monthly", "weekly"]).optional().default("monthly"),
  recentLimit: z.coerce.number().int().min(1).max(50).optional().default(10),
});

dashboardRouter.get(
  "/summary",
  authRequired,
  requireRoles("VIEWER", "ANALYST", "ADMIN"),
  async (req, res, next) => {
    try {
      const q = querySchema.parse(req.query);
      const summary = await getDashboardSummary({
        ...(q.from ? { from: q.from } : {}),
        ...(q.to ? { to: q.to } : {}),
        granularity: q.granularity as Granularity,
        recentLimit: q.recentLimit,
      });
      return res.json({ summary });
    } catch (err) {
      return next(err);
    }
  }
);

