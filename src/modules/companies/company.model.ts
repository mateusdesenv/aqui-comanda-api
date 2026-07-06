import { Schema, model, InferSchemaType } from 'mongoose';

const companySchema = new Schema(
  {
    nome: { type: String, required: true, trim: true },
    slug: { type: String, trim: true, index: true },
    ownerFirebaseUid: { type: String, required: true, unique: true, index: true },
    ownerEmail: { type: String, trim: true },
    status: { type: String, enum: ['ativa', 'inativa'], default: 'ativa', index: true },
    plano: { type: String, default: 'development' },
    deletedAt: { type: Date, default: null, index: true },
  },
  { timestamps: true },
);

export type Company = InferSchemaType<typeof companySchema>;
export const CompanyModel = model('Company', companySchema, 'companies');
