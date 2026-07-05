import { InferSchemaType, Schema, model } from 'mongoose';
import { tenantFields } from '../../common/mongoose/base-fields';

const clienteSchema = new Schema(
  {
    ...tenantFields,
    nome: { type: String, required: true, trim: true, index: true },
    cpf: { type: String, trim: true },
    documento: { type: String, trim: true },
    dataNascimento: String,
    endereco: String,
    cep: String,
    telefone: String,
    email: String,
    observacao: String,
    ativo: { type: Boolean, default: true, index: true },
  },
  { timestamps: true, strict: false },
);

clienteSchema.index({ tenantId: 1, cpf: 1 }, { unique: true, sparse: true, partialFilterExpression: { cpf: { $type: 'string' }, deletedAt: null } });
clienteSchema.index({ tenantId: 1, documento: 1 }, { sparse: true });

export type Cliente = InferSchemaType<typeof clienteSchema>;
export const ClienteModel = model('Cliente', clienteSchema, 'clientes');
