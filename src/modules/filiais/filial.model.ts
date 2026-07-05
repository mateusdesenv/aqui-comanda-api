import { InferSchemaType, Schema, model } from 'mongoose';
import { tenantFields } from '../../common/mongoose/base-fields';

const enderecoFilialSchema = new Schema(
  {
    rua: { type: String, required: true },
    numero: { type: String, required: true },
    complemento: String,
    bairro: { type: String, required: true },
    cidade: { type: String, required: true },
    estado: { type: String, required: true },
    cep: String,
  },
  { _id: false },
);

const filialSchema = new Schema(
  {
    ...tenantFields,
    codigo: String,
    nome: { type: String, required: true, trim: true },
    descricao: String,
    endereco: { type: enderecoFilialSchema, required: true },
    colaboradoresIds: { type: [String], default: [] },
    ativa: { type: Boolean, default: true, index: true },
  },
  { timestamps: true, strict: false },
);

export type Filial = InferSchemaType<typeof filialSchema>;
export const FilialModel = model('Filial', filialSchema, 'filiais');
