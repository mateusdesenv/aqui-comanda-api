import { Router } from 'express';
import { requirePermission } from '../../middlewares/auth.middleware';
import { getValidatedQuery, validate } from '../../middlewares/validate.middleware';
import { asyncHandler } from '../../common/utils/async-handler';
import { sendSuccess } from '../../common/utils/api-response';
import { AuthenticatedRequest } from '../../common/types/request';
import { getScope } from '../../common/crud/crud.controller';
import { exportBackup, importBackup, importBackupModule } from './backup.service';
import { backupImportModuleSchema, backupImportSchema } from './backup.validation';

const router = Router();

router.get('/export', requirePermission('configuracoes', 'leitura'), asyncHandler(async (req: AuthenticatedRequest, res) => {
  const backup = await exportBackup(getScope(req));
  sendSuccess(res, backup);
}));

router.post('/import', requirePermission('configuracoes', 'escrita'), validate(backupImportSchema), asyncHandler(async (req: AuthenticatedRequest, res) => {
  const query = getValidatedQuery<{ mode?: 'replace' | 'merge' }>(req);
  await importBackup(getScope(req), req.body, query.mode ?? 'replace');
  sendSuccess(res, { imported: true }, 'Backup importado com sucesso.');
}));

router.post('/import/:moduleId', requirePermission('configuracoes', 'escrita'), validate(backupImportModuleSchema), asyncHandler(async (req: AuthenticatedRequest, res) => {
  const query = getValidatedQuery<{ mode?: 'replace' | 'merge' }>(req);
  await importBackupModule(getScope(req), String(req.params.moduleId), req.body, query.mode ?? 'replace');
  sendSuccess(res, { imported: true }, 'Modulo importado com sucesso.');
}));

export const backupRoutes = router;
