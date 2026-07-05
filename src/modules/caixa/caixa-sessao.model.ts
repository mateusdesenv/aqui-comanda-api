import { InferSchemaType, Schema, model } from 'mongoose';
import { tenantFields } from '../../common/mongoose/base-fields';

const caixaSessaoSchema = new Schema(
  {
    ...tenantFields,
    status: { type: String, enum: ['aberto', 'fechado'], default: 'aberto', index: true },
    abertoEm: { type: Date, required: true },
    fechadoEm: Date,
    abertoPorId: String,
    abertoPorNome: String,
    fechadoPorId: String,
    fechadoPorNome: String,
    observacaoAbertura: String,
    observacaoFechamento: String,
    totalEntradas: { type: Number, default: 0 },
    quantidadeEntradas: { type: Number, default: 0 },
  },
  { timestamps: true, strict: false },
);

caixaSessaoSchema.index({ tenantId: 1, status: 1 });

export type CaixaSessao = InferSchemaType<typeof caixaSessaoSchema>;
export const CaixaSessaoModel = model('CaixaSessao', caixaSessaoSchema, 'caixa_sessoes');
