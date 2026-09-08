# Research #110 — Gap Vercel Web Interface Guidelines vs DESIGN.md ModoOps

- **Ticket:** #110 (mapa #109) · **Branch:** `research/gap-vercel-110` · **Fecha:** 2026-09-08
- **Fuentes primarias:**
  - https://vercel.com/design/guidelines (lista viva: Interactions / Animations / Layout / Content / Forms / Performance / Design + Copy Vercel-specific + Integrate with Agents)
  - https://github.com/vercel-labs/web-interface-guidelines — `README.md` (mismo contenido que la página) + `AGENTS.md` (versión MUST/SHOULD/NEVER, ej. Keyboard: MUST full keyboard APG; Targets: hit ≥24px/mobile ≥44px; Animation: NEVER `transition: all`; Forms: MUST errors inline + focus first error)
  - Locales: `docs/DESIGN.md:1`, `web/src/styles/global.css:1`, `web/src/pages/index.astro:1`, `web/src/components/sections/Hero.astro:1`, `web/src/components/sections/Contact.astro:1`, `web/src/layouts/BaseLayout.astro:1`, `web/src/components/ui/Button.astro:1`, `web/src/components/ui/Section.astro:1`, `web/src/data/business.ts:1`, `web/src/lib/oficina-mapping.ts:1`, `CONTEXT.md:51` (marca blanca, Shell Astro BFF + Liquid Glass, Odoo no en marketing)

## 1. Tabla por sección

### Interactions

| Regla Vercel | Aplica directo a web/ (Astro 5 + Tailwind v4) | Choque con DESIGN.md:104-108 / Liquid Glass v2 | Veredicto |
|---|---|---|---|
| Keyboard everywhere + focus `:focus-visible` / `:focus-within`, sticky nunca tapa foco (AGENTS.md Keyboard) | SÍ. Landing hoy no tiene focus ring visible: `Button.astro:13-20` solo `transition-all hover:opacity-90`, sin `focus-visible`. `SiteHeader`/nav por hash (`business.ts:157-160`) necesitan skip-link + foco gestionado. Bajo costo en Tailwind (`focus-visible:ring-2`). | Sin choque. DESIGN.md:96-101 exige contraste AA en textos críticos — el focus ring lo refuerza. | **Adoptar** (top-10 #1) |
| Hit targets ≥24px / 44px mobile, `touch-action: manipulation`, tap-highlight | SÍ. `Button.astro:14` (`px-6 py-4`) ya cumple; pero links chicos de hero `Hero.astro:28-30` ("Ir a mi panel", `text-sm` + underline) y `Contact.astro:18-32` necesitan hit ≥24px + `touch-action`. Una línea en `global.css:41-58` (`@layer base`). | Sin choque. | **Adoptar** (top-10 #2) |
| Mobile input ≥16px, NEVER disable zoom | SÍ directo. `BaseLayout.astro:18` ya usa `width=device-width, initial-scale=1` (sin `maximum-scale=1`) — conforme. Portal onboarding (formularios `oficina-mapping.ts:91-141` Prospecto/Fichas) debe fijar `text-base` (16px) en inputs. | Sin choque. | **Adoptar** en portal (top-10 #7) |
| URL as state / deep-link everything, scroll restore | SÍ parcial. Landing es one-page por hashes (`index.astro:17-25`, nav `#camino/#contacto` en `business.ts:157`); falta `scroll-margin-top` en secciones y título dinámico. Portal 3D (`oficina-mapping.ts:12-27` seam Objeto3D↔módulo + `borradorV1:74-85`) DEBE deep-linkear objeto seleccionado (`?objeto=gondola-3d`) para share/refresh. | Sin choque. | **Adoptar** (top-10 #5) |
| Loading buttons + min-duration 150-300ms, optimistic + undo, confirm destructive | SÍ para portal/futuro BFF. Landing actual no tiene mutations salvo Plausible (`Hero.astro:34-47`, `BaseLayout.astro:37-58`); el portal (guardar borrador `oficina-mapping.ts:187-213` localStorage) debe aplicar loading+undo al pasar a POST <500ms. | Sin choque. | Adoptar en portal, no landing |
| `overscroll-behavior: contain` en modals/drawers, `inert` durante drag, gestos con alternativa tap/teclado, announce `aria-live` | SÍ para portal 3D: la escena Three.js (`web/src/scripts/oficina-scene.ts`, `web/src/pages/prototype/`) es drag-heavy → exige alternativa click/teclado por objeto + `aria-live` en selección + `inert` durante drag. | Tensión leve: Liquid Glass v2 (`global.css:60-77`) no define patrones de drag; no choca, solo falta. | **Adoptar** para portal (top-10 #8) |

### Animations

| Regla Vercel | Aplica directo | Choque | Veredicto |
|---|---|---|---|
| Honor `prefers-reduced-motion`; CSS > WAAPI > JS; solo `transform/opacity`; NEVER `transition: all`; interruptible; autoplay >5s con controles | SÍ, de alto valor. Hoy: `global.css:43` (`scroll-behavior: smooth` sin media query), `Button.astro:14` (`transition-all` = viola NEVER `transition: all`), `Hero.astro:13,18` usa `drop-shadow` pesado. Portal 3D es el mayor riesgo (Three.js main-thread). | Sin choque con DESIGN.md:104-108 (no prohíbe animar). Choque potencial con Liquid Glass si el blur (`galaxy-card:80-84` `backdrop-filter: blur(10px)`) se anima — NO animar blur. | **Adoptar** (top-10 #3): `prefers-reduced-motion` + `transition-colors` explícito + solo transform/opacity |
| Easing según sujeto, `transform-origin` correcto, SVG `<g>` + `transform-box: fill-box` | SÍ barato. Icono WhatsApp inline `Contact.astro:28-29` es SVG sin animación hoy; si se anima, aplicar wrapper `<g>`. | Sin choque. | Adoptar cuando haya animación |

### Layout

| Regla Vercel | Aplica directo | Choque | Veredicto |
|---|---|---|---|
| Optical ±1px, deliberate alignment, lockups icono+texto, responsive mobile/laptop/ultra-wide, safe areas, no scrollbars espurios, flex/grid sobre JS | SÍ. `Section.astro:28-30` (shell `px-6 md:px-10`, `max-w-[var(--width-content)]`) y `DESIGN.md:52-58` (content 1120px, gaps) ya van en la línea "deliberate alignment". Faltan: `env(safe-area-inset-*)` (FloatingWhatsApp), verificación ultra-wide, `min-w-0` en flex children (AGENTS.md Content Handling). | Sin choque. | **Adoptar** (top-10 #6 parcial: safe-area + scrollbars + `min-w-0`) |
| Let the browser size things | SÍ. Ya se cumple (flex/grid en `Hero.astro:6,22`, `Contact.astro:13`). Mantener; portal no debe medir layout en JS. | Sin choque. | Mantener |

### Content / A11y

| Regla Vercel | Aplica directo | Choque | Veredicto |
|---|---|---|---|
| Inline help first; skeletons estables; `<title>` contextual; no dead ends; empty/sparse/dense/error; `tabular-nums`; status redundante (no solo color); icon-only con `aria-label`; semántica antes que ARIA; `h1-h6` + skip link; `translate="no"`; `&nbsp;` unidades | SÍ, mayor gap de la landing. Estado actual: `index.astro:12-13` title/description estáticos (ok landing, falta en portal/app); `Contact.astro:37-44` lista "Qué incluir" es buen inline-help (alinear con Vercel); sin skip-link (`BaseLayout.astro:60-64` va directo a `SiteHeader`); sin `aria-label` en CTAs iconográficos; `business.ts:11` (`+54 9 354 753-2008`) y precios sin `&nbsp;`; marca `ModoOps` sin `translate="no"`. | Sin choque con DESIGN.md. Copy ES-AR: comillas tipográficas (“ ”) y `…` (U+2026) aplican igual en ES. | **Adoptar** (top-10 #4, #9): skip-link + headings + `aria-label` + `tabular-nums` + `translate="no"` + `&nbsp;` |
| `scroll-margin-top` en headings con anclas | SÍ directo. Nav por hash (`business.ts:157-160` `#camino/#contacto`) + header sticky: sin `scroll-margin-top` el título queda tapado. Una regla en `global.css`. | Sin choque. | **Adoptar** (top-10 #5 con URL-state) |
| Locale-aware formats (`Intl.*`), idioma por `Accept-Language`/`navigator.languages`, nunca IP/GPS | SÍ para portal + copy. Hoy `business.ts:63-72` mezcla formato precio (`$52 USD`, `$155.000` en `DESIGN.md:92` con punto miles AR) y `html lang="es-AR"` (`BaseLayout.astro:15`) correcto. Portal debe formatear moneda/fecha con `Intl.NumberFormat('es-AR')`. | Tensión ES vs EN (ver Copy): Vercel Title Case/`&`/placeholders EN no se copian literal. | Adoptar `Intl` + `es-AR` (top-10 #9) |

### Forms

| Regla Vercel (AGENTS.md Forms) | Aplica directo | Choque | Veredicto |
|---|---|---|---|
| Labels everywhere + activación; Enter submit / ⌘+Enter en textarea; no pre-deshabilitar submit; no bloquear typing; errores inline + foco primer error; `autocomplete`+`name`+`type`+`inputmode`; spellcheck selectivo; placeholders `…` + ejemplo; unsaved-changes; password-managers; trim; sin dead zones; `<select>` con bg/color explícitos | Landing hoy NO tiene `<form>` (contacto es mailto/WhatsApp `Contact.astro:18-32`) → aplica al **portal onboarding** (`oficina-mapping.ts:91-141` Prospecto: nombre/contacto/teléfono/email/rubro/sucursales/cajas/usuarios). `validarBorrador:163-170` valida post-submit (bien, no pre-deshabilita) pero errores son `string[]` sin foco inline — hay que llevarlos a campo + `aria-live`. | Sin choque con DESIGN.md. Ojo `DESIGN.md:92` precio `$155.000` vs canónico USD `CONTEXT.md:23` ($155 USD): el form debe mostrar USD + nota ARS, no mezclar. | **Adoptar** en portal (top-10 #7) |
| Hydration-safe inputs, don't block paste | SÍ Astro: usar islas solo donde hay estado; inputs no pierden valor al hidratar. Portal guarda en localStorage (`oficina-mapping.ts:187-213`) — hidratar con `defaultValue`, nunca `value` sin `onChange`. | Sin choque. | Adoptar en portal |

### Performance

| Regla Vercel | Aplica directo | Choque | Veredicto |
|---|---|---|---|
| Matrix iOS Low Power + Safari; medir sin extensiones; throttle CPU/red; batch layout; mutations <500ms; inputs no controlados caros; virtualizar >50; preload above-fold + lazy resto; CLS con dimensiones; `preconnect`; fonts preload+subset+`swap`; video > GIF + `prefers-reduced-motion` | SÍ, adaptado a Astro (no React: "track re-renders" no aplica; equivale: minimizar JS hidratado, islas parciales). Estado actual: `BaseLayout.astro:26-31` ya hace `preconnect` fonts + `display=swap` (conforme); Plausible `<2KB` (`BaseLayout.astro:32-33`) conforme; falta: `fetchpriority`/dims explícitas en hero, `content-visibility: auto` en secciones bajo fold, `subset` Inter (carga `400;500;600` completa), fallback still para escena 3D. | Sin choque. | **Adoptar** selectivo (top-10 #6): dims + lazy + `content-visibility` + font-subset |
| Portal 3D budgets (INP, virtualización leads, video vs gif) | Abierto en #109 "Not yet specified". Three.js (`oficina-scene.ts`) debe correr en worker/cap FPS + fallback 2D (`oficina-mapping.ts:1-3` ya prevé variante 2D/recorrido). | Sin choque con DESIGN.md; Liquid Glass blur es costo GPU — medir en Low Power. | Dejar a spec portal (desbloquea #112) |

### Design (choques reales)

| Regla Vercel | Aplica directo | Choque con DESIGN.md:104-108 / Liquid Glass v2 | Veredicto |
|---|---|---|---|
| **Layered shadows** (SHOULD, ambient+direct ≥2 capas) | NO directo. `DESIGN.md:106` prohíbe "sombras fuertes o glassmorphism". | **CHOQUE FRONTAL.** Además `Hero.astro:13,18` usa `drop-shadow-[0_2px_24px...]` pesado que ya bordea la prohibición. | **NO adoptar** layered shadows. Sustituir por `Crisp borders` (ver abajo). Registrar excepción en spec #112 |
| **Crisp borders** (semi-transparent border + shadow sutil) | SÍ adaptado. `galaxy-card:80-84` (`border nebula-cyan 32%` + fill 72%) y `Contact.astro:45,52` (`border-nebula-cyan/15`) ya hacen borde semi-transparente. | Compatible si la "shadow" se reduce a `0 1px 0 rgba(0,0,0,.15)` o nada. No viola `DESIGN.md:106` si no hay blur-sombra fuerte. | **Adoptar** como sustituto de layered shadows (top-10 #10) |
| **Nested radii** (hijo ≤ padre, concéntrico) | SÍ. Tokens `DESIGN.md:56-58` (pill 80px, cards 20px, nav 16px) + `global.css:36-37` (`--radius-button:5rem`, `--radius-card:1.25rem`) ya los fijan. Auditar `Contact.astro:14,37` (`rounded-[var(--radius-card)]` + botones pill dentro — pill dentro de card 20px rompe concentricidad; aceptar como excepción o usar radio 12px en botones dentro de cards). | Sin choque. | Adoptar (lint visual) |
| **Hue consistency** (bordes/sombras/texto hacia el hue del bg) | SÍ. `global.css:70-72` (`--sg-glass-border` mezclado con `nebula-cyan 28%`) y `70-71` fills al 72/84% ya lo implementan. | Tensión: `DESIGN.md:13,28` ("sin franja / no gradiente", Trust Slate solo acento) vs paleta galaxia real (`global.css:4-15` galaxy/nebula/star-warm) que **ya diverge** de los tokens DESIGN.md (`midnight #000` vs `canvas #f3ecf2` como "white", `soft-linen #101020` oscuro vs `#f5f5f5` claro en `DESIGN.md:25-27`). El drift existe y hay que blanquearlo en #112. | Adoptar, y resolver drift en #112 |
| **Minimum contrast: prefer APCA over WCAG 2** | Parcial. `DESIGN.md:101` exige WCAG AA en textos críticos y prohíbe ash-gray en CTAs. Vercel pide APCA (más perceptual). | **CHOQUE DE NORMA, no de valor.** Cambiar el contrato a APCA rompería `DESIGN.md:101`. | **NO cambiar norma**: mantener WCAG AA como gate; usar APCA solo como check informativo. Registrar en #112 |
| **Interactions increase contrast** (`:hover/:active/:focus` más contraste) | SÍ. `Button.astro:17-19` (`hover:bg-star-glow`, `hover:border-canvas-white`) ya sube contraste en hover; falta `:focus-visible` equivalente. | Sin choque; refuerza AA. | **Adoptar** (con #1) |
| **`theme-color` + `color-scheme: dark`** | SÍ. Landing es dark-first real (`global.css:50-51` body `star-white` sobre `space-void`; `Section.astro:11-15` todas las variantes con `text-canvas-white`, incluso "white" = `bg-galaxy-deep`). Falta `<meta name="theme-color" content="#000000">` y `color-scheme: dark` en `<html>`. | **CHOQUE APARENTE con `DESIGN.md:107`** ("dark mode completo no; solo hero+footer oscuros"): el código actual ya es dark en TODAS las secciones (`Section.astro:11-15`, `Contact.astro:10` `variant="dark"`), contradiciendo la tabla de superficies `DESIGN.md:64-73` (linen/white alternados). Hay que decidir en #112 si DESIGN.md manda (aclarar secciones) o si el dark-galaxia actual se blanquea como nuevo sistema. | Adoptar `theme-color`+`color-scheme` (top-10 #10); elevar contradicción a #112 |
| **Text anti-aliasing / animar wrapper, `translateZ(0)`** | SÍ si hay animación de texto. Hoy no hay; si el hero anima, animar wrapper, no el `h1` (`Hero.astro:12-16`). | Sin choque. | Guía, no acción |
| **Avoid gradient banding** | SÍ. `Hero.astro:7` (`hero-content-scrim` `global.css:86-93` gradiente 88%/55%/70% negro) + `DESIGN.md:105` (no neon) + `DESIGN.md:13` (sin gradiente sci-fi): el scrim es funcional (legibilidad sobre imagen), no decorativo — aceptable, pero vigilar banding en darks con `background-image` si aparece. | Compatible como excepción funcional. | Mantener scrim, vigilar banding |

### Copy (Vercel-specific — mayor adaptación ES-AR)

| Regla Vercel | Aplica directo | Choque / adaptación | Veredicto |
|---|---|---|---|
| Title Case en headings/buttons; `&` sobre `and`; active voice; 2ª persona; conciso; placeholders `YOUR_API_TOKEN_HERE`/`0123456789`; numerales; moneda 0 ó 2 decimales sin mezclar; `10 MB` con `&nbsp;`; positive language; errores con salida | Parcial. Lo universal (voz activa, 2ª persona, conciso, sustantivos consistentes del glosario `CONTEXT.md`, errores con salida, numerales) aplica directo al ES-AR (`business.ts:76-77` "Tu operación, en modo." es buen ejemplo). Lo EN-específico NO: Title Case no existe en ES (usar oración + mayúscula inicial), `&` → `y` (salvo marca), placeholders en ES (`TU_TOKEN_AQUI`), moneda USD canónico `CONTEXT.md:11-12` con formato `Intl es-AR` y sin mezclar (`DESIGN.md:92` `$155.000` debe pasar a `$155 USD` + nota ARS). | **CHOQUE EN vs ES.** | **Adoptar** versión ES-AR (top-10 #9): guía copy ES (oración, `y`, `Vos`, `Intl es-AR`, `&nbsp;`, `…`, «»/“ ”) |

## 2. Top-10 reglas a adoptar (con file:line)

1. **Focus visible + skip-link + headings jerárquicos** — `web/src/components/ui/Button.astro:13-20` (sin focus), `web/src/layouts/BaseLayout.astro:60-64` (sin skip-link), `web/src/pages/index.astro:17-25` (un `h1` en `Hero.astro:12`). [Interactions/Copy]
2. **`touch-action: manipulation` + hit ≥24/44px + tap-highlight** — base en `web/src/styles/global.css:41-58`, auditar links chicos `Hero.astro:28-30`, `Contact.astro:18-32`. [Interactions]
3. **Motion: `prefers-reduced-motion` + NEVER `transition: all` + solo transform/opacity** — `global.css:43` (smooth sin guard), `Button.astro:14` (`transition-all` → `transition-colors`), no animar `backdrop-blur` de `global.css:80-84`. [Animations]
4. **A11y contenido: `aria-label` icon-only, `aria-live` validaciones, `tabular-nums`, redundancia no-color** — `Contact.astro:28-32` (svg `aria-hidden` sin label en link), `oficina-mapping.ts:163-170` (errores sin canal). [Content]
5. **URL-state + `scroll-margin-top` + títulos** — `business.ts:157-160` (hashes), `index.astro:17-25` (secciones sin scroll-margin), `oficina-mapping.ts:74-85` (borrador sin deep-link `?objeto=`). [Interactions/Content]
6. **Perf Astro: dims explícitas + lazy bajo fold + `content-visibility` + subset Inter + `preconnect` ya ok** — `BaseLayout.astro:26-31` (base ok, falta subset), `Hero.astro:7` (hero eager/`fetchpriority`), secciones bajo fold diferidas. [Performance]
7. **Forms portal (no landing): labels, Enter/⌘+Enter, sin pre-disable, errores inline + foco, `autocomplete`/`type`/`inputmode`, `text-base` 16px, trim, unsaved, `defaultValue`** — `oficina-mapping.ts:91-141` (Prospecto/Fichas), `163-170` (errores), `187-213` (persistencia). [Forms]
8. **Portal 3D: gestos con alternativa click/teclado + `overscroll contain` + `inert` en drag + `aria-live` selección** — `web/src/scripts/oficina-scene.ts`, `web/src/pages/prototype/`, seam `oficina-mapping.ts:12-27`. [Interactions]
9. **Copy ES-AR + `Intl es-AR` + `translate="no"` + `&nbsp;` + `…`/“ ”** — `business.ts:1-78` (copy + `+54 9...:11` sin `&nbsp;`), `BaseLayout.astro:15` (`es-AR` ok), `DESIGN.md:92` (`$155.000` → `$155 USD`), `CONTEXT.md:11-12` (USD canónico). [Copy/Content]
10. **Design compatible: crisp-borders sí / layered-shadows no + `theme-color`/`color-scheme` + nested-radii + hue-consistency** — `global.css:70-84` (borders ok), `DESIGN.md:104-108` (no-glass/no-shadows/dark-solo-hero+footer como límite), `Section.astro:11-15` (dark-real vs tabla `DESIGN.md:64-73`). [Design]

## 3. Choques que debe resolver #112 (decisión visual)

- **D1. Sombras:** Vercel SHOULD layered-shadows vs `DESIGN.md:106` no-glass/no-shadows. Propuesta: NO adoptar; crisp-borders sutiles como techo (`Contact.astro:45,52`).
- **D2. Dark total vs parcial:** `DESIGN.md:64-73,107` (linen/white + dark solo hero/footer) vs realidad dark-galaxia (`global.css:50-51`, `Section.astro:11-15`). Propuesta: blanquear dark-galaxia como sistema vigente O aclarar secciones a linen/white.
- **D3. Tokens drift:** `DESIGN.md:22-28` (`canvas #fff`, `linen #f5f5f5`) vs `global.css:18-22` (`canvas #f3ecf2`, `linen #101020` oscuro). Propuesta: remapear `@theme` a DESIGN.md o enmendar DESIGN.md.
- **D4. Contraste:** WCAG AA (`DESIGN.md:101`) se mantiene como gate; APCA solo informativo.
- **D5. Copy EN→ES:** Title Case/`&`/placeholders no se copian; guía ES-AR propia.
- **D6. Liquid Glass v2 alcance:** chrome UI del portal SÍ (cards/bordes/blur estático `global.css:60-84`); escena 3D NOромpe reglas (motion/perf/a11y mandan); Odoo nativa fuera (decisión #109).
- **D7. Precio público:** `DESIGN.md:92` `$155.000` vs `CONTEXT.md:23-24` `$155 USD` — unificar a USD en web.

## 4. Qué NO adoptar

- Layered shadows (D1), APCA como gate (D4), Title Case/`&` EN (D5), `track re-renders` React (traducir a islas Astro), `maximum-scale=1` (prohibido), `transition: all`, animar blur, `div onClick` para navegar, bloquear paste/typing, pre-deshabilitar submit.
