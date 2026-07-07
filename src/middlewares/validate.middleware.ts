import { NextFunction, Request, RequestHandler, Response } from 'express';
import { z, ZodTypeAny } from 'zod';

export type ValidatedRequest<
  TQuery = Record<string, unknown>,
  TBody = Record<string, unknown>,
  TParams = Record<string, unknown>,
> = Request & {
  validatedQuery?: TQuery;
  validatedBody?: TBody;
  validatedParams?: TParams;
};

export function getValidatedQuery<TQuery = Record<string, unknown>>(req: Request): TQuery {
  return ((req as ValidatedRequest<TQuery>).validatedQuery ?? req.query) as TQuery;
}

export function getValidatedBody<TBody = Record<string, unknown>>(req: Request): TBody {
  return ((req as ValidatedRequest<unknown, TBody>).validatedBody ?? req.body) as TBody;
}

export function getValidatedParams<TParams = Record<string, unknown>>(req: Request): TParams {
  return ((req as ValidatedRequest<unknown, unknown, TParams>).validatedParams ?? req.params) as TParams;
}

export function validate(schema: ZodTypeAny): RequestHandler {
  return (req: Request, _res: Response, next: NextFunction) => {
    const parsed = schema.parse({
      body: req.body,
      params: req.params,
      query: req.query,
    }) as Record<string, any>;

    if (parsed.body !== undefined) {
      (req as any).body = parsed.body;
      (req as ValidatedRequest).validatedBody = parsed.body;
    }

    if (parsed.params !== undefined) {
      (req as any).params = parsed.params;
      (req as ValidatedRequest).validatedParams = parsed.params;
    }

    // Express 5 exposes req.query through a getter-only property.
    // Do not assign to req.query. Keep the sanitized/coerced value here.
    if (parsed.query !== undefined) {
      (req as ValidatedRequest).validatedQuery = parsed.query;
    }

    next();
  };
}

export const idParamsSchema = z.object({
  params: z.object({ id: z.string().min(1) }),
});
