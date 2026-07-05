import { z } from 'zod';
import { paginationQuerySchema } from '../../common/validation/base.validation';
import { telasSistema } from './membership.types';

const permissaoSchema = z.object({
  tela: z.enum(telasSistema as [string, ...string[]]),
  leitura: z.boolean().default(false),
  escrita: z.boolean().default(false),
});

export const membershipBodySchema = z.object({
  firebaseUid: z.string().min(1),
  colaboradorId: z.string().optional(),
  nome: z.string().min(1),
  email: z.string().email().optional(),
  role: z.enum(['admin', 'colaborador']).default('colaborador'),
  ativo: z.boolean().default(true),
  permissoes: z.array(permissaoSchema).default([]),
}).passthrough();

export const membershipListSchema = z.object({ query: paginationQuerySchema.passthrough() });
export const membershipCreateSchema = z.object({ body: membershipBodySchema });
export const membershipUpdateSchema = z.object({ params: z.object({ id: z.string().min(1) }), body: membershipBodySchema.partial() });
export const membershipStatusSchema = z.object({ params: z.object({ id: z.string().min(1) }), body: z.object({ ativo: z.boolean() }) });
export const membershipIdSchema = z.object({ params: z.object({ id: z.string().min(1) }) });
