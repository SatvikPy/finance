"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const bcrypt_1 = __importDefault(require("bcrypt"));
const prisma_1 = require("./db/prisma");
const SEED_PASSWORD = process.env.SEED_PASSWORD ?? "Password123!";
async function upsertUser(params) {
    const existing = await prisma_1.prisma.user.findUnique({ where: { username: params.username } });
    if (existing)
        return existing;
    const passwordHash = await bcrypt_1.default.hash(SEED_PASSWORD, 10);
    return prisma_1.prisma.user.create({
        data: {
            username: params.username,
            passwordHash,
            role: params.role,
            status: params.status,
        },
    });
}
async function main() {
    const viewer = await upsertUser({ username: "viewer1", role: "VIEWER", status: "ACTIVE" });
    const analyst = await upsertUser({ username: "analyst1", role: "ANALYST", status: "ACTIVE" });
    const admin = await upsertUser({ username: "admin1", role: "ADMIN", status: "ACTIVE" });
    // Add a small dataset for dashboard testing.
    const now = new Date();
    const daysAgo = (n) => {
        const d = new Date(now.getTime() - n * 24 * 60 * 60 * 1000);
        return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 0, 0, 0, 0));
    };
    const existingCount = await prisma_1.prisma.transaction.count({ where: { deletedAt: null } });
    if (existingCount > 0) {
        // Don't spam the DB if seed already ran.
        return;
    }
    await prisma_1.prisma.transaction.createMany({
        data: [
            { amountCents: 500000, type: "INCOME", category: "Salary", date: daysAgo(3), notes: "Monthly salary", createdByUserId: admin.id },
            { amountCents: 200000, type: "INCOME", category: "Freelance", date: daysAgo(10), notes: "Project payout", createdByUserId: admin.id },
            { amountCents: 120000, type: "EXPENSE", category: "Rent", date: daysAgo(5), notes: "April rent", createdByUserId: admin.id },
            { amountCents: 45000, type: "EXPENSE", category: "Groceries", date: daysAgo(6), notes: "Weekly groceries", createdByUserId: admin.id },
            { amountCents: 18000, type: "EXPENSE", category: "Transport", date: daysAgo(8), notes: "Fuel/metro", createdByUserId: admin.id },
            { amountCents: 60000, type: "EXPENSE", category: "Utilities", date: daysAgo(15), notes: "Electricity + water", createdByUserId: admin.id },
            { amountCents: 80000, type: "INCOME", category: "Consulting", date: daysAgo(20), notes: "Consulting work", createdByUserId: analyst.id },
            { amountCents: 25000, type: "EXPENSE", category: "Dining", date: daysAgo(22), notes: null, createdByUserId: analyst.id },
        ],
    });
    // eslint-disable-next-line no-console
    console.log("Seed complete.");
    // eslint-disable-next-line no-console
    console.log(`Seed password for viewer1/analyst1/admin1: ${SEED_PASSWORD}`);
}
main()
    .catch((e) => {
    // eslint-disable-next-line no-console
    console.error(e);
    process.exit(1);
})
    .finally(async () => {
    await prisma_1.prisma.$disconnect();
});
//# sourceMappingURL=seed.js.map