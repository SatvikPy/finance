export declare function login(params: {
    username: string;
    password: string;
}): Promise<{
    token: string;
    user: {
        id: string;
        username: string;
        role: import("@prisma/client").$Enums.Role;
        status: "ACTIVE";
    };
}>;
//# sourceMappingURL=authService.d.ts.map