import { Router } from 'express';
import { CrudService } from '../../common/crud/crud.service';
import { createCrudHandlers, getScope } from '../../common/crud/crud.controller';
import { validate } from '../../middlewares/validate.middleware';
import { requirePermission } from '../../middlewares/auth.middleware';
import { PedidoModel } from './pedido.model';
import { pedidoCreateSchema, pedidoIdSchema, pedidoListSchema, pedidoStatusSchema, pedidoUpdateSchema } from './pedido.validation';
import { asyncHandler } from '../../common/utils/async-handler';
import { sendSuccess } from '../../common/utils/api-response';
import { AuthenticatedRequest } from '../../common/types/request';
import { createPedido, updatePedido, updatePedidoStatus } from './pedido.service';
import { endOfDay, parseDate } from '../../common/utils/dates';

const router = Router();
const handlers = createCrudHandlers(new CrudService(PedidoModel, { searchFields: ['codigo', 'clienteNome', 'telefone', 'enderecoEntrega', 'bairro', 'cidade'], defaultSort: { createdAt: -1 } }), {
  listFilter: (query) => {
    const filter: Record<string, unknown> = {};
    if (query.status) filter.status = query.status;
    if (query.clienteId) filter.clienteId = query.clienteId;
    if (query.pagamentoConfirmado === 'true' || query.pagamentoConfirmado === 'false') filter.pagamentoConfirmado = query.pagamentoConfirmado === 'true';
    const start = parseDate(query.dateStart as string | undefined);
    const end = parseDate(query.dateEnd as string | undefined);
    if (start || end) filter.createdAt = { ...(start ? { $gte: start } : {}), ...(end ? { $lte: endOfDay(end) } : {}) };
    return filter;
  },
});

router.get('/', requirePermission('pedidos', 'leitura'), validate(pedidoListSchema), handlers.list);
router.post('/', requirePermission('pedidos', 'escrita'), validate(pedidoCreateSchema), asyncHandler(async (req: AuthenticatedRequest, res) => {
  const pedido = await createPedido(getScope(req), req.body);
  sendSuccess(res, pedido, 'Pedido criado com sucesso.', 201);
}));
router.get('/:id', requirePermission('pedidos', 'leitura'), validate(pedidoIdSchema), handlers.getById);
router.put('/:id', requirePermission('pedidos', 'escrita'), validate(pedidoUpdateSchema), asyncHandler(async (req: AuthenticatedRequest, res) => {
  const pedido = await updatePedido(getScope(req), String(req.params.id), req.body);
  sendSuccess(res, pedido, 'Pedido atualizado com sucesso.');
}));
router.patch('/:id/status', requirePermission('pedidos', 'escrita'), validate(pedidoStatusSchema), asyncHandler(async (req: AuthenticatedRequest, res) => {
  const pedido = await updatePedidoStatus(getScope(req), String(req.params.id), req.body.status, req.body.justificativaCancelamento);
  sendSuccess(res, pedido, 'Status do pedido atualizado com sucesso.');
}));
router.post('/:id/confirmar-pagamento', requirePermission('pedidos', 'escrita'), validate(pedidoIdSchema), asyncHandler(async (req: AuthenticatedRequest, res) => {
  const pedido = await PedidoModel.findOneAndUpdate({ _id: String(req.params.id), tenantId: req.tenantId, deletedAt: null }, { pagamentoConfirmado: true, updatedBy: req.user.uid }, { new: true });
  sendSuccess(res, pedido, 'Pagamento confirmado com sucesso.');
}));
router.delete('/:id', requirePermission('pedidos', 'escrita'), validate(pedidoIdSchema), handlers.remove);

export const pedidoRoutes = router;
