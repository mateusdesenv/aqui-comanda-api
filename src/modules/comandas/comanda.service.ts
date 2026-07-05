import mongoose from 'mongoose';
import { AppError } from '../../common/errors/AppError';
import { ErrorCodes } from '../../common/errors/error-codes';
import { TenantScope } from '../../common/crud/crud.service';
import { roundMoney } from '../../common/utils/money';
import { CaixaEntradaModel } from '../caixa/caixa-entrada.model';
import { CaixaSessaoModel } from '../caixa/caixa-sessao.model';
import { MesaModel } from '../mesas/mesa.model';
import { ProdutoModel } from '../produtos/produto.model';
import { ComandaModel } from './comanda.model';

interface ComandaItemInput {
  id?: string;
  productId: string;
  nome?: string;
  tamanho?: string;
  quantidade: number;
  precoUnitario?: number;
  unitCost?: number;
}

interface ComandaPayload {
  legacyId?: string;
  clienteId?: string;
  clienteNome?: string;
  clienteManual?: boolean;
  mesaId?: string;
  items?: ComandaItemInput[];
  itens?: ComandaItemInput[];
}

function getInputItems(payload: ComandaPayload): ComandaItemInput[] {
  return payload.items ?? payload.itens ?? [];
}

function quantitiesByProduct(items: Array<{ productId: string; quantidade: number }>) {
  const map = new Map<string, number>();
  for (const item of items) {
    map.set(item.productId, (map.get(item.productId) ?? 0) + Number(item.quantidade || 0));
  }
  return map;
}

async function normalizeItems(scope: TenantScope, items: ComandaItemInput[], session: mongoose.ClientSession) {
  const productIds = [...new Set(items.map((item) => item.productId))];
  const products = await ProdutoModel.find({ _id: { $in: productIds }, tenantId: scope.tenantId, deletedAt: null }).session(session);

  if (products.length !== productIds.length) {
    throw new AppError(404, 'Produto nao encontrado no cadastro.', ErrorCodes.NOT_FOUND);
  }

  return items.map((item) => {
    const product = products.find((current) => current.id === item.productId)!;
    if (!product.ativo) {
      throw new AppError(409, 'Produto inativo.', ErrorCodes.CONFLICT);
    }
    const quantidade = Number(item.quantidade) || 0;
    const precoUnitario = Number(item.precoUnitario ?? product.preco) || 0;
    const unitCost = Number(item.unitCost ?? product.costPrice) || 0;
    return {
      id: item.id ?? `${product.id}-${Date.now()}-${Math.random().toString(16).slice(2, 6)}`,
      productId: product.id,
      nome: item.nome ?? product.nome,
      tamanho: item.tamanho ?? product.tamanho,
      quantidade,
      precoUnitario,
      unitCost,
      totalCost: roundMoney(quantidade * unitCost),
      subtotal: roundMoney(quantidade * precoUnitario),
    };
  });
}

async function applyStockDelta(scope: TenantScope, previousItems: Array<{ productId: string; quantidade: number }>, nextItems: Array<{ productId: string; quantidade: number }>, session: mongoose.ClientSession) {
  const previous = quantitiesByProduct(previousItems);
  const next = quantitiesByProduct(nextItems);
  const productIds = [...new Set([...previous.keys(), ...next.keys()])];
  const products = await ProdutoModel.find({ _id: { $in: productIds }, tenantId: scope.tenantId, deletedAt: null }).session(session);

  for (const productId of productIds) {
    const product = products.find((item) => item.id === productId);
    if (!product) throw new AppError(404, 'Produto nao encontrado no cadastro.', ErrorCodes.NOT_FOUND);
    const reserveDelta = (next.get(productId) ?? 0) - (previous.get(productId) ?? 0);
    if (reserveDelta <= 0) {
      await ProdutoModel.updateOne({ _id: productId, tenantId: scope.tenantId }, { $inc: { stockQuantity: -reserveDelta }, updatedBy: scope.userId }, { session });
      continue;
    }
    if (product.controlaEstoque !== false && product.stockQuantity < reserveDelta) {
      throw new AppError(409, product.stockQuantity <= 0 ? 'Produto sem estoque disponível.' : 'Quantidade solicitada maior que o estoque disponível.', ErrorCodes.CONFLICT);
    }
    if (product.controlaEstoque !== false) {
      await ProdutoModel.updateOne({ _id: productId, tenantId: scope.tenantId }, { $inc: { stockQuantity: -reserveDelta }, updatedBy: scope.userId }, { session });
    }
  }
}

export async function createComanda(scope: TenantScope, payload: ComandaPayload) {
  const session = await mongoose.startSession();
  try {
    let created;
    await session.withTransaction(async () => {
      const itens = await normalizeItems(scope, getInputItems(payload), session);
      await applyStockDelta(scope, [], itens, session);
      const total = roundMoney(itens.reduce((sum, item) => sum + item.subtotal, 0));
      const [comanda] = await (ComandaModel as any).create([
        {
          legacyId: payload.legacyId,
          tenantId: scope.tenantId,
          companyId: scope.companyId,
          createdBy: scope.userId,
          updatedBy: scope.userId,
          mesaId: payload.mesaId || undefined,
          clienteId: payload.clienteId || undefined,
          clienteNome: payload.clienteNome,
          clienteManual: payload.clienteManual ?? !payload.clienteId,
          tipo: payload.mesaId ? 'mesa' : 'avulsa',
          status: 'aberta',
          paga: false,
          itens,
          total,
          deletedAt: null,
        },
      ], { session });
      created = comanda;
    });
    return created;
  } finally {
    await session.endSession();
  }
}

export async function updateComanda(scope: TenantScope, id: string, payload: ComandaPayload) {
  const session = await mongoose.startSession();
  try {
    let updated;
    await session.withTransaction(async () => {
      const existing = await ComandaModel.findOne({ _id: id, tenantId: scope.tenantId, deletedAt: null }).session(session);
      if (!existing) throw new AppError(404, 'Comanda nao encontrada.', ErrorCodes.NOT_FOUND);
      if (existing.status !== 'aberta' || existing.paga) throw new AppError(409, 'Somente comandas abertas podem ser editadas.', ErrorCodes.CONFLICT);
      const itens = await normalizeItems(scope, getInputItems(payload), session);
      await applyStockDelta(scope, existing.itens, itens, session);
      existing.set({
        mesaId: payload.mesaId || undefined,
        clienteId: payload.clienteId || undefined,
        clienteNome: payload.clienteNome,
        clienteManual: payload.clienteManual ?? !payload.clienteId,
        tipo: payload.mesaId ? 'mesa' : 'avulsa',
        itens,
        total: roundMoney(itens.reduce((sum, item) => sum + item.subtotal, 0)),
        updatedBy: scope.userId,
      });
      updated = await existing.save({ session });
    });
    return updated;
  } finally {
    await session.endSession();
  }
}

export async function removeOpenComanda(scope: TenantScope, id: string) {
  const session = await mongoose.startSession();
  try {
    await session.withTransaction(async () => {
      const existing = await ComandaModel.findOne({ _id: id, tenantId: scope.tenantId, deletedAt: null }).session(session);
      if (!existing) throw new AppError(404, 'Comanda nao encontrada.', ErrorCodes.NOT_FOUND);
      if (existing.status !== 'aberta' || existing.paga) throw new AppError(409, 'Somente comandas abertas podem ser removidas.', ErrorCodes.CONFLICT);
      await applyStockDelta(scope, existing.itens, [], session);
      (existing as any).deletedAt = new Date();
      (existing as any).deletedBy = scope.userId;
      await existing.save({ session });
    });
  } finally {
    await session.endSession();
  }
}

export async function finalizarComanda(scope: TenantScope, id: string, formaPagamento?: string) {
  const session = await mongoose.startSession();
  try {
    let finalized;
    await session.withTransaction(async () => {
      const [comanda, sessaoAberta] = await Promise.all([
        ComandaModel.findOne({ _id: id, tenantId: scope.tenantId, deletedAt: null }).session(session),
        CaixaSessaoModel.findOne({ tenantId: scope.tenantId, status: 'aberto', deletedAt: null }).session(session),
      ]);
      if (!comanda) throw new AppError(404, 'Comanda nao encontrada.', ErrorCodes.NOT_FOUND);
      if (!sessaoAberta) throw new AppError(409, 'Finalizar comanda exige caixa aberto.', ErrorCodes.CONFLICT);
      if (comanda.status !== 'aberta' || comanda.paga) throw new AppError(409, 'Comanda ja finalizada.', ErrorCodes.CONFLICT);
      if (!comanda.itens.length) throw new AppError(409, 'Finalizar comanda exige ao menos um item.', ErrorCodes.CONFLICT);
      const exists = await CaixaEntradaModel.exists({ tenantId: scope.tenantId, tipo: 'comanda', origemId: comanda.id, deletedAt: null }).session(session);
      if (exists) throw new AppError(409, 'Ja existe entrada de caixa para esta comanda.', ErrorCodes.CONFLICT);
      const now = new Date();
      const total = roundMoney(comanda.itens.reduce((sum, item) => sum + item.subtotal, 0));
      comanda.status = 'finalizada';
      comanda.paga = true;
      comanda.finalizadaEm = now;
      comanda.totalFinalizado = total;
      comanda.total = total;
      (comanda as any).updatedBy = scope.userId;
      finalized = await comanda.save({ session });
      const mesa = comanda.mesaId ? await MesaModel.findOne({ _id: comanda.mesaId, tenantId: scope.tenantId }).session(session) : null;
      await (CaixaEntradaModel as any).create([
        {
          tenantId: scope.tenantId,
          companyId: scope.companyId,
          createdBy: scope.userId,
          updatedBy: scope.userId,
          tipo: 'comanda',
          origemId: comanda.id,
          origemDescricao: mesa ? `Comanda ${comanda.id} - Mesa ${mesa.numero}` : `Comanda rápida - ${comanda.clienteNome ?? 'Cliente não informado'}`,
          clienteId: comanda.clienteId,
          clienteNome: comanda.clienteNome ?? 'Cliente não informado',
          mesaId: comanda.mesaId ?? null,
          mesaNumero: mesa?.numero ?? null,
          valor: total,
          formaPagamento: formaPagamento ?? 'Não informado',
          sessaoCaixaId: sessaoAberta.id,
          criadaEm: now,
          comandaFinalizadaEm: now,
          deletedAt: null,
        },
      ], { session });
      sessaoAberta.totalEntradas += total;
      sessaoAberta.quantidadeEntradas += 1;
      await sessaoAberta.save({ session });
    });
    return finalized;
  } finally {
    await session.endSession();
  }
}
