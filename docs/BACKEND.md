# BACKEND.md
> Express structure, routing patterns, middleware, and error handling.
> Read before creating any route, controller, or middleware file.

---

## 1. ESTRUTURA DE PASTAS

```
project/
├── src/
│   ├── server.js              ← entrada da aplicação
│   ├── app.js                 ← configuração do Express (separado do listen)
│   ├── routes/
│   │   ├── index.js           ← agrega todas as rotas
│   │   ├── auth.routes.js
│   │   ├── user.routes.js
│   │   └── [recurso].routes.js
│   ├── controllers/
│   │   ├── auth.controller.js
│   │   ├── user.controller.js
│   │   └── [recurso].controller.js
│   ├── middleware/
│   │   ├── auth.middleware.js  ← proteção de rotas
│   │   ├── error.middleware.js ← handler de erros
│   │   └── validate.middleware.js ← validação Zod
│   ├── lib/
│   │   ├── prisma.js           ← instância do Prisma
│   │   └── jwt.js              ← helpers de JWT (se usando JWT simples)
│   └── schemas/
│       ├── auth.schema.js      ← schemas Zod por recurso
│       └── user.schema.js
├── public/                     ← arquivos estáticos (se static)
├── prisma/
│   ├── schema.prisma
│   └── migrations/
├── .env
├── .env.example
├── .gitignore
└── package.json
```

---

## 2. APP.JS vs SERVER.JS

Separar configuração do Express do ponto de entrada. Isso facilita testes e clareza.

**src/app.js — configuração pura:**

```js
import express from 'express';
import 'dotenv/config';
import helmet from 'helmet';
import cors   from 'cors';
import morgan from 'morgan';
import router from './routes/index.js';
import { notFound, errorHandler } from './middleware/error.middleware.js';

const app = express();

// Security & parsing
app.use(helmet());
app.use(cors({
  origin: process.env.ALLOWED_ORIGIN || 'http://localhost:3000',
  credentials: true
}));
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Static files (se necessário)
app.use(express.static('public'));

// View engine (se usando EJS)
// app.set('view engine', 'ejs');
// app.set('views', './src/views');

// Routes
app.use('/', router);

// Error handlers — sempre por último
app.use(notFound);
app.use(errorHandler);

export default app;
```

**src/server.js — só o listen:**

```js
import app from './app.js';

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
```

---

## 3. ROTAS

### Arquivo agregador (src/routes/index.js)

```js
import { Router } from 'express';
import authRoutes from './auth.routes.js';
import userRoutes from './user.routes.js';

const router = Router();

router.use('/api/auth',  authRoutes);
router.use('/api/users', userRoutes);

// Rota de health check — útil pra hospedagem
router.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

export default router;
```

### Padrão de rota por recurso

```js
// src/routes/user.routes.js
import { Router } from 'express';
import { getUsers, getUserById, updateUser, deleteUser } from '../controllers/user.controller.js';
import { requireAuth } from '../middleware/auth.middleware.js';
import { validate }     from '../middleware/validate.middleware.js';
import { updateUserSchema } from '../schemas/user.schema.js';

const router = Router();

router.get('/',     requireAuth, getUsers);
router.get('/:id',  requireAuth, getUserById);
router.put('/:id',  requireAuth, validate(updateUserSchema), updateUser);
router.delete('/:id', requireAuth, deleteUser);

export default router;
```

### Convenção de URLs REST

| Método | URL | Ação |
|---|---|---|
| GET | `/api/users` | listar todos |
| GET | `/api/users/:id` | buscar um |
| POST | `/api/users` | criar |
| PUT | `/api/users/:id` | atualizar completo |
| PATCH | `/api/users/:id` | atualizar parcial |
| DELETE | `/api/users/:id` | deletar |

---

## 4. CONTROLLERS

Toda lógica de negócio fica no controller — nunca inline na rota.

```js
// src/controllers/user.controller.js
import prisma from '../lib/prisma.js';

export async function getUsers(req, res, next) {
  try {
    const users = await prisma.user.findMany({
      select: { id: true, name: true, email: true, createdAt: true }
      // nunca retornar password
    });
    res.json({ success: true, data: users });
  } catch (error) {
    next(error); // sempre passar erros pro next()
  }
}

export async function getUserById(req, res, next) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: parseInt(req.params.id) },
      select: { id: true, name: true, email: true, createdAt: true }
    });

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    res.json({ success: true, data: user });
  } catch (error) {
    next(error);
  }
}

export async function updateUser(req, res, next) {
  try {
    const user = await prisma.user.update({
      where: { id: parseInt(req.params.id) },
      data: req.body, // já validado pelo middleware Zod
      select: { id: true, name: true, email: true }
    });
    res.json({ success: true, data: user });
  } catch (error) {
    next(error);
  }
}

export async function deleteUser(req, res, next) {
  try {
    await prisma.user.delete({
      where: { id: parseInt(req.params.id) }
    });
    res.status(204).send(); // 204 No Content — sem body
  } catch (error) {
    next(error);
  }
}
```

---

## 5. MIDDLEWARE

### Validação Zod (src/middleware/validate.middleware.js)

```js
export function validate(schema) {
  return (req, res, next) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: result.error.flatten().fieldErrors
      });
    }
    req.body = result.data; // substitui pelo dado validado e tipado
    next();
  };
}
```

### Proteção de rotas (src/middleware/auth.middleware.js)

```js
// Ver AUTH.md para implementação completa de JWT ou Better Auth
// Padrão de interface — o middleware sempre segue esta assinatura:

export function requireAuth(req, res, next) {
  // valida token/sessão
  // se inválido: res.status(401).json({ success: false, message: 'Unauthorized' })
  // se válido: req.user = { id, email, role } → next()
}

export function requireRole(...roles) {
  return (req, res, next) => {
    if (!roles.includes(req.user?.role)) {
      return res.status(403).json({ success: false, message: 'Forbidden' });
    }
    next();
  };
}
```

### Error handler (src/middleware/error.middleware.js)

```js
// 404 — rota não encontrada
export function notFound(req, res, next) {
  res.status(404).json({
    success: false,
    message: `Route ${req.method} ${req.originalUrl} not found`
  });
}

// Handler geral de erros — sempre o último middleware
export function errorHandler(err, req, res, next) {
  console.error(err.stack);

  // Erros conhecidos do Prisma
  if (err.code === 'P2002') {
    return res.status(409).json({
      success: false,
      message: 'A record with this value already exists'
    });
  }

  if (err.code === 'P2025') {
    return res.status(404).json({
      success: false,
      message: 'Record not found'
    });
  }

  // Erro genérico
  res.status(err.status || 500).json({
    success: false,
    message: process.env.NODE_ENV === 'production'
      ? 'Internal server error'
      : err.message
  });
}
```

---

## 6. PADRÃO DE RESPOSTA DA API

Toda resposta JSON segue este formato. Consistência absoluta.

```js
// Sucesso com dados
res.json({
  success: true,
  data: { ... }
});

// Sucesso com lista + paginação
res.json({
  success: true,
  data: [...],
  pagination: {
    total: 100,
    page: 1,
    perPage: 20,
    totalPages: 5
  }
});

// Sucesso sem dados (ex: delete)
res.status(204).send();

// Erro de cliente (400, 401, 403, 404, 409)
res.status(400).json({
  success: false,
  message: 'Descrição do erro',
  errors: { campo: ['mensagem'] } // opcional, para validação
});

// Erro de servidor (500)
res.status(500).json({
  success: false,
  message: 'Internal server error'
});
```

**Nunca misturar formatos.** Não retornar array direto em um endpoint e objeto em outro. O campo `success` está sempre presente.

---

## 7. SCHEMAS ZOD (src/schemas/)

```js
// src/schemas/user.schema.js
import { z } from 'zod';

export const createUserSchema = z.object({
  name:     z.string().min(2, 'Name must be at least 2 characters'),
  email:    z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

export const updateUserSchema = z.object({
  name:  z.string().min(2).optional(),
  email: z.string().email().optional(),
}).refine(data => Object.keys(data).length > 0, {
  message: 'At least one field must be provided'
});

export const loginSchema = z.object({
  email:    z.string().email(),
  password: z.string().min(1, 'Password is required'),
});
```

---

## 8. PRISMA — PADRÕES DE USO

```js
// src/lib/prisma.js — instanciar uma vez, importar em todo controller
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error'] : ['error'],
});

export default prisma;
```

**Padrões obrigatórios:**

```js
// Nunca retornar password em selects
const user = await prisma.user.findUnique({
  where: { id },
  select: { id: true, name: true, email: true } // password omitido
});

// Paginação padrão
const [users, total] = await prisma.$transaction([
  prisma.user.findMany({ skip: (page - 1) * perPage, take: perPage }),
  prisma.user.count()
]);

// Transação quando múltiplas operações devem ser atômicas
await prisma.$transaction(async (tx) => {
  const order = await tx.order.create({ data: orderData });
  await tx.stock.update({ where: { id: productId }, data: { quantity: { decrement: 1 } } });
  return order;
});
```

---

## 9. VARIÁVEIS DE AMBIENTE — REFERÊNCIA COMPLETA

```env
# Server
PORT=3000
NODE_ENV=development           # development | production

# Database
DATABASE_URL=./database.db     # SQLite local
# DATABASE_URL=postgresql://user:password@host:5432/dbname  # PostgreSQL

# Auth
JWT_SECRET=minimo-32-caracteres-aleatorios-aqui
JWT_EXPIRES_IN=7d
SESSION_SECRET=outro-segredo-aqui

# App
ALLOWED_ORIGIN=http://localhost:3000
APP_URL=http://localhost:3000

# Email (quando necessário)
SMTP_HOST=
SMTP_PORT=
SMTP_USER=
SMTP_PASS=
```

---

## 10. CHECKLIST — ANTES DE CADA ENTREGA

```
[ ] Toda lógica está em controllers — nenhuma inline nas rotas
[ ] Toda entrada do cliente passa por validação Zod
[ ] Nenhuma query retorna o campo password
[ ] Todos os erros são passados via next(error)
[ ] Rotas protegidas têm requireAuth aplicado
[ ] Variáveis sensíveis estão em .env — nunca hardcoded
[ ] .env está no .gitignore
[ ] .env.example está atualizado com todas as chaves (sem valores)
[ ] Health check em /health respondendo
[ ] Prisma: nunca instanciar PrismaClient fora de src/lib/prisma.js
```
