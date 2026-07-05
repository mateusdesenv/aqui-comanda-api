import { z } from 'zod';

export const dashboardQuerySchema = z.object({
  query: z.object({
    preset: z.enum(['today', 'yesterday', 'last_7', 'last_30', 'custom']).default('today'),
    startDate: z.string().optional(),
    endDate: z.string().optional(),
  }),
});
