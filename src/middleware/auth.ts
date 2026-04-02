import type { NextFunction, Request, Response } from "express";
import * as jwt from "jsonwebtoken";
import { AppError } from "../utils/errors";

export function authRequired(req: Request, _res: Response, next: NextFunction) {
  const authHeader = req.header("authorization");
  if (!authHeader) {
    return next(new AppError({ statusCode: 401, code: "UNAUTHORIZED", message: "Missing auth token" }));
  }

  const [scheme, token] = authHeader.split(" ");
  if (!scheme || scheme.toLowerCase() !== "bearer" || !token) {
    return next(new AppError({ statusCode: 401, code: "UNAUTHORIZED", message: "Invalid auth header" }));
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET ?? "dev-secret") as jwt.JwtPayload & {
      userId?: string;
      username?: string;
      role?: string;
      status?: string;
    };

    if (!payload.userId || !payload.role || !payload.status) {
      return next(new AppError({ statusCode: 401, code: "UNAUTHORIZED", message: "Invalid auth token payload" }));
    }

    req.user = {
      id: payload.userId,
      username: payload.username ?? "",
      role: payload.role as any,
      status: payload.status as any,
    };

    next();
  } catch {
    return next(new AppError({ statusCode: 401, code: "UNAUTHORIZED", message: "Invalid or expired token" }));
  }
}

