import { Response } from 'express';
import { AuthenticatedRequest, TelaSistema } from '../types/request';
import { asyncHandler } from '../utils/async-handler';
import { sendSuccess } from '../utils/api-response';
import { CrudService } from './crud.service';

export function getScope(req: AuthenticatedRequest) {
  return { tenantId: req.tenantId, companyId: req.companyId, userId: req.user.uid };
}

export function createCrudHandlers<T = any>(
  service: CrudService<T>,
  options?: {
    listFilter?: (query: Record<string, unknown>) => Record<string, unknown>;
    beforeCreate?: (body: Record<string, unknown>) => Record<string, unknown>;
    beforeUpdate?: (body: Record<string, unknown>) => Record<string, unknown>;
  },
) {
  return {
    list: asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
      const query = req.query as Record<string, unknown>;
      const data = await service.list(getScope(req), query, options?.listFilter?.(query) ?? {});
      sendSuccess(res, data);
    }),
    getById: asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
      const item = await service.getById(getScope(req), String(req.params.id));
      sendSuccess(res, item);
    }),
    create: asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
      const item = await service.create(getScope(req), options?.beforeCreate?.(req.body) ?? req.body);
      sendSuccess(res, item, 'Registro criado com sucesso.', 201);
    }),
    update: asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
      const item = await service.update(getScope(req), String(req.params.id), options?.beforeUpdate?.(req.body) ?? req.body);
      sendSuccess(res, item, 'Registro atualizado com sucesso.');
    }),
    remove: asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
      await service.softDelete(getScope(req), String(req.params.id));
      res.status(204).send();
    }),
  };
}

export interface CrudRouteConfig {
  tela: TelaSistema;
}
