import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

// Keep a single Prisma instance in dev to avoid exhausting connections.
const globalForPrisma = global as unknown as { prisma?: PrismaClient };
const connectionUrl = process.env.DIRECT_URL ?? process.env.DATABASE_URL;

if (!connectionUrl) {
  throw new Error("Missing DIRECT_URL or DATABASE_URL for Prisma");
}

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    adapter: new PrismaPg({ connectionString: connectionUrl }),
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

