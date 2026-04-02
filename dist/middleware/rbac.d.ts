import type { NextFunction, Request, Response } from "express";
import type { Role } from "@prisma/client";
export declare function requireRoles(...roles: Role[]): (req: Request, _res: Response, next: NextFunction) => void;
//# sourceMappingURL=rbac.d.ts.map