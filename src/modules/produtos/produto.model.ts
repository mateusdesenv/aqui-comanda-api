import { InferSchemaType, Schema, model } from 'mongoose';
import { tenantFields } from '../../common/mongoose/base-fields';

export const productCategories = ['Bebidas', 'Sinuca', 'Petiscos', 'Lanches', 'Drinks', 'Cervejas', 'Chopp', 'Extras', 'Destilados', 'Porções', 'Sobremesas'] as const;
export const produtoTamanhos = ['mini', 'muito_pequeno', 'pequeno', 'medio', 'grande'] as const;

const produtoSchema = new Schema(
  {
    ...tenantFields,
    codigo: String,
    nome: { type: String, required: true, trim: true, index: true },
    descricao: { type: String, default: '' },
    categoria: { type: String, enum: productCategories, required: true, index: true },
    tamanho: { type: String, enum: produtoTamanhos, default: 'medio' },
    preco: { type: Number, required: true, min: 0 },
    stockQuantity: { type: Number, default: 0, min: 0 },
    estoqueAtual: Number,
    costPrice: { type: Number, default: 0, min: 0 },
    controlaEstoque: { type: Boolean, default: true },
    ativo: { type: Boolean, default: true, index: true },
    minimumStock: Number,
    estoqueMinimo: Number,
    minStock: Number,
    unidade: String,
  },
  { timestamps: true, strict: false },
);

produtoSchema.index({ tenantId: 1, nome: 1 });
produtoSchema.index({ tenantId: 1, categoria: 1 });
produtoSchema.index({ tenantId: 1, ativo: 1 });

export type Produto = InferSchemaType<typeof produtoSchema>;
export const ProdutoModel = model('Produto', produtoSchema, 'produtos');
