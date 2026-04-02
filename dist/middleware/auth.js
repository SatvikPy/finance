"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.authRequired = authRequired;
const jwt = __importStar(require("jsonwebtoken"));
const errors_1 = require("../utils/errors");
function authRequired(req, _res, next) {
    const authHeader = req.header("authorization");
    if (!authHeader) {
        return next(new errors_1.AppError({ statusCode: 401, code: "UNAUTHORIZED", message: "Missing auth token" }));
    }
    const [scheme, token] = authHeader.split(" ");
    if (!scheme || scheme.toLowerCase() !== "bearer" || !token) {
        return next(new errors_1.AppError({ statusCode: 401, code: "UNAUTHORIZED", message: "Invalid auth header" }));
    }
    try {
        const payload = jwt.verify(token, process.env.JWT_SECRET ?? "dev-secret");
        if (!payload.userId || !payload.role || !payload.status) {
            return next(new errors_1.AppError({ statusCode: 401, code: "UNAUTHORIZED", message: "Invalid auth token payload" }));
        }
        req.user = {
            id: payload.userId,
            username: payload.username ?? "",
            role: payload.role,
            status: payload.status,
        };
        next();
    }
    catch {
        return next(new errors_1.AppError({ statusCode: 401, code: "UNAUTHORIZED", message: "Invalid or expired token" }));
    }
}
//# sourceMappingURL=auth.js.map