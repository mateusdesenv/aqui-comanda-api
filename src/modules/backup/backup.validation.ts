import { z } from 'zod';

export const backupImportSchema = z.object({
  query: z.object({ mode: z.enum(['replace', 'merge']).default('replace') }).default({ mode: 'replace' }),
  body: z.record(z.string(), z.unknown()),
});

export const backupImportModuleSchema = z.object({
  params: z.object({ moduleId: z.string().min(1) }),
  query: z.object({ mode: z.enum(['replace', 'merge']).default('replace') }).default({ mode: 'replace' }),
  body: z.unknown(),
});
