import { InferSchemaType, Schema, model } from 'mongoose';
import { tenantFields } from '../../common/mongoose/base-fields';

const itemPedidoSchema = new Schema(
  {
    id: String,
    productId: { type: String, required: true },
    nome: { type: String, required: true },
    tamanho: String,
    quantidade: { type: Number, required: true, min: 0 },
    precoUnitario: { type: Number, required: true, min: 0 },
    subtotal: { type: Number, required: true, min: 0 },
    unitCost: Number,
    totalCost: Number,
  },
  { _id: false, strict: false },
);

const pedidoSchema = new Schema(
  {
    ...tenantFields,
    codigo: { type: String, required: true, index: true },
    clienteId: { type: String, index: true },
    clienteNome: { type: String, required: true },
    telefone: String,
    cepEntrega: String,
    enderecoEntrega: { type: String, required: true },
    numero: String,
    complemento: String,
    bairro: String,
    cidade: String,
    estado: String,
    observacoesEntrega: String,
    itens: { type: [itemPedidoSchema], default: [] },
    subtotal: Number,
    taxaEntrega: Number,
    desconto: Number,
    total: { type: Number, default: 0 },
    formaPagamento: String,
    trocoPara: Number,
    observacoesPedido: String,
    pagamentoConfirmado: { type: Boolean, default: false },
    status: { type: String, enum: ['aberto', 'em_preparo', 'saiu_entrega', 'entregue', 'cancelado'], default: 'aberto', index: true },
    justificativaCancelamento: String,
  },
  { timestamps: true, strict: false },
);

pedidoSchema.index({ tenantId: 1, codigo: 1 }, { unique: true, partialFilterExpression: { deletedAt: null } });

export type Pedido = InferSchemaType<typeof pedidoSchema>;
export const PedidoModel = model('Pedido', pedidoSchema, 'pedidos');
