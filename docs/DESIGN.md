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

> Enmienda mapa #112 (D2/D3): el sistema vigente es dark-galaxia; los valores mandan desde el código (`@theme`), los nombres históricos se conservan como alias. El doc se actualiza al código, no al revés.

| Name | Value | Token | Role |
|------|-------|-------|------|
| Midnight Void | `#000000` | `--color-midnight-void` | Base dark, theme-color, texto de CTA primario |
| Star White (alias Canvas White) | `#f3ecf2` | `--color-canvas-white` | Texto principal sobre dark (18.09:1, AA) |
| Space Mist (alias Soft Linen) | `#101020` | `--color-soft-linen` | Superficies alternas oscuras |
| Ash Gray | `#867f7f` | `--color-ash-gray` | Solo secundario sobre dark (5.36:1, AA); nunca en CTA |
| Nebula (alias Trust Slate) | `#496a95` | `--color-trust-slate` | Acento, bordes crisp |
| Galaxy Deep | `#2a3444` | `--color-galaxy-deep` | Fills glass al 72% |
| Star Warm | `#c05a42` | `--color-star-warm` | CTA primario, siempre con texto midnight (4.78:1, AA) |
| Star Glow | `#b65e49` | `--color-star-glow` | Hover CTA, siempre con texto midnight (4.69:1, AA) |
| Core Cream | `#d4bfb3` | `--color-core-cream` | Headings en cards (7.11:1 sobre Galaxy Deep, AA) |

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

> Enmienda mapa #112: el producto real es dark en todas las secciones (no solo hero + footer). La tabla anterior linen/white queda reemplazada por esta.

| § | Sección | Fondo |
|---|---------|-------|
| 1 | Hero | `space-void` + scrim funcional (legibilidad, no decorativo) |
| 2 | Problema | `galaxy-deep` / glass |
| 3 | Solución | `space-void` |
| 4 | Camino | `space-mist` |
| 5 | Descubrimiento | `galaxy-deep` (bloque destacado con borde crisp) |
| 6 | Para quién | `space-mist` |
| 7 | Cómo trabajamos | `space-void` |
| 8 | Contacto | `space-void` |

---

## Components

### Button primary (pill)
Fondo `star-warm`, texto `midnight-void` (4.78:1, AA; en blanco no llegaba — fix S3), radius 80px, padding 16px 24px. Uso: “Pedir descubrimiento”.

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
- Sombras fuertes o glassmorphism decorativo (crisp sutil sí: borde semi-transparente + sombra mínima o nada — D1 mapa #112).
- Iconografía “AI brain” / neuro.

---

## Tailwind v4 (`@theme` en `web/src/styles/global.css`)

Ver implementación en el proyecto `web/`.
