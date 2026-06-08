# DATABASE.md
> Database decisions, Prisma schema patterns, migrations, and query conventions.
> Read before creating any model, migration, or database query.

---

## 1. DECISÃO DE BANCO

A decisão é feita uma vez no início do projeto. Mudar depois é possível com Prisma mas tem custo.

```
Qual é o projeto?
│
├─ Protótipo, projeto pessoal, ou sistema de uso interno por 1–5 pessoas?
│   └─ SQLite
│
├─ Sistema com múltiplos usuários simultâneos ou dados críticos?
│   └─ PostgreSQL
│
├─ Começa pequeno mas vai crescer ou ser entregue a cliente?
│   └─ PostgreSQL desde o início — migrar depois custa mais
│
└─ Precisa de deploy sem gerenciar servidor de banco?
    └─ PostgreSQL via Supabase (gratuito até 500MB) ou Railway
```

**SQLite:** arquivo `.db` na raiz do projeto. Zero configuração. Ótimo pra desenvolvimento local mesmo quando o banco de produção é PostgreSQL.

**PostgreSQL:** exige servidor rodando. Em desenvolvimento, instalar local ou usar Docker. Em produção, usar Supabase, Railway, ou Render.

---

## 2. CONFIGURAÇÃO PRISMA

### Inicialização

```bash
npm install prisma @prisma/client -D
npx prisma init
```

Isso cria `prisma/schema.prisma` e adiciona `DATABASE_URL` no `.env`.

### .env por banco

```env
# SQLite
DATABASE_URL="file:./database.db"

# PostgreSQL local
DATABASE_URL="postgresql://postgres:senha@localhost:5432/nome_do_banco"

# PostgreSQL Supabase
DATABASE_URL="postgresql://postgres:[SENHA]@db.[PROJETO].supabase.co:5432/postgres"
```

### schema.prisma — cabeçalho padrão

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "sqlite"      // trocar para "postgresql" quando necessário
  url      = env("DATABASE_URL")
}
```

---

## 3. MODELOS — PADRÕES OBRIGATÓRIOS

### Convenções de nomenclatura

| Elemento | Convenção | Exemplo |
|---|---|---|
| Model name | PascalCase singular | `User`, `Product`, `OrderItem` |
| Field name | camelCase | `firstName`, `createdAt` |
| Relation field | camelCase | `orders`, `user` |
| Enum | PascalCase | `Role`, `OrderStatus` |
| Table name (override) | snake_case plural | `@@map("order_items")` |

### Campos obrigatórios em todo modelo

```prisma
model Example {
  id        Int      @id @default(autoincrement())
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
```

Usar `String @id @default(cuid())` quando IDs sequenciais expõem volume de dados (ex: IDs públicos em URLs).

---

## 4. MODELOS COMUNS — PRONTOS PRA USAR

### User

```prisma
model User {
  id        Int      @id @default(autoincrement())
  email     String   @unique
  name      String
  password  String   // sempre hash bcrypt — nunca plain text
  role      Role     @default(USER)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  // Relações
  sessions  Session[]
  orders    Order[]
}

enum Role {
  USER
  ADMIN
}
```

### Session (quando usando JWT com revogação ou auth baseada em sessão)

```prisma
model Session {
  id        String   @id @default(cuid())
  userId    Int
  token     String   @unique
  expiresAt DateTime
  createdAt DateTime @default(now())

  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
}
```

### Product / Catálogo

```prisma
model Product {
  id          Int      @id @default(autoincrement())
  name        String
  slug        String   @unique
  description String?
  price       Float
  imageUrl    String?
  active      Boolean  @default(true)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  category    Category  @relation(fields: [categoryId], references: [id])
  categoryId  Int
}

model Category {
  id       Int       @id @default(autoincrement())
  name     String    @unique
  slug     String    @unique
  products Product[]
}
```

### Order / Pedido

```prisma
model Order {
  id        Int         @id @default(autoincrement())
  status    OrderStatus @default(PENDING)
  total     Float
  createdAt DateTime    @default(now())
  updatedAt DateTime    @updatedAt

  user      User        @relation(fields: [userId], references: [id])
  userId    Int
  items     OrderItem[]
}

model OrderItem {
  id        Int     @id @default(autoincrement())
  quantity  Int
  price     Float   // preço no momento da compra — não referenciar product.price
  order     Order   @relation(fields: [orderId], references: [id], onDelete: Cascade)
  orderId   Int
  product   Product @relation(fields: [productId], references: [id])
  productId Int

  @@map("order_items")
}

enum OrderStatus {
  PENDING
  CONFIRMED
  SHIPPED
  DELIVERED
  CANCELLED
}
```

### Contact Form / Lead

```prisma
model Lead {
  id        Int      @id @default(autoincrement())
  name      String
  email     String
  phone     String?
  message   String
  read      Boolean  @default(false)
  createdAt DateTime @default(now())
}
```

---

## 5. ÍNDICES

Adicionar índices em campos usados frequentemente em `where`, `orderBy`, ou `findUnique`.

```prisma
model Product {
  id         Int    @id @default(autoincrement())
  slug       String @unique  // @unique já cria índice
  categoryId Int

  @@index([categoryId])          // buscas por categoria
  @@index([active, createdAt])   // listagem de produtos ativos ordenados
}
```

**Quando criar índice:**
- Todo campo usado em `where` com frequência
- Todo campo de FK (relação) — Prisma não cria automaticamente em SQLite
- Campos combinados usados juntos em filtros (`active` + `createdAt`)

---

## 6. MIGRATIONS

```bash
# Criar e aplicar migration (desenvolvimento)
npx prisma migrate dev --name descricao_da_mudanca

# Exemplos de nomes descritivos
npx prisma migrate dev --name add_users_table
npx prisma migrate dev --name add_role_to_users
npx prisma migrate dev --name create_products_and_categories

# Aplicar migrations em produção (sem criar novas)
npx prisma migrate deploy

# Ver status das migrations
npx prisma migrate status

# Resetar banco em desenvolvimento (CUIDADO — apaga todos os dados)
npx prisma migrate reset
```

**Regras de migration:**
- Sempre usar nomes descritivos no `--name`
- Nunca editar arquivos de migration já aplicados
- Rodar `npx prisma generate` após qualquer mudança no schema
- Em produção: sempre usar `migrate deploy`, nunca `migrate dev`

---

## 7. SEED — DADOS INICIAIS

```js
// prisma/seed.js
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  // Admin padrão
  const admin = await prisma.user.upsert({
    where:  { email: 'admin@exemplo.com' },
    update: {},
    create: {
      email:    'admin@exemplo.com',
      name:     'Admin',
      password: await bcrypt.hash('senha123', 10),
      role:     'ADMIN',
    },
  });

  // Categorias base
  const categories = await Promise.all([
    prisma.category.upsert({
      where:  { slug: 'geral' },
      update: {},
      create: { name: 'Geral', slug: 'geral' }
    })
  ]);

  console.log('Seed completo:', { admin, categories });
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => await prisma.$disconnect());
```

**package.json — registrar o seed:**

```json
{
  "prisma": {
    "seed": "node prisma/seed.js"
  }
}
```

```bash
# Rodar seed
npx prisma db seed
```

---

## 8. QUERIES — PADRÕES

### Busca com seleção segura (sem password)

```js
const user = await prisma.user.findUnique({
  where: { id },
  select: { id: true, name: true, email: true, role: true, createdAt: true }
});
```

### Listagem com paginação

```js
async function getProducts({ page = 1, perPage = 20, categoryId } = {}) {
  const where = categoryId ? { categoryId, active: true } : { active: true };

  const [items, total] = await prisma.$transaction([
    prisma.product.findMany({
      where,
      skip:    (page - 1) * perPage,
      take:    perPage,
      orderBy: { createdAt: 'desc' },
      include: { category: { select: { name: true, slug: true } } }
    }),
    prisma.product.count({ where })
  ]);

  return {
    items,
    pagination: {
      total,
      page,
      perPage,
      totalPages: Math.ceil(total / perPage)
    }
  };
}
```

### Busca por texto (LIKE)

```js
const products = await prisma.product.findMany({
  where: {
    OR: [
      { name:        { contains: query } },
      { description: { contains: query } },
    ]
  }
});

// PostgreSQL: adicionar mode: 'insensitive' para case-insensitive
where: {
  name: { contains: query, mode: 'insensitive' }
}
// SQLite não suporta mode: 'insensitive' — contains já é case-insensitive por padrão
```

### Upsert (criar ou atualizar)

```js
const record = await prisma.product.upsert({
  where:  { slug: data.slug },
  update: { name: data.name, price: data.price },
  create: data
});
```

### Soft delete (não deletar de verdade)

Preferir soft delete em registros com histórico (pedidos, usuários).

```prisma
model Order {
  // ...
  deletedAt DateTime? // null = ativo, data = deletado
}
```

```js
// Busca que ignora deletados
prisma.order.findMany({ where: { deletedAt: null } });

// Soft delete
prisma.order.update({ where: { id }, data: { deletedAt: new Date() } });
```

### Transação

```js
// Quando múltiplas operações devem ser atômicas
const result = await prisma.$transaction(async (tx) => {
  const order = await tx.order.create({ data: orderData });

  await Promise.all(
    items.map(item =>
      tx.stock.update({
        where: { productId: item.productId },
        data:  { quantity: { decrement: item.quantity } }
      })
    )
  );

  return order;
});
```

---

## 9. PRISMA STUDIO

Interface visual do banco — útil em desenvolvimento para inspecionar dados sem SQL.

```bash
npx prisma studio
# Abre em http://localhost:5555
```

---

## 10. DIFERENÇAS SQLITE vs POSTGRESQL

| Recurso | SQLite | PostgreSQL |
|---|---|---|
| `mode: 'insensitive'` em contains | ❌ Não suporta | ✅ Suporta |
| JSON fields | ❌ Limitado | ✅ Nativo |
| Full-text search | ❌ Limitado | ✅ Nativo |
| Concurrent writes | ❌ Bloqueio de arquivo | ✅ Sem problema |
| Enums no schema | Simulado como String | ✅ Nativo |
| `@db.Text` e tipos específicos | Ignorado | Mapeado ao tipo PG |

**Ao migrar SQLite → PostgreSQL:**
1. Trocar `provider = "sqlite"` para `"postgresql"` no schema
2. Atualizar `DATABASE_URL` no `.env`
3. Rodar `npx prisma migrate dev`
4. Verificar se há queries com `mode: 'insensitive'` faltando

---

## 11. CHECKLIST

```
[ ] Provider correto declarado no schema (sqlite ou postgresql)
[ ] DATABASE_URL no .env — nunca hardcoded
[ ] Todo modelo tem id, createdAt, updatedAt
[ ] Campos de FK têm @@index declarado
[ ] Seed criado para dados iniciais obrigatórios (admin, categorias base)
[ ] Nenhuma query retorna o campo password
[ ] Paginação implementada em toda listagem
[ ] Transações usadas quando múltiplas operações são atômicas
[ ] Soft delete aplicado em modelos com histórico
[ ] prisma/seed.js usa upsert — pode rodar múltiplas vezes sem duplicar
```
