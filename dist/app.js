"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.app = void 0;
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const morgan_1 = __importDefault(require("morgan"));
const errorHandler_1 = require("./middleware/errorHandler");
const authRoutes_1 = require("./routes/authRoutes");
const userRoutes_1 = require("./routes/userRoutes");
const transactionRoutes_1 = require("./routes/transactionRoutes");
const dashboardRoutes_1 = require("./routes/dashboardRoutes");
exports.app = (0, express_1.default)();
exports.default = exports.app;
exports.app.use((0, helmet_1.default)());
exports.app.use((0, cors_1.default)());
exports.app.use((0, morgan_1.default)("dev"));
exports.app.use(express_1.default.json({ limit: "1mb" }));
exports.app.get("/health", (_req, res) => {
    res.status(200).json({ ok: true });
});
exports.app.use("/auth", authRoutes_1.authRouter);
exports.app.use("/users", userRoutes_1.userRouter);
exports.app.use("/transactions", transactionRoutes_1.transactionRouter);
exports.app.use("/dashboard", dashboardRoutes_1.dashboardRouter);
// 404
exports.app.use((_req, res) => {
    res.status(404).json({ error: { code: "NOT_FOUND", message: "Route not found" } });
});
// Error handler
exports.app.use(errorHandler_1.errorHandler);
//# sourceMappingURL=app.js.map