# Checklist Webflow → Landing ModoOps (motion + componentes)

> **Fecha:** 2026-09-29 · **Rama:** `feat/landing-tema-papel-split`  
> **Referencia:** landing Webflow (Last Published Tue Sep 29 2026) — DevTools  
> **Nuestra base:** `web/src/pages/index.astro` + `web/src/layouts/BaseLayout.astro`  
> **Límites:** `web/AGENTS.md` (tema papel, sin glass decorativo, CTA `star-warm` + texto oscuro, `prefers-reduced-motion`)  
> **Brief previo:** `research/landing-2026/brief.md`  
> **Inventario:** completo (todas las secciones)

---

## A. Reconocer en la página referencia (DevTools)

### Shell / sistema
- [x] Comentario Webflow + `Last Published` (visto en captura)
- [x] Tokens CSS (`--colors--*`, `--typography--*`)
- [x] `page-wrapper` / flex layout
- [x] Fonts cargadas
- [x] Header: logo + CTA primario + menú

### Motion stack
- [x] `gsap.min.js` (v3.x)
- [x] `ScrollTrigger.min.js`
- [x] `SplitText.min.js`
- [x] Scripts al final del `<body>` / CDN

### Visuales / media
- [x] `three.min.js` + **Fluted glass**
- [x] **Inline video**
- [x] `swiper-bundle`

### UI de producto-en-la-landing
- [x] Card producto simulado
- [x] Overlay colaborativo (avatar + comentario)
- [x] Secciones feature: H2 + párrafo + visual
- [x] Selectores / sticky / dialogs

---

## B. Aplicar a ModoOps (mapa global)

| # | Componente referencia | En ModoOps hoy | Acción |
|---|---|---|---|
| 1 | Header + CTA | `SiteHeader` sticky + nav + login | Auditar CTA primario AA (`star-warm`); hoy CTA header = login ghost |
| 2 | Tokens tipografía/color | `light-app.css` + `data-theme="papel"` + tokens galaxy residuales en secciones | Unificar `--mo-*` vs `text-ash-gray` / `galaxy-card` |
| 3 | Feature block | Casi todas = heading + lista/cards texto | 2–3 con visual producto |
| 4 | Product UI fake | **Ninguna** | Hero y/o Contraste / Circuito / PuenteOficina |
| 5 | GSAP + ScrollTrigger | No | CSS/`animate` primero; GSAP solo si ≥2 scroll beats |
| 6 | SplitText | No | Opcional Hero/Path |
| 7 | Three / fluted glass | No | **Skip** (AGENTS) |
| 8 | Swiper | No | Opcional Solution (módulos); default skip |
| 9 | Inline video | No | Skip salvo Circuito/Hero con presupuesto |
| 10 | Dialogs / sticky | Header sticky + WhatsApp | Keep; no 2FA |
| 11 | Scripts / perf | Plausible + scroll_camino | No GSAP/Three globales |

### No copiar de Webflow
- Dark-only + glass/WebGL decorativo vs tema `papel`.
- Stack GSAP+Three+Swiper sin necesidad de contenido.
- Overlay de comentarios colaborativos.

---

## C. Tabla inventario (completo)

| # | Sección | Archivo | Variant | Tipo | Decisión | Prioridad visual |
|---|---|---|---|---|---|---|
| 0 | Shell | `BaseLayout` + `SiteHeader` | papel | chrome + CTA propuesta star-warm | **hecho** Ola 2 | media |
| 1 | Hero | `Hero.astro` | split + mock mostrador | **hecho** Ola 2 | **alta** |
| 2 | Problem | `Problem.astro` | linen | lista texto | keep | — |
| 3 | Ejemplo | `Ejemplo.astro` | white | copy + mock local | **hecho** Ola 3 | media |
| 4 | Contraste | `Contraste.astro` | dark | filas hoy/con + mini-UI | **hecho** Ola 1 | **alta** |
| 5 | Circuito | `Circuito.astro` | linen | flujo 5 nodos | **hecho** Ola 1 | **alta** |
| 6 | Solution | `Solution.astro` | white | grid + chips | **hecho** Ola 3 | media |
| 7 | PuenteOficina | `PuenteOficina.astro` | dark | CTA + preview chat | **hecho** Ola 1 | **alta** |
| 8 | Descubrimiento | `Descubrimiento.astro` | linen | agenda ol | keep | — |
| 9 | Migracion | `Migracion.astro` | white | texto solo | keep | — |
| 10 | Fiscal | `Fiscal.astro` | dark | texto solo | keep | — |
| 11 | Path | `Path.astro` | linen | timeline 3 pasos | **hecho** Ola 3 | baja |
| 12 | Audience | `Audience.astro` | white | sí/no 2 cols | keep | — |
| 13 | HowWeWork | `HowWeWork.astro` | linen | lista + id ancla | keep (+ id) | — |
| 14 | Despues | `Despues.astro` | white | texto solo | keep | — |
| 15 | Crecer | `Crecer.astro` | linen | texto solo | keep | — |
| 16 | Garantia | `Garantia.astro` | dark | texto solo | keep | — |
| 17 | Faq | `Faq.astro` | linen | accordion details | **hecho** Ola 3 | baja |
| 18 | Contact | `Contact.astro` | dark | 2 cards + CTA star-warm | **hecho** Ola 3 | media |

---

## D. Detalles por sección

### 0. Shell — `BaseLayout` + `SiteHeader`
- Sticky header, brand Fraunces, nav + login quieto + **CTA “Pedir propuesta”** (`star-warm` + tinta oscura).
- Plausible: `cta_propuesta` / `cta_login` desde header.
- **Decisión:** **hecho** Ola 2 (2026-09-29).

### 1. Hero — `Hero.astro`
- Split + **mock mostrador** (KPIs caja/tickets + chips) bajo el H1; panel CTAs intacto.
- Motion entrada CSS + `prefers-reduced-motion`.
- **Decisión:** **hecho** Ola 2 (2026-09-29).

### 2. Problem — `Problem.astro` · **inventariado**
- Linen + heading + pains + closing.
- **Decisión:** keep quieto (no mock Webflow).

### 3. Ejemplo — `Ejemplo.astro`
- White + mock local (cajas / Excel / WhatsApp) + signos con chips.
- **Decisión:** **hecho** Ola 3 (2026-09-29).

### 4. Contraste — `Contraste.astro`
- Dark + filas hoy vs con ModoOps con **mini-UI** (cuaderno/memoria/conteo/chat → ticket sistema).
- **Decisión:** **hecho** Ola 1 (2026-09-29).

### 5. Circuito — `Circuito.astro`
- Linen + flujo 5 nodos (Depósito→…→Factura) + conectores desktop; entrada CSS + reduced-motion.
- **Decisión:** **hecho** Ola 1 (2026-09-29).

### 6. Solution — `Solution.astro`
- White + grid módulos con **chips** semánticos.
- **Decisión:** **hecho** Ola 3 (2026-09-29).

### 7. PuenteOficina — `PuenteOficina.astro`
- Dark + CTA + **preview chat/borrador** (mensajes demo + chips).
- **Decisión:** **hecho** Ola 1 (2026-09-29).

### 8. Descubrimiento — `Descubrimiento.astro`
- Linen + agenda 3 días en cards.
- **Decisión:** keep (texto de oferta).

### 9. Migracion — `Migracion.astro`
- White + heading + detail.
- **Decisión:** keep.

### 10. Fiscal — `Fiscal.astro`
- Dark + heading + detail.
- **Decisión:** keep.

### 11. Path — `Path.astro`
- Linen + timeline numerada (star-warm) + conectores; Plausible.
- **Decisión:** **hecho** Ola 3 (2026-09-29).

### 12. Audience — `Audience.astro`
- White + sí/no.
- **Decisión:** keep.

### 13. HowWeWork — `HowWeWork.astro`
- Linen + lista; `id="como-trabajamos"`.
- **Decisión:** keep (+ ancla Ola 3).

### 14. Despues — `Despues.astro`
- White + texto.
- **Decisión:** keep.

### 15. Crecer — `Crecer.astro`
- Linen + texto.
- **Decisión:** keep.

### 16. Garantia — `Garantia.astro`
- Dark + texto.
- **Decisión:** keep.

### 17. Faq — `Faq.astro`
- Linen + `<details>` accordion nativo + foco visible.
- **Decisión:** **hecho** Ola 3 (2026-09-29).

### 18. Contact — `Contact.astro`
- Dark + email CTA `star-warm` + tinta oscura; WhatsApp ghost.
- **Decisión:** **hecho** Ola 3 (2026-09-29).

---

## E. Plan de implementación (post-inventario)

### Ola 1 — Producto en escena (máx. 3)
1. **Contraste** — UI hoy/con por fila · **hecho**
2. **Circuito** — diagrama de flujo · **hecho**
3. **PuenteOficina** — preview chat/borrador · **hecho**  

### Ola 2 — Hero + shell
4. **Hero** — mock ancla + motion entrada mínima · **hecho**
5. **SiteHeader** — CTA comercial primario AA (`star-warm`) · **hecho**  
   También alineado `Button` primary + burbuja user en PuenteOficina.  

### Ola 3 — Pulido
6. **Ejemplo** / **Solution** / **Path** — visual leve · **hecho**
7. Unificar tokens en secciones tocadas (`--mo-*` / star-warm) · **hecho** (parcial; quedan galaxy-card en keep)
8. Motion global sutil + `prefers-reduced-motion` · **hecho** donde aplica (Path/Circuito/Hero/Puente)
9. **Faq** accordion · **Contact** AA · **hecho**

### Explicit skip
- Three.js / fluted glass / Swiper global / SplitText masivo / overlay comentarios Webflow / video full-bleed 1er viewport

---

## F. Estado del documento

| Hito | Estado |
|---|---|
| Checklist ref Webflow | hecho |
| Inventario todas las secciones | hecho |
| OK humano Ola 1 | hecho |
| Implementación Ola 1 | **hecho** |
| Implementación Ola 2 | **hecho** |
| Implementación Ola 3 | **hecho** |

**Siguiente paso:** review visual en browser (`localhost:3001`) o commit si cerramos.
