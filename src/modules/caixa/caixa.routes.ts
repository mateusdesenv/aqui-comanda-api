import { Router } from 'express';
import { CrudService } from '../../common/crud/crud.service';
import { createCrudHandlers, getScope } from '../../common/crud/crud.controller';
import { validate } from '../../middlewares/validate.middleware';
import { requirePermission } from '../../middlewares/auth.middleware';
import { CaixaEntradaModel } from './caixa-entrada.model';
import { CaixaSessaoModel } from './caixa-sessao.model';
import { abrirCaixaSchema, caixaEntradasListSchema, caixaSessoesListSchema, fecharCaixaSchema } from './caixa.validation';
import { asyncHandler } from '../../common/utils/async-handler';
import { sendSuccess } from '../../common/utils/api-response';
import { abrirCaixa, fecharCaixa } from './caixa.service';
import { AuthenticatedRequest } from '../../common/types/request';
import { endOfDay, parseDate } from '../../common/utils/dates';

const router = Router();
const sessoes = createCrudHandlers(new CrudService(CaixaSessaoModel, { defaultSort: { abertoEm: -1 } }), {
  listFilter: (query) => {
    const filter: Record<string, unknown> = {};
    if (query.status) filter.status = query.status;
    const start = parseDate(query.dateStart as string | undefined);
    const end = parseDate(query.dateEnd as string | undefined);
    if (start || end) filter.abertoEm = { ...(start ? { $gte: start } : {}), ...(end ? { $lte: endOfDay(end) } : {}) };
    return filter;
  },
});
const entradas = createCrudHandlers(new CrudService(CaixaEntradaModel, { searchFields: ['origemDescricao', 'clienteNome', 'formaPagamento'], defaultSort: { criadaEm: -1 } }), {
  listFilter: (query) => {
    const filter: Record<string, unknown> = {};
    if (query.formaPagamento) filter.formaPagamento = query.formaPagamento;
    if (query.mesaNumero) filter.mesaNumero = query.mesaNumero;
    if (query.tipo) filter.tipo = query.tipo;
    const start = parseDate(query.dateStart as string | undefined);
    const end = parseDate(query.dateEnd as string | undefined);
    if (start || end) filter.criadaEm = { ...(start ? { $gte: start } : {}), ...(end ? { $lte: endOfDay(end) } : {}) };
    return filter;
  },
});

router.get('/sessoes', requirePermission('caixa', 'leitura'), validate(caixaSessoesListSchema), sessoes.list);
router.post('/sessoes/abrir', requirePermission('caixa', 'escrita'), validate(abrirCaixaSchema), asyncHandler(async (req: AuthenticatedRequest, res) => {
  const sessao = await abrirCaixa(getScope(req), req.body.observacaoAbertura);
  sendSuccess(res, sessao, 'Caixa aberto com sucesso.', 201);
}));
router.post('/sessoes/:id/fechar', requirePermission('caixa', 'escrita'), validate(fecharCaixaSchema), asyncHandler(async (req: AuthenticatedRequest, res) => {
  const sessao = await fecharCaixa(getScope(req), String(req.params.id), req.body.observacaoFechamento);
  sendSuccess(res, sessao, 'Caixa fechado com sucesso.');
}));
router.get('/entradas', requirePermission('caixa', 'leitura'), validate(caixaEntradasListSchema), entradas.list);
router.get('/resumo', requirePermission('caixa', 'leitura'), asyncHandler(async (req: AuthenticatedRequest, res) => {
  const scope = getScope(req);
  const [sessaoAberta, totalEntradas, quantidadeEntradas] = await Promise.all([
    CaixaSessaoModel.findOne({ tenantId: scope.tenantId, status: 'aberto', deletedAt: null }),
    CaixaEntradaModel.aggregate([{ $match: { tenantId: scope.tenantId, deletedAt: null } }, { $group: { _id: null, total: { $sum: '$valor' } } }]),
    CaixaEntradaModel.countDocuments({ tenantId: scope.tenantId, deletedAt: null }),
  ]);
  sendSuccess(res, { sessaoAberta, totalEntradas: totalEntradas[0]?.total ?? 0, quantidadeEntradas });
}));

export const caixaRoutes = router;
