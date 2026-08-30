# Consultoría Matasini — Design system (Neuralink adaptado)

> Base visual inspirada en [Refero: Neuralink](https://styles.refero.design/style/7510b18e-63c3-4c2a-97c3-39fa7dfa6ae3). **No** clonar marca Neuralink: sin gradiente sci‑fi, sin imágenes neurotech.

**Producto:** landing + PDF one-pager · **Mauricio Matasini** · consultoría de sistemas de gestión para comercios (oferta actual: Odoo CE retail).

---

## Overrides — Consultoría (obligatorio)

| Regla Neuralink original | Adaptación |
|--------------------------|------------|
| Neural Gradient banner | **No usar.** Acento opcional: franja sólida `#1a3a52` o sin franja. |
| Untitled Sans | **Inter** o `system-ui` |
| Tono clinical / neuro | Copy **PYME, Argentina, operación** (ver `marketing-one-pager.md`) |
| Imágenes duotone ciencia | Sin stock photos sci‑fi en v1; iconos lineales o sin imagen |

---

## Tokens — Colors

| Name | Value | Token | Role |
|------|-------|-------|------|
| Midnight Void | `#000000` | `--color-midnight-void` | Hero, footer, texto en fondos claros |
| Canvas White | `#ffffff` | `--color-canvas-white` | Texto en hero, fondo botón primario, cards |
| Soft Linen | `#f5f5f5` | `--color-soft-linen` | Secciones alternas (problema, camino, etc.) |
| Ash Gray | `#bababa` | `--color-ash-gray` | Texto secundario, bordes suaves |
| Trust Slate | `#1a3a52` | `--color-trust-slate` | Acento opcional (links, borde CTA secundario) — **no** gradiente |

---

## Tokens — Typography

**Font:** `--font-sans: 'Inter', ui-sans-serif, system-ui, sans-serif`

| Role | Size | Line height | Use |
|------|------|-------------|-----|
| display | 48px | 1.05 | Hero titular |
| display-sm | 40px | 1.1 | Títulos de sección |
| heading | 32px | 1.15 | Subtítulos |
| subheading | 24px | 1.2 | Cards, pasos |
| body-lg | 18px | 1.5 | Lead paragraphs |
| body | 16px | 1.5 | Cuerpo |
| body-sm | 14px | 1.5 | Pie, notas |

**Weights:** 400 body, 500 headings, 600 display (no ultralight en body crítico).

---

## Tokens — Spacing & shape

- **Section gap:** 50px (`--section-gap`)
- **Element gap:** 12px (`--element-gap`)
- **Card padding:** 20px (landing: un poco más que Neuralink 12px para legibilidad PYME)
- **Max width content:** 1120px (`--content-max`)
- **Radius buttons:** 80px (pill)
- **Radius cards:** 20px
- **Radius nav:** 16px

---

## Surfaces (por sección landing)

| § | Sección | Fondo |
|---|---------|-------|
| 1 | Hero | `midnight-void` |
| 2 | Problema | `soft-linen` |
| 3 | Solución | `canvas-white` |
| 4 | Camino | `soft-linen` |
| 5 | Descubrimiento | `canvas-white` (bloque destacado con borde) |
| 6 | Para quién | `soft-linen` |
| 7 | Cómo trabajamos | `canvas-white` |
| 8 | Contacto | `midnight-void` |

---

## Components

### Button primary (pill)
Fondo `canvas-white`, texto `midnight-void`, radius 80px, padding 16px 24px. Uso: “Pedir descubrimiento”.

### Button ghost (dark)
Borde 1px `canvas-white`, texto blanco, transparente. Uso: WhatsApp / secundario en hero.

### Button ghost (light)
Borde 1px `midnight-void`, texto negro, transparente. Uso: enlaces secundarios en secciones claras.

### Section shell
`max-width: var(--content-max)`, padding horizontal 24px (mobile) / 40px (desktop), `padding-block: var(--section-gap)`.

### Price highlight
`subheading` + `body-sm` ash gray para “ARS” y notas; precio descubrimiento **$155.000** en `heading` weight 500.

---

## Do

- Hero oscuro + CTA pill blanco visible.
- Alternar linen / white entre secciones.
- Mantener mucho aire (50px entre secciones).
- Contraste WCAG AA en textos críticos (no ash gray en CTAs).

## Don't

- Neural Gradient ni paletas neon.
- Sombras fuertes o glassmorphism.
- Dark mode completo (solo hero + footer oscuros).
- Iconografía “AI brain” / neuro.

---

## Tailwind v4 (`@theme` en `web/src/styles/global.css`)

Ver implementación en el proyecto `web/`.
