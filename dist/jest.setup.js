"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const node_child_process_1 = require("node:child_process");
process.env.NODE_ENV = "test";
process.env.JWT_SECRET = "test-secret";
process.env.JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN ?? "1h";
process.env.DATABASE_URL = process.env.DATABASE_URL ?? "file:./test.db";
// Ensure schema exists for integration tests.
(0, node_child_process_1.execSync)("npx prisma db push", {
    stdio: "inherit",
    env: process.env,
});
//# sourceMappingURL=jest.setup.js.map