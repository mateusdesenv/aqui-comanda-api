import { ErrorRequestHandler } from 'express';
import { ZodError } from 'zod';
import { isProduction } from '../config/env';
import { AppError } from '../common/errors/AppError';
import { ErrorCodes } from '../common/errors/error-codes';

export const errorMiddleware: ErrorRequestHandler = (error, _req, res, _next) => {
  if (error instanceof AppError) {
    res.status(error.statusCode).json({
      success: false,
      message: error.message,
      code: error.code,
      details: error.details,
    });
    return;
  }

  if (error instanceof ZodError) {
    res.status(400).json({
      success: false,
      message: 'Dados invalidos.',
      code: ErrorCodes.VALIDATION_ERROR,
      details: error.flatten(),
    });
    return;
  }

  console.error(error);
  res.status(500).json({
    success: false,
    message: 'Erro interno do servidor.',
    code: ErrorCodes.INTERNAL_ERROR,
    stack: isProduction ? undefined : error instanceof Error ? error.stack : undefined,
  });
};
