import { z } from 'zod';
import { paginationQuerySchema } from '../../common/validation/base.validation';

export const mesaBodySchema = z.object({
  legacyId: z.string().optional(),
  numero: z.coerce.number().int().positive(),
  nome: z.string().optional(),
  status: z.enum(['livre', 'reservada', 'inativa']).default('livre'),
  capacidade: z.coerce.number().optional(),
  observacao: z.string().optional(),
  ambiente: z.string().optional(),
  ativo: z.boolean().optional(),
}).passthrough();

export const mesaListSchema = z.object({
  query: paginationQuerySchema.extend({ status: z.string().optional() }).passthrough(),
});
export const mesaCreateSchema = z.object({ body: mesaBodySchema });
export const mesaUpdateSchema = z.object({ params: z.object({ id: z.string().min(1) }), body: mesaBodySchema.partial() });
export const mesaStatusSchema = z.object({ params: z.object({ id: z.string().min(1) }), body: z.object({ status: z.enum(['livre', 'reservada', 'inativa']) }) });
export const mesaIdSchema = z.object({ params: z.object({ id: z.string().min(1) }) });
