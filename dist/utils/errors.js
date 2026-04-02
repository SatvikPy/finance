"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppError = void 0;
exports.isAppError = isAppError;
class AppError extends Error {
    constructor(params) {
        super(params.message);
        this.statusCode = params.statusCode;
        this.code = params.code;
        this.details = params.details;
    }
}
exports.AppError = AppError;
function isAppError(err) {
    return err instanceof AppError;
}
//# sourceMappingURL=errors.js.map