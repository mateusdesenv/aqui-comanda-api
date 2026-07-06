import { DecodedIdToken } from 'firebase-admin/auth';
import { SettingModel } from '../configuracoes/setting.model';
import { CompanyModel } from '../companies/company.model';
import { FilialModel } from '../filiais/filial.model';
import { MembershipModel } from './membership.model';
import { createFullPermissoes } from './membership.types';
import { debugSaasContext } from '../../common/utils/saas-debug';

export async function findOrCreateMembership(decodedToken: DecodedIdToken) {
  const firebaseUid = decodedToken.uid;
  const email = decodedToken.email;
  const providerId = decodedToken.firebase?.sign_in_provider;

  const existingMembership = await MembershipModel.findOne({ firebaseUid, deletedAt: null });

  if (existingMembership) {
    if (existingMembership.role === 'admin' && !existingMembership.manualAuth) {
      await CompanyModel.findOneAndUpdate(
        { _id: existingMembership.companyId },
        {
          $set: {
            ownerFirebaseUid: firebaseUid,
            ownerEmail: email,
          },
          $setOnInsert: {
            nome: email ? `Empresa de ${email}` : `Empresa ${firebaseUid.slice(0, 8)}`,
            slug: firebaseUid,
            status: 'ativa',
          },
        },
        { upsert: true, new: true },
      );
      await ensureInitialTenantStructure(existingMembership.tenantId, existingMembership.companyId, firebaseUid);
    }

    debugSaasContext('membership.reused', {
      firebaseUid,
      email,
      membershipId: String(existingMembership.id),
      tenantId: existingMembership.tenantId,
      companyId: existingMembership.companyId,
    });
    return existingMembership;
  }

  const company = await CompanyModel.findOneAndUpdate(
    { ownerFirebaseUid: firebaseUid, deletedAt: null },
    {
      $setOnInsert: {
        nome: email ? `Empresa de ${email}` : `Empresa ${firebaseUid.slice(0, 8)}`,
        slug: firebaseUid,
        ownerFirebaseUid: firebaseUid,
        ownerEmail: email,
        status: 'ativa',
      },
    },
    { upsert: true, new: true },
  );
  const tenantId = company.id;

  await ensureInitialTenantStructure(tenantId, company.id, firebaseUid);

  const createdMembership = await MembershipModel.create({
    tenantId,
    companyId: company.id,
    firebaseUid,
    colaboradorId: `firebase-${firebaseUid}`,
    nome: decodedToken.name ?? email ?? 'Administrador',
    email,
    picture: decodedToken.picture,
    providerId,
    manualAuth: false,
    role: 'admin',
    ativo: true,
    permissoes: createFullPermissoes(),
  });

  debugSaasContext('membership.created', {
    firebaseUid,
    email,
    membershipId: String(createdMembership.id),
    tenantId: createdMembership.tenantId,
    companyId: createdMembership.companyId,
  });

  return createdMembership;
}

async function ensureInitialTenantStructure(tenantId: string, companyId: string, userId: string) {
  await Promise.all([
    FilialModel.findOneAndUpdate(
      { tenantId, codigo: 'matriz', deletedAt: null },
      {
        $setOnInsert: {
          tenantId,
          companyId,
          codigo: 'matriz',
          nome: 'Matriz',
          descricao: 'Filial principal',
          endereco: {
            rua: 'Rua principal',
            numero: 'S/N',
            bairro: 'Centro',
            cidade: 'Não informado',
            estado: 'SP',
          },
          colaboradoresIds: [],
          ativa: true,
          createdBy: userId,
          updatedBy: userId,
          deletedAt: null,
        },
      },
      { upsert: true, new: true },
    ),
    SettingModel.findOneAndUpdate(
      { tenantId },
      {
        $setOnInsert: {
          tenantId,
          companyId,
          uiScale: 'medium',
          menuOrder: [],
          createdBy: userId,
        },
      },
      { upsert: true, new: true },
    ),
  ]);
}
