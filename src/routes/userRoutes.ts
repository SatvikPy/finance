import { Router } from "express";
import { z } from "zod";
import bcrypt from "bcrypt";
import { prisma } from "../db/prisma";
import { authRequired } from "../middleware/auth";
import { requireRoles } from "../middleware/rbac";
import { AppError } from "../utils/errors";
import type { Role, UserStatus } from "@prisma/client";

export const userRouter = Router();

// Validate using explicit string unions to keep TS types straightforward.
const userRoleSchema = z.enum(["VIEWER", "ANALYST", "ADMIN"]);
const userStatusSchema = z.enum(["ACTIVE", "INACTIVE"]);

const createUserSchema = z.object({
  username: z.string().min(3).max(50),
  password: z.string().min(6).max(200),
  role: userRoleSchema.default("ANALYST"),
  status: userStatusSchema.default("ACTIVE"),
});

const updateUserSchema = z
  .object({
    username: z.string().min(3).max(50).optional(),
    password: z.string().min(6).max(200).optional(),
    role: userRoleSchema.optional(),
    status: userStatusSchema.optional(),
  })
  .refine((v) => Object.keys(v).length > 0, { message: "No updates provided" });

userRouter.post("/", authRequired, requireRoles("ADMIN"), async (req, res, next) => {
  try {
    const body = createUserSchema.parse(req.body);
    const passwordHash = await bcrypt.hash(body.password, 10);

    const user = await prisma.user.create({
      data: { username: body.username, passwordHash, role: body.role as Role, status: body.status as UserStatus },
      select: { id: true, username: true, role: true, status: true, createdAt: true, updatedAt: true },
    });

    return res.status(201).json({ user });
  } catch (err: any) {
    if (err?.code === "P2002") {
      return next(new AppError({ statusCode: 409, code: "USERNAME_TAKEN", message: "Username already exists" }));
    }
    return next(err);
  }
});

userRouter.get("/", authRequired, requireRoles("ADMIN"), async (req, res, next) => {
  try {
    const qSchema = z.object({
      page: z.coerce.number().int().min(1).default(1),
      pageSize: z.coerce.number().int().min(1).max(100).default(20),
      status: userStatusSchema.optional(),
    });
    const q = qSchema.parse(req.query);

    const where: any = {};
    if (q.status) where.status = q.status;

    const total = await prisma.user.count({ where });
    const users = await prisma.user.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (q.page - 1) * q.pageSize,
      take: q.pageSize,
      select: { id: true, username: true, role: true, status: true, createdAt: true, updatedAt: true },
    });

    return res.json({ users, total, page: q.page, pageSize: q.pageSize });
  } catch (err) {
    return next(err);
  }
});

userRouter.patch("/:id", authRequired, requireRoles("ADMIN"), async (req, res, next) => {
  try {
    const paramSchema = z.object({ id: z.string().min(1) });
    const p = paramSchema.parse(req.params);
    const body = updateUserSchema.parse(req.body);

    const existing = await prisma.user.findFirst({ where: { id: p.id } });
    if (!existing) {
      return next(new AppError({ statusCode: 404, code: "NOT_FOUND", message: "User not found" }));
    }

    const data: any = {};
    if (body.username) data.username = body.username;
    if (body.role) data.role = body.role as Role;
    if (body.status) data.status = body.status as UserStatus;
    if (body.password) data.passwordHash = await bcrypt.hash(body.password, 10);

    const updated = await prisma.user.update({
      where: { id: p.id },
      data,
      select: { id: true, username: true, role: true, status: true, createdAt: true, updatedAt: true },
    });

    return res.json({ user: updated });
  } catch (err: any) {
    if (err?.code === "P2002") {
      return next(new AppError({ statusCode: 409, code: "USERNAME_TAKEN", message: "Username already exists" }));
    }
    return next(err);
  }
});

userRouter.delete("/:id", authRequired, requireRoles("ADMIN"), async (req, res, next) => {
  try {
    const p = z.object({ id: z.string().min(1) }).parse(req.params);

    const existing = await prisma.user.findFirst({ where: { id: p.id } });
    if (!existing) {
      return next(new AppError({ statusCode: 404, code: "NOT_FOUND", message: "User not found" }));
    }

    await prisma.user.update({
      where: { id: p.id },
      data: { status: "INACTIVE" as UserStatus },
    });

    return res.status(204).send();
  } catch (err) {
    return next(err);
  }
});

