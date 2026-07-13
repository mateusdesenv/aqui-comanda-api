import { z } from 'zod';
import { paginationQuerySchema } from '../../common/validation/base.validation';

export const produtoCategoriaBodySchema = z.object({
  titulo: z.string().trim().min(1),
  icone: z.string().trim().min(1).default('cards'),
  imagem: z.string().trim().optional(),
});

export const produtoCategoriaListSchema = z.object({
  query: paginationQuerySchema.passthrough(),
});

export const produtoCategoriaCreateSchema = z.object({ body: produtoCategoriaBodySchema });
export const produtoCategoriaUpdateSchema = z.object({
  params: z.object({ id: z.string().min(1) }),
  body: produtoCategoriaBodySchema.partial(),
});
export const produtoCategoriaIdSchema = z.object({ params: z.object({ id: z.string().min(1) }) });
