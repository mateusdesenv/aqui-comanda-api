import { Router } from 'express';
import { validate } from '../../middlewares/validate.middleware';
import { requirePermission } from '../../middlewares/auth.middleware';
import { asyncHandler } from '../../common/utils/async-handler';
import { sendSuccess } from '../../common/utils/api-response';
import { AuthenticatedRequest } from '../../common/types/request';
import { ComandaModel } from '../comandas/comanda.model';
import { PedidoModel } from '../pedidos/pedido.model';
import { ProdutoModel } from '../produtos/produto.model';
import { dashboardQuerySchema } from './dashboard.validation';
import { endOfDay, parseDate, startOfDay } from '../../common/utils/dates';
import { roundMoney } from '../../common/utils/money';

const router = Router();

function resolveRange(query: { preset?: string; startDate?: string; endDate?: string }) {
  const today = startOfDay(new Date());
  let start = new Date(today);
  let end = new Date(today);
  if (query.preset === 'yesterday') {
    start.setDate(start.getDate() - 1);
    end.setDate(end.getDate() - 1);
  } else if (query.preset === 'last_7') {
    start.setDate(start.getDate() - 6);
  } else if (query.preset === 'last_30') {
    start.setDate(start.getDate() - 29);
  } else if (query.preset === 'custom') {
    start = parseDate(query.startDate) ?? start;
    end = parseDate(query.endDate) ?? end;
  }
  return { start, end: endOfDay(end) };
}

router.get('/', requirePermission('dashboard', 'leitura'), validate(dashboardQuerySchema), asyncHandler(async (req: AuthenticatedRequest, res) => {
  const { start, end } = resolveRange(req.query);
  const [comandas, pedidos, produtos, openCommandsCount] = await Promise.all([
    ComandaModel.find({ tenantId: req.tenantId, status: 'finalizada', paga: true, finalizadaEm: { $gte: start, $lte: end }, deletedAt: null }),
    PedidoModel.find({ tenantId: req.tenantId, $or: [{ status: 'entregue' }, { pagamentoConfirmado: true }], updatedAt: { $gte: start, $lte: end }, deletedAt: null }),
    ProdutoModel.find({ tenantId: req.tenantId, deletedAt: null }),
    ComandaModel.countDocuments({ tenantId: req.tenantId, status: 'aberta', paga: false, deletedAt: null }),
  ]);
  const productCost = new Map(produtos.map((produto) => [produto.id, Number(produto.costPrice) || 0]));
  const sales = [
    ...comandas.map((comanda) => ({ total: Number(comanda.totalFinalizado ?? comanda.total) || 0, items: comanda.itens })),
    ...pedidos.map((pedido) => ({ total: Number(pedido.total) || 0, items: pedido.itens })),
  ];
  const salesTotal = roundMoney(sales.reduce((total, sale) => total + sale.total, 0));
  const cmvTotal = roundMoney(sales.flatMap((sale) => sale.items).reduce((total, item) => total + (Number((item as any).totalCost) || Number(item.quantidade) * (Number((item as any).unitCost) || productCost.get(item.productId) || 0)), 0));
  const grossProfit = roundMoney(salesTotal - cmvTotal);
  const criticalStock = produtos
    .filter((produto) => produto.ativo && produto.controlaEstoque !== false)
    .map((produto) => ({ productId: produto.id, productName: produto.nome, currentStock: produto.stockQuantity, minimumStock: Number(produto.minimumStock ?? produto.estoqueMinimo ?? produto.minStock) || 5, status: produto.stockQuantity <= 0 ? 'OUT_OF_STOCK' : produto.stockQuantity <= (Number(produto.minimumStock ?? produto.estoqueMinimo ?? produto.minStock) || 5) ? 'LOW' : 'OK' }))
    .filter((item) => item.status !== 'OK')
    .slice(0, 8);
  sendSuccess(res, {
    salesTotal,
    cmvTotal,
    grossProfit,
    grossMarginPercent: salesTotal > 0 ? roundMoney((grossProfit / salesTotal) * 100) : 0,
    averageTicket: sales.length > 0 ? roundMoney(salesTotal / sales.length) : 0,
    closedOrdersCount: sales.length,
    openCommandsCount,
    criticalStock,
  });
}));

export const dashboardRoutes = router;
