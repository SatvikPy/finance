"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authRouter = void 0;
const express_1 = require("express");
const zod_1 = require("zod");
const authService_1 = require("../services/authService");
const errors_1 = require("../utils/errors");
exports.authRouter = (0, express_1.Router)();
const loginSchema = zod_1.z.object({
    username: zod_1.z.string().min(3).max(50),
    password: zod_1.z.string().min(6).max(200),
});
exports.authRouter.post("/login", async (req, res, next) => {
    try {
        const body = loginSchema.parse(req.body);
        const result = await (0, authService_1.login)(body);
        return res.status(200).json(result);
    }
    catch (err) {
        // If bcrypt/prisma throws, it will be handled by errorHandler.
        if (err instanceof errors_1.AppError)
            return next(err);
        return next(err);
    }
});
exports.authRouter.post("/logout", async (_req, res) => {
    // Stateless JWT logout: clients can simply discard the token.
    res.status(204).send();
});
//# sourceMappingURL=authRoutes.js.map