"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorHandler = errorHandler;
const zod_1 = require("zod");
const errors_1 = require("../utils/errors");
function errorHandler(err, _req, res, _next) {
    if (process.env.NODE_ENV !== "test") {
        // eslint-disable-next-line no-console
        console.error(err);
    }
    if (err instanceof zod_1.ZodError) {
        return res.status(400).json({
            error: {
                code: "VALIDATION_ERROR",
                message: "Invalid request input",
                issues: err.issues,
            },
        });
    }
    if ((0, errors_1.isAppError)(err)) {
        return res.status(err.statusCode).json({
            error: {
                code: err.code,
                message: err.message,
                ...(err.details ? { details: err.details } : {}),
            },
        });
    }
    return res.status(500).json({
        error: {
            code: "INTERNAL_ERROR",
            message: "Unexpected server error",
        },
    });
}
//# sourceMappingURL=errorHandler.js.map