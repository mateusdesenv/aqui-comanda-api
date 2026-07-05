import { Router } from 'express';
import { CrudService } from '../../common/crud/crud.service';
import { createCrudHandlers } from '../../common/crud/crud.controller';
import { validate } from '../../middlewares/validate.middleware';
import { requirePermission } from '../../middlewares/auth.middleware';
import { ClienteModel } from './cliente.model';
import { clienteCreateSchema, clienteIdSchema, clienteListSchema, clienteUpdateSchema } from './cliente.validation';

const router = Router();
const service = new CrudService(ClienteModel, { searchFields: ['nome', 'cpf', 'documento', 'telefone', 'email'], defaultSort: { nome: 1 } });
const handlers = createCrudHandlers(service, {
  listFilter: (query) => query.cpf ? { $or: [{ cpf: query.cpf }, { documento: query.cpf }] } : {},
});

router.get('/', requirePermission('clientes', 'leitura'), validate(clienteListSchema), handlers.list);
router.post('/', requirePermission('clientes', 'escrita'), validate(clienteCreateSchema), handlers.create);
router.get('/:id', requirePermission('clientes', 'leitura'), validate(clienteIdSchema), handlers.getById);
router.put('/:id', requirePermission('clientes', 'escrita'), validate(clienteUpdateSchema), handlers.update);
router.delete('/:id', requirePermission('clientes', 'escrita'), validate(clienteIdSchema), handlers.remove);

export const clienteRoutes = router;
