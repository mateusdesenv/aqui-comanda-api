# Aqui Comanda API - documentacao

## Auth e tenant

Todas as rotas `/api/*` passam por Firebase Admin:

```text
Authorization: Bearer <firebase_id_token>
```

O middleware valida o token, busca ou cria membership e injeta `req.user`, `req.tenantId` e `req.companyId`. O `tenantId` nunca e aceito pelo body.

## Health

`GET /health`

Retorna status publico da API.

## Endpoints

### Clientes

`GET /api/clientes`, `POST /api/clientes`, `GET /api/clientes/:id`, `PUT /api/clientes/:id`, `DELETE /api/clientes/:id`

Filtros: `search`, `cpf`, `page`, `limit`, `sortBy`, `sortOrder`.

### Produtos

`GET /api/produtos`, `POST /api/produtos`, `GET /api/produtos/:id`, `PUT /api/produtos/:id`, `PATCH /api/produtos/:id/status`, `DELETE /api/produtos/:id`

Filtros: `search`, `categoria`, `tamanho`, `ativo`, `stockStatus`, `minPrice`, `maxPrice`.

### Mesas

Inclui `POST /api/mesas/:id/liberar`, que valida se todas as comandas ativas da mesa estao finalizadas.

### Comandas

Criar/editar comanda reserva estoque. Remover comanda aberta devolve estoque. Finalizar exige caixa aberto, marca a comanda como paga/finalizada e cria entrada unica no caixa.

### Pedidos

Pedido nao reduz estoque nesta primeira versao, mantendo comportamento do front atual. Pagamentos legados `cartao_debito` e `cartao_credito` sao normalizados para `debito` e `credito`.

### Estoque

`POST /api/estoque/entradas` cria entrada, incrementa estoque e recalcula custo medio ponderado.

### Caixa

Somente uma sessao aberta por tenant. Fechamento consolida total e quantidade de entradas.

### Backup

`GET /api/backups/export` exporta:

```ts
{
  clientes: [],
  produtos: [],
  estoque: [],
  mesas: [],
  comandas: [],
  pedidos: [],
  caixa: { entradas: [], sessoes: [] },
  colaboradores: [],
  filiais: [],
  configuracoes: "medium",
  "ordem-menu": []
}
```

`POST /api/backups/import?mode=replace|merge` importa backup completo isolado por tenant e registra `backup_jobs`.

## Status codes

- `200` sucesso
- `201` criado
- `204` removido via soft delete
- `400` validacao
- `401` nao autenticado
- `403` sem permissao
- `404` nao encontrado
- `409` regra de negocio/conflito
- `500` erro interno
