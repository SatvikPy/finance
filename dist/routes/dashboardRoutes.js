"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.dashboardRouter = void 0;
const express_1 = require("express");
const zod_1 = require("zod");
const auth_1 = require("../middleware/auth");
const rbac_1 = require("../middleware/rbac");
const transactionService_1 = require("../services/transactionService");
exports.dashboardRouter = (0, express_1.Router)();
const querySchema = zod_1.z.object({
    from: zod_1.z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
    to: zod_1.z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
    granularity: zod_1.z.enum(["monthly", "weekly"]).optional().default("monthly"),
    recentLimit: zod_1.z.coerce.number().int().min(1).max(50).optional().default(10),
});
exports.dashboardRouter.get("/summary", auth_1.authRequired, (0, rbac_1.requireRoles)("VIEWER", "ANALYST", "ADMIN"), async (req, res, next) => {
    try {
        const q = querySchema.parse(req.query);
        const summary = await (0, transactionService_1.getDashboardSummary)({
            ...(q.from ? { from: q.from } : {}),
            ...(q.to ? { to: q.to } : {}),
            granularity: q.granularity,
            recentLimit: q.recentLimit,
        });
        return res.json({ summary });
    }
    catch (err) {
        return next(err);
    }
});
//# sourceMappingURL=dashboardRoutes.js.map