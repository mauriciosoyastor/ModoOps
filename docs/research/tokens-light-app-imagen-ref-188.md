# Research — Tokens light-app desde la imagen ref (deltas vs sistema vigente)

> **Ticket:** #188 (parte de #187) · **Fecha:** 2026-09-22 · **Autor:** agente research (Muse Spark)
> **Pregunta:** ¿Qué tokens trae la imagen de referencia y qué deltas implican contra nuestros tokens vigentes?
> **Mapa padre:** #187 (dirección light-app locked para Control Plane + Shell, 4 votos 2026-09-22)
> **Restricción dura (#187 Notes):** landing sigue dark-galaxia — decisión A solo reabierta para app.

---

## 1. Resumen ejecutivo (TL;DR)

La imagen ref es un **dashboard light operativo** (rail iconos, search, KPI fila con hero negro + 2 claras, filtros fecha/funnel + export CSV, barras funnel, heatmap por canal, tabla transactions). Sus tokens **no existen hoy en el stylesheet**: el sistema vigente es **dark-galaxia completo** (`global.css:4-39`, `color-scheme: dark` en `global.css:44`).

**Deltas gruesos:** fondo claro (`#fbfbf9`-like / `#fff`) vs fondo `#000`; tinta oscura sobre claro vs `star-white #f3ecf2` sobre negro; **acento verde nuevo** (sin token vigente — el único acento es `star-warm #c05a42`); hero negro como **excepción**, no como base; radios chicos operativos (8–12px) vs pill 80px / cards 20px; tabla densa tabular vs bandas landing 50px.

**¿Qué contradice A?** Todo lo light contradice la **letra** de la decisión A (dark-galaxia vigente, "nada de superficies claras nuevas" en `web/AGENTS.md`), pero **no su alcance actual**: el voto 1 del 2026-09-22 (`.scratch/…/09-board-visual-2026.md:27-28`) reabre A **solo para app** (Control Plane + Shell). Landing sigue dark — ahí A queda intacta. Ver §5.

**Limitación honesta:** la imagen vive en el hilo del issue, no en archivo del repo — no hay hex medido con eyedropper. Los valores light se reconstruyen por inspección visual descrita en el ticket + patrones ya votados del board (`research/board-visual-2026/`). Donde doy un hex, es el del patrón board citado, no un sample de la imagen.

---

## 2. Tokens extraídos de la imagen ref (reconstrucción)

### 2.1 Paleta light

| Rol en imagen | Valor reconstruido | Fuente del valor |
|---|---|---|
| Page wash (fondo app) | `#fbfbf9`-like / `#f7f8fb` | Patrón votado `pinterest.md:213` (light operativo gana); `S5` Frost `#f7f8fb` (`pinterest.md:123`); `S2` page wash `#fbfbf9` (`pinterest.md:92`) |
| Canvas (cards/tabla) | `#ffffff` | `S2` canvas `#ffffff` (`pinterest.md:92`); `S5` canvas `#ffffff` (`pinterest.md:123`) |
| Card secundaria | `#f6f6f3`-like | `S2` card `#f6f6f3` (`pinterest.md:92`); P2 "gris `#f6f6f3`-like" (`pinterest.md:33`) |
| Tinta primaria | `#211922` / `#13151b` / `#000` | `S2` tinta `#211922`/`#000` (`pinterest.md:92`); `S5` Ink `#000`, Charcoal `#13151b` (`pinterest.md:123`) |
| Tinta secundaria / bordes | grises cálidos `#e5e5e0`-like, Ash `#777d90` | `S4` Linen `#e5e5e0` (`pinterest.md:112`); `S5` Ash `#777d90`, Fog `#9fa5ba` (`pinterest.md:123`) |
| **Acento verde** (barras, heatmap, deltas +) | familia `#00A86B` (Alegra) / éxito `#02a745` (Refero) | `gestion-2026.md:81` (verde Alegra para crear/cobrar); `pinterest.md:123` (semántico éxito `#02a745`) — **sin token vigente equivalente** |
| **Hero negro** (KPI principal) | `#000` / Charcoal `#13151b`, texto claro encima | `S5` CTA pill negro `#000` sobre blanco (`pinterest.md:125`); patrón "un solo bloque oscuro como excepción" (no base) |
| Semánticos (heatmap / estados) | verde éxito + ámbar `#7c4b01` + rojo `#a10214` | `S5` error `#a10214` / warning `#7c4b01` / éxito `#02a745` (`pinterest.md:123`); regla "color = estado, nunca solo color" (`tokens.md:31`, `superficies.md:10`) |

### 2.2 Radios

| Uso en imagen | Valor | Fuente |
|---|---|---|
| Cards / KPI / tabla / inputs | **8–12px** (operativo) | P1 "radios 8–12px en tablas" (`pinterest.md:25`); T3 densa (`pinterest.md:177-179`) |
| CTA / export / pill pequeño | pill 9999px solo en botones | `S2` "radios solo 16px / 32px / pill" (`pinterest.md:94`); `S4` "pills 9999px" (`pinterest.md:114`) |
| Disciplina | **2–3 radios, no 5** | `S2` "RESTRICCIÓN (un rojo, dos radios)" (`pinterest.md:97`) |

Vigente: pill **80px** botones / cards **20px** / nav 16px (`DESIGN.md:63-65`, `tokens.md:19`, `global.css:36-37`).

### 2.3 Tipografía

Inter (única fuente vigente, `global.css:24`) + **tabulares para números** (`tabular-nums`, KPI/tabla/heatmap alineados derecha). Fuente board: S1 "tabular-nums para números" (`pinterest.md:81`); S7 "números tabulares en tablas" (`pinterest.md:144`); T1 "números der tabulares" (`pinterest.md:158`); T2 "números der" (`pinterest.md:169`). Escala vigente display 48 → body-sm 14 (`global.css:26-32`, `DESIGN.md:43-51`) se reutiliza; la imagen no pide display marketing (rechazo explícito P5: "si parece una landing, descartalo", `pinterest.md:71`).

### 2.4 Densidades por zona (imagen)

| Zona imagen | Patrón | Fuente board |
|---|---|---|
| KPI fila (hero negro + 2 claras) | 1 sola fila, veredicto arriba-izq, resto quieto | P2 "KPI fila + tabla debajo, veredicto arriba-izq" (`pinterest.md:37`); `superficies.md:10` (veredicto mora arriba-izq) |
| Barras funnel | barras monocromo + **un acento** (verde), sin neón | S1 "todo es monocromo salvo el estado" (`pinterest.md:86`); S4 "el rojo aparece UNA vez por pantalla" (`pinterest.md:117`) |
| Heatmap por canal | color = estado + texto (nunca solo color) | `tokens.md:31`; `componentes.md:18` (prohibido color solo sin texto); T3 "estado = dot + label" (`pinterest.md:178`) |
| Tabla transactions | full-width densa, header sticky, texto izq / números der tabulares, "showing X of Y", filtros facetados + URL, row actions 1–2 + overflow | T1 (`pinterest.md:160`), T2 (`pinterest.md:170`), T3 (`pinterest.md:178-179`); `superficies.md:10`; `componentes.md:17` |
| Filtros fecha/funnel + export CSV | chips removibles + clear-all + URL compartible; export 1 clic | `superficies.md:10` (filtros reversibles con URL); `gestion-2026.md:53` (export Excel/PDF en 1 clic); Odoo "export muestra solo campos visibles" (`gestion-2026.md:24`) |
| Rail iconos + search | sidebar angosto + header fino + content tabla full-width; search inline | P1 "sidebar angosto + header fino" (`pinterest.md:26`); S7 shell admin (`pinterest.md:146`); R1 "search inline con sugerencias" (`pinterest.md:194`) |

---

## 3. Tabla de deltas "imagen vs sistema vigente"

| # | Dimensión | Imagen ref (light-app) | Sistema vigente | Delta / acción |
|---|---|---|---|---|
| 1 | Fondo base | claro `#fbfbf9`/`#fff` | `space-void #000000` (`global.css:5,82`) | **Nuevo theme app**; `color-scheme: dark` (`global.css:44`) no sirve en app |
| 2 | Tinta base | oscura `#211922`/`#13151b` sobre claro | `star-white #f3ecf2` sobre negro (`global.css:81`) | Invertir par texto/fondo solo en app |
| 3 | Bandas `linen`/`white` | claras reales | **oscuras** (`Section.astro:11-15`: linen→`bg-space-mist`, white→`bg-galaxy-deep`) | Drift documentado (`componentes.md:13`); app necesita variante clara real nueva |
| 4 | Acento | **verde** (`#00A86B`-fam / `#02a745`) | único acento `star-warm #c05a42` + texto oscuro (`global.css:98`, `Button.astro:17`) | **Color nuevo** — choca con NEVER "nuevos tokens que dupliquen paleta" (`web/AGENTS.md`); decidir: verde semántico solo-estado vs warm |
| 5 | Hero negro | excepción (1 card `#000`) | negro = **base** (hero, footer, body) | Invertir rol: claro base + negro quirúrgico |
| 6 | Radios | 8–12px operativo | pill 80px / cards 20px (`global.css:36-37`) | Nuevo radio chico o reuso nav 16px (`DESIGN.md:65`); prohibido "5 radios" (S2) |
| 7 | Ghost-light | borde oscuro + tinta oscura | borde `nebula` + **texto claro** (`Button.astro:19`) — invisible sobre fondo claro | Requiere variante light real |
| 8 | Bordes | línea gris fina (`#e5e5e0`-like), inset-ring, sin sombra | `galaxy-card`: borde nebula 32% + fill deep 72% + `blur(10px)` (`global.css:132-136`) | Glass/blur decorativo prohibido en app (S5 "una línea gris fina alcanza") |
| 9 | Densidad | tabla densa = pantalla, compact/comfortable conmutable (T1) | ritmo landing: section 50px, element 12px (`global.css:34-35`) | Tokens densidad operativa 8–12px zona primaria (`superficies.md:16`) |
| 10 | Números | tabulares derecha | sin `tabular-nums` en stylesheet | Agregar (board unánime T1/T2/S1/S7) |
| 11 | Filtros/estado URL | estado en URL (filtros, tabs) | MUST "estado en la URL" (`web/AGENTS.md`) | **Sin delta** — ya exigido, aplicar en app |
| 12 | Contraste | medir tinta-sobre-claro + verde-sobre-claro (AA 4.5) | AA medido: warm+texto oscuro 4.78; blanco-sobre-warm prohibido (`global.css:93-97`) | Re-medir paleta light; verde `#02a745` sobre blanco ≈ 3.3 — solo gráfico grande/estado+texto, nunca cuerpo crítico |
| 13 | Dark en app | override/setting, no default (Square R2) | dark = default único | Decisión abierta #187 ("dark como override/setting en app (Square lo pone como setting)") — `pinterest.md:202-205` |

---

## 4. Qué NO cambia (la imagen confirma lo vigente)

- **Inter única fuente**, escala display→body-sm, `text-wrap: balance` en titulares (`global.css:24-32,71-75`).
- **Tabla-first, color = estado + texto, filtros con URL, "showing X of Y", confirm en destructivas** (`superficies.md:10-11`, `componentes.md:17`).
- **Foco `:focus-visible` global, teclado full (Enter abre detalle), `prefers-reduced-motion`, ES-AR voseo, USD sin mezclar** (`web/AGENTS.md` MUST).
- **Motion quieta** (micro 100ms → large 350ms, `global.css:116-121`); POS "quietud" (`superficies.md:6`).
- **Un solo acento saturado + resto monocromo cálido** (S2, `pinterest.md:95`) — la pelea es *cuál* acento en app (verde-estado vs warm-marca), no cuántos.

---

## 5. ¿Qué contradice la decisión A? (respuesta al ticket)

**Decisión A** (`.scratch/sistema-diseno-modoops-impl/issues/01-tema-blanquear-docs.md:9`, 2026-09-16): **mantener dark-galaxia**; blanquea `docs/DESIGN.md:7-10`, `web/AGENTS.md` ("Dark-galaxia vigente… Nada de superficies claras nuevas"), `color-scheme: dark`, Section linen/white oscuras, CTA warm+oscuro.

**Contradicciones literales de la dirección light-app contra A** (todas scoped a app por el voto 1):

1. **Fondos claros** — viola "nada de superficies claras nuevas" (`web/AGENTS.md`) y `componentes.md:13` ("no crear variante clara nueva sin decisión de spec"). Esta research + #187 **son** esa decisión de spec.
2. **Acento verde nuevo** — viola NEVER "nuevos tokens que dupliquen la paleta; el drift se reporta, no se esconde" (`web/AGENTS.md`). Se reporta aquí (§3 fila 4): sin token vigente equivalente.
3. **`color-scheme: dark` global** (`global.css:44`) — la app light necesita scheme light (o por-superficie).
4. **`ghost-light` actual inservible en claro** (`Button.astro:19`, texto `canvas-white`) — pide variante nueva.
5. **Glass deep+blur** (`.galaxy-card`, `hero-content-scrim`) — en app light rige "una línea gris fina alcanza" (S5), glass solo estático en chrome (`DESIGN.md:112`).
6. **Tensión honesta ya registrada** (`09-board-visual-2026.md:36-39`): "Holded es fondo claro y nuestra decisión A fijó dark-galaxia… si al aplicarlos el claro pide pista en superficies operativas, **se reabre A solo para app (landing sigue dark), no se revierte a escondidas**". El voto 1 (2026-09-22) ejecutó esa reapertura.

**Lo que NO contradice A:** nada de landing. `docs/DESIGN.md` §§ hero/bandas/componentes, `Section.astro`, `Button.astro`, CTA warm+oscuro y `color-scheme: dark` siguen mandando en landing/marketing. La reapertura es **solo Control Plane + Shell** (#187 Out of scope: "Landing y marketing (siguen dark; decisión A intacta ahí)").

**Gates para la implementación:** `tools/design-check/check.js` en verde + AA medido en la paleta light (tinta y verde re-medidos, no heredados del 4.78 warm) + excepción allowlist con motivo por cada token nuevo (spec `.scratch/sistema-diseno-modoops/spec.md:28,111-115`).

---

## 6. Referencias primarias (claim → source)

- Ticket research: `https://github.com/mauriciosoyastor/ModoOps/issues/188` (pregunta + imagen en hilo, no en archivo).
- Mapa padre: `https://github.com/mauriciosoyastor/ModoOps/issues/187` (destino, restricción dura landing-dark, 4 votos, out of scope).
- Decisión A: `.scratch/sistema-diseno-modoops-impl/issues/01-tema-blanquear-docs.md:9` (dark-galaxia 2026-09-16, resolved).
- Reapertura solo-app + 4 votos: `.scratch/sistema-diseno-modoops-impl/issues/09-board-visual-2026.md:25-39` (2026-09-22).
- Tokens vigentes: `web/src/styles/global.css:3-39` (paleta), `:44` (color-scheme dark), `:81-83` (body), `:92-122` (marca/motion); `docs/DESIGN.md:7-10,25-65`; `docs/design-system/tokens.md:1-31`.
- Reglas agente: `web/AGENTS.md` (MUST/SHOULD/NEVER, dark-galaxia, CTA warm+oscuro, anti-drift).
- Drift Section/Button: `web/src/components/ui/Section.astro:11-15`, `web/src/components/ui/Button.astro:16-20,29-35`; documentado en `docs/design-system/README.md:13-15`, `docs/design-system/componentes.md:9-18`.
- Superficies: `docs/design-system/superficies.md:8-16` (Control Plane table-first, Shell POS 2 col, densidades).
- Board light: `research/board-visual-2026/pinterest.md:92,112,123,144,158,160,170,178,194,202-205,213` (S2/S4/S5 hex, T1/T2/T3 tablas, R1/R2 POS, Square dark-setting, patrón light operativo).
- Board gestión: `research/board-visual-2026/gestion-2026.md:24,53,81` (export visibles, export 1 clic, verde Alegra).
- Spec/checklist: `.scratch/sistema-diseno-modoops/spec.md:100-115` (autoridad stylesheet, tokens, fail-closed); `docs/design-system/README.md:5-11` (orden autoridad).
- Glosario (Control Plane / Shell / Tenant / marca blanca): `CONTEXT.md:51-58,257-264`.

*Fin — siguiente: #187 pasa a to-spec/to-tickets con esta tabla como input de tokens; no se cierra ni comenta el issue (lo hace el dueño).*
