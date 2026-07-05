import { z } from 'zod';
import { optionalDateRangeQuerySchema, paginationQuerySchema } from '../../common/validation/base.validation';

const itemComandaSchema = z.object({
  id: z.string().optional(),
  productId: z.string().min(1),
  nome: z.string().optional(),
  tamanho: z.string().optional(),
  quantidade: z.coerce.number().positive(),
  precoUnitario: z.coerce.number().min(0).optional(),
  unitCost: z.coerce.number().min(0).optional(),
});

export const comandaPayloadSchema = z.object({
  body: z.object({
    legacyId: z.string().optional(),
    clienteId: z.string().optional(),
    clienteNome: z.string().optional(),
    clienteManual: z.boolean().optional(),
    mesaId: z.string().optional(),
    items: z.array(itemComandaSchema).optional(),
    itens: z.array(itemComandaSchema).optional(),
  }).passthrough(),
});

export const comandaItensSchema = z.object({
  params: z.object({ id: z.string().min(1) }),
  body: z.object({
    items: z.array(itemComandaSchema).optional(),
    itens: z.array(itemComandaSchema).optional(),
  }),
});

export const comandaFinalizarSchema = z.object({
  params: z.object({ id: z.string().min(1) }),
  body: z.object({ formaPagamento: z.string().optional() }).default({}),
});

export const comandaListSchema = z.object({
  query: paginationQuerySchema.merge(optionalDateRangeQuerySchema).extend({
    status: z.string().optional(),
    mesaId: z.string().optional(),
    clienteId: z.string().optional(),
    tipo: z.string().optional(),
    ativa: z.string().optional(),
  }).passthrough(),
});

export const comandaIdSchema = z.object({ params: z.object({ id: z.string().min(1) }) });
