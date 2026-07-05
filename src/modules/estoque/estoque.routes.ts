import { Router } from 'express';
import { validate } from '../../middlewares/validate.middleware';
import { requirePermission } from '../../middlewares/auth.middleware';
import { CrudService } from '../../common/crud/crud.service';
import { createCrudHandlers, getScope } from '../../common/crud/crud.controller';
import { StockEntryModel } from './stock-entry.model';
import { stockEntryCreateSchema, stockEntryIdSchema, stockEntryListSchema } from './estoque.validation';
import { asyncHandler } from '../../common/utils/async-handler';
import { sendSuccess } from '../../common/utils/api-response';
import { createStockEntry } from './estoque.service';
import { AuthenticatedRequest } from '../../common/types/request';
import { parseDate, endOfDay } from '../../common/utils/dates';

const router = Router();
const service = new CrudService(StockEntryModel, { searchFields: ['supplierName', 'notes', 'items.productName'], defaultSort: { date: -1, createdAt: -1 } });
const handlers = createCrudHandlers(service, {
  listFilter: (query) => {
    const filter: Record<string, unknown> = {};
    const productId = query.produtoId ?? query.productId;
    if (productId) filter['items.productId'] = productId;
    if (query.supplierName) filter.supplierName = new RegExp(String(query.supplierName), 'i');
    const start = parseDate(query.dateStart as string | undefined);
    const end = parseDate(query.dateEnd as string | undefined);
    if (start || end) filter.date = { ...(start ? { $gte: start } : {}), ...(end ? { $lte: endOfDay(end) } : {}) };
    return filter;
  },
});

router.get('/entradas', requirePermission('estoque', 'leitura'), validate(stockEntryListSchema), handlers.list);
router.post('/entradas', requirePermission('estoque', 'escrita'), validate(stockEntryCreateSchema), asyncHandler(async (req: AuthenticatedRequest, res) => {
  const entry = await createStockEntry(getScope(req), req.body);
  sendSuccess(res, entry, 'Entrada de estoque registrada com sucesso.', 201);
}));
router.get('/entradas/:id', requirePermission('estoque', 'leitura'), validate(stockEntryIdSchema), handlers.getById);

export const estoqueRoutes = router;
