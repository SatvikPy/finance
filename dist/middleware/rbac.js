"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireRoles = requireRoles;
const errors_1 = require("../utils/errors");
function requireRoles(...roles) {
    return (req, _res, next) => {
        const user = req.user;
        if (!user) {
            return next(new errors_1.AppError({ statusCode: 401, code: "UNAUTHORIZED", message: "Missing auth context" }));
        }
        if (user.status !== "ACTIVE") {
            return next(new errors_1.AppError({ statusCode: 403, code: "INACTIVE_USER", message: "User is inactive" }));
        }
        if (!roles.includes(user.role)) {
            return next(new errors_1.AppError({ statusCode: 403, code: "FORBIDDEN", message: "Insufficient permissions" }));
        }
        next();
    };
}
//# sourceMappingURL=rbac.js.map