# STACK.md
> Technology decisions for fullstack projects with Node.js + Express.
> Read before installing any package, choosing any library, or structuring the project.

---

## 1. CORE — NODE.JS + EXPRESS

### Setup inicial (sempre perguntar antes de instalar)

```bash
npm init -y
npm install express
npm install -D nodemon
```

**package.json scripts obrigatórios:**

```json
{
  "scripts": {
    "start": "node src/server.js",
    "dev":   "nodemon src/server.js"
  }
}
```

**Servidor base (src/server.js):**

```js
import express from 'express';
import 'dotenv/config';

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
import indexRouter from './routes/index.js';
app.use('/', indexRouter);

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
```

**Usar ES Modules (package.json):**

```json
{
  "type": "module"
}
```

---

## 2. FRONTEND — STATIC vs EJS

### Regra de decisão

| Situação | Abordagem |
|---|---|
| Página pública (landing, catálogo, portfólio) | **Static** — Express serve HTML/CSS/JS da pasta `public/` |
| Área logada, painel, dashboard | **EJS** — Express renderiza páginas com dados do servidor |
| Projeto com os dois | Static pra público + EJS pra área logada |

---

### Static (páginas públicas)

Express serve os arquivos estáticos. Frontend faz chamadas à API via `fetch`.

```js
// src/server.js
app.use(express.static('public'));
```

```
project/
└── public/
    ├── index.html
    ├── src/
    │   ├── input.css
    │   └── main.js
    └── assets/
```

**Tailwind no modo static:** seguir exatamente o `STACK.md` do template landing-page — mesmas regras de CDN vs build, mesmas libs de animação, mesmos ícones.

---

### EJS (área logada / páginas com dados do servidor)

```bash
npm install ejs
```

```js
// src/server.js
app.set('view engine', 'ejs');
app.set('views', './src/views');
app.use(express.static('public')); // CSS e JS ainda servidos como static
```

```
project/
└── src/
    └── views/
        ├── layouts/
        │   └── base.ejs       ← layout base com head, nav, footer
        ├── pages/
        │   ├── index.ejs
        │   └── dashboard.ejs
        └── partials/
            ├── nav.ejs
            └── footer.ejs
```

**Renderizar uma view:**

```js
// src/routes/dashboard.js
router.get('/dashboard', requireAuth, (req, res) => {
  res.render('pages/dashboard', {
    title: 'Dashboard',
    user: req.user,
    data: []
  });
});
```

**Tailwind no EJS:** Tailwind build (nunca CDN em views dinâmicas). CSS compilado em `public/dist/output.css` e linkado no layout base.

**Alpine.js com EJS** — padrão pra interatividade em páginas EJS:

```html
<script defer src="https://cdn.jsdelivr.net/npm/alpinejs@3.x.x/dist/cdn.min.js"></script>
```

---

## 3. VARIÁVEIS DE AMBIENTE

```bash
npm install dotenv
```

**Arquivo `.env` na raiz (nunca versionar):**

```env
PORT=3000
NODE_ENV=development
DATABASE_URL=./database.db
JWT_SECRET=seu-segredo-aqui-minimo-32-caracteres
SESSION_SECRET=outro-segredo-aqui
```

**Arquivo `.env.example` (versionar — sem valores reais):**

```env
PORT=
NODE_ENV=
DATABASE_URL=
JWT_SECRET=
SESSION_SECRET=
```

**`.gitignore` obrigatório:**

```
node_modules/
.env
dist/
*.db
*.db-journal
```

**Importar dotenv sempre no topo de `server.js`:**

```js
import 'dotenv/config';
```

---

## 4. SEGURANÇA — PACOTES BASE

Instalar em todo projeto fullstack que vai pra produção:

```bash
npm install helmet cors morgan
```

```js
import helmet from 'helmet';
import cors   from 'cors';
import morgan from 'morgan';

app.use(helmet());  // headers de segurança HTTP
app.use(cors());    // configurar origens permitidas em produção
app.use(morgan('dev')); // log de requisições no terminal
```

**CORS em produção — nunca deixar aberto:**

```js
app.use(cors({
  origin: process.env.ALLOWED_ORIGIN || 'http://localhost:3000',
  credentials: true
}));
```

---

## 5. VALIDAÇÃO DE DADOS

```bash
npm install zod
```

Usar Zod pra validar qualquer dado que venha do cliente — body, params, query. Nunca confiar no frontend.

```js
import { z } from 'zod';

const createUserSchema = z.object({
  name:     z.string().min(2).max(100),
  email:    z.string().email(),
  password: z.string().min(8),
});

// Em uma rota:
router.post('/users', (req, res) => {
  const result = createUserSchema.safeParse(req.body);
  if (!result.success) {
    return res.status(400).json({ errors: result.error.flatten() });
  }
  // prosseguir com result.data (já tipado e validado)
});
```

---

## 6. BANCO DE DADOS — DECISÃO

### Regra de decisão

| Condição | Banco |
|---|---|
| Projeto pessoal, protótipo, ou sistema de um único usuário | **SQLite** |
| Sistema com múltiplos usuários simultâneos | **PostgreSQL** |
| Projeto começa pequeno mas vai escalar | **PostgreSQL desde o início** |
| Precisa de deploy sem gerenciar servidor de banco | **PostgreSQL via Supabase ou Railway** |

---

### ORM — Prisma (padrão para ambos)

```bash
npm install prisma @prisma/client -D
npx prisma init
```

Prisma funciona com SQLite e PostgreSQL sem mudar o código — só a `DATABASE_URL` no `.env` muda.

**schema.prisma base:**

```prisma
datasource db {
  provider = "sqlite"   // trocar para "postgresql" quando necessário
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}

model User {
  id        Int      @id @default(autoincrement())
  email     String   @unique
  name      String
  password  String
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
```

**Comandos Prisma:**

```bash
npx prisma migrate dev --name init    # cria e aplica migration
npx prisma studio                     # interface visual do banco
npx prisma generate                   # regenera o client após mudança no schema
```

**Client — instanciar uma vez:**

```js
// src/lib/prisma.js
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
export default prisma;
```

---

## 7. AUTENTICAÇÃO — DECISÃO

Ver `AUTH.md` para documentação completa. Resumo de decisão:

| Situação | Solução |
|---|---|
| Login simples (email + senha), sem OAuth, sem roles | **JWT com jsonwebtoken** |
| OAuth (Google, GitHub), roles, MFA, múltiplos provedores | **Better Auth** |

---

### JWT — setup rápido

```bash
npm install jsonwebtoken bcryptjs
```

---

### Better Auth — setup completo

```bash
npm install better-auth
```

---

## 8. ESTRUTURA DE PACOTES POR TIPO DE PROJETO

### Landing page com formulário e API simples

```bash
npm install express dotenv cors helmet morgan zod
npm install -D nodemon
```

### Sistema com login e banco

```bash
npm install express dotenv cors helmet morgan zod jsonwebtoken bcryptjs prisma @prisma/client
npm install -D nodemon
```

### Sistema completo com OAuth e roles

```bash
npm install express dotenv cors helmet morgan zod better-auth prisma @prisma/client
npm install -D nodemon
```

---

## 9. REFERÊNCIA DE PACOTES

| Pacote | Função | Tamanho |
|---|---|---|
| express | Framework web | ~200kb |
| dotenv | Variáveis de ambiente | ~5kb |
| helmet | Headers de segurança | ~20kb |
| cors | Controle de CORS | ~5kb |
| morgan | Log de requisições | ~10kb |
| zod | Validação de dados | ~50kb |
| bcryptjs | Hash de senhas | ~40kb |
| jsonwebtoken | Tokens JWT | ~30kb |
| better-auth | Auth completa | ~150kb |
| prisma client | ORM | ~500kb |
| ejs | Template engine | ~30kb |
| nodemon | Dev reload (devDep) | ~100kb |

---

## 10. COMPATIBILIDADE COM HOSPEDAGEM

Node.js + Express é compatível com todas as plataformas relevantes:

| Plataforma | Plano gratuito | Banco incluso | Ideal para |
|---|---|---|---|
| Railway | Sim (limitado) | PostgreSQL | Projetos de cliente |
| Render | Sim | PostgreSQL | Projetos de cliente |
| Fly.io | Sim | SQLite nativo | Apps menores |
| Supabase | Sim | PostgreSQL | Quando só precisa de banco + auth |
| VPS (DigitalOcean, Hetzner) | Não | Qualquer | Projetos maiores |

**Para projetos de cliente:** Railway ou Render são o ponto de partida. Setup em minutos, plano gratuito cobre protótipos e projetos pequenos.
