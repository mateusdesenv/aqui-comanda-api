import { Router } from 'express';
import { CrudService } from '../../common/crud/crud.service';
import { createCrudHandlers } from '../../common/crud/crud.controller';
import { validate } from '../../middlewares/validate.middleware';
import { requirePermission } from '../../middlewares/auth.middleware';
import { ProdutoModel } from './produto.model';
import { produtoCreateSchema, produtoIdSchema, produtoListSchema, produtoStatusSchema, produtoUpdateSchema } from './produto.validation';

const router = Router();
const service = new CrudService(ProdutoModel, { searchFields: ['nome', 'descricao', 'categoria', 'codigo'], defaultSort: { nome: 1 } });
const handlers = createCrudHandlers(service, {
  listFilter: (query) => {
    const filter: Record<string, unknown> = {};
    if (query.categoria) filter.categoria = query.categoria;
    if (query.tamanho) filter.tamanho = query.tamanho;
    if (query.ativo === 'true' || query.ativo === 'false') filter.ativo = query.ativo === 'true';
    if (query.minPrice || query.maxPrice) filter.preco = { ...(query.minPrice ? { $gte: query.minPrice } : {}), ...(query.maxPrice ? { $lte: query.maxPrice } : {}) };
    if (query.stockStatus === 'sem_estoque') filter.stockQuantity = { $lte: 0 };
    if (query.stockStatus === 'baixo') filter.stockQuantity = { $gt: 0, $lte: Number(query.lowStockLimit ?? 5) };
    return filter;
  },
});

router.get('/', requirePermission('cardapio', 'leitura'), validate(produtoListSchema), handlers.list);
router.post('/', requirePermission('cardapio', 'escrita'), validate(produtoCreateSchema), handlers.create);
router.get('/:id', requirePermission('cardapio', 'leitura'), validate(produtoIdSchema), handlers.getById);
router.put('/:id', requirePermission('cardapio', 'escrita'), validate(produtoUpdateSchema), handlers.update);
router.patch('/:id/status', requirePermission('cardapio', 'escrita'), validate(produtoStatusSchema), handlers.update);
router.delete('/:id', requirePermission('cardapio', 'escrita'), validate(produtoIdSchema), handlers.remove);

export const produtoRoutes = router;
