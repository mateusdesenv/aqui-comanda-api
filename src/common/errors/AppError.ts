import { ErrorCode } from './error-codes';

export class AppError extends Error {
  constructor(
    public readonly statusCode: number,
    message: string,
    public readonly code: ErrorCode | string,
    public readonly details?: unknown,
  ) {
    super(message);
    this.name = 'AppError';
  }
}
