import { Router } from 'express';
import { validate } from '../../middlewares/validate.middleware';
import { requirePermission } from '../../middlewares/auth.middleware';
import { asyncHandler } from '../../common/utils/async-handler';
import { sendSuccess } from '../../common/utils/api-response';
import { AuthenticatedRequest } from '../../common/types/request';
import { SettingModel } from './setting.model';
import { menuOrderSchema, uiScaleSchema } from './configuracao.validation';

const router = Router();

async function getOrCreateSettings(req: AuthenticatedRequest) {
  return SettingModel.findOneAndUpdate(
    { tenantId: req.tenantId },
    { $setOnInsert: { tenantId: req.tenantId, companyId: req.companyId, createdBy: req.user.uid, uiScale: 'medium', menuOrder: [] } },
    { upsert: true, new: true },
  );
}

router.get('/ui', requirePermission('configuracoes', 'leitura'), asyncHandler(async (req: AuthenticatedRequest, res) => {
  const settings = await getOrCreateSettings(req);
  sendSuccess(res, { uiScale: settings.uiScale });
}));

router.put('/ui', requirePermission('configuracoes', 'escrita'), validate(uiScaleSchema), asyncHandler(async (req: AuthenticatedRequest, res) => {
  const settings = await SettingModel.findOneAndUpdate({ tenantId: req.tenantId }, { uiScale: req.body.uiScale, updatedBy: req.user.uid, companyId: req.companyId }, { upsert: true, new: true });
  sendSuccess(res, { uiScale: settings.uiScale }, 'Configuracao visual salva com sucesso.');
}));

router.get('/menu-order', requirePermission('configuracoes', 'leitura'), asyncHandler(async (req: AuthenticatedRequest, res) => {
  const settings = await getOrCreateSettings(req);
  sendSuccess(res, { menuOrder: settings.menuOrder });
}));

router.put('/menu-order', requirePermission('configuracoes', 'escrita'), validate(menuOrderSchema), asyncHandler(async (req: AuthenticatedRequest, res) => {
  const settings = await SettingModel.findOneAndUpdate({ tenantId: req.tenantId }, { menuOrder: req.body.menuOrder, updatedBy: req.user.uid, companyId: req.companyId }, { upsert: true, new: true });
  sendSuccess(res, { menuOrder: settings.menuOrder }, 'Ordem do menu salva com sucesso.');
}));

export const configuracaoRoutes = router;
