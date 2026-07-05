import { z } from 'zod';
import { paginationQuerySchema } from '../../common/validation/base.validation';

const enderecoSchema = z.object({
  rua: z.string().min(1),
  numero: z.string().min(1),
  complemento: z.string().optional(),
  bairro: z.string().min(1),
  cidade: z.string().min(1),
  estado: z.string().min(1).transform((value) => value.toUpperCase()),
  cep: z.string().optional(),
});

export const filialBodySchema = z.object({
  legacyId: z.string().optional(),
  codigo: z.string().optional(),
  nome: z.string().min(1),
  descricao: z.string().optional(),
  endereco: enderecoSchema,
  colaboradoresIds: z.array(z.string()).default([]),
  ativa: z.boolean().optional(),
}).passthrough();

export const filialListSchema = z.object({ query: paginationQuerySchema.extend({ ativa: z.string().optional() }).passthrough() });
export const filialCreateSchema = z.object({ body: filialBodySchema });
export const filialUpdateSchema = z.object({ params: z.object({ id: z.string().min(1) }), body: filialBodySchema.partial() });
export const filialStatusSchema = z.object({ params: z.object({ id: z.string().min(1) }), body: z.object({ ativa: z.boolean() }) });
export const filialIdSchema = z.object({ params: z.object({ id: z.string().min(1) }) });
