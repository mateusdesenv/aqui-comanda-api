import { Router, Response } from 'express';
import { CrudService } from '../../common/crud/crud.service';
import { createCrudHandlers, getScope } from '../../common/crud/crud.controller';
import { sendSuccess } from '../../common/utils/api-response';
import { asyncHandler } from '../../common/utils/async-handler';
import { AuthenticatedRequest } from '../../common/types/request';
import { validate } from '../../middlewares/validate.middleware';
import { requirePermission } from '../../middlewares/auth.middleware';
import { ProdutoCategoriaModel, defaultProductCategories } from './produto-categoria.model';
import {
  produtoCategoriaCreateSchema,
  produtoCategoriaIdSchema,
  produtoCategoriaListSchema,
  produtoCategoriaUpdateSchema,
} from './produto-categoria.validation';

const router = Router();
const service = new CrudService(ProdutoCategoriaModel, { searchFields: ['titulo'], defaultSort: { titulo: 1 } });
const handlers = createCrudHandlers(service);

const ensureDefaultCategories = async (req: AuthenticatedRequest) => {
  const existingCount = await ProdutoCategoriaModel.countDocuments({
    tenantId: req.tenantId,
    deletedAt: null,
  });

  if (existingCount === 0) {
    await ProdutoCategoriaModel.insertMany(
      defaultProductCategories.map((category) => ({
        ...category,
        tenantId: req.tenantId,
        companyId: req.companyId,
        createdBy: req.user.uid,
        updatedBy: req.user.uid,
        deletedAt: null,
      })),
    );
    return;
  }

  await Promise.all(
    defaultProductCategories.map((category) =>
      ProdutoCategoriaModel.updateOne(
        {
          tenantId: req.tenantId,
          deletedAt: null,
          titulo: category.titulo,
          $or: [{ imagem: { $exists: false } }, { imagem: '' }, { imagem: null }],
        },
        {
          $set: {
            icone: category.icone,
            imagem: category.imagem,
            updatedBy: req.user.uid,
          },
        },
      ),
    ),
  );
};

router.get(
  '/',
  requirePermission('cardapio', 'leitura'),
  validate(produtoCategoriaListSchema),
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    await ensureDefaultCategories(req);
    const data = await service.list(getScope(req), { page: 1, limit: 100, sortBy: 'titulo', sortOrder: 'asc' });
    sendSuccess(res, data);
  }),
);
router.post('/', requirePermission('cardapio', 'escrita'), validate(produtoCategoriaCreateSchema), handlers.create);
router.get('/:id', requirePermission('cardapio', 'leitura'), validate(produtoCategoriaIdSchema), handlers.getById);
router.put('/:id', requirePermission('cardapio', 'escrita'), validate(produtoCategoriaUpdateSchema), handlers.update);
router.delete('/:id', requirePermission('cardapio', 'escrita'), validate(produtoCategoriaIdSchema), handlers.remove);

export const produtoCategoriaRoutes = router;
