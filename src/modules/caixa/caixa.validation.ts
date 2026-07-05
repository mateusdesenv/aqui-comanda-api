import { z } from 'zod';
import { optionalDateRangeQuerySchema, paginationQuerySchema } from '../../common/validation/base.validation';

export const abrirCaixaSchema = z.object({ body: z.object({ observacaoAbertura: z.string().optional() }).default({}) });
export const fecharCaixaSchema = z.object({
  params: z.object({ id: z.string().min(1) }),
  body: z.object({ observacaoFechamento: z.string().optional() }).default({}),
});
export const caixaEntradasListSchema = z.object({
  query: paginationQuerySchema.merge(optionalDateRangeQuerySchema).extend({
    formaPagamento: z.string().optional(),
    mesaNumero: z.string().optional(),
    tipo: z.string().optional(),
  }).passthrough(),
});
export const caixaSessoesListSchema = z.object({
  query: paginationQuerySchema.merge(optionalDateRangeQuerySchema).extend({ status: z.string().optional() }).passthrough(),
});
