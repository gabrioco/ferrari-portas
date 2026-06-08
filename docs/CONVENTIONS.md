# CONVENTIONS.md
> Naming rules, code patterns, and structure for fullstack projects.
> Frontend conventions (HTML, CSS, Tailwind, JS do lado do cliente) seguem o mesmo arquivo do template landing-page.
> Este arquivo cobre o que é específico do backend Node.js + Express.

---

## 1. NOMENCLATURA DE ARQUIVOS

| Tipo | Convenção | Exemplo |
|---|---|---|
| Rotas | `[recurso].routes.js` | `user.routes.js`, `product.routes.js` |
| Controllers | `[recurso].controller.js` | `user.controller.js` |
| Middleware | `[função].middleware.js` | `auth.middleware.js`, `validate.middleware.js` |
| Schemas Zod | `[recurso].schema.js` | `user.schema.js`, `auth.schema.js` |
| Libs/helpers | `[nome].js` | `prisma.js`, `jwt.js` |
| Views EJS | `[nome].ejs` | `dashboard.ejs`, `login.ejs` |
| Partials EJS | `[nome].ejs` dentro de `partials/` | `partials/nav.ejs` |
| Env example | `.env.example` | sempre na raiz |
| Seed | `seed.js` | sempre em `prisma/` |

**Regras:**
- Sempre kebab-case em nomes de arquivo — nunca camelCase ou PascalCase
- Sempre sufixo descritivo (`.routes.`, `.controller.`, `.middleware.`)
- Um arquivo por responsabilidade — nunca misturar controller de dois recursos

---

## 2. IMPORTS — ORDEM OBRIGATÓRIA

```js
// 1. Módulos nativos do Node
import path   from 'path';
import fs     from 'fs';

// 2. Pacotes third-party (node_modules)
import express    from 'express';
import bcrypt     from 'bcryptjs';
import { z }      from 'zod';

// 3. Arquivos locais do projeto
import prisma         from '../lib/prisma.js';
import { signToken }  from '../lib/jwt.js';
import { requireAuth } from '../middleware/auth.middleware.js';
```

Linha em branco separando cada grupo. Nunca misturar os três grupos.

---

## 3. ES MODULES — REGRAS

O projeto usa ES Modules (`"type": "module"` no package.json).

```js
// Correto — ES Module
import express from 'express';
export default router;
export function myFunction() {}

// Errado — CommonJS
const express = require('express');
module.exports = router;
```

**Sempre usar extensão `.js` nos imports locais:**

```js
// Correto
import prisma from '../lib/prisma.js';

// Errado — quebra com ES Modules
import prisma from '../lib/prisma';
```

---

## 4. ASYNC/AWAIT — PADRÃO ABSOLUTO

Nunca usar callbacks ou `.then()/.catch()` em código novo. Sempre async/await com try/catch.

```js
// Correto
export async function getUsers(req, res, next) {
  try {
    const users = await prisma.user.findMany();
    res.json({ success: true, data: users });
  } catch (error) {
    next(error);
  }
}

// Errado — callback
prisma.user.findMany().then(users => {
  res.json(users);
}).catch(err => {
  res.status(500).json({ error: err.message });
});
```

**Todo controller é async. Todo erro vai pro `next(error)` — nunca `res.status(500)` direto no catch.**

---

## 5. ESTRUTURA DE CONTROLLER

Todo controller segue este padrão sem exceção:

```js
// src/controllers/[recurso].controller.js

import prisma from '../lib/prisma.js';

// Verbo que descreve a ação — nunca só o nome do recurso
export async function listProducts(req, res, next) { ... }
export async function getProduct(req, res, next) { ... }
export async function createProduct(req, res, next) { ... }
export async function updateProduct(req, res, next) { ... }
export async function deleteProduct(req, res, next) { ... }
```

**Nomes de função — verbo primeiro:**

| Ação | Nome |
|---|---|
| Listar todos | `list[Recurso]s` |
| Buscar um | `get[Recurso]` |
| Criar | `create[Recurso]` |
| Atualizar | `update[Recurso]` |
| Deletar | `delete[Recurso]` |
| Ação específica | `[verbo][Contexto]` — ex: `activateUser`, `sendPasswordReset` |

---

## 6. ESTRUTURA DE ROTA

```js
// src/routes/[recurso].routes.js

import { Router }       from 'express';
import { list, get, create, update, remove } from '../controllers/[recurso].controller.js';
import { requireAuth }  from '../middleware/auth.middleware.js';
import { validate }     from '../middleware/validate.middleware.js';
import { createSchema, updateSchema } from '../schemas/[recurso].schema.js';

const router = Router();

// Rotas agrupadas por acesso
// Públicas primeiro, protegidas depois
router.get('/',    list);
router.get('/:id', get);

router.post('/',    requireAuth, validate(createSchema), create);
router.put('/:id',  requireAuth, validate(updateSchema), update);
router.delete('/:id', requireAuth, remove);

export default router;
```

**Nunca colocar lógica inline na rota:**

```js
// Errado
router.get('/users', async (req, res) => {
  const users = await prisma.user.findMany();
  res.json(users);
});

// Correto — lógica no controller
router.get('/users', requireAuth, listUsers);
```

---

## 7. VARIÁVEIS DE AMBIENTE — NOMENCLATURA

```env
# Formato: CATEGORIA_NOME em UPPER_SNAKE_CASE

# Servidor
PORT=
NODE_ENV=

# Banco
DATABASE_URL=

# Auth
JWT_SECRET=
JWT_EXPIRES_IN=
BETTER_AUTH_SECRET=
BETTER_AUTH_URL=

# OAuth
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GITHUB_CLIENT_ID=
GITHUB_CLIENT_SECRET=

# Email
SMTP_HOST=
SMTP_PORT=
SMTP_USER=
SMTP_PASS=
SMTP_FROM=

# App
APP_URL=
ALLOWED_ORIGIN=
```

**Regras:**
- Sempre `UPPER_SNAKE_CASE`
- Categoria como prefixo quando há múltiplas vars do mesmo serviço (`SMTP_HOST`, `SMTP_PORT`)
- `.env.example` sempre atualizado com todas as chaves — sem valores reais
- Acessar sempre via `process.env.NOME` — nunca hardcoded

---

## 8. CONSOLE.LOG — REGRAS

```js
// Permitido em desenvolvimento — informativo
console.log(`Server running on port ${PORT}`);

// Permitido sempre — erros reais
console.error('Prisma connection failed:', error);

// Nunca deixar em produção — debug temporário
console.log(req.body); // remover antes de commitar
console.log(user);     // remover antes de commitar
```

**Regra:** qualquer `console.log` que foi adicionado pra debugar deve ser removido antes de entregar. Usar `console.error` pra erros reais que devem aparecer em produção.

---

## 9. COMENTÁRIOS NO CÓDIGO

```js
// Bom — explica o POR QUÊ, não o QUE
// Salva o preço no momento da compra para não ser afetado por atualizações futuras
price: item.product.price,

// Bom — marca decisão explícita
// Mensagem genérica intencional — não revelar se o email existe no sistema
return res.status(401).json({ success: false, message: 'Invalid credentials' });

// Desnecessário — o código já diz isso
// Busca o usuário pelo id
const user = await prisma.user.findUnique({ where: { id } });
```

Comentários explicam decisões e contexto — nunca descrevem o que o código já faz claramente.

---

## 10. GITIGNORE PADRÃO

```
# Dependências
node_modules/

# Ambiente
.env
.env.local
.env.production

# Banco SQLite
*.db
*.db-journal
*.db-shm
*.db-wal

# Prisma
prisma/migrations/dev_*

# Build Tailwind
dist/
public/dist/

# Sistema
.DS_Store
Thumbs.db

# Editor
.vscode/
.idea/
*.swp
```

---

## 11. CHECKLIST

```
[ ] Todos os arquivos usam kebab-case com sufixo descritivo
[ ] Imports em ordem: Node → third-party → local
[ ] Todos os controllers são async com try/catch + next(error)
[ ] Nenhuma lógica inline nas rotas — sempre no controller
[ ] .env.example atualizado com todas as chaves
[ ] Nenhum console.log de debug no código entregue
[ ] Extensão .js em todos os imports locais
[ ] Verbo primeiro no nome de funções de controller
```
