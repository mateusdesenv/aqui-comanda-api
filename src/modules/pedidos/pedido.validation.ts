import { z } from 'zod';
import { optionalDateRangeQuerySchema, paginationQuerySchema } from '../../common/validation/base.validation';

const paymentMethods = ['dinheiro', 'pix', 'credito', 'debito', 'outro', 'cartao_debito', 'cartao_credito'] as const;
const pedidoStatus = ['aberto', 'em_preparo', 'saiu_entrega', 'entregue', 'cancelado'] as const;

const itemPedidoSchema = z.object({
  id: z.string().optional(),
  productId: z.string().min(1),
  nome: z.string().min(1),
  tamanho: z.string().optional(),
  quantidade: z.coerce.number().positive(),
  precoUnitario: z.coerce.number().min(0),
  subtotal: z.coerce.number().min(0).optional(),
  unitCost: z.coerce.number().optional(),
  totalCost: z.coerce.number().optional(),
}).passthrough();

export const pedidoBodySchema = z.object({
  legacyId: z.string().optional(),
  codigo: z.string().optional(),
  clienteId: z.string().optional(),
  clienteNome: z.string().min(1),
  telefone: z.string().optional(),
  cepEntrega: z.string().optional(),
  enderecoEntrega: z.string().min(1),
  numero: z.string().optional(),
  complemento: z.string().optional(),
  bairro: z.string().optional(),
  cidade: z.string().optional(),
  estado: z.string().optional(),
  observacoesEntrega: z.string().optional(),
  itens: z.array(itemPedidoSchema).min(1),
  subtotal: z.coerce.number().optional(),
  taxaEntrega: z.coerce.number().optional(),
  desconto: z.coerce.number().optional(),
  total: z.coerce.number().optional(),
  formaPagamento: z.enum(paymentMethods).optional(),
  trocoPara: z.coerce.number().optional(),
  observacoesPedido: z.string().optional(),
  status: z.enum(pedidoStatus).optional(),
  justificativaCancelamento: z.string().optional(),
}).passthrough();

export const pedidoCreateSchema = z.object({ body: pedidoBodySchema });
export const pedidoUpdateSchema = z.object({ params: z.object({ id: z.string().min(1) }), body: pedidoBodySchema.partial().extend({ itens: z.array(itemPedidoSchema).min(1).optional() }) });
export const pedidoStatusSchema = z.object({ params: z.object({ id: z.string().min(1) }), body: z.object({ status: z.enum(pedidoStatus), justificativaCancelamento: z.string().optional() }) });
export const pedidoIdSchema = z.object({ params: z.object({ id: z.string().min(1) }) });
export const pedidoListSchema = z.object({
  query: paginationQuerySchema.merge(optionalDateRangeQuerySchema).extend({
    status: z.string().optional(),
    clienteId: z.string().optional(),
    pagamentoConfirmado: z.string().optional(),
  }).passthrough(),
});
