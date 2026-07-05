import { Router } from 'express';
import { CrudService } from '../../common/crud/crud.service';
import { createCrudHandlers } from '../../common/crud/crud.controller';
import { validate } from '../../middlewares/validate.middleware';
import { requirePermission } from '../../middlewares/auth.middleware';
import { MesaModel } from './mesa.model';
import { mesaCreateSchema, mesaIdSchema, mesaListSchema, mesaStatusSchema, mesaUpdateSchema } from './mesa.validation';
import { asyncHandler } from '../../common/utils/async-handler';
import { sendSuccess } from '../../common/utils/api-response';
import { ComandaModel } from '../comandas/comanda.model';
import { getScope } from '../../common/crud/crud.controller';
import { AppError } from '../../common/errors/AppError';
import { ErrorCodes } from '../../common/errors/error-codes';
import { AuthenticatedRequest } from '../../common/types/request';

const router = Router();
const service = new CrudService(MesaModel, { searchFields: ['nome', 'observacao', 'ambiente'], defaultSort: { numero: 1 } });
const handlers = createCrudHandlers(service, { listFilter: (query) => query.status ? { status: query.status } : {} });

router.get('/', requirePermission('mesas', 'leitura'), validate(mesaListSchema), handlers.list);
router.post('/', requirePermission('mesas', 'escrita'), validate(mesaCreateSchema), handlers.create);
router.get('/:id', requirePermission('mesas', 'leitura'), validate(mesaIdSchema), handlers.getById);
router.put('/:id', requirePermission('mesas', 'escrita'), validate(mesaUpdateSchema), handlers.update);
router.patch('/:id/status', requirePermission('mesas', 'escrita'), validate(mesaStatusSchema), handlers.update);
router.delete('/:id', requirePermission('mesas', 'escrita'), validate(mesaIdSchema), handlers.remove);
router.post('/:id/liberar', requirePermission('mapa', 'escrita'), validate(mesaIdSchema), asyncHandler(async (req: AuthenticatedRequest, res) => {
  const scope = getScope(req);
  const active = await ComandaModel.find({ tenantId: scope.tenantId, mesaId: req.params.id, mesaLiberadaEm: null, deletedAt: null });
  if (active.length === 0 || active.some((comanda) => comanda.status !== 'finalizada' && !comanda.paga)) {
    throw new AppError(409, 'A mesa so pode ser liberada quando todas as comandas estiverem finalizadas.', ErrorCodes.CONFLICT);
  }
  await ComandaModel.updateMany({ tenantId: scope.tenantId, mesaId: req.params.id, mesaLiberadaEm: null }, { mesaLiberadaEm: new Date(), updatedBy: scope.userId });
  sendSuccess(res, { released: true }, 'Mesa liberada com sucesso.');
}));

export const mesaRoutes = router;
