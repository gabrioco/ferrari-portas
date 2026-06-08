# DESIGN.md
> Visual decision framework for every frontend project.
> Read before writing a single line of HTML or CSS.
> All visual tokens, effects, and components referenced here live in `FRONTEND_REFERENCE.html`.

---

## 0. MANDATORY FIRST STEP

Before starting any project, answer these three questions out loud (in a comment at the top of CLAUDE.md or stated in the brief):

1. **What is the project type?** (portfolio, landing page, SaaS, institutional, e-commerce, editorial)
2. **What is the dominant mood?** (premium/refined, dark/cinematic, warm/human, clean/technical, editorial/bold)
3. **What is the one thing someone will remember?** (a specific effect, a typographic moment, an unexpected layout)

If these are not answered, ask before starting. A generic layout is always the result of skipping this step.

---

## 1. HOW TO USE FRONTEND_REFERENCE.HTML

`FRONTEND_REFERENCE.html` is the visual bible for this project. It contains working code for:
- 4 color palettes with CSS variables
- 4 typography pairs with Google Fonts imports
- All background/surface options (noise, grid, glass, gradient blur, border gradient)
- All animation keyframes (fadeSlideIn, textSlide, marquee, shimmer, conicSpin)
- All button variants (beam, conic, radial glow, ghost pill, solid, big text link)
- All card patterns (split, flashlight, glass)
- All navigation patterns (glass pill, frosted sticky, mix-blend-difference)
- Misc components (badge, floating label input, scroll indicator, marquee)

**Workflow:**
1. Open `FRONTEND_REFERENCE.html`
2. Pick one palette — commit to it fully
3. Pick one typography pair — do not mix pairs from different themes
4. Select effects appropriate for the project type (see section 4)
5. Copy the relevant CSS variables and keyframes into the project's stylesheet
6. Build components from the patterns in the reference — never from scratch without reason

---

## 2. PALETTE SELECTION

Match the palette to the project mood. Do not default to dark because it looks impressive.

| Palette | Name | Best for |
|---|---|---|
| **Theme A** | Dark Abyss (`#050505`) | Portfolios, creative studios, cinematic products, luxury |
| **Theme B** | Dark Creative (`#000` + `#ef233c`) | Tech startups, music/entertainment, bold agencies |
| **Theme C** | Stone / Concrete (`#E3E1DC`) | Architecture, design studios, craft brands, warm premium |
| **Theme D** | Clean White (`#FFFFFF` + `#1C1C1C`) | SaaS, institutional, e-commerce, B2B, anything client-facing that needs trust |

**Selection rules:**
- Choose ONE palette. Do not mix backgrounds from different themes.
- The accent color (`--accent`) should appear in maximum 2–3 places: primary CTA, active state, one decorative moment. Not everywhere.
- If the client has a brand color: replace `--accent` only. Keep the rest of the palette intact.
- When unsure between A and B: A is more refined, B is more aggressive. Choose based on whether the product leads with prestige or energy.

**CSS variables — always declare at `:root` level:**

```css
:root {
  --bg:          [value from chosen palette];
  --bg-2:        [value];
  --bg-3:        [value];
  --text:        [value];
  --text-muted:  [value];
  --accent:      [value];
  --border:      [value];
}
```

Never hardcode hex values directly in components. Always use variables.

---

## 3. TYPOGRAPHY SELECTION

| Pair | Display font | Body font | Personality | Best for |
|---|---|---|---|---|
| **Pair A** | Syncopate 700 | Manrope 300–600 | Architectural, geometric, rigid | Studio, portfolio, architecture, premium |
| **Pair B** | Oswald 600 | Inter 400 | Editorial, condensed, neutral | Product landing page, SaaS, editorial |
| **Pair C** | Bricolage Grotesque 700 | Geist Mono 400 | Expressive, contemporary, tech | Dev tools, tech brand, creative agency |
| **Pair D** | Space Grotesk 700 | Manrope 300 | Geometric, clean, warm | Agency, premium service, B2B |

**Selection rules:**
- Choose ONE pair per project. Never mix display fonts from different pairs.
- Import only the weights actually used (see `STACK.md` — font weight cost table).
- The display font is for H1, H2, hero text, and large section headings only.
- Body font handles everything else: H3 downward, paragraphs, nav links, captions.
- Labels, tags, section indexes, and metadata always use `Space Mono` — this is non-negotiable and consistent across all pairs.

**Type scale — always follow this hierarchy:**

| Role | Size | Weight | Font | Notes |
|---|---|---|---|---|
| Hero / Display | `clamp(2.5rem, 7vw, 6rem)` | 700 | Display | `leading-none`, `tracking-tight` or tighter |
| Section H2 | `clamp(1.75rem, 4vw, 3rem)` | 700 | Display | `leading-tight` |
| Card title H3 | `1.25rem–1.75rem` | 600 | Body | `tracking-tight` |
| Body large | `1.125rem` | 400 | Body | `leading-relaxed` |
| Body standard | `1rem` | 400 | Body | `leading-relaxed`, `opacity-70` |
| Label / tag | `0.65rem` | 400 | Space Mono | `uppercase tracking-[0.2em] opacity-40` |
| Section index | `3rem–5rem` | 700 | Display | `opacity-10–15` |

---

## 4. EFFECTS & SURFACES — WHEN TO USE

### Background effects

| Effect | Use when | Never use when |
|---|---|---|
| Noise overlay | Dark or stone themes, any hero section | White theme (too visible), card lists |
| CSS grid background | Clean/white theme heroes, technical products | Dark cinematic (kills the atmosphere) |
| Glass panel | Navs, floating cards, modals, overlays over imagery | As the primary card surface in a list |
| Gradient blur (layered) | Fixed nav on scroll, top-of-page nav fade | Anywhere other than nav/header area |
| Border gradient | Feature cards, hero CTAs, nav pill | Generic input fields, footer |
| Blob/aura background | Hero section, dark themes only | Below fold, on white theme |

### Animation effects

| Effect | Use when | Limit |
|---|---|---|
| fadeSlideIn | Default entrance for any block, section, or card | Stagger max 6 elements per group |
| textSlide (clip reveal) | Hero headline, section titles, impactful moments | Max 1–2 per section |
| Word split reveal (GSAP) | Main hero headline only | Once per page |
| Marquee | Divider between sections, client logos, tag cloud | Max 2 per page |
| Flashlight card | Feature/service cards on dark backgrounds | Max 1 grid of cards |
| Shimmer button | Primary CTA | Once per section |
| Conic spin border | Primary CTA on black background | Once per section |
| Parallax (GSAP scrub) | Hero image, background layer | Max 2 layers per page |
| Preloader | Portfolio, cinematic, or dark-theme sites | Never on B2B, SaaS, or fast-utility sites |

---

## 5. LAYOUT PHILOSOPHY

**The rule:** No layout should feel safe. Every page must have at least one spatial decision that is unexpected.

### Grid options

```
Full width (1 col)         → Hero sections, full-bleed imagery
Asymmetric split           → 1fr 1.2fr, 1fr 1.5fr, 5/7 col — never 1fr 1fr for featured content
12-column editorial        → Section body, mixed text/image layouts
2-col even                 → Only for equal-weight cards or feature grids
3-col card grid            → Services, portfolio thumbs, team
4-col tight                → Small feature lists, icon+text combos
```

**Asymmetry rule:** When a section has text + image or text + component, the split is never 50/50. Use `grid-cols-[1fr_1.4fr]` or Tailwind's `lg:col-span-5` / `lg:col-span-7`.

### Spacing rhythm

```
Section padding (vertical):  py-20 md:py-28 lg:py-36
Section padding (horizontal): px-6 md:px-12 lg:px-20
Max content width:            max-w-7xl (1280px) centered — wider max-w-[1400px] for editorial
Gap between cards:            gap-6 (tight grid) or gap-8 (standard) or gap-12 (editorial)
Space between section label and heading: mb-4
Space between heading and body: mt-6
Space between body and CTA:  mt-10 md:mt-12
```

### Spatial decisions — at least one per page

Pick at least one of these per project to break the grid deliberately:

- **Oversized index number** behind section heading (`opacity-10`, `Syncopate 700`, `text-[8rem]`)
- **Overlapping elements** — a card that breaks out of its column into the margin
- **Full-bleed section** between padded sections — no side padding, edge-to-edge
- **Offset grid** — first card starts at col 2, leaves a deliberate empty column
- **Typography scale break** — one headline at `10vw–14vw` that bleeds past the grid
- **Horizontal scroll section** — card row that scrolls sideways instead of wrapping
- **Sticky sidebar** — left label stays fixed while right content scrolls

---

## 6. COMPONENT RULES

### Navigation
- **Dark cinematic / portfolio:** mix-blend-difference OR glass pill floating centered
- **Stone / warm:** fixed top with subtle border-bottom, no blur
- **Clean white / SaaS:** frosted sticky (`bg-white/80 backdrop-blur-md border-b`)
- Nav links: always `Space Mono uppercase tracking-widest text-xs` or `Manrope text-sm font-medium`
- Mobile: hamburger or a minimal `MENU` text toggle — never a drawer that covers the whole screen unless it's a statement

### Buttons
- Every page has exactly **one primary CTA** — it gets the most elaborate button (beam, conic, or radial glow)
- Secondary CTAs use ghost pill or solid
- Text links in body use `border-b border-current pb-0.5` underline — no underline CSS default
- Big text link (`LET'S TALK` style) only in contact section or footer CTA

### Cards
- Dark themes: `card-split` (image + content) or `card-flashlight`
- Stone / white themes: clean border card, no glass
- Never use `rounded-xl` or `rounded-2xl` for cards — it looks generic. Use `rounded-none` (editorial/studio) or `rounded-sm` (4px, subtle)
- Card hover: image scale `scale(1.06–1.08)` with `transition-transform duration-700` — never a box-shadow pop

### Section structure
Every section follows this order:
1. Label (`Space Mono`, uppercase, `opacity-40`) — e.g. `01 — Services`
2. Heading (`display font`)
3. Optional subheading or body (`body font`, `opacity-70`)
4. Content (grid, cards, etc.)
5. Optional CTA

---

## 7. ANTI-PATTERNS — NEVER DO

These are the most common generic AI-output patterns. Avoid all of them.

```
✗ Purple or blue gradient on white background
✗ Cards with rounded-xl + drop-shadow + hover:shadow-xl — the default SaaS card
✗ Hero with centered H1, subtext, and two pill buttons stacked — every AI landing page
✗ Inter or Roboto as display font
✗ Grid of 3 cards with icon + title + 2 lines of text — the "features" cliché
✗ Symmetric 50/50 split layouts throughout the entire page
✗ Section labels that just say "Our Services" or "About Us" — no index, no personality
✗ Accordion FAQ as the only interactive element on the page
✗ Background gradient from one brand color to another — lazy and overused
✗ Testimonials section with quote marks and stars — always looks cheap
✗ Footer with 4 equal columns of links — add a big CTA headline first
✗ Buttons with only a background color change on hover — always add a second behavior
✗ Every section the same height and the same padding — kills visual rhythm
✗ Using the same animation (fadeSlideIn) on every single element without variety
```

---

## 8. VARIETY MANDATE

**No two projects should share the same layout structure.** Before starting, identify what was used last and choose something different in at least three of these:

- Palette (rotate between themes A/B/C/D)
- Typography pair (rotate between A/B/C/D)
- Hero structure (full-bleed image / text-only / split / video background / animated text)
- Navigation style (glass pill / mix-blend / frosted sticky)
- Primary button style (beam / conic / radial glow / big text link)
- Card pattern (split / flashlight / glass / clean border)
- Background surface (noise + dark / grid + white / stone flat / blob + dark)

If the current project feels like the last one: stop and change at least two of the above before writing code.

---

## 9. QUICK-START CHECKLIST

```
[ ] Answered: project type, mood, one memorable thing
[ ] Opened FRONTEND_REFERENCE.html and chosen one palette
[ ] Chosen one typography pair — not mixing pairs
[ ] CSS variables declared at :root
[ ] Google Fonts import uses display=swap and only needed weights
[ ] At least one spatial decision that breaks the safe grid
[ ] Section labels use Space Mono + uppercase + tracking-[0.2em] + opacity-40
[ ] Primary CTA uses an elaborate button — not a flat color change
[ ] Every section has the label → heading → content hierarchy
[ ] Checked against anti-patterns list — none present
[ ] No two animations identical across all sections
```
