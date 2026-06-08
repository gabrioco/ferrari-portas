# CLAUDE.md

## Project Identity

- **Project name:** ferrari-portas
- **Client / owner:** Marcelo
- **Type:** sistema com painel — landing page pública + área logada para gestão de catálogo de produtos
- **Mood visual:** clean-técnico
- **The one memorable thing:** a definir
- **Primary language:** pt-BR
- **Auth:** jwt-simples (email + senha, httpOnly cookie em área EJS)
- **Database:** sqlite (migrar para postgresql antes de ir ao ar)
- **Frontend approach:** ambos — static para landing page pública, ejs para painel do contratante
- **Deadline:** a definir

---

## Autonomy

Act without asking permission for:
- Creating and organizing files and folders
- Writing and editing HTML, CSS, JS, and backend code
- Choosing Tailwind classes, effects, and components from the design reference
- Refactoring code that violates conventions
- Installing packages already listed in `docs/STACK.md`
- Creating Prisma migrations in development
- Running `npx prisma generate` after schema changes

**Always ask before:**
- Installing any package NOT listed in `docs/STACK.md`
- Installing Node.js, Python, or any system-level dependency
- Running `prisma migrate reset` (deletes all data)
- Deleting files or folders
- Making the project go live or deploying anywhere
- Changing the database provider (sqlite → postgresql)

---

## Docs — Read in this order

| File | Read when |
|---|---|
| `docs/DESIGN.md` | Starting any frontend page or section |
| `docs/STACK.md` | Choosing any library, package, or build tool |
| `docs/BACKEND.md` | Creating routes, controllers, or middleware |
| `docs/AUTH.md` | Implementing any login, registration, or route protection |
| `docs/DATABASE.md` | Creating or modifying Prisma models, migrations, or queries |
| `docs/PERFORMANCE.md` | Adding queries, images, scripts, or background effects |
| `docs/CONVENTIONS.md` | Creating any file or writing any code |

Do not read all docs on every task. Read only what is relevant to the current action.

---

## Visual Reference

`assets/FRONTEND_REFERENCE.html` é a fonte de verdade para todos os tokens visuais.

Antes de escrever qualquer CSS ou componente frontend: abrir, escolher uma paleta, escolher um par tipográfico. Não construir de memória.

---

## Quality Bar

Every output must pass this before being considered done:

**Frontend:**
- [ ] Palette and typography pair chosen from reference — not invented
- [ ] Section labels use Space Mono + uppercase + tracking-[0.2em] + opacity-40
- [ ] All images have `loading` attribute and explicit dimensions
- [ ] All third-party scripts have `defer`
- [ ] Only `transform` and `opacity` are animated

**Backend:**
- [ ] Toda lógica está em controllers — nenhuma inline nas rotas
- [ ] Toda entrada do cliente passa por validação Zod
- [ ] Nenhuma query retorna o campo password
- [ ] Todos os erros passam por next(error)
- [ ] Rotas protegidas têm requireAuth aplicado
- [ ] Variáveis sensíveis estão em .env — nunca hardcoded
- [ ] .env está no .gitignore e .env.example está atualizado

---

## This template does NOT apply when

- O projeto é built em React, Vue, Next.js, ou qualquer framework JS de frontend
- O projeto usa uma plataforma no-code ou low-code (Webflow, Bubble, etc.)
- O backend é exclusivamente um serviço externo (Firebase, Supabase sem Express)
