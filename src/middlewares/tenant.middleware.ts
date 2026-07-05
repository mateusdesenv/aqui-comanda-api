import { NextFunction, Request, RequestHandler, Response } from 'express';
import { AuthenticatedRequest } from '../common/types/request';
import { AppError } from '../common/errors/AppError';
import { ErrorCodes } from '../common/errors/error-codes';

export const tenantMiddleware: RequestHandler = (req: Request, _res: Response, next: NextFunction): void => {
  const request = req as AuthenticatedRequest;
  if (!request.user?.tenantId || !request.user?.companyId) {
    next(new AppError(403, 'Usuario sem empresa ativa.', ErrorCodes.TENANT_REQUIRED));
    return;
  }

  request.tenantId = request.user.tenantId;
  request.companyId = request.user.companyId;
  next();
};
