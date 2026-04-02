import * as jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import { prisma } from "../db/prisma";
import { AppError } from "../utils/errors";
import type { Role } from "@prisma/client";

export async function login(params: { username: string; password: string }) {
  const user = await prisma.user.findUnique({
    where: { username: params.username },
  });

  if (!user) {
    throw new AppError({ statusCode: 401, code: "INVALID_CREDENTIALS", message: "Invalid username or password" });
  }

  if (user.status !== "ACTIVE") {
    throw new AppError({ statusCode: 403, code: "INACTIVE_USER", message: "User is inactive" });
  }

  const ok = await bcrypt.compare(params.password, user.passwordHash);
  if (!ok) {
    throw new AppError({ statusCode: 401, code: "INVALID_CREDENTIALS", message: "Invalid username or password" });
  }

  const secret = (process.env.JWT_SECRET ?? "dev-secret") as jwt.Secret;
  const expiresIn = (process.env.JWT_EXPIRES_IN ?? "1h") as NonNullable<jwt.SignOptions["expiresIn"]>;

  const token = jwt.sign(
    {
      userId: user.id,
      username: user.username,
      role: user.role as Role,
      status: user.status,
    },
    secret,
    { expiresIn }
  );

  return {
    token,
    user: {
      id: user.id,
      username: user.username,
      role: user.role,
      status: user.status,
    },
  };
}

