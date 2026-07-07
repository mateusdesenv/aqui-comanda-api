import mongoose, { Model } from 'mongoose';
import { TenantScope } from '../../common/crud/crud.service';
import { BackupJobModel } from './backup-job.model';
import { ClienteModel } from '../clientes/cliente.model';
import { ProdutoModel } from '../produtos/produto.model';
import { StockEntryModel } from '../estoque/stock-entry.model';
import { MesaModel } from '../mesas/mesa.model';
import { ComandaModel } from '../comandas/comanda.model';
import { PedidoModel } from '../pedidos/pedido.model';
import { CaixaEntradaModel } from '../caixa/caixa-entrada.model';
import { CaixaSessaoModel } from '../caixa/caixa-sessao.model';
import { MembershipModel } from '../memberships/membership.model';
import { FilialModel } from '../filiais/filial.model';
import { SettingModel } from '../configuracoes/setting.model';
import { AppError } from '../../common/errors/AppError';
import { ErrorCodes } from '../../common/errors/error-codes';
import { normalizeCpf } from '../../common/utils/cpf';
import { stripTenantProtectedFields } from '../../common/utils/tenant-payload';

const BackupJobs = BackupJobModel as any;

const moduleMap: Record<string, Model<any>> = {
  clientes: ClienteModel,
  produtos: ProdutoModel,
  estoque: StockEntryModel,
  mesas: MesaModel,
  comandas: ComandaModel,
  pedidos: PedidoModel,
  colaboradores: MembershipModel,
  filiais: FilialModel,
};

export async function exportBackup(scope: TenantScope) {
  const [clientes, produtos, estoque, mesas, comandas, pedidos, entradas, sessoes, colaboradores, filiais, settings] = await Promise.all([
    ClienteModel.find({ tenantId: scope.tenantId, deletedAt: null }).lean(),
    ProdutoModel.find({ tenantId: scope.tenantId, deletedAt: null }).lean(),
    StockEntryModel.find({ tenantId: scope.tenantId, deletedAt: null }).lean(),
    MesaModel.find({ tenantId: scope.tenantId, deletedAt: null }).lean(),
    ComandaModel.find({ tenantId: scope.tenantId, deletedAt: null }).lean(),
    PedidoModel.find({ tenantId: scope.tenantId, deletedAt: null }).lean(),
    CaixaEntradaModel.find({ tenantId: scope.tenantId, deletedAt: null }).lean(),
    CaixaSessaoModel.find({ tenantId: scope.tenantId, deletedAt: null }).lean(),
    MembershipModel.find({ tenantId: scope.tenantId, deletedAt: null }).lean(),
    FilialModel.find({ tenantId: scope.tenantId, deletedAt: null }).lean(),
    SettingModel.findOne({ tenantId: scope.tenantId }).lean(),
  ]);
  await BackupJobs.create({ tenantId: scope.tenantId, companyId: scope.companyId, createdBy: scope.userId, updatedBy: scope.userId, type: 'export', status: 'success', collections: Object.keys(moduleMap), deletedAt: null });
  return {
    clientes,
    produtos,
    estoque,
    mesas,
    comandas,
    pedidos,
    caixa: { entradas, sessoes },
    colaboradores,
    filiais,
    configuracoes: settings?.uiScale ?? 'medium',
    'ordem-menu': settings?.menuOrder ?? [],
  };
}

function normalizeImportedDocs(scope: TenantScope, docs: unknown[]) {
  return docs.map((doc: any) => {
    const cleanDoc = stripTenantProtectedFields(doc);

    return {
    ...cleanDoc,
    _id: undefined,
    legacyId: doc.legacyId ?? doc.id ?? doc._id,
    tenantId: scope.tenantId,
    companyId: scope.companyId,
    createdBy: scope.userId,
    updatedBy: scope.userId,
    deletedAt: null,
    };
  });
}

function normalizeImportedMemberships(scope: TenantScope, docs: unknown[]) {
  return docs
    .filter((doc: any) => doc?.manualAuth === true || doc?.cpf)
    .flatMap((doc: any) => {
      const cpf = normalizeCpf(doc.cpf ?? doc.usuario ?? doc.login);
      if (!cpf) return [];
      const cleanDoc = stripTenantProtectedFields(doc);

      return [{
        ...cleanDoc,
        _id: undefined,
        legacyId: doc.legacyId ?? doc.id ?? doc._id,
        cpf,
        firebaseUid: `manual-${scope.tenantId}-${cpf}`,
        colaboradorId: `cpf-${cpf}`,
        providerId: 'cpf-password',
        manualAuth: true,
        tenantId: scope.tenantId,
        companyId: scope.companyId,
        createdBy: scope.userId,
        updatedBy: scope.userId,
        deletedAt: null,
      }];
    });
}

function normalizeModuleDocs(scope: TenantScope, moduleId: string, docs: unknown[]) {
  return moduleId === 'colaboradores' ? normalizeImportedMemberships(scope, docs) : normalizeImportedDocs(scope, docs);
}

export async function importBackup(scope: TenantScope, backup: Record<string, unknown>, mode: 'replace' | 'merge') {
  const session = await mongoose.startSession();
  try {
    await session.withTransaction(async () => {
      for (const [moduleId, model] of Object.entries(moduleMap)) {
        const payload = backup[moduleId];
        if (!Array.isArray(payload)) throw new AppError(400, `Modulo ${moduleId} precisa ser uma lista.`, ErrorCodes.VALIDATION_ERROR);
        if (mode === 'replace') await model.updateMany({ tenantId: scope.tenantId, deletedAt: null }, { deletedAt: new Date(), deletedBy: scope.userId }, { session });
        if (payload.length) await model.insertMany(normalizeModuleDocs(scope, moduleId, payload), { session, ordered: true });
      }
      const caixa = backup.caixa as { entradas?: unknown[]; sessoes?: unknown[] } | undefined;
      if (!caixa || !Array.isArray(caixa.entradas) || !Array.isArray(caixa.sessoes)) throw new AppError(400, 'Modulo caixa precisa conter entradas e sessoes.', ErrorCodes.VALIDATION_ERROR);
      if (mode === 'replace') {
        await CaixaEntradaModel.updateMany({ tenantId: scope.tenantId, deletedAt: null }, { deletedAt: new Date(), deletedBy: scope.userId }, { session });
        await CaixaSessaoModel.updateMany({ tenantId: scope.tenantId, deletedAt: null }, { deletedAt: new Date(), deletedBy: scope.userId }, { session });
      }
      if (caixa.entradas.length) await CaixaEntradaModel.insertMany(normalizeImportedDocs(scope, caixa.entradas), { session });
      if (caixa.sessoes.length) await CaixaSessaoModel.insertMany(normalizeImportedDocs(scope, caixa.sessoes), { session });
      await SettingModel.findOneAndUpdate({ tenantId: scope.tenantId }, { tenantId: scope.tenantId, companyId: scope.companyId, uiScale: backup.configuracoes ?? 'medium', menuOrder: backup['ordem-menu'] ?? [], updatedBy: scope.userId }, { upsert: true, session });
      await BackupJobs.create([{ tenantId: scope.tenantId, companyId: scope.companyId, createdBy: scope.userId, updatedBy: scope.userId, type: 'import', mode, status: 'success', collections: [...Object.keys(moduleMap), 'caixa', 'configuracoes', 'ordem-menu'], deletedAt: null }], { session });
    });
  } finally {
    await session.endSession();
  }
}

export async function importBackupModule(scope: TenantScope, moduleId: string, payload: unknown, mode: 'replace' | 'merge') {
  if (moduleId === 'caixa') {
    await importCaixaModule(scope, payload, mode);
    return;
  }

  if (moduleId === 'configuracoes') {
    await SettingModel.findOneAndUpdate(
      { tenantId: scope.tenantId },
      { tenantId: scope.tenantId, companyId: scope.companyId, uiScale: typeof payload === 'string' ? payload : 'medium', updatedBy: scope.userId },
      { upsert: true },
    );
    await BackupJobs.create({ tenantId: scope.tenantId, companyId: scope.companyId, createdBy: scope.userId, updatedBy: scope.userId, type: 'import', mode, moduleId, status: 'success', collections: [moduleId], deletedAt: null });
    return;
  }

  if (moduleId === 'ordem-menu') {
    await SettingModel.findOneAndUpdate(
      { tenantId: scope.tenantId },
      { tenantId: scope.tenantId, companyId: scope.companyId, menuOrder: Array.isArray(payload) ? payload : [], updatedBy: scope.userId },
      { upsert: true },
    );
    await BackupJobs.create({ tenantId: scope.tenantId, companyId: scope.companyId, createdBy: scope.userId, updatedBy: scope.userId, type: 'import', mode, moduleId, status: 'success', collections: [moduleId], deletedAt: null });
    return;
  }

  const model = moduleMap[moduleId];
  if (!model) throw new AppError(404, 'Modulo de backup nao encontrado.', ErrorCodes.NOT_FOUND);
  if (!Array.isArray(payload)) throw new AppError(400, 'Modulo precisa ser uma lista.', ErrorCodes.VALIDATION_ERROR);
  if (mode === 'replace') await model.updateMany({ tenantId: scope.tenantId, deletedAt: null }, { deletedAt: new Date(), deletedBy: scope.userId });
  if (payload.length) await model.insertMany(normalizeModuleDocs(scope, moduleId, payload));
  await BackupJobs.create({ tenantId: scope.tenantId, companyId: scope.companyId, createdBy: scope.userId, updatedBy: scope.userId, type: 'import', mode, moduleId, status: 'success', collections: [moduleId], deletedAt: null });
}

async function importCaixaModule(scope: TenantScope, payload: unknown, mode: 'replace' | 'merge') {
  const caixa = payload as { entradas?: unknown[]; sessoes?: unknown[] };
  if (!caixa || !Array.isArray(caixa.entradas) || !Array.isArray(caixa.sessoes)) {
    throw new AppError(400, 'Modulo caixa precisa conter entradas e sessoes.', ErrorCodes.VALIDATION_ERROR);
  }
  const entradas = caixa.entradas;
  const sessoes = caixa.sessoes;

  const session = await mongoose.startSession();
  try {
    await session.withTransaction(async () => {
      if (mode === 'replace') {
        await CaixaEntradaModel.updateMany({ tenantId: scope.tenantId, deletedAt: null }, { deletedAt: new Date(), deletedBy: scope.userId }, { session });
        await CaixaSessaoModel.updateMany({ tenantId: scope.tenantId, deletedAt: null }, { deletedAt: new Date(), deletedBy: scope.userId }, { session });
      }

      if (entradas.length) await CaixaEntradaModel.insertMany(normalizeImportedDocs(scope, entradas), { session });
      if (sessoes.length) await CaixaSessaoModel.insertMany(normalizeImportedDocs(scope, sessoes), { session });
      await BackupJobs.create([{ tenantId: scope.tenantId, companyId: scope.companyId, createdBy: scope.userId, updatedBy: scope.userId, type: 'import', mode, moduleId: 'caixa', status: 'success', collections: ['caixa'], deletedAt: null }], { session });
    });
  } finally {
    await session.endSession();
  }
}
