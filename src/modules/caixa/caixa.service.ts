import mongoose from 'mongoose';
import { AppError } from '../../common/errors/AppError';
import { ErrorCodes } from '../../common/errors/error-codes';
import { TenantScope } from '../../common/crud/crud.service';
import { CaixaEntradaModel } from './caixa-entrada.model';
import { CaixaSessaoModel } from './caixa-sessao.model';

export async function abrirCaixa(scope: TenantScope, observacaoAbertura?: string) {
  const exists = await CaixaSessaoModel.exists({ tenantId: scope.tenantId, status: 'aberto', deletedAt: null });
  if (exists) {
    throw new AppError(409, 'Ja existe um caixa aberto.', ErrorCodes.CONFLICT);
  }

  return (CaixaSessaoModel as any).create({
    tenantId: scope.tenantId,
    companyId: scope.companyId,
    createdBy: scope.userId,
    updatedBy: scope.userId,
    status: 'aberto',
    abertoEm: new Date(),
    abertoPorId: scope.userId,
    observacaoAbertura: observacaoAbertura?.trim() || undefined,
    totalEntradas: 0,
    quantidadeEntradas: 0,
    deletedAt: null,
  });
}

export async function fecharCaixa(scope: TenantScope, sessaoId: string, observacaoFechamento?: string) {
  const session = await mongoose.startSession();
  try {
    let closed;
    await session.withTransaction(async () => {
      const sessao = await CaixaSessaoModel.findOne({ _id: sessaoId, tenantId: scope.tenantId, status: 'aberto', deletedAt: null }).session(session);
      if (!sessao) {
        throw new AppError(409, 'Nao existe caixa aberto para fechar.', ErrorCodes.CONFLICT);
      }
      const entradas = await CaixaEntradaModel.find({ tenantId: scope.tenantId, sessaoCaixaId: sessao.id, deletedAt: null }).session(session);
      sessao.status = 'fechado';
      sessao.fechadoEm = new Date();
      sessao.fechadoPorId = scope.userId;
      sessao.observacaoFechamento = observacaoFechamento?.trim() || undefined;
      sessao.totalEntradas = entradas.reduce((total, entrada) => total + entrada.valor, 0);
      sessao.quantidadeEntradas = entradas.length;
      (sessao as any).updatedBy = scope.userId;
      closed = await sessao.save({ session });
    });
    return closed;
  } finally {
    await session.endSession();
  }
}
