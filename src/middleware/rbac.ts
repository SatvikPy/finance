import type { NextFunction, Request, Response } from "express";
import { AppError } from "../utils/errors";
import type { Role } from "@prisma/client";

export function requireRoles(...roles: Role[]) {
  return (req: Request, _res: Response, next: NextFunction) => {
    const user = req.user;
    if (!user) {
      return next(new AppError({ statusCode: 401, code: "UNAUTHORIZED", message: "Missing auth context" }));
    }

    if (user.status !== "ACTIVE") {
      return next(new AppError({ statusCode: 403, code: "INACTIVE_USER", message: "User is inactive" }));
    }

    if (!roles.includes(user.role as Role)) {
      return next(new AppError({ statusCode: 403, code: "FORBIDDEN", message: "Insufficient permissions" }));
    }

    next();
  };
}

