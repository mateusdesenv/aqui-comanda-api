import { z } from 'zod';
import { optionalDateRangeQuerySchema, paginationQuerySchema } from '../../common/validation/base.validation';

const stockItemSchema = z.object({
  productId: z.string().min(1),
  quantity: z.coerce.number().positive(),
  unitCost: z.coerce.number().min(0),
});

export const stockEntryCreateSchema = z.object({
  body: z.object({
    legacyId: z.string().optional(),
    date: z.string().min(1),
    notes: z.string().optional(),
    supplierName: z.string().optional(),
    items: z.array(stockItemSchema).min(1),
  }).passthrough(),
});

export const stockEntryListSchema = z.object({
  query: paginationQuerySchema.merge(optionalDateRangeQuerySchema).extend({
    produtoId: z.string().optional(),
    productId: z.string().optional(),
    supplierName: z.string().optional(),
  }).passthrough(),
});

export const stockEntryIdSchema = z.object({ params: z.object({ id: z.string().min(1) }) });
