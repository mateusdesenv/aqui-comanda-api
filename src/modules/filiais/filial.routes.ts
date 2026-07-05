import { Router } from 'express';
import { CrudService } from '../../common/crud/crud.service';
import { createCrudHandlers } from '../../common/crud/crud.controller';
import { validate } from '../../middlewares/validate.middleware';
import { requirePermission } from '../../middlewares/auth.middleware';
import { FilialModel } from './filial.model';
import { filialCreateSchema, filialIdSchema, filialListSchema, filialStatusSchema, filialUpdateSchema } from './filial.validation';
import { uniqueStrings } from '../../common/utils/normalize';

const router = Router();
const service = new CrudService(FilialModel, { searchFields: ['nome', 'descricao', 'endereco.cidade'], defaultSort: { nome: 1 } });
const handlers = createCrudHandlers(service, {
  listFilter: (query) => query.ativa === 'true' || query.ativa === 'false' ? { ativa: query.ativa === 'true' } : {},
  beforeCreate: (body) => ({ ...body, colaboradoresIds: uniqueStrings(body.colaboradoresIds as unknown[]), endereco: { ...(body.endereco as object), estado: String((body.endereco as { estado?: string }).estado ?? '').toUpperCase() } }),
  beforeUpdate: (body) => ({ ...body, colaboradoresIds: Array.isArray(body.colaboradoresIds) ? uniqueStrings(body.colaboradoresIds) : undefined }),
});

router.get('/', requirePermission('configuracoes', 'leitura'), validate(filialListSchema), handlers.list);
router.post('/', requirePermission('configuracoes', 'escrita'), validate(filialCreateSchema), handlers.create);
router.get('/:id', requirePermission('configuracoes', 'leitura'), validate(filialIdSchema), handlers.getById);
router.put('/:id', requirePermission('configuracoes', 'escrita'), validate(filialUpdateSchema), handlers.update);
router.patch('/:id/status', requirePermission('configuracoes', 'escrita'), validate(filialStatusSchema), handlers.update);
router.delete('/:id', requirePermission('configuracoes', 'escrita'), validate(filialIdSchema), handlers.remove);

export const filialRoutes = router;
