import { InferSchemaType, Schema, model } from 'mongoose';
import { tenantFields } from '../../common/mongoose/base-fields';

export const defaultProductCategories = [
  { titulo: 'Bebidas', icone: 'cards', imagem: 'assets/category-icons/bebidas.webp' },
  { titulo: 'Sinuca', icone: 'table', imagem: 'assets/category-icons/sinuca.webp' },
  { titulo: 'Petiscos', icone: 'receipt', imagem: 'assets/category-icons/petiscos.webp' },
  { titulo: 'Lanches', icone: 'cards', imagem: 'assets/category-icons/lanches.webp' },
  { titulo: 'Drinks', icone: 'bell', imagem: 'assets/category-icons/drinks.webp' },
  { titulo: 'Cervejas', icone: 'register', imagem: 'assets/category-icons/cervejas.webp' },
  { titulo: 'Chopp', icone: 'dollar', imagem: 'assets/category-icons/chopp.webp' },
  { titulo: 'Extras', icone: 'file', imagem: 'assets/category-icons/extras.webp' },
  { titulo: 'Destilados', icone: 'shield', imagem: 'assets/category-icons/destilados.webp' },
  { titulo: 'Porções', icone: 'receipt', imagem: 'assets/category-icons/porcoes.webp' },
  { titulo: 'Sobremesas', icone: 'check', imagem: 'assets/category-icons/sobremesas.webp' },
] as const;

const produtoCategoriaSchema = new Schema(
  {
    ...tenantFields,
    titulo: { type: String, required: true, trim: true, index: true },
    icone: { type: String, required: true, trim: true, default: 'cards' },
    imagem: { type: String, trim: true, default: '' },
  },
  { timestamps: true },
);

produtoCategoriaSchema.index({ tenantId: 1, titulo: 1 });

export type ProdutoCategoria = InferSchemaType<typeof produtoCategoriaSchema>;
export const ProdutoCategoriaModel = model('ProdutoCategoria', produtoCategoriaSchema, 'produto_categorias');
