"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.userRouter = void 0;
const express_1 = require("express");
const zod_1 = require("zod");
const bcrypt_1 = __importDefault(require("bcrypt"));
const prisma_1 = require("../db/prisma");
const auth_1 = require("../middleware/auth");
const rbac_1 = require("../middleware/rbac");
const errors_1 = require("../utils/errors");
exports.userRouter = (0, express_1.Router)();
// Validate using explicit string unions to keep TS types straightforward.
const userRoleSchema = zod_1.z.enum(["VIEWER", "ANALYST", "ADMIN"]);
const userStatusSchema = zod_1.z.enum(["ACTIVE", "INACTIVE"]);
const createUserSchema = zod_1.z.object({
    username: zod_1.z.string().min(3).max(50),
    password: zod_1.z.string().min(6).max(200),
    role: userRoleSchema.default("ANALYST"),
    status: userStatusSchema.default("ACTIVE"),
});
const updateUserSchema = zod_1.z
    .object({
    username: zod_1.z.string().min(3).max(50).optional(),
    password: zod_1.z.string().min(6).max(200).optional(),
    role: userRoleSchema.optional(),
    status: userStatusSchema.optional(),
})
    .refine((v) => Object.keys(v).length > 0, { message: "No updates provided" });
exports.userRouter.post("/", auth_1.authRequired, (0, rbac_1.requireRoles)("ADMIN"), async (req, res, next) => {
    try {
        const body = createUserSchema.parse(req.body);
        const passwordHash = await bcrypt_1.default.hash(body.password, 10);
        const user = await prisma_1.prisma.user.create({
            data: { username: body.username, passwordHash, role: body.role, status: body.status },
            select: { id: true, username: true, role: true, status: true, createdAt: true, updatedAt: true },
        });
        return res.status(201).json({ user });
    }
    catch (err) {
        if (err?.code === "P2002") {
            return next(new errors_1.AppError({ statusCode: 409, code: "USERNAME_TAKEN", message: "Username already exists" }));
        }
        return next(err);
    }
});
exports.userRouter.get("/", auth_1.authRequired, (0, rbac_1.requireRoles)("ADMIN"), async (req, res, next) => {
    try {
        const qSchema = zod_1.z.object({
            page: zod_1.z.coerce.number().int().min(1).default(1),
            pageSize: zod_1.z.coerce.number().int().min(1).max(100).default(20),
            status: userStatusSchema.optional(),
        });
        const q = qSchema.parse(req.query);
        const where = {};
        if (q.status)
            where.status = q.status;
        const total = await prisma_1.prisma.user.count({ where });
        const users = await prisma_1.prisma.user.findMany({
            where,
            orderBy: { createdAt: "desc" },
            skip: (q.page - 1) * q.pageSize,
            take: q.pageSize,
            select: { id: true, username: true, role: true, status: true, createdAt: true, updatedAt: true },
        });
        return res.json({ users, total, page: q.page, pageSize: q.pageSize });
    }
    catch (err) {
        return next(err);
    }
});
exports.userRouter.patch("/:id", auth_1.authRequired, (0, rbac_1.requireRoles)("ADMIN"), async (req, res, next) => {
    try {
        const paramSchema = zod_1.z.object({ id: zod_1.z.string().min(1) });
        const p = paramSchema.parse(req.params);
        const body = updateUserSchema.parse(req.body);
        const existing = await prisma_1.prisma.user.findFirst({ where: { id: p.id } });
        if (!existing) {
            return next(new errors_1.AppError({ statusCode: 404, code: "NOT_FOUND", message: "User not found" }));
        }
        const data = {};
        if (body.username)
            data.username = body.username;
        if (body.role)
            data.role = body.role;
        if (body.status)
            data.status = body.status;
        if (body.password)
            data.passwordHash = await bcrypt_1.default.hash(body.password, 10);
        const updated = await prisma_1.prisma.user.update({
            where: { id: p.id },
            data,
            select: { id: true, username: true, role: true, status: true, createdAt: true, updatedAt: true },
        });
        return res.json({ user: updated });
    }
    catch (err) {
        if (err?.code === "P2002") {
            return next(new errors_1.AppError({ statusCode: 409, code: "USERNAME_TAKEN", message: "Username already exists" }));
        }
        return next(err);
    }
});
exports.userRouter.delete("/:id", auth_1.authRequired, (0, rbac_1.requireRoles)("ADMIN"), async (req, res, next) => {
    try {
        const p = zod_1.z.object({ id: zod_1.z.string().min(1) }).parse(req.params);
        const existing = await prisma_1.prisma.user.findFirst({ where: { id: p.id } });
        if (!existing) {
            return next(new errors_1.AppError({ statusCode: 404, code: "NOT_FOUND", message: "User not found" }));
        }
        await prisma_1.prisma.user.update({
            where: { id: p.id },
            data: { status: "INACTIVE" },
        });
        return res.status(204).send();
    }
    catch (err) {
        return next(err);
    }
});
//# sourceMappingURL=userRoutes.js.map