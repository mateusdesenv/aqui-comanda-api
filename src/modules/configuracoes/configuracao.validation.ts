import { z } from 'zod';

export const uiScaleSchema = z.object({
  body: z.object({ uiScale: z.enum(['mini', 'tiny', 'small', 'medium', 'large']) }),
});

const validMenuIds = ['dashboard', 'mapa', 'comandas', 'mesas', 'clientes', 'pedidos', 'colaboradores', 'caixa', 'cardapio', 'estoque', 'relatorios', 'configuracoes'] as const;

export const menuOrderSchema = z.object({
  body: z.object({ menuOrder: z.array(z.enum(validMenuIds)) }),
});
