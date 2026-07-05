import { InferSchemaType, Schema, model } from 'mongoose';
import { tenantFields } from '../../common/mongoose/base-fields';

const mesaSchema = new Schema(
  {
    ...tenantFields,
    numero: { type: Number, required: true },
    nome: String,
    status: { type: String, enum: ['livre', 'reservada', 'inativa'], default: 'livre', index: true },
    capacidade: Number,
    observacao: String,
    ambiente: String,
    ativo: { type: Boolean, default: true },
  },
  { timestamps: true, strict: false },
);

mesaSchema.index({ tenantId: 1, numero: 1 }, { unique: true, partialFilterExpression: { deletedAt: null } });

export type Mesa = InferSchemaType<typeof mesaSchema>;
export const MesaModel = model('Mesa', mesaSchema, 'mesas');
