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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.login = login;
const jwt = __importStar(require("jsonwebtoken"));
const bcrypt_1 = __importDefault(require("bcrypt"));
const prisma_1 = require("../db/prisma");
const errors_1 = require("../utils/errors");
async function login(params) {
    const user = await prisma_1.prisma.user.findUnique({
        where: { username: params.username },
    });
    if (!user) {
        throw new errors_1.AppError({ statusCode: 401, code: "INVALID_CREDENTIALS", message: "Invalid username or password" });
    }
    if (user.status !== "ACTIVE") {
        throw new errors_1.AppError({ statusCode: 403, code: "INACTIVE_USER", message: "User is inactive" });
    }
    const ok = await bcrypt_1.default.compare(params.password, user.passwordHash);
    if (!ok) {
        throw new errors_1.AppError({ statusCode: 401, code: "INVALID_CREDENTIALS", message: "Invalid username or password" });
    }
    const secret = (process.env.JWT_SECRET ?? "dev-secret");
    const expiresIn = (process.env.JWT_EXPIRES_IN ?? "1h");
    const token = jwt.sign({
        userId: user.id,
        username: user.username,
        role: user.role,
        status: user.status,
    }, secret, { expiresIn });
    return {
        token,
        user: {
            id: user.id,
            username: user.username,
            role: user.role,
            status: user.status,
        },
    };
}
//# sourceMappingURL=authService.js.map