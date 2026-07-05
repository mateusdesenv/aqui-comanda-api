import { InferSchemaType, Schema, model } from 'mongoose';
import { tenantFields } from '../../common/mongoose/base-fields';

const itemComandaSchema = new Schema(
  {
    id: String,
    productId: { type: String, required: true },
    nome: { type: String, required: true },
    tamanho: String,
    quantidade: { type: Number, required: true, min: 0 },
    precoUnitario: { type: Number, required: true, min: 0 },
    unitCost: Number,
    totalCost: Number,
    subtotal: { type: Number, required: true, min: 0 },
  },
  { _id: false, strict: false },
);

const comandaSchema = new Schema(
  {
    ...tenantFields,
    mesaId: { type: String, index: true },
    mesaLiberadaEm: Date,
    clienteId: { type: String, index: true },
    clienteNome: String,
    clienteManual: Boolean,
    tipo: { type: String, enum: ['mesa', 'avulsa'], default: 'avulsa' },
    status: { type: String, enum: ['aberta', 'finalizada'], default: 'aberta', index: true },
    paga: { type: Boolean, default: false },
    finalizadaEm: Date,
    totalFinalizado: Number,
    itens: { type: [itemComandaSchema], default: [] },
    total: { type: Number, default: 0 },
  },
  { timestamps: true, strict: false },
);

comandaSchema.index({ tenantId: 1, status: 1 });
comandaSchema.index({ tenantId: 1, mesaId: 1, mesaLiberadaEm: 1 });

export type Comanda = InferSchemaType<typeof comandaSchema>;
export const ComandaModel = model('Comanda', comandaSchema, 'comandas');
