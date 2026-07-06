import { Router } from 'express';
import { sendSuccess } from '../../common/utils/api-response';
import { asyncHandler } from '../../common/utils/async-handler';
import { AuthenticatedRequest } from '../../common/types/request';
import { MembershipModel } from '../memberships/membership.model';
import { normalizeCpf, isValidCpf } from '../../common/utils/cpf';
import { verifyPassword } from '../../common/utils/password';
import { AppError } from '../../common/errors/AppError';
import { ErrorCodes } from '../../common/errors/error-codes';
import { firebaseAuth } from '../../config/firebase';

const router = Router();
export const publicAuthRoutes = Router();

publicAuthRoutes.post('/manual-login', asyncHandler(async (req, res) => {
  const cpf = normalizeCpf(req.body?.cpf ?? req.body?.login ?? req.body?.usuario);
  const senha = String(req.body?.senha ?? req.body?.password ?? '');

  if (!cpf) throw new AppError(400, 'CPF é obrigatório.', ErrorCodes.VALIDATION_ERROR);
  if (!isValidCpf(cpf)) throw new AppError(400, 'Informe um CPF válido.', ErrorCodes.VALIDATION_ERROR);
  if (!senha) throw new AppError(400, 'Informe a senha.', ErrorCodes.VALIDATION_ERROR);

  const membership = await MembershipModel.findOne({ cpf, manualAuth: true, ativo: true, deletedAt: null });
  if (!membership || !verifyPassword(senha, membership.passwordHash)) {
    throw new AppError(401, 'CPF ou senha incorretos.', ErrorCodes.UNAUTHENTICATED);
  }

  const customToken = await firebaseAuth().createCustomToken(membership.firebaseUid, {
    companyId: membership.companyId,
    tenantId: membership.tenantId,
    membershipId: String(membership.id),
  });

  sendSuccess(res, {
    customToken,
    user: {
      uid: membership.firebaseUid,
      cpf: membership.cpf,
      nome: membership.nome,
      role: membership.role,
    },
  });
}));

router.get('/me', asyncHandler(async (req: AuthenticatedRequest, res) => {
  sendSuccess(res, req.user);
}));

export const authRoutes = router;
