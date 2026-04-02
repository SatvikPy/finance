import { PrismaClient } from "@prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";

// Keep a single Prisma instance in dev to avoid exhausting connections.
const globalForPrisma = global as unknown as { prisma?: PrismaClient };

function sqliteAdapterUrlFromEnv(envValue: string | undefined): string {
  // Prisma uses DATABASE_URL like "file:./dev.db". The adapter expects a better-sqlite3 style path.
  const raw = envValue ?? "file:./dev.db";
  if (raw.startsWith("file:")) return raw.slice("file:".length);
  return raw;
}

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    adapter: new PrismaBetterSqlite3({ url: sqliteAdapterUrlFromEnv(process.env.DATABASE_URL) }),
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

