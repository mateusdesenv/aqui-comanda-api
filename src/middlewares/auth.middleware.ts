import { NextFunction, Request, RequestHandler, Response } from 'express';
import { firebaseAuth } from '../config/firebase';
import { AppError } from '../common/errors/AppError';
import { ErrorCodes } from '../common/errors/error-codes';
import { AuthenticatedRequest, TelaSistema } from '../common/types/request';
import { findOrCreateMembership } from '../modules/memberships/membership.service';
import { debugSaasContext } from '../common/utils/saas-debug';

export const authMiddleware: RequestHandler = async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
  const request = req as AuthenticatedRequest;
  const authorization = req.headers.authorization;

  if (!authorization?.startsWith('Bearer ')) {
    next(new AppError(401, 'Token de autenticacao ausente.', ErrorCodes.UNAUTHENTICATED));
    return;
  }

  const token = authorization.replace('Bearer ', '').trim();

  try {
    const decodedToken = await firebaseAuth().verifyIdToken(token);
    const membership = await findOrCreateMembership(decodedToken);

    if (!membership.ativo || membership.deletedAt) {
      throw new AppError(403, 'Usuario sem acesso ativo.', ErrorCodes.FORBIDDEN);
    }

    request.user = {
      uid: decodedToken.uid,
      email: decodedToken.email,
	      name: decodedToken.name,
	      picture: decodedToken.picture,
	      providerId: decodedToken.firebase?.sign_in_provider,
	      authProvider: membership.manualAuth ? 'manual' : 'firebase',
	      companyId: membership.companyId,
      tenantId: membership.tenantId,
      membershipId: membership.id,
      role: membership.role,
      permissoes: membership.permissoes,
    };
	    request.companyId = membership.companyId;
	    request.tenantId = membership.tenantId;
	    debugSaasContext('auth.resolved', {
	      firebaseUid: decodedToken.uid,
	      email: decodedToken.email,
	      membershipId: String(membership.id),
	      tenantId: membership.tenantId,
	      companyId: membership.companyId,
	      role: membership.role,
	      authProvider: membership.manualAuth ? 'manual' : 'firebase',
	    });
	    next();
  } catch (error) {
    if (error instanceof AppError) {
      next(error);
      return;
    }

    next(new AppError(401, 'Token de autenticacao invalido.', ErrorCodes.UNAUTHENTICATED));
  }
};

export function requirePermission(tela: TelaSistema, action: 'leitura' | 'escrita'): RequestHandler {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const request = req as AuthenticatedRequest;
    if (request.user.role === 'admin') {
      next();
      return;
    }

    const permissao = request.user.permissoes.find((item) => item.tela === tela);

    if (!permissao?.[action]) {
      next(new AppError(403, 'Voce nao tem permissao para esta operacao.', ErrorCodes.FORBIDDEN));
      return;
    }

    next();
  };
}
