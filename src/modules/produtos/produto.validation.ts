import { z } from 'zod';
import { paginationQuerySchema } from '../../common/validation/base.validation';
import { produtoTamanhos } from './produto.model';

export const produtoBodySchema = z.object({
  legacyId: z.string().optional(),
  codigo: z.string().optional(),
  nome: z.string().min(1),
  descricao: z.string().default(''),
  categoria: z.string().trim().min(1),
  tamanho: z.enum(produtoTamanhos).default('medio'),
  preco: z.coerce.number().min(0),
  stockQuantity: z.coerce.number().min(0).optional(),
  estoqueAtual: z.coerce.number().optional(),
  costPrice: z.coerce.number().min(0).optional(),
  controlaEstoque: z.boolean().optional(),
  ativo: z.boolean().optional(),
  minimumStock: z.coerce.number().optional(),
  estoqueMinimo: z.coerce.number().optional(),
  minStock: z.coerce.number().optional(),
  unidade: z.string().optional(),
}).passthrough();

export const produtoListSchema = z.object({
  query: paginationQuerySchema.extend({
    categoria: z.string().optional(),
    tamanho: z.string().optional(),
    ativo: z.string().optional(),
    stockStatus: z.string().optional(),
    minPrice: z.coerce.number().optional(),
    maxPrice: z.coerce.number().optional(),
  }).passthrough(),
});

export const produtoCreateSchema = z.object({ body: produtoBodySchema });
export const produtoUpdateSchema = z.object({ params: z.object({ id: z.string().min(1) }), body: produtoBodySchema.partial() });
export const produtoStatusSchema = z.object({ params: z.object({ id: z.string().min(1) }), body: z.object({ ativo: z.boolean() }) });
export const produtoIdSchema = z.object({ params: z.object({ id: z.string().min(1) }) });
