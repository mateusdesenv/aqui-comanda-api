import { Schema, model, InferSchemaType } from 'mongoose';
import { telasSistema } from './membership.types';

const permissaoSchema = new Schema(
  {
    tela: { type: String, enum: telasSistema, required: true },
    leitura: { type: Boolean, default: false },
    escrita: { type: Boolean, default: false },
  },
  { _id: false },
);

const membershipSchema = new Schema(
  {
    tenantId: { type: String, required: true, index: true },
    companyId: { type: String, required: true, index: true },
    firebaseUid: { type: String, required: true, index: true },
    colaboradorId: { type: String, index: true },
    nome: String,
    email: { type: String, index: true },
    picture: String,
    providerId: String,
    role: { type: String, enum: ['admin', 'colaborador'], default: 'admin' },
    ativo: { type: Boolean, default: true, index: true },
    permissoes: { type: [permissaoSchema], default: [] },
    deletedBy: String,
    deletedAt: { type: Date, default: null, index: true },
  },
  { timestamps: true },
);

membershipSchema.index({ firebaseUid: 1, companyId: 1 }, { unique: true });

export type Membership = InferSchemaType<typeof membershipSchema>;
export const MembershipModel = model('Membership', membershipSchema, 'memberships');
