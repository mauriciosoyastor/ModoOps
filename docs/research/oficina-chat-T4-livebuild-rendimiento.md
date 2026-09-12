# T4 — Live-build 3D: rendimiento y patrones (research)

**Ticket:** `.scratch/oficina-chat-3d-whatsapp/issues/T4-livebuild-rendimiento.md:1`
**Mapa:** `docs/plans/wayfinder-oficina-chat-3d-whatsapp.md:39`
**Rama:** `research/oficina-chat-livebuild` (throwaway, desde `main@12cd88b`; nada a `main`)
**Fecha:** 2026-09-09 · **Skill:** `research` (fuentes primarias, sin secundarios)

**Pregunta T4:** ¿qué patrón de escena (reúso de `oficina-scene.ts`: lazy, resize, cleanup, sin islands),
presupuesto (~700 KB gzip, LCP/CLS), estado en URL y alternativa teclado/lista exige el live-build
chat→3D según `web/AGENTS.md` y el precedente del portal?

## 1. Respuesta corta (para T2)

- **Reutilizar `mountOficinaScene` tal cual como montaje, pero hay que extender su handle.**
  Hoy solo expone `cleanup` y el callback `onPick` (`web/src/scripts/oficina-scene.ts:19-23`);
  `resaltar()` y `seleccionado` son internos (`oficina-scene.ts:104-114,195`).
  El live-build chat→3D (responder marca/construye objeto en vivo) necesita una API programática
  tipo `setResaltado(id)` / `setConstruidos(ids)` sobre el mismo mount — T2 la diseña, no este ticket.
- **Lazy ya resuelto en el precedente, copiarlo:** `IntersectionObserver` con `rootMargin: 200px` +
  `await import('../scripts/oficina-scene')` solo al entrar a viewport, con `io.disconnect()` tras el
  primer intersect (`web/src/pages/oficina.astro:622-644`). Three.js (`three@^0.185.0`,
  `web/package.json:11-15`) nunca toca SSR: vive solo dentro de `<script>` cliente con import diferido
  (`docs/specs/0010-portal-onboarding-3d-spec.md:44`).
- **Cleanup ya resuelto, copiarlo:** `pagehide` + `astro:before-swap` con `{ once: true }`
  (`oficina.astro:633-634`) → cleanup que desconecta `IntersectionObserver`/`ResizeObserver`,
  cancela `requestAnimationFrame`, `controls.dispose()`, vacía carteles, remueve listeners,
  `geometry/material.dispose()`, `renderer.dispose()`, borra `dataset.mounted`
  (`oficina-scene.ts:315-334`). Sin framework islands: Astro + un `<script>` plano, sin estado reactivo
  (`docs/specs/0010-portal-onboarding-3d-spec.md:40`; `oficina.astro:612-657` es JS vanilla).
- **Presupuesto:** ~700 KB gzip, escena 100% cliente, cero SSR, `prefers-reduced-motion` respetado,
  fallback 2D paritario (`0010-portal-onboarding-3d-spec.md:44`; historias 6/7/17/18 en líneas 20,21,31,32).
- **Estado en URL obligatorio:** `?variant=chat` (nueva variante del conmutador `?variant=` existente:
  A→B→C en `0010-portal-onboarding-3d-spec.md:43`) + `?objeto=<id>` deep-link ya implementado con
  `history.replaceState` en `irAFicha` (`oficina.astro:590-595`) e hidratación al abrir
  (`oficina.astro:649-656`). `web/AGENTS.md:11` lo exige (filtros, tabs, variantes, objeto).
- **A11y teclado/lista obligatoria:** todo gesto 3D necesita alternativa teclado/lista
  (`web/AGENTS.md:28` NEVER "UI que solo funciona con mouse"). El precedente ya trae el patrón:
  `data-hero-fallback` (botones por objeto, `oficina.astro:64-74`) + `<details>` "Elegir objeto sin 3D
  (teclado)" (`oficina.astro:78-87`). El chat→3D debe escalar ese patrón, no inventar otro.
- **Seam intocable:** `web/src/lib/oficina-mapping.ts:1-3` es el seam único Objeto3D↔Módulo.
  El live-build lee `OBJETO_A_MODULO` (`oficina-mapping.ts:20-27`), `OBJETO_LABEL`
  (`oficina-mapping.ts:29-36`), `borradorV1`/`construirBorrador` (`:74-85,:144-156`),
  `validarBorrador` (`:163-170`), `CLAVE_BORRADOR = 'modoops.borrador.v1'` + `guardar/cargarBorrador`
  (`:174-213`). La validación dura vive en el Configurador, nunca en el browser (`:2-3`).

## 2. Patrón escena a reutilizar (línea por línea)

| Pieza | Dónde | Qué copiar en `?variant=chat` |
|---|---|---|
| Firma mount | `oficina-scene.ts:19-23` | `mountOficinaScene(canvas, onPick, etiquetas?) => cleanup`. T2 añade highlight programático sin romper esta firma. |
| Renderer contenido | `oficina-scene.ts:25-35` | `pixelRatio min(dpr,2)`, 1 sola direccional con sombras 2048 + `PCFSoft` + `ACESFilmic`. Presupuesto de luces ya acotado. |
| Raycast click vs drag | `oficina-scene.ts:234-254` | Threshold 6px, sube por padres hasta `userData.objeto`. Dirección actual: 3D→ficha (`onPick → irAFicha`). Falta la inversa (chat→3D). |
| Carteles HTML | `oficina-scene.ts:174-212` | `OBJETO_LABEL` proyectado por frame, oculto si `proy.z >= 1` o fuera de canvas. Barato y legible; reutilizar para "marca en vivo". |
| Controles | `oficina-scene.ts:214-223` | `OrbitControls`, `enablePan: false`, distancia 6–16, polar clamp. Táctil nativo incluido. |
| Resize | `oficina-scene.ts:262-272` | `ResizeObserver` sobre el contenedor; `h = clamp(w*0.62, 300, 480)`. |
| Loop on-demand | `oficina-scene.ts:277-312` | `programa()` solo si `aLaVista && !reduced`; `IntersectionObserver` pausa fuera de pantalla; con `reduced` un `foto()` fijo por evento (`controls change`). |
| Reduced motion | `oficina-scene.ts:258,287-291,311` | `matchMedia('(prefers-reduced-motion: reduce)')`. Sin loop, sin flotación (`:296`). `web/AGENTS.md:10` lo exige; historias 7 (`0010:21`). |
| Lazy mount | `oficina.astro:622-644` | IO `rootMargin: 200px`, `dynamic import`, `try/catch → fallback 2D` (`heroFallback.hidden = false`, mensaje "Sin WebGL…"). |
| Cleanup wiring | `oficina.astro:633-634` + `oficina-scene.ts:315-334` | `pagehide` + `astro:before-swap` → dispose total. |

**Sin islands:** no hay componentes framework con hidratación parcial; es Astro estático + un
`<script>` vanilla (`oficina.astro:612-657`). El live-build debe seguir así (chat DOM + escena en el
mismo script o dos scripts coordinados por el seam, sin isla reactiva).

## 3. Presupuesto ~700 KB gzip + LCP/CLS

- **Fuente:** `0010-portal-onboarding-3d-spec.md:44` (presupuesto ~700 KB gzip, reserva de layout
  contra CLS, LCP no bloqueado) e historias 17/18 (`0010:31-32`).
- **Estado actual verificado:**
  - Three.js solo vía `import * as THREE from 'three'` + `three/addons/controls/OrbitControls.js`
    (`oficina-scene.ts:4-5`); dependencia `three@^0.185.0` (`web/package.json:14`). No hay evidencia de
    pruning por módulos — el presupuesto se juega en el bundle diferido, no en el HTML inicial.
  - LCP protegido por diferido: el `await import` corre tras intersect con 200px de margen, y el
    `catch` garantiza LCP aunque falle WebGL (`oficina.astro:623-641`).
  - **Riesgo CLS abierto:** el `<canvas>` no declara `width/height` ni `aspect-ratio` en el markup
    (`oficina.astro:57-62`); la altura la impone `resize()` en JS (`oficina-scene.ts:263-264`).
    Antes del primer `resize()` el layout puede saltar. Recomendación para T2: reservar con CSS
    (`aspect-ratio: ~1/0.62; min-height: 300px`) coherente con `clamp(w*0.62, 300, 480)`.
  - **Split chat/3D y lazy:** en desktop el panel 3D nace visible → el IO dispara de inmediato; el
    diferido sigue valiendo (no bloquea LCP) pero el peso cae igual al abrir `?variant=chat`.
    Medir con build real + gzip antes de cerrar T2 (nota de entorno: `node_modules` parcial y build
    que colgaba en `0010:74` — reinstalar antes de medir).
- **Regla para T2:** nada de Three.js en SSR ni en el chunk inicial; todo lo 3D detrás del mismo
  `await import`; el chat y el borrador vivo deben funcionar aunque el 3D aún no cargó o falló
  (fallback 2D paritario, `0010:20` historia 6).

## 4. Estado en URL

- `web/AGENTS.md:11` MUST: "Estado en la URL (filtros, tabs, variantes, objeto) para compartir y refrescar".
- Precedente: `?variant=` conmuta A→B→C (`0010:43`); `?objeto=` deep-linkea ("el objeto vive en
  `?objeto=` para compartir y refrescar", `oficina.astro:589`) vía `history.replaceState`
  (`oficina.astro:591-595`) con lectura inicial (`oficina.astro:649-656`).
- Para `?variant=chat` T2 debe definir además qué estado del chat vive en URL (mínimo: `variant` +
  `objeto`; abierto si paso/pregunta/respuestas — ver "Not yet specified" del mapa). No se propone
  esquema aquí: lo decide T2 con el guion de T1 (`wayfinder-oficina-chat-3d-whatsapp.md:29-31`).

## 5. A11y teclado/lista (exigido, no opcional)

`web/AGENTS.md` aplicable al live-build:

- MUST `web/AGENTS.md:7-13`: todo flujo por teclado + `:focus-visible` visible; cada control con
  `<label>`; errores con foco y `aria-live`/`role="alert"`; transiciones con propiedades explícitas
  (NEVER `transition-all`); `prefers-reduced-motion`; estado en URL; voseo ES-AR; CTA `star-warm` con
  texto oscuro; contraste AA 4.5.
- NEVER `web/AGENTS.md:27-28`: `transition-all`, focos invisibles, y — crítico para T4 —
  "UI que solo funciona con mouse (todo gesto necesita alternativa teclado/lista)".
- Precedente listo para escalar:
  - Canvas con `aria-label` + `aria-describedby="hero-ayuda"` (`oficina.astro:60-61`) y párrafo de
    ayuda/estado (`oficina.astro:75-77`).
  - Fallback 2D con un botón por objeto (`oficina.astro:64-74`) + `<details>` de teclado
    (`oficina.astro:78-87`) — ese es el patrón "lista alternativa".
  - Formularios del portal ya usan `<label>` + `type/inputmode/autocomplete` correctos
    (ej. `oficina.astro:91-101`), como pide `web/AGENTS.md:20`.
- **Gaps detectados (para T2, no bloquean T4):**
  1. `data-hero-estado` es un `<p>` plano (`oficina.astro:75`); para anunciar "objeto marcado en
     vivo" conviene `aria-live="polite"` (el MUST lo prevé para errores/anuncios).
  2. `scrollIntoView({ behavior: 'smooth' })` en `irAFicha` (`oficina.astro:607`) debería respetar
     `prefers-reduced-motion` (usar `auto` con reduced).
  3. Los carteles 3D son `aria-hidden` (`oficina.astro:63`) — correcto, pero entonces la lista/botones
     es la única vía lectora: no puede perderse en `?variant=chat`.

## 6. Seam `oficina-mapping.ts` (leer, no duplicar)

- Tabla + constructor + validación mínima + persistencia, todo en un archivo
  (`oficina-mapping.ts:1-3,20-27,74-85,144-170,174-213`).
- `ANCLA` incluye siempre-incluidos (`contactos`, `plataforma`, `puente_factura`, `:38-47`); la puerta
  "crecer" solo ofrece futuros (`PUERTA_FUTURO`, `:50-55`) — el chat en lenguaje comerciante (T1) debe
  respetar esa partición.
- Tests existentes cubren el seam sin browser/WebGL (`oficina-mapping.test.ts:49-112`): mapping contra
  universo del catálogo, partición ancla/futuros + horas + `vinculante: false`, validación mínima,
  persistencia corrupta→`null` y SSR-safe (`null`→`false`/`null`). El live-build se testea ahí, no en 3D.

## 7. Lo que T2 necesita y hoy no existe (handoff, no solución)

1. **Highlight/construcción programática:** exponer desde `mountOficinaScene` (o un wrapper) algo como
   `setResaltado(id | null)` reutilizando `resaltar()` interno (`oficina-scene.ts:104-114`) y, si el
   diseño T1/T2 pide "construir", `setVisibles(ids)` sobre `raices` (`:65-67`). Mantener firma y cleanup.
2. **Bidireccionalidad:** hoy solo 3D→chat (`onPick → irAFicha`, `oficina.astro:628-631`); falta
   chat→3D (responder → marcar objeto + mover cámara o cartel). Definir si el click en objeto abre su
   pregunta (mapa Q3, `wayfinder-oficina-chat-3d-whatsapp.md:12,31`) con el guion T1.
3. **Medición:** bundle gzip real de la ruta `?variant=chat` vs presupuesto ~700 KB; LCP/CLS con y sin
   WebGL; reserva de layout (punto 3).
4. **URL del chat:** qué parte del progreso vive en URL además de `variant`/`objeto` (mapa: T2,
   `wayfinder-oficina-chat-3d-whatsapp.md:31`).
5. **Anuncio en vivo:** `aria-live` para "objeto marcado" (gap 1 del punto 5).

## Fuentes (primarias, por afirmación)

- Escena: `web/src/scripts/oficina-scene.ts:4-5,19-23,25-35,104-114,174-223,234-254,258-272,277-334`.
- Montaje lazy/cleanup/fallback: `web/src/pages/oficina.astro:57-87,589-595,622-644,649-656`.
- Seam: `web/src/lib/oficina-mapping.ts:1-3,20-36,38-55,74-85,144-170,174-213`;
  tests `web/src/lib/oficina-mapping.test.ts:49-112`.
- Presupuesto/robustez/variantes: `docs/specs/0010-portal-onboarding-3d-spec.md:40-44,50-56`
  (historias `0010:20,21,31,32`; entorno `0010:74`).
- Reglas UI: `web/AGENTS.md:7-13,20,27-28`.
- Mapa y tickets: `docs/plans/wayfinder-oficina-chat-3d-whatsapp.md:12-16,29-31,39`;
  `.scratch/oficina-chat-3d-whatsapp/issues/T4-livebuild-rendimiento.md:1-9`.
- Deps 3D: `web/package.json:11-15`.
