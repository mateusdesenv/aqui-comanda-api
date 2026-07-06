import { connectDatabase, disconnectDatabase } from './connection';
import { CompanyModel } from '../modules/companies/company.model';
import { MembershipModel } from '../modules/memberships/membership.model';
import { createFullPermissoes } from '../modules/memberships/membership.types';
import { FilialModel } from '../modules/filiais/filial.model';
import { MesaModel } from '../modules/mesas/mesa.model';
import { ProdutoModel } from '../modules/produtos/produto.model';
import { SettingModel } from '../modules/configuracoes/setting.model';

async function seed(): Promise<void> {
  await connectDatabase();

  const adminUid = 'dev-admin-firebase-uid';
  const company = await CompanyModel.findOneAndUpdate(
    { ownerFirebaseUid: adminUid },
    {
      nome: 'Aqui Comanda Dev',
      slug: 'default-dev',
      ownerFirebaseUid: adminUid,
      ownerEmail: 'admin@aqui-comanda.local',
      status: 'ativa',
      plano: 'development',
    },
    { upsert: true, new: true },
  );

  const tenantId = company.id;
  const companyId = company.id;

  await MembershipModel.findOneAndUpdate(
    { firebaseUid: adminUid, companyId },
    {
      tenantId,
      companyId,
      firebaseUid: adminUid,
      colaboradorId: 'admin-default',
      nome: 'Administrador Dev',
      email: 'admin@aqui-comanda.local',
      role: 'admin',
      ativo: true,
      permissoes: createFullPermissoes(),
      deletedAt: null,
    },
    { upsert: true },
  );

  await FilialModel.findOneAndUpdate(
    { tenantId, nome: 'Matriz' },
    {
      tenantId,
      companyId,
      nome: 'Matriz',
      endereco: { rua: 'Rua do Comercio', numero: '120', bairro: 'Centro', cidade: 'Criciuma', estado: 'SC', cep: '88801-000' },
      colaboradoresIds: ['admin-default'],
      ativa: true,
      deletedAt: null,
    },
    { upsert: true },
  );

  const mesas = [1, 2, 3].map((numero) => ({
    tenantId,
    companyId,
    numero,
    nome: `Mesa ${String(numero).padStart(2, '0')}`,
    status: 'livre',
    capacidade: 4,
    deletedAt: null,
  }));
  await MesaModel.bulkWrite(mesas.map((mesa) => ({ updateOne: { filter: { tenantId, numero: mesa.numero }, update: mesa, upsert: true } })));

  const produtos = [
    { nome: 'X-Burger', descricao: 'Hamburguer, queijo e molho da casa.', categoria: 'Lanches', tamanho: 'medio', preco: 24.9 },
    { nome: 'Batata Frita', descricao: 'Porcao crocante.', categoria: 'Porções', tamanho: 'grande', preco: 16.9 },
    { nome: 'Refrigerante Lata', descricao: 'Lata 350 ml.', categoria: 'Bebidas', tamanho: 'pequeno', preco: 7.5 },
  ].map((produto) => ({ tenantId, companyId, ...produto, stockQuantity: 0, costPrice: 0, ativo: true, controlaEstoque: true, deletedAt: null }));
  await ProdutoModel.bulkWrite(produtos.map((produto) => ({ updateOne: { filter: { tenantId, nome: produto.nome }, update: produto, upsert: true } })));

  await SettingModel.findOneAndUpdate({ tenantId }, { tenantId, companyId, uiScale: 'medium', menuOrder: [] }, { upsert: true });

  console.log('[seed] Seed de desenvolvimento concluido.');
  await disconnectDatabase();
}

seed().catch(async (error) => {
  console.error('[seed] Falha:', error);
  await disconnectDatabase();
  process.exit(1);
});
