import { z } from 'zod';

export const paginationQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).default('asc'),
  search: z.string().optional(),
});

export const idParamSchema = z.object({
  id: z.string().min(1),
});

export const optionalDateRangeQuerySchema = z.object({
  dateStart: z.string().optional(),
  dateEnd: z.string().optional(),
});
