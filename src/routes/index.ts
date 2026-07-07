import { Router } from 'express';
import { authMiddleware } from '../middlewares/auth.middleware';
import { tenantMiddleware } from '../middlewares/tenant.middleware';
import { authRoutes, publicAuthRoutes } from '../modules/auth/auth.routes';
import { backupRoutes } from '../modules/backup/backup.routes';
import { caixaRoutes } from '../modules/caixa/caixa.routes';
import { clienteRoutes } from '../modules/clientes/cliente.routes';
import { comandaRoutes } from '../modules/comandas/comanda.routes';
import { configuracaoRoutes } from '../modules/configuracoes/configuracao.routes';
import { dashboardRoutes } from '../modules/dashboard/dashboard.routes';
import { estoqueRoutes } from '../modules/estoque/estoque.routes';
import { filialRoutes } from '../modules/filiais/filial.routes';
import { membershipRoutes } from '../modules/memberships/membership.routes';
import { mesaRoutes } from '../modules/mesas/mesa.routes';
import { pedidoRoutes } from '../modules/pedidos/pedido.routes';
import { produtoRoutes } from '../modules/produtos/produto.routes';

export const routes = Router();

routes.use('/auth', publicAuthRoutes);
routes.use(authMiddleware);
routes.use(tenantMiddleware);

routes.use('/auth', authRoutes);
routes.use('/clientes', clienteRoutes);
routes.use('/produtos', produtoRoutes);
routes.use('/mesas', mesaRoutes);
routes.use('/comandas', comandaRoutes);
routes.use('/pedidos', pedidoRoutes);
routes.use('/estoque', estoqueRoutes);
routes.use('/caixa', caixaRoutes);
routes.use('/colaboradores', membershipRoutes);
routes.use('/filiais', filialRoutes);
routes.use('/configuracoes', configuracaoRoutes);
routes.use('/dashboard', dashboardRoutes);
routes.use('/backups', backupRoutes);
