# AUTH.md
> Authentication patterns for fullstack projects.
> Read before implementing any login, registration, or route protection.

---

## 1. DECISÃO DE AUTH

```
O projeto precisa de:
│
├─ Login simples com email + senha?
├─ Sem OAuth (Google, GitHub, etc.)?
├─ Sem roles complexos (só user/admin)?
└─ Sem MFA?
    └─ JWT simples — jsonwebtoken + bcryptjs

├─ Login com Google, GitHub, ou outro OAuth?
├─ Roles e permissões granulares?
├─ MFA (autenticação em dois fatores)?
└─ Múltiplos provedores no mesmo sistema?
    └─ Better Auth
```

---

## 2. JWT SIMPLES

### Pacotes

```bash
npm install jsonwebtoken bcryptjs
```

### Helper JWT (src/lib/jwt.js)

```js
import jwt from 'jsonwebtoken';

const SECRET  = process.env.JWT_SECRET;
const EXPIRES = process.env.JWT_EXPIRES_IN || '7d';

export function signToken(payload) {
  return jwt.sign(payload, SECRET, { expiresIn: EXPIRES });
}

export function verifyToken(token) {
  return jwt.verify(token, SECRET); // lança erro se inválido ou expirado
}
```

### Controller de auth (src/controllers/auth.controller.js)

```js
import bcrypt      from 'bcryptjs';
import prisma      from '../lib/prisma.js';
import { signToken } from '../lib/jwt.js';

// POST /api/auth/register
export async function register(req, res, next) {
  try {
    const { name, email, password } = req.body;

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return res.status(409).json({ success: false, message: 'Email already in use' });
    }

    const hashed = await bcrypt.hash(password, 10);
    const user   = await prisma.user.create({
      data: { name, email, password: hashed },
      select: { id: true, name: true, email: true, role: true }
    });

    const token = signToken({ id: user.id, email: user.email, role: user.role });

    res.status(201).json({ success: true, data: { user, token } });
  } catch (error) {
    next(error);
  }
}

// POST /api/auth/login
export async function login(req, res, next) {
  try {
    const { email, password } = req.body;

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    const token = signToken({ id: user.id, email: user.email, role: user.role });

    res.json({
      success: true,
      data: {
        user: { id: user.id, name: user.name, email: user.email, role: user.role },
        token
      }
    });
  } catch (error) {
    next(error);
  }
}

// GET /api/auth/me
export async function me(req, res, next) {
  try {
    const user = await prisma.user.findUnique({
      where:  { id: req.user.id },
      select: { id: true, name: true, email: true, role: true, createdAt: true }
    });
    res.json({ success: true, data: user });
  } catch (error) {
    next(error);
  }
}
```

### Middleware de proteção (src/middleware/auth.middleware.js)

```js
import { verifyToken } from '../lib/jwt.js';

export function requireAuth(req, res, next) {
  const header = req.headers.authorization;

  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: 'No token provided' });
  }

  const token = header.split(' ')[1];

  try {
    const payload = verifyToken(token);
    req.user = payload; // { id, email, role }
    next();
  } catch {
    return res.status(401).json({ success: false, message: 'Invalid or expired token' });
  }
}

export function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ success: false, message: 'Forbidden' });
    }
    next();
  };
}
```

### Rotas de auth (src/routes/auth.routes.js)

```js
import { Router }   from 'express';
import { register, login, me } from '../controllers/auth.controller.js';
import { requireAuth }         from '../middleware/auth.middleware.js';
import { validate }            from '../middleware/validate.middleware.js';
import { registerSchema, loginSchema } from '../schemas/auth.schema.js';

const router = Router();

router.post('/register', validate(registerSchema), register);
router.post('/login',    validate(loginSchema),    login);
router.get('/me',        requireAuth,              me);

export default router;
```

### Schemas Zod para auth (src/schemas/auth.schema.js)

```js
import { z } from 'zod';

export const registerSchema = z.object({
  name:     z.string().min(2, 'Name must be at least 2 characters'),
  email:    z.string().email('Invalid email'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

export const loginSchema = z.object({
  email:    z.string().email('Invalid email'),
  password: z.string().min(1, 'Password is required'),
});
```

### Como usar nas rotas protegidas

```js
import { requireAuth, requireRole } from '../middleware/auth.middleware.js';

// Qualquer usuário logado
router.get('/profile', requireAuth, getProfile);

// Só admin
router.delete('/users/:id', requireAuth, requireRole('ADMIN'), deleteUser);

// Admin ou moderador
router.put('/posts/:id', requireAuth, requireRole('ADMIN', 'MODERATOR'), updatePost);
```

### Como usar no frontend (fetch)

```js
// Salvar token após login
localStorage.setItem('token', data.token);

// Enviar em toda requisição autenticada
const res = await fetch('/api/users', {
  headers: {
    'Authorization': `Bearer ${localStorage.getItem('token')}`,
    'Content-Type': 'application/json'
  }
});
```

### Como usar em páginas EJS

```js
// No controller — verificar token via cookie ou header
// Usar cookie ao invés de localStorage em projetos EJS:

// src/server.js
import cookieParser from 'cookie-parser';
app.use(cookieParser());
```

```bash
npm install cookie-parser
```

```js
// Ao fazer login — setar cookie
res.cookie('token', token, {
  httpOnly: true,     // não acessível via JS — proteção XSS
  secure:   process.env.NODE_ENV === 'production',
  sameSite: 'strict',
  maxAge:   7 * 24 * 60 * 60 * 1000 // 7 dias em ms
});

// Middleware pra EJS — lê o cookie
export function requireAuth(req, res, next) {
  const token = req.cookies?.token;
  if (!token) return res.redirect('/login');
  try {
    req.user = verifyToken(token);
    next();
  } catch {
    res.clearCookie('token');
    res.redirect('/login');
  }
}

// Logout
router.post('/logout', (req, res) => {
  res.clearCookie('token');
  res.redirect('/login');
});
```

---

## 3. BETTER AUTH

Usar quando o projeto precisa de OAuth, MFA, roles avançados, ou múltiplos provedores.

### Pacotes

```bash
npm install better-auth
```

### Configuração (src/lib/auth.js)

```js
import { betterAuth } from 'better-auth';
import { prismaAdapter } from 'better-auth/adapters/prisma';
import { PrismaClient }  from '@prisma/client';

const prisma = new PrismaClient();

export const auth = betterAuth({
  database: prismaAdapter(prisma, { provider: 'sqlite' }), // ou 'postgresql'

  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false, // true quando tiver SMTP configurado
  },

  socialProviders: {
    // Google OAuth — exige GOOGLE_CLIENT_ID e GOOGLE_CLIENT_SECRET no .env
    google: {
      clientId:     process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    },
    // GitHub OAuth — exige GITHUB_CLIENT_ID e GITHUB_CLIENT_SECRET
    github: {
      clientId:     process.env.GITHUB_CLIENT_ID,
      clientSecret: process.env.GITHUB_CLIENT_SECRET,
    },
  },
});
```

### Variáveis de ambiente necessárias

```env
# Better Auth
BETTER_AUTH_SECRET=minimo-32-caracteres-aleatorios
BETTER_AUTH_URL=http://localhost:3000   # URL base da aplicação

# Google OAuth (opcional)
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=

# GitHub OAuth (opcional)
GITHUB_CLIENT_ID=
GITHUB_CLIENT_SECRET=
```

### Integração com Express (src/app.js)

```js
import { auth } from './lib/auth.js';
import { toNodeHandler } from 'better-auth/node';

// Montar o handler do Better Auth antes das outras rotas
app.all('/api/auth/*', toNodeHandler(auth));
```

### Migrations Prisma para Better Auth

```bash
npx @better-auth/cli generate  # gera os modelos necessários no schema.prisma
npx prisma migrate dev --name add_better_auth
```

### Middleware de proteção com Better Auth

```js
// src/middleware/auth.middleware.js
import { auth } from '../lib/auth.js';

export async function requireAuth(req, res, next) {
  const session = await auth.api.getSession({
    headers: req.headers
  });

  if (!session) {
    return res.status(401).json({ success: false, message: 'Unauthorized' });
  }

  req.user    = session.user;
  req.session = session.session;
  next();
}
```

### Uso no frontend com Better Auth

```js
import { createAuthClient } from 'better-auth/client';

const authClient = createAuthClient({
  baseURL: 'http://localhost:3000'
});

// Login com email e senha
await authClient.signIn.email({ email, password });

// Login com Google
await authClient.signIn.social({ provider: 'google' });

// Logout
await authClient.signOut();

// Sessão atual
const session = await authClient.getSession();
```

---

## 4. BCRYPT — REGRAS

```js
import bcrypt from 'bcryptjs';

// Hash — custo 10 é o padrão seguro
const hashed = await bcrypt.hash(plainPassword, 10);

// Comparar
const valid = await bcrypt.compare(plainPassword, hashed);
```

**Regras:**
- Nunca salvar senha em plain text — sempre hash bcrypt antes de qualquer operação de banco
- Custo 10 — suficiente pra maioria dos projetos. Aumentar pra 12 em sistemas financeiros
- Nunca logar ou retornar o campo `password` em nenhuma resposta
- Nunca comparar strings direto — sempre usar `bcrypt.compare`

---

## 5. SEGURANÇA — REGRAS GERAIS

```
✓ Sempre usar HTTPS em produção
✓ JWT_SECRET com mínimo 32 caracteres aleatórios
✓ Tokens em httpOnly cookies em projetos EJS (não localStorage)
✓ Tokens em localStorage só em SPAs onde cookies não se aplicam
✓ Validar todos os inputs com Zod antes de qualquer operação de banco
✓ Rate limiting em rotas de login e registro
✓ Mensagem de erro genérica no login ("Invalid credentials") — nunca dizer se é o email ou a senha
✓ bcrypt em toda senha antes de salvar
✓ Nunca retornar o campo password em nenhuma query
✓ Variáveis sensíveis sempre em .env — nunca hardcoded
```

### Rate limiting em auth (recomendado em produção)

```bash
npm install express-rate-limit
```

```js
import rateLimit from 'express-rate-limit';

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 10,                   // máximo 10 tentativas
  message: { success: false, message: 'Too many requests, try again later' }
});

// Aplicar nas rotas de auth
router.post('/login',    authLimiter, validate(loginSchema),    login);
router.post('/register', authLimiter, validate(registerSchema), register);
```

---

## 6. CHECKLIST

```
[ ] JWT_SECRET tem no mínimo 32 caracteres e está no .env
[ ] Senhas passam por bcrypt.hash antes de salvar — sempre
[ ] Nenhuma query retorna o campo password
[ ] Mensagem de erro do login é genérica — não revela se email existe
[ ] Middleware requireAuth aplicado em todas as rotas protegidas
[ ] requireRole aplicado em rotas exclusivas de admin
[ ] Em projetos EJS: token em httpOnly cookie, não localStorage
[ ] Rate limiting ativo nas rotas de login e registro (produção)
[ ] BETTER_AUTH_SECRET ou JWT_SECRET não está hardcoded em nenhum arquivo
[ ] .env está no .gitignore
```
