# Research — Sistemas de color (Radix / Carbon / Atlassian) → tokens `--mo-*` light-app

> **Fecha:** 2026-09-23 · **Autor:** agente (research corto)  
> **Pregunta:** ¿Cómo mapear tres sistemas de color vivos (2025–27) a los tokens de `web/src/styles/light-app.css` (papel locked)?  
> **Padre:** light-app #187/#188/#190 · Ola 1–2 prototipos · board `research/board-visual-2026/`  
> **Restricción:** landing dark-galaxia intacta; no adoptar hex IBM/Atlassian/Radix como marca.

---

## 1. Resumen ejecutivo (TL;DR)

Los tres sistemas **coinciden en estructura** (roles semánticos + capas de superficie + contraste medido) y **difieren en hex/marca**. ModoOps papel ya tiene esa estructura con nombres cortos (`--mo-wash` … `--mo-danger`).

**No hace falta importar** Radix/Carbon/Atlassian como dependencia. Sí conviene **alinear vocabularios** (para agentes y specs) y **cerrar 3 huecos** del mapa actual:

1. Separar **accent de marca** vs **ok de estado** (hoy en papel `--mo-accent` ≈ `--mo-ok` = `#2f5d50`).
2. Agregar tokens de **estado interactivo** (hover/selected/focus) que Carbon/Radix nombran y nosotros resolvemos ad-hoc en CSS.
3. Decidir gate de contraste: Vercel/Radix empujan **APCA**; ModoOps (#114) mantiene **WCAG AA** como contractual.

---

## 2. Fuentes primarias

| Sistema | Documento | Qué aporta |
|---|---|---|
| **Radix Colors** | [Understanding the scale](https://www.radix-ui.com/colors/docs/palette-composition/understanding-the-scale) · [Colors](https://www.radix-ui.com/colors) | Escala 1–12 por uso (bg → text); APCA; alpha; dark class |
| **IBM Carbon** | [Color tokens](https://carbondesignsystem.com/elements/color/tokens/) · [Overview](https://carbondesignsystem.com/elements/color/overview/) | `$background` / `$layer-*` / `$border-*` / `$support-*` / `$text-*`; temas White/Gray/G100 |
| **Atlassian** | [Color foundations](https://atlassian.design/foundations/color) | Roles: `neutral`, `brand`, `success`, `warning`, `danger`, `information`, `discovery`; énfasis + estados; **WCAG AA** |

Local: `light-app.css:7-22` (papel), `docs/research/tokens-light-app-imagen-ref-188.md`, `web/AGENTS.md` (#114).

---

## 3. Vocabulario cruzado (roles → `--mo-*`)

Valores papel actuales entre paréntesis.

| Rol UI | Radix (paso / escala) | Carbon (token) | Atlassian (rol) | ModoOps papel |
|---|---|---|---|---|
| Fondo app | Step **1** (App background) | `$background` | surface default / `neutral` subtle | `--mo-wash` (`#f3efe6`) |
| Superficie primaria (tabla/panel) | Step **2** Subtle bg | `$layer-01` / `$layer-02` | elevation / neutral | `--mo-canvas` (`#faf7f0`) |
| Superficie secundaria (chrome tabla) | Step **3** UI element bg | `$layer-accent-*` | neutral softer | `--mo-card` (`#ebe6da`) |
| Texto alto contraste | Step **12** | `$text-primary` | `neutral` bold text | `--mo-ink` (`#211922`) |
| Texto bajo contraste | Step **11** | `$text-secondary` | `neutral` subtle text | `--mo-muted` (`#6b6570`) |
| Borde sutil | Step **6** | `$border-subtle-*` | `neutral` border | `--mo-line` (`#d8d0c2`) |
| Borde / foco interactivo | Step **7–8** | `$border-interactive` / `$focus` | focus ring | *(implícito en `:focus-visible` ink)* |
| CTA / marca | Step **9** solid (p.ej. Teal/Jade) | `$background-brand` / `$link-primary` | **`brand`** | `--mo-accent` (`#2f5d50`) |
| Texto sobre CTA | white o dark según escala | `$text-on-color` | `inverse` | `--mo-accent-ink` (`#faf7f0`) |
| Soft fill acento | Step **3–5** tint | `$layer` + support tint | brand subtle | `--mo-accent-soft` (`#e2ece8`) |
| Éxito | Green/Jade **9** + **11** text | `$support-success` | **`success`** | `--mo-ok` (**igual que accent hoy**) |
| Advertencia | Amber **9–11** | `$support-warning` | **`warning`** | `--mo-warn` (`#7c4b01`) |
| Peligro / error | Red/Tomato **9–11** | `$support-error` | **`danger`** | `--mo-danger` (`#a10214`) |
| Hero / inverso | Gray/Mauve **12** bg + **1** text | `$background-inverse` / `$layer-selected-inverse` | `inverse` on bold | `--mo-hero` / `--mo-on-hero` |

**Escalas Radix cercanas a papel (cálido + verde):** neutro `Sand` o `Mauve`; acento `Teal` / `Jade` / `Olive` — **no** Blue 60 de Carbon (choca con “look billetera” del board).

---

## 4. Huecos vs `light-app.css` (acciones concretas)

| # | Gap | Evidencia | Propuesta (sin implementar acá) |
|---|---|---|---|
| G1 | `--mo-ok` ≡ `--mo-accent` en papel | `light-app.css:15-20` | Separar: accent = marca; ok = éxito semántico (puede ser misma familia, distinto step / saturación) |
| G2 | Sin `--mo-info` / discovery | Atlassian `information`/`discovery`; Carbon `$support-info` | Opcional: info azul-gris **solo** banners no-urgencia; no CTA |
| G3 | Sin tokens hover/selected/focus | Radix 4–5 / 8; Carbon `*-hover` / `$focus` | Añadir `--mo-line-strong`, `--mo-focus`, `--mo-row-hover` (ya hay color-mix ad-hoc) |
| G4 | Field bg no tipado | Carbon `$field-01` | Alias `--mo-field` → canvas (ya casi es así) |
| G5 | Contraste APCA vs AA | Radix APCA; Atlassian + ModoOps AA | Seguir **AA gate**; APCA check en charts/solid step 9 |
| G6 | Dark mode app | Radix dark class; Carbon Gray 100; Atlassian dual theme | Override opcional (#187 abierto); no default |

---

## 5. Reglas que los tres sistemas refuerzan (y el board ya votó)

1. **Color = significado**, no decoración (Atlassian: no uses `accent` cuando hay semántica; board: monocromo salvo estado).
2. **Texto + color** en estados (Vercel #114 US12; Carbon support + text).
3. **Capas** wash → canvas → card (Carbon layering; Radix 1–3).
4. **CTA único saturado** por pantalla (Radix step 9; board “un rojo/acento una vez”).
5. **Inverse** solo en hero/bulk/chrome invertido (`--mo-hero`, `--mo-bulk`).

---

## 6. Mapa “si alguien pregunta en jerga ajena”

| Dicen… | En ModoOps light-app |
|---|---|
| `$layer-01` / Radix step 2 | `--mo-canvas` |
| `$text-secondary` / step 11 | `--mo-muted` |
| `$support-error` / `danger` | `--mo-danger` |
| `$background-brand` / `brand` / step 9 | `--mo-accent` |
| `$background-inverse` | `--mo-hero` |
| Radix step 6 | `--mo-line` |

---

## 7. Fuera de alcance

- Sustituir Fraunces/papel por Geist o Carbon Gray.
- Importar CSS de Radix/Carbon al bundle.
- Paleta Alegra `#00A86B` como accent (board: riesgo billetera); verde papel `#2f5d50` ya es la decisión humana #190.
- Medición AA pixel-a-pixel de cada par (dejar a checklist de prototipo / design-check).

---

## 8. Siguiente paso sugerido

**Hecho (2026-09-23):** G1–G3 en `light-app.css` — `--mo-ok` ≠ `--mo-accent` (papel `#1f6b45` vs `#2f5d50`); `--mo-focus`, `--mo-row-hover`, `--mo-line-strong`, `--mo-ok-soft`, `--mo-field`.
