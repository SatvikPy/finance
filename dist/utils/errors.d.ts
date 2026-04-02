export type ErrorDetails = Record<string, unknown>;
export declare class AppError extends Error {
    statusCode: number;
    code: string;
    details: ErrorDetails | undefined;
    constructor(params: {
        statusCode: number;
        code: string;
        message: string;
        details?: ErrorDetails;
    });
}
export declare function isAppError(err: unknown): err is AppError;
//# sourceMappingURL=errors.d.ts.map