# PERFORMANCE.md
> Performance rules for fullstack projects — server, database, and API.
> Frontend performance (imagens, scripts, animações, fontes) segue o PERFORMANCE.md do template landing-page.
> Este arquivo cobre o que é específico do backend.

---

## 1. BANCO DE DADOS — REGRAS CRÍTICAS

### Nunca SELECT * — sempre selecionar só o necessário

```js
// Errado — traz tudo incluindo password, campos irrelevantes
const users = await prisma.user.findMany();

// Correto — só o que a rota precisa retornar
const users = await prisma.user.findMany({
  select: { id: true, name: true, email: true, createdAt: true }
});
```

### N+1 problem — o erro mais comum com ORMs

Acontece quando você busca uma lista e depois faz uma query por item dentro de um loop.

```js
// Errado — 1 query pra buscar produtos + N queries pra buscar categoria de cada um
const products = await prisma.product.findMany();
for (const product of products) {
  product.category = await prisma.category.findUnique({
    where: { id: product.categoryId }
  });
}

// Correto — 1 query com JOIN via include
const products = await prisma.product.findMany({
  include: { category: { select: { name: true, slug: true } } }
});
```

**Regra:** nunca fazer queries dentro de loops. Usar `include` ou `select` com relações aninhadas.

### Paginação — obrigatória em toda listagem

Nunca retornar uma lista sem limite. Sem paginação, uma tabela com 10.000 registros trava a API.

```js
// Sempre paginar
const { page = 1, perPage = 20 } = req.query;

const [items, total] = await prisma.$transaction([
  prisma.product.findMany({
    skip: (page - 1) * perPage,
    take: Math.min(perPage, 100), // limitar máximo por segurança
  }),
  prisma.product.count()
]);
```

### Buscar antes de atualizar/deletar

```js
// Evita queries desnecessárias em caso de registro inexistente
const product = await prisma.product.findUnique({ where: { id } });
if (!product) {
  return res.status(404).json({ success: false, message: 'Not found' });
}
await prisma.product.update({ where: { id }, data: req.body });
```

### $transaction para operações simultâneas independentes

```js
// Errado — duas queries em sequência quando poderiam ser paralelas
const users    = await prisma.user.findMany();
const products = await prisma.product.findMany();

// Correto — executam em paralelo
const [users, products] = await prisma.$transaction([
  prisma.user.findMany(),
  prisma.product.findMany()
]);
```

---

## 2. COMPRESSÃO DE RESPOSTAS

```bash
npm install compression
```

```js
// src/app.js — antes das rotas
import compression from 'compression';
app.use(compression());
```

Reduz o tamanho das respostas JSON em 60–80%. Obrigatório em produção.

---

## 3. CACHE DE ASSETS ESTÁTICOS

```js
// Servir assets com cache de 1 ano para arquivos com hash no nome
app.use('/assets', express.static('public/assets', {
  maxAge: '1y',
  immutable: true
}));

// Cache menor para HTML (pode mudar com deploys)
app.use(express.static('public', {
  maxAge: '1h',
  etag: true
}));
```

---

## 4. PAYLOAD DE REQUISIÇÃO — LIMITES

```js
// Limitar tamanho do body — evita ataques de payload grande
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

// Para rotas de upload de arquivo — aumentar só onde necessário
// (configurar na rota específica, não globalmente)
```

---

## 5. CONEXÃO COM BANCO

### SQLite — sem necessidade de pool

SQLite usa um único arquivo. O Prisma gerencia a conexão automaticamente.

### PostgreSQL — connection pool

O Prisma usa pool por padrão (10 conexões). Configurar explicitamente em produção:

```prisma
// schema.prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
  // Pool via URL params:
  // ?connection_limit=5&pool_timeout=10
}
```

Ou via URL no `.env`:

```env
DATABASE_URL="postgresql://user:pass@host:5432/db?connection_limit=5"
```

**Em planos gratuitos de hospedagem (Railway, Render):** connection_limit entre 3 e 5. Acima disso, o banco rejeita conexões novas.

---

## 6. QUERIES LENTAS — COMO IDENTIFICAR

Ativar log de queries em desenvolvimento:

```js
// src/lib/prisma.js
const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development'
    ? ['query', 'warn', 'error']
    : ['error'],
});
```

Qualquer query que apareça levando mais de 100ms no log precisa de índice ou refatoração.

---

## 7. RATE LIMITING — POR TIPO DE ROTA

```bash
npm install express-rate-limit
```

```js
import rateLimit from 'express-rate-limit';

// Rotas de auth — mais restrito
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 10,
  message: { success: false, message: 'Too many requests' }
});

// API geral — mais permissivo
export const apiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minuto
  max: 100,
  message: { success: false, message: 'Too many requests' }
});
```

```js
// src/app.js
import { apiLimiter } from './middleware/rateLimiter.js';
app.use('/api/', apiLimiter);
```

---

## 8. RESPOSTAS — O QUE NÃO ENVIAR

```js
// Nunca enviar stack trace em produção
res.status(500).json({
  success: false,
  message: process.env.NODE_ENV === 'production'
    ? 'Internal server error'  // produção — genérico
    : err.message              // desenvolvimento — detalhado
});

// Nunca enviar campos desnecessários
// Errado — expõe estrutura interna
{
  success: true,
  data: {
    id: 1,
    password: "$2b$10$...",    // NUNCA
    __prisma_meta: {...},      // campos internos
    _count: {...}              // a menos que necessário
  }
}
```

---

## 9. CHECKLIST DE PERFORMANCE

```
[ ] Toda query usa select com os campos necessários — nunca findMany() sem select
[ ] Nenhuma query dentro de loop — usar include ou Promise.all
[ ] Toda listagem tem paginação com limite máximo de 100 por página
[ ] compression instalado e ativo
[ ] express.json com limit: '10kb'
[ ] Rate limiting ativo nas rotas de auth
[ ] Rate limiting geral ativo em /api/
[ ] Log de queries ativo em development — queries lentas identificadas
[ ] Stack trace não exposto em produção
[ ] connection_limit configurado para o plano de hospedagem em uso
[ ] Índices criados nos campos usados em where com frequência (ver DATABASE.md)
```
