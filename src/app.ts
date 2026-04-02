import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import { errorHandler } from "./middleware/errorHandler";

import { authRouter } from "./routes/authRoutes";
import { userRouter } from "./routes/userRoutes";
import { transactionRouter } from "./routes/transactionRoutes";
import { dashboardRouter } from "./routes/dashboardRoutes";

export const app = express();

app.use(helmet());
app.use(cors());
app.use(morgan("dev"));
app.use(express.json({ limit: "1mb" }));

app.get("/health", (_req, res) => {
  res.status(200).json({ ok: true });
});

app.use("/auth", authRouter);
app.use("/users", userRouter);
app.use("/transactions", transactionRouter);
app.use("/dashboard", dashboardRouter);

// 404
app.use((_req, res) => {
  res.status(404).json({ error: { code: "NOT_FOUND", message: "Route not found" } });
});

// Error handler
app.use(errorHandler);

