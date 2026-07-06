import { Router } from 'express';
import { CrudService } from '../../common/crud/crud.service';
import { createCrudHandlers, getScope } from '../../common/crud/crud.controller';
import { validate } from '../../middlewares/validate.middleware';
import { requirePermission } from '../../middlewares/auth.middleware';
import { MembershipModel } from './membership.model';
import { membershipCreateSchema, membershipIdSchema, membershipListSchema, membershipStatusSchema, membershipUpdateSchema } from './membership.validation';
import { normalizePermissoes } from './membership.types';
import { AppError } from '../../common/errors/AppError';
import { ErrorCodes } from '../../common/errors/error-codes';
import { asyncHandler } from '../../common/utils/async-handler';
import { sendSuccess } from '../../common/utils/api-response';
import { normalizeCpf, isValidCpf } from '../../common/utils/cpf';
import { hashPassword } from '../../common/utils/password';
import { AuthenticatedRequest } from '../../common/types/request';

const router = Router();
const service = new CrudService(MembershipModel, { searchFields: ['nome', 'email', 'cpf'], defaultSort: { nome: 1 } });
const handlers = createCrudHandlers(service, {
  beforeUpdate: (body) => ({ ...body, permissoes: body.permissoes ? normalizePermissoes(body.permissoes as any[], body.role as any) : undefined }),
});

router.get('/', requirePermission('colaboradores', 'leitura'), validate(membershipListSchema), handlers.list);
router.post('/', requirePermission('colaboradores', 'escrita'), validate(membershipCreateSchema), asyncHandler(async (req: AuthenticatedRequest, res) => {
  const scope = getScope(req);
  const payload = await buildMembershipPayload(req.body, scope);
  const created = await MembershipModel.create(payload);
  sendSuccess(res, created, 'Colaborador criado com sucesso.', 201);
}));
router.get('/:id', requirePermission('colaboradores', 'leitura'), validate(membershipIdSchema), handlers.getById);
router.put('/:id', requirePermission('colaboradores', 'escrita'), validate(membershipUpdateSchema), asyncHandler(async (req: AuthenticatedRequest, res) => {
  const scope = getScope(req);
  const existing = await MembershipModel.findOne({ _id: req.params.id, tenantId: scope.tenantId, deletedAt: null });
  if (!existing) throw new AppError(404, 'Colaborador nao encontrado.', ErrorCodes.NOT_FOUND);
  const payload = await buildMembershipPayload(req.body, scope, String(existing.id), Boolean((existing as any).manualAuth || existing.cpf));
  const updated = await MembershipModel.findOneAndUpdate({ _id: req.params.id, tenantId: scope.tenantId, deletedAt: null }, payload, { new: true, runValidators: true });
  sendSuccess(res, updated, 'Colaborador atualizado com sucesso.');
}));
router.patch('/:id/status', requirePermission('colaboradores', 'escrita'), validate(membershipStatusSchema), (req, _res, next) => {
  if ((req as any).user?.membershipId === req.params.id && req.body.ativo === false) {
    next(new AppError(409, 'Usuario nao pode inativar a propria conta.', ErrorCodes.CONFLICT));
    return;
  }
  next();
}, handlers.update);
router.delete('/:id', requirePermission('colaboradores', 'escrita'), validate(membershipIdSchema), handlers.remove);

export const membershipRoutes = router;

async function buildMembershipPayload(body: Record<string, any>, scope: { tenantId: string; companyId: string; userId: string }, ignoreId?: string, forceManual = false) {
  const cpf = normalizeCpf(body.cpf ?? body.usuario ?? body.login);
  const isManual = forceManual || Boolean(cpf || body.senha || !body.firebaseUid);

  if (isManual) {
    if (!cpf) throw new AppError(400, 'CPF é obrigatório.', ErrorCodes.VALIDATION_ERROR);
    if (!isValidCpf(cpf)) throw new AppError(400, 'Informe um CPF válido.', ErrorCodes.VALIDATION_ERROR);
    if (!ignoreId && !body.senha) throw new AppError(400, 'Senha é obrigatória para colaborador manual.', ErrorCodes.VALIDATION_ERROR);
    const duplicated = await MembershipModel.findOne({ cpf, deletedAt: null, ...(ignoreId ? { _id: { $ne: ignoreId } } : {}) });
    if (duplicated) throw new AppError(409, 'Já existe um colaborador cadastrado com este CPF.', ErrorCodes.CONFLICT);
  }

  const payload: Record<string, any> = {
    tenantId: scope.tenantId,
    companyId: scope.companyId,
    nome: body.nome,
    email: body.email,
    cpf: cpf || undefined,
    firebaseUid: body.firebaseUid ?? (cpf ? `manual-${scope.tenantId}-${cpf}` : undefined),
    colaboradorId: body.colaboradorId ?? (cpf ? `cpf-${cpf}` : undefined),
    providerId: cpf ? 'cpf-password' : body.providerId,
    manualAuth: isManual,
    role: body.role ?? body.nivel ?? 'colaborador',
    ativo: body.ativo ?? true,
    permissoes: normalizePermissoes(body.permissoes as any[], (body.role ?? body.nivel) as any),
    updatedBy: scope.userId,
  };

  if (!ignoreId) payload.createdBy = scope.userId;
  if (body.senha) payload.passwordHash = hashPassword(String(body.senha));

  return payload;
}
