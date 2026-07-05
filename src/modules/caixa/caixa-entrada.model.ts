import { InferSchemaType, Schema, model } from 'mongoose';
import { tenantFields } from '../../common/mongoose/base-fields';

const caixaEntradaSchema = new Schema(
  {
    ...tenantFields,
    tipo: { type: String, enum: ['comanda'], default: 'comanda', required: true },
    origemId: { type: String, required: true, index: true },
    origemDescricao: { type: String, required: true },
    clienteId: String,
    clienteNome: String,
    mesaId: { type: String, default: null },
    mesaNumero: Schema.Types.Mixed,
    valor: { type: Number, required: true, min: 0 },
    formaPagamento: { type: String, default: 'Não informado' },
    sessaoCaixaId: { type: String, index: true },
    criadaEm: { type: Date, required: true },
    comandaFinalizadaEm: Date,
  },
  { timestamps: true, strict: false },
);

caixaEntradaSchema.index({ tenantId: 1, origemId: 1, tipo: 1 }, { unique: true, partialFilterExpression: { deletedAt: null } });

export type CaixaEntrada = InferSchemaType<typeof caixaEntradaSchema>;
export const CaixaEntradaModel = model('CaixaEntrada', caixaEntradaSchema, 'caixa_entradas');
