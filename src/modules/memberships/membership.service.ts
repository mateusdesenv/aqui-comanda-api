import { DecodedIdToken } from 'firebase-admin/auth';
import { CompanyModel } from '../companies/company.model';
import { MembershipModel } from './membership.model';
import { createFullPermissoes } from './membership.types';

export async function findOrCreateMembership(decodedToken: DecodedIdToken) {
  const firebaseUid = decodedToken.uid;
  const email = decodedToken.email;
  const providerId = decodedToken.firebase?.sign_in_provider;

  const existingMembership = await MembershipModel.findOne({ firebaseUid, deletedAt: null });

  if (existingMembership) {
    return existingMembership;
  }

  const company = await CompanyModel.create({
    nome: email ? `Empresa de ${email}` : `Empresa ${firebaseUid.slice(0, 8)}`,
    slug: firebaseUid,
    status: 'ativa',
  });

  return MembershipModel.create({
    tenantId: company.id,
    companyId: company.id,
    firebaseUid,
    colaboradorId: `firebase-${firebaseUid}`,
    nome: decodedToken.name ?? email ?? 'Administrador',
    email,
    picture: decodedToken.picture,
    providerId,
    role: 'admin',
    ativo: true,
    permissoes: createFullPermissoes(),
  });
}
