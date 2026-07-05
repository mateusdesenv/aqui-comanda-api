import { Response } from 'express';

export function sendSuccess<T>(res: Response, data: T, message = 'Operacao realizada com sucesso', statusCode = 200): void {
  res.status(statusCode).json({ success: true, data, message });
}

export function buildPagination(page: number, limit: number, total: number) {
  return {
    page,
    limit,
    total,
    totalPages: Math.max(1, Math.ceil(total / limit)),
  };
}
