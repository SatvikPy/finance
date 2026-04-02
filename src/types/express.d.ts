import type { Role } from "@prisma/client";

declare module "express-serve-static-core" {
  interface Request {
    user?: {
      id: string;
      username: string;
      role: Role;
      status: "ACTIVE" | "INACTIVE";
    };
  }
}

