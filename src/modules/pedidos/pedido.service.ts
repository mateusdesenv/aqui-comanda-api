import { AppError } from '../../common/errors/AppError';
import { ErrorCodes } from '../../common/errors/error-codes';
import { TenantScope } from '../../common/crud/crud.service';
import { roundMoney } from '../../common/utils/money';
import { stripTenantProtectedFields } from '../../common/utils/tenant-payload';
import { PedidoModel } from './pedido.model';

const workflow = ['aberto', 'em_preparo', 'saiu_entrega', 'entregue'];
const paymentMap: Record<string, string> = {
  cartao_debito: 'debito',
  cartao_credito: 'credito',
};

function normalizePedidoPayload(payload: Record<string, any>): Record<string, any> {
  const cleanPayload = stripTenantProtectedFields(payload);
  const itens = (cleanPayload.itens ?? []).map((item: Record<string, any>) => ({
    ...item,
    quantidade: Number(item.quantidade) || 0,
    precoUnitario: Number(item.precoUnitario) || 0,
    subtotal: roundMoney(Number(item.subtotal) || (Number(item.quantidade) || 0) * (Number(item.precoUnitario) || 0)),
  }));
  const subtotal = roundMoney(Number(cleanPayload.subtotal) || itens.reduce((total: number, item: { subtotal: number }) => total + item.subtotal, 0));
  const taxaEntrega = Number(cleanPayload.taxaEntrega) || 0;
  const desconto = Number(cleanPayload.desconto) || 0;
  const total = roundMoney(Number(cleanPayload.total) || subtotal + taxaEntrega - desconto);

  return {
    ...cleanPayload,
    formaPagamento: cleanPayload.formaPagamento ? paymentMap[cleanPayload.formaPagamento] ?? cleanPayload.formaPagamento : undefined,
    itens,
    subtotal,
    taxaEntrega,
    desconto,
    total,
  };
}

export async function createPedido(scope: TenantScope, payload: Record<string, any>) {
  const normalized = normalizePedidoPayload(payload);
  const count = await PedidoModel.countDocuments({ tenantId: scope.tenantId });
  return (PedidoModel as any).create({
    ...normalized,
    codigo: normalized.codigo ?? `PED-${String(count + 1).padStart(4, '0')}`,
    status: 'aberto',
    pagamentoConfirmado: false,
    tenantId: scope.tenantId,
    companyId: scope.companyId,
    createdBy: scope.userId,
    updatedBy: scope.userId,
    deletedAt: null,
  });
}

export async function updatePedido(scope: TenantScope, id: string, payload: Record<string, any>) {
  const pedido = await PedidoModel.findOne({ _id: id, tenantId: scope.tenantId, deletedAt: null });
  if (!pedido) throw new AppError(404, 'Pedido nao encontrado.', ErrorCodes.NOT_FOUND);
  if (pedido.status === 'cancelado') throw new AppError(409, 'Pedidos cancelados nao podem ser editados.', ErrorCodes.CONFLICT);
  if (payload.status === 'cancelado' && !payload.justificativaCancelamento?.trim()) {
    throw new AppError(400, 'Pedido cancelado exige justificativa.', ErrorCodes.VALIDATION_ERROR);
  }
  pedido.set({ ...normalizePedidoPayload(payload), updatedBy: scope.userId });
  return pedido.save();
}

export async function updatePedidoStatus(scope: TenantScope, id: string, status: string, justificativaCancelamento?: string) {
  const pedido = await PedidoModel.findOne({ _id: id, tenantId: scope.tenantId, deletedAt: null });
  if (!pedido) throw new AppError(404, 'Pedido nao encontrado.', ErrorCodes.NOT_FOUND);
  if (status === 'cancelado' && !justificativaCancelamento?.trim()) {
    throw new AppError(400, 'Pedido cancelado exige justificativa.', ErrorCodes.VALIDATION_ERROR);
  }
  if (status !== 'cancelado' && (!workflow.includes(String(pedido.status)) || !workflow.includes(status))) {
    throw new AppError(409, 'Status fora do workflow sequencial.', ErrorCodes.CONFLICT);
  }
  (pedido as any).status = status;
  pedido.justificativaCancelamento = status === 'cancelado' ? justificativaCancelamento : undefined;
  (pedido as any).updatedBy = scope.userId;
  return pedido.save();
}
