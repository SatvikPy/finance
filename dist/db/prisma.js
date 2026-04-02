"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.prisma = void 0;
const client_1 = require("@prisma/client");
const adapter_better_sqlite3_1 = require("@prisma/adapter-better-sqlite3");
// Keep a single Prisma instance in dev to avoid exhausting connections.
const globalForPrisma = global;
function sqliteAdapterUrlFromEnv(envValue) {
    // Prisma uses DATABASE_URL like "file:./dev.db". The adapter expects a better-sqlite3 style path.
    const raw = envValue ?? "file:./dev.db";
    if (raw.startsWith("file:"))
        return raw.slice("file:".length);
    return raw;
}
exports.prisma = globalForPrisma.prisma ??
    new client_1.PrismaClient({
        adapter: new adapter_better_sqlite3_1.PrismaBetterSqlite3({ url: sqliteAdapterUrlFromEnv(process.env.DATABASE_URL) }),
        log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
    });
if (process.env.NODE_ENV !== "production")
    globalForPrisma.prisma = exports.prisma;
//# sourceMappingURL=prisma.js.map