# Arquitectura landing — Consultoría Matasini

**Stack:** Astro 5 · Tailwind CSS v4 · HTML semántico · formulario → Formspree (`PUBLIC_FORMSPREE_FORM_ID`).

**Contenido:** [`marketing-one-pager.md`](./marketing-one-pager.md)  
**Visual:** [`DESIGN.md`](./DESIGN.md)

---

## Árbol de carpetas (`web/`)

```
web/
├── astro.config.mjs
├── package.json
├── tsconfig.json
├── public/
│   └── favicon.svg          # pendiente
└── src/
    ├── pages/
    │   └── index.astro        # ensambla todas las secciones
    ├── layouts/
    │   └── BaseLayout.astro   # <html>, meta SEO, fonts, global.css
    ├── styles/
    │   └── global.css         # @import tailwind; @theme tokens
    └── components/
        ├── sections/          # 1 bloque = 1 sección del one-pager
        │   ├── Hero.astro
        │   ├── Problem.astro
        │   ├── Solution.astro
        │   ├── Path.astro
        │   ├── Discovery.astro
        │   ├── Audience.astro
        │   ├── HowWeWork.astro
        │   └── Contact.astro
        └── ui/
            ├── Section.astro      # wrapper: fondo + max-width + padding
            ├── Button.astro       # variant: primary | ghost-dark | ghost-light
            └── SectionHeading.astro
```

---

## Flujo de `index.astro`

```astro
---
import BaseLayout from '../layouts/BaseLayout.astro';
import Hero from '../components/sections/Hero.astro';
// ... resto de imports
---
<BaseLayout title="..." description="...">
  <Hero />
  <Problem />
  <Solution />
  <Path />
  <Discovery />
  <Audience />
  <HowWeWork />
  <Contact />
</BaseLayout>
```

---

## Responsabilidad por componente

| Componente | Contenido (one-pager §) | Fondo DESIGN |
|------------|-------------------------|--------------|
| `Hero` | 1 | midnight-void |
| `Problem` | 2 | soft-linen |
| `Solution` | 3 | canvas-white |
| `Path` | 4 | soft-linen |
| `Discovery` | 5 | canvas-white + card |
| `Audience` | 6 | soft-linen |
| `HowWeWork` | 7 | canvas-white |
| `Contact` | 8 + form | midnight-void |

---

## `ui/Section.astro` (API prevista)

Props:

- `variant`: `'dark' | 'linen' | 'white'`
- `id?`: anchor (`contacto`)
- `narrow?`: boolean (formulario más angosto)

Slots: default (children).

---

## `ui/Button.astro` (API prevista)

Props:

- `variant`: `'primary' | 'ghost-dark' | 'ghost-light'`
- `href`: string (siempre `<a>` para SEO y mailto/tel)

---

## Integraciones pendientes

| Item | Estado |
|------|--------|
| Formspree | `PUBLIC_FORMSPREE_FORM_ID` en `web/.env` — ver `web/README.md` |
| Google Fonts Inter | layout |
| Open Graph image | pendiente |
| PDF download (mismo copy) | fase 2 |
| Dominio + deploy Cloudflare Pages | fase 2 |

---

## Comandos (cuando `npm install` hecho)

```bash
cd web
npm install
npm run dev
npm run build
```
