import { z } from 'zod';
import { paginationQuerySchema } from '../../common/validation/base.validation';

export const clienteBodySchema = z.object({
  legacyId: z.string().optional(),
  nome: z.string().min(1),
  cpf: z.string().optional(),
  documento: z.string().optional(),
  dataNascimento: z.string().optional(),
  endereco: z.string().optional(),
  cep: z.string().optional(),
  telefone: z.string().optional(),
  email: z.string().email().optional().or(z.literal('')),
  observacao: z.string().optional(),
  ativo: z.boolean().optional(),
}).passthrough();

export const clienteListSchema = z.object({
  query: paginationQuerySchema.extend({
    cpf: z.string().optional(),
  }).passthrough(),
});

export const clienteCreateSchema = z.object({ body: clienteBodySchema });
export const clienteUpdateSchema = z.object({ params: z.object({ id: z.string().min(1) }), body: clienteBodySchema.partial() });
export const clienteIdSchema = z.object({ params: z.object({ id: z.string().min(1) }) });
