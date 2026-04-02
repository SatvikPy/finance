import { Router } from "express";
import { z } from "zod";
import { login } from "../services/authService";
import { AppError } from "../utils/errors";

export const authRouter = Router();

const loginSchema = z.object({
  username: z.string().min(3).max(50),
  password: z.string().min(6).max(200),
});

authRouter.post("/login", async (req, res, next) => {
  try {
    const body = loginSchema.parse(req.body);
    const result = await login(body);
    return res.status(200).json(result);
  } catch (err) {
    // If bcrypt/prisma throws, it will be handled by errorHandler.
    if (err instanceof AppError) return next(err);
    return next(err);
  }
});

authRouter.post("/logout", async (_req, res) => {
  // Stateless JWT logout: clients can simply discard the token.
  res.status(204).send();
});

