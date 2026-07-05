import { Router } from 'express';
import { CrudService } from '../../common/crud/crud.service';
import { createCrudHandlers, getScope } from '../../common/crud/crud.controller';
import { validate } from '../../middlewares/validate.middleware';
import { requirePermission } from '../../middlewares/auth.middleware';
import { ComandaModel } from './comanda.model';
import { comandaFinalizarSchema, comandaIdSchema, comandaItensSchema, comandaListSchema, comandaPayloadSchema } from './comanda.validation';
import { asyncHandler } from '../../common/utils/async-handler';
import { sendSuccess } from '../../common/utils/api-response';
import { createComanda, finalizarComanda, removeOpenComanda, updateComanda } from './comanda.service';
import { AuthenticatedRequest } from '../../common/types/request';
import { endOfDay, parseDate } from '../../common/utils/dates';

const router = Router();
const handlers = createCrudHandlers(new CrudService(ComandaModel, { searchFields: ['clienteNome'], defaultSort: { createdAt: -1 } }), {
  listFilter: (query) => {
    const filter: Record<string, unknown> = {};
    if (query.status) filter.status = query.status;
    if (query.mesaId) filter.mesaId = query.mesaId;
    if (query.clienteId) filter.clienteId = query.clienteId;
    if (query.tipo) filter.tipo = query.tipo;
    if (query.ativa === 'true') filter.mesaLiberadaEm = null;
    const start = parseDate(query.dateStart as string | undefined);
    const end = parseDate(query.dateEnd as string | undefined);
    if (start || end) filter.createdAt = { ...(start ? { $gte: start } : {}), ...(end ? { $lte: endOfDay(end) } : {}) };
    return filter;
  },
});

router.get('/', requirePermission('comandas', 'leitura'), validate(comandaListSchema), handlers.list);
router.post('/', requirePermission('comandas', 'escrita'), validate(comandaPayloadSchema), asyncHandler(async (req: AuthenticatedRequest, res) => {
  const comanda = await createComanda(getScope(req), req.body);
  sendSuccess(res, comanda, 'Comanda criada com sucesso.', 201);
}));
router.get('/:id', requirePermission('comandas', 'leitura'), validate(comandaIdSchema), handlers.getById);
router.put('/:id', requirePermission('comandas', 'escrita'), validate(comandaPayloadSchema.extend({ params: comandaIdSchema.shape.params })), asyncHandler(async (req: AuthenticatedRequest, res) => {
  const comanda = await updateComanda(getScope(req), String(req.params.id), req.body);
  sendSuccess(res, comanda, 'Comanda atualizada com sucesso.');
}));
router.patch('/:id/itens', requirePermission('comandas', 'escrita'), validate(comandaItensSchema), asyncHandler(async (req: AuthenticatedRequest, res) => {
  const existing = await ComandaModel.findOne({ _id: String(req.params.id), tenantId: req.tenantId, deletedAt: null });
  const comanda = await updateComanda(getScope(req), String(req.params.id), { clienteId: existing?.clienteId ?? undefined, clienteNome: existing?.clienteNome ?? undefined, clienteManual: existing?.clienteManual ?? undefined, mesaId: existing?.mesaId ?? undefined, items: req.body.items ?? req.body.itens });
  sendSuccess(res, comanda, 'Itens da comanda atualizados com sucesso.');
}));
router.post('/:id/finalizar', requirePermission('comandas', 'escrita'), validate(comandaFinalizarSchema), asyncHandler(async (req: AuthenticatedRequest, res) => {
  const comanda = await finalizarComanda(getScope(req), String(req.params.id), req.body.formaPagamento);
  sendSuccess(res, comanda, 'Comanda finalizada com sucesso.');
}));
router.delete('/:id', requirePermission('comandas', 'escrita'), validate(comandaIdSchema), asyncHandler(async (req: AuthenticatedRequest, res) => {
  await removeOpenComanda(getScope(req), String(req.params.id));
  res.status(204).send();
}));

export const comandaRoutes = router;
