export type ErrorDetails = Record<string, unknown>;

export class AppError extends Error {
  statusCode: number;
  code: string;
  details: ErrorDetails | undefined;

  constructor(params: { statusCode: number; code: string; message: string; details?: ErrorDetails }) {
    super(params.message);
    this.statusCode = params.statusCode;
    this.code = params.code;
    this.details = params.details;
  }
}

export function isAppError(err: unknown): err is AppError {
  return err instanceof AppError;
}

