"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const supertest_1 = __importDefault(require("supertest"));
const bcrypt_1 = __importDefault(require("bcrypt"));
const app_1 = require("../app");
const prisma_1 = require("../db/prisma");
async function resetDb() {
    await prisma_1.prisma.transaction.deleteMany({});
    await prisma_1.prisma.user.deleteMany({});
}
async function createUser(params) {
    const passwordHash = await bcrypt_1.default.hash(params.password, 10);
    return prisma_1.prisma.user.create({
        data: { username: params.username, passwordHash, role: params.role, status: "ACTIVE" },
    });
}
describe("Finance backend RBAC + dashboard analytics", () => {
    const password = "Password123!";
    test("viewer cannot create transactions but can read dashboard summary", async () => {
        await resetDb();
        const admin = await createUser({ username: "admin1", role: "ADMIN", password });
        await createUser({ username: "viewer1", role: "VIEWER", password });
        await prisma_1.prisma.transaction.createMany({
            data: [
                {
                    amountCents: 1000,
                    type: "INCOME",
                    category: "Salary",
                    date: new Date(Date.UTC(2026, 3, 1, 0, 0, 0, 0)), // 2026-04-01
                    notes: null,
                    createdByUserId: admin.id,
                },
                {
                    amountCents: 500,
                    type: "EXPENSE",
                    category: "Rent",
                    date: new Date(Date.UTC(2026, 3, 2, 0, 0, 0, 0)), // 2026-04-02
                    notes: null,
                    createdByUserId: admin.id,
                },
            ],
        });
        const loginRes = await (0, supertest_1.default)(app_1.app).post("/auth/login").send({ username: "viewer1", password });
        expect(loginRes.status).toBe(200);
        const token = loginRes.body.token;
        const createRes = await (0, supertest_1.default)(app_1.app)
            .post("/transactions")
            .set("Authorization", `Bearer ${token}`)
            .send({
            amount: 10,
            type: "INCOME",
            category: "Salary",
            date: "2026-04-03",
            notes: "Not allowed",
        });
        expect(createRes.status).toBe(403);
        expect(createRes.body.error.code).toBe("FORBIDDEN");
        const summaryRes = await (0, supertest_1.default)(app_1.app)
            .get("/dashboard/summary?from=2026-04-01&to=2026-04-30&granularity=monthly")
            .set("Authorization", `Bearer ${token}`);
        expect(summaryRes.status).toBe(200);
        expect(summaryRes.body.summary.totals.totalIncome).toBe("10.00");
        expect(summaryRes.body.summary.totals.totalExpenses).toBe("5.00");
        expect(summaryRes.body.summary.totals.netBalance).toBe("5.00");
    });
    test("analyst can list transactions and sees filtered counts", async () => {
        await resetDb();
        const admin = await createUser({ username: "admin1", role: "ADMIN", password });
        await createUser({ username: "analyst1", role: "ANALYST", password });
        await prisma_1.prisma.transaction.createMany({
            data: [
                {
                    amountCents: 1000,
                    type: "INCOME",
                    category: "Salary",
                    date: new Date(Date.UTC(2026, 3, 1, 0, 0, 0, 0)),
                    notes: null,
                    createdByUserId: admin.id,
                },
                {
                    amountCents: 2000,
                    type: "INCOME",
                    category: "Freelance",
                    date: new Date(Date.UTC(2026, 3, 10, 0, 0, 0, 0)),
                    notes: "Side gig",
                    createdByUserId: admin.id,
                },
                {
                    amountCents: 500,
                    type: "EXPENSE",
                    category: "Rent",
                    date: new Date(Date.UTC(2026, 3, 12, 0, 0, 0, 0)),
                    notes: null,
                    createdByUserId: admin.id,
                },
            ],
        });
        const loginRes = await (0, supertest_1.default)(app_1.app).post("/auth/login").send({ username: "analyst1", password });
        expect(loginRes.status).toBe(200);
        const token = loginRes.body.token;
        const listRes = await (0, supertest_1.default)(app_1.app)
            .get("/transactions?type=INCOME&from=2026-04-01&to=2026-04-30&page=1&pageSize=20")
            .set("Authorization", `Bearer ${token}`);
        expect(listRes.status).toBe(200);
        expect(listRes.body.total).toBe(2);
        expect(listRes.body.items.length).toBe(2);
    });
});
//# sourceMappingURL=finance-api.test.js.map