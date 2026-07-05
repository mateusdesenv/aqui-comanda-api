import { NextFunction, Request, RequestHandler, Response } from 'express';
import { z, ZodTypeAny } from 'zod';

export function validate(schema: ZodTypeAny): RequestHandler {
  return (req: Request, _res: Response, next: NextFunction) => {
    const parsed = schema.parse({
      body: req.body,
      params: req.params,
      query: req.query,
    }) as Record<string, any>;

    (req as any).body = parsed.body ?? req.body;
    (req as any).params = parsed.params ?? req.params;
    (req as any).query = parsed.query ?? req.query;
    next();
  };
}

export const idParamsSchema = z.object({
  params: z.object({ id: z.string().min(1) }),
});
