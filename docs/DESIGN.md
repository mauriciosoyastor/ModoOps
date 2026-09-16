# Consultoría Matasini — Design system (Neuralink adaptado)

> Base visual inspirada en [Refero: Neuralink](https://styles.refero.design/style/7510b18e-63c3-4c2a-97c3-39fa7dfa6ae3). **No** clonar marca Neuralink: sin gradiente sci‑fi, sin imágenes neurotech.

**Producto:** landing + PDF one-pager · **Mauricio Matasini** · consultoría de sistemas de gestión para comercios (oferta actual: Odoo CE retail).

> **Vigencia (2026-09, decisión A del mapa sistema-diseno-modoops):** la landing implementada es
> **dark-galaxia** y manda el stylesheet (`web/src/styles/global.css`) + `web/AGENTS.md`. Esta tabla
> refleja lo vigente, no la intención clara original. Spec viva: `docs/design-system/`; gate:
> `tools/design-check/`.

---

## Overrides — Consultoría (obligatorio)

| Regla Neuralink original | Adaptación |
|--------------------------|------------|
| Neural Gradient banner | **No usar.** Acento opcional: franja sólida `#1a3a52` o sin franja. |
| Untitled Sans | **Inter** o `system-ui` |
| Tono clinical / neuro | Copy **PYME, Argentina, operación** (ver `marketing-one-pager.md`) |
| Imágenes duotone ciencia | Sin stock photos sci‑fi en v1; iconos lineales o sin imagen |

---

## Tokens — Colors (vigentes dark-galaxia, stylesheet manda)

| Name | Value | Token | Role |
|------|-------|-------|------|
| Midnight Void | `#000000` | `--color-midnight-void` | Hero, footer, fondo base |
| Canvas White | `#f3ecf2` | `--color-canvas-white` | Texto base (alias star-white, no blanco puro) |
| Soft Linen | `#101020` | `--color-soft-linen` | Bandas alternas **oscuras** (alias space-mist) |
| Galaxy Deep | `#2a3444` | — (ver `white` en `Section`) | Secciones "claras", siempre oscuras |
| Star Warm | `#c05a42` | `--color-brand-accent` | **Único acento: CTA primario siempre con texto oscuro** (4.78 AA; en blanco falla) |
| Ash Gray | `#867f7f` | `--color-ash-gray` | Bordes y notas `body-sm` — prohibido en texto CTA/cuerpo crítico |
| Trust Slate | `#496a95` | `--color-trust-slate` | Bordes ghost y glass **estático** en chrome — **no** gradiente |

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
`subheading` + `body-sm` ash gray para “ARS” y notas; precio descubrimiento **$155 USD** en `heading` weight 500.

---

## Do

- Hero oscuro + CTA pill star-warm con texto oscuro visible.
- Alternar bandas oscuras (mist / deep) entre secciones, full-bleed.
- Mantener mucho aire (50px entre secciones).
- Contraste WCAG AA en textos críticos (no ash gray en CTAs).

## Don't

- Neural Gradient ni paletas neon.
- Sombras fuertes; glass solo estático en chrome UI (SiteHeader), nunca decorativo.
- Superficies claras nuevas (el tema vigente es dark completo).
- Iconografía “AI brain” / neuro.

---

## Tailwind v4 (`@theme` en `web/src/styles/global.css`)

Ver implementación en el proyecto `web/`.
