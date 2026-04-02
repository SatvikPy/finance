"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.prisma = void 0;
const client_1 = require("@prisma/client");
const adapter_pg_1 = require("@prisma/adapter-pg");
// Keep a single Prisma instance in dev to avoid exhausting connections.
const globalForPrisma = global;
const connectionUrl = process.env.DIRECT_URL ?? process.env.DATABASE_URL;
if (!connectionUrl) {
    throw new Error("Missing DIRECT_URL or DATABASE_URL for Prisma");
}
exports.prisma = globalForPrisma.prisma ??
    new client_1.PrismaClient({
        adapter: new adapter_pg_1.PrismaPg({ connectionString: connectionUrl }),
        log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
    });
if (process.env.NODE_ENV !== "production")
    globalForPrisma.prisma = exports.prisma;
//# sourceMappingURL=prisma.js.map