import { Router } from 'express';
import { CrudService } from '../../common/crud/crud.service';
import { createCrudHandlers } from '../../common/crud/crud.controller';
import { validate } from '../../middlewares/validate.middleware';
import { requirePermission } from '../../middlewares/auth.middleware';
import { MembershipModel } from './membership.model';
import { membershipCreateSchema, membershipIdSchema, membershipListSchema, membershipStatusSchema, membershipUpdateSchema } from './membership.validation';
import { normalizePermissoes } from './membership.types';
import { AppError } from '../../common/errors/AppError';
import { ErrorCodes } from '../../common/errors/error-codes';

const router = Router();
const service = new CrudService(MembershipModel, { searchFields: ['nome', 'email'], defaultSort: { nome: 1 } });
const handlers = createCrudHandlers(service, {
  beforeCreate: (body) => ({ ...body, permissoes: normalizePermissoes(body.permissoes as any[], body.role as any) }),
  beforeUpdate: (body) => ({ ...body, permissoes: body.permissoes ? normalizePermissoes(body.permissoes as any[], body.role as any) : undefined }),
});

router.get('/', requirePermission('colaboradores', 'leitura'), validate(membershipListSchema), handlers.list);
router.post('/', requirePermission('colaboradores', 'escrita'), validate(membershipCreateSchema), handlers.create);
router.get('/:id', requirePermission('colaboradores', 'leitura'), validate(membershipIdSchema), handlers.getById);
router.put('/:id', requirePermission('colaboradores', 'escrita'), validate(membershipUpdateSchema), handlers.update);
router.patch('/:id/status', requirePermission('colaboradores', 'escrita'), validate(membershipStatusSchema), (req, _res, next) => {
  if ((req as any).user?.membershipId === req.params.id && req.body.ativo === false) {
    next(new AppError(409, 'Usuario nao pode inativar a propria conta.', ErrorCodes.CONFLICT));
    return;
  }
  next();
}, handlers.update);
router.delete('/:id', requirePermission('colaboradores', 'escrita'), validate(membershipIdSchema), handlers.remove);

export const membershipRoutes = router;
