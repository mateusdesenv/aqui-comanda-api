# Aqui Comanda API

API REST em Node.js + TypeScript + Express + MongoDB/Mongoose para o Aqui Comanda Clientes.

## Stack

- Node.js
- TypeScript
- Express
- MongoDB + Mongoose
- Firebase Admin SDK
- Zod
- dotenv, cors, helmet, morgan

## Instalar

```bash
npm install
cp .env.example .env
```

Configure `MONGO_URI` no `.env`. A API falha com erro claro se `MONGO_URI` nao existir.

## Rodar

```bash
npm run dev
```

Build:

```bash
npm run build
npm start
```

Seed de desenvolvimento:

```bash
npm run seed
```

## Firebase Admin

Rotas `/api/*` exigem:

```text
Authorization: Bearer <firebase_id_token>
```

Configure no `.env`:

```env
FIREBASE_PROJECT_ID=aqui-comanda
FIREBASE_CLIENT_EMAIL=
FIREBASE_PRIVATE_KEY=
```

Para desenvolvimento local, `FIREBASE_PROJECT_ID` já é suficiente para validar ID tokens do Firebase por chave pública. Para produção, use uma service account real e preencha `FIREBASE_CLIENT_EMAIL` e `FIREBASE_PRIVATE_KEY` com os valores do JSON do Firebase Admin SDK.

Não use a `apiKey` do Firebase Web como `FIREBASE_PRIVATE_KEY`. A API ignora configurações inválidas de service account e inicializa o Admin SDK apenas com `projectId` quando a chave privada não estiver em formato PEM.

## Endpoints principais

- `GET /health`
- `/api/clientes`
- `/api/produtos`
- `/api/mesas`
- `/api/comandas`
- `/api/pedidos`
- `/api/estoque/entradas`
- `/api/caixa/sessoes`
- `/api/caixa/entradas`
- `/api/colaboradores`
- `/api/filiais`
- `/api/configuracoes/ui`
- `/api/configuracoes/menu-order`
- `/api/dashboard`
- `/api/backups/export`
- `/api/backups/import`

## Padrao de resposta

```json
{
  "success": true,
  "data": {},
  "message": "Operacao realizada com sucesso"
}
```

Erros:

```json
{
  "success": false,
  "message": "Mensagem amigavel",
  "code": "ERROR_CODE"
}
```

## Compatibilidade

A API foi modelada a partir de `docs/aqui-comanda-clientes-storage-contracts.md` e preserva campos extras observados nos backups. Importacao/exportacao usa o formato atual do front: `clientes`, `produtos`, `estoque`, `mesas`, `comandas`, `pedidos`, `caixa`, `colaboradores`, `filiais`, `configuracoes` e `"ordem-menu"`.

Operacoes criticas de estoque, comandas, caixa e backup foram estruturadas com transacoes MongoDB. Em MongoDB local standalone, transacoes podem nao estar disponiveis; em producao use replica set ou cluster.
# aqui-comanda-api
