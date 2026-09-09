---
name: portal-visual-polish
description: Iterative visual polish loop for the ModoOps onboarding portal Three.js office scene. Use when the user wants to raise the visual quality of the oficina portal page, oficina-scene, or the hero scene step by step with screenshots until a defined visual bar is met.
---

# Portal Visual Polish

Lleva la oficina 3D del portal de onboarding de "cajas de ensayo" a "producto visual" **iterando**: un ítem del checklist por vez, con screenshot que lo demuestre. Nada se da por hecho sin evidencia visual.

## Alcance (lo que sí / lo que no)

- **Sí**: `web/src/scripts/oficina-scene.ts`, `web/src/pages/oficina.astro`, estilos y accesibilidad de la página del portal.
- **No**: `web/src/lib/oficina-mapping.ts` es contrato (ticket 01 done + suite 35/35). Si un ítem exige cambiar su interfaz, **parar y preguntar** — no romper el seam.
- Marca blanca siempre: solo Módulos ModoOps, ningún precio como oferta, nada crea Tenant.

## Gate GitNexus (obligatorio, 1 call)

Antes de editar cualquier símbolo: `impact({target, direction: "upstream", summaryOnly: true})`. Si devuelve `HIGH`/`CRITICAL`/`UNKNOWN`, avisar al usuario antes de tocar. Al terminar, `detect_changes({scope: "all"})`.

## Fuentes (leer la del ítem antes de implementarlo)

Ante conflicto, manda el precedente interno + el spec. Lo externo es guía, no ley.

**Precedente interno (primero):**
- `web/src/scripts/nebula-scene.ts` — mount/cleanup canónico: `ResizeObserver`, `matchMedia reduced-motion`, `dataset.mounted`, dispose explícito de cada recurso.
- `web/src/components/sections/PathNebula.astro` — wiring Astro: import estático del mount + cleanup en `astro:before-swap` y `pagehide`.
- `docs/specs/0010-portal-onboarding-3d-spec.md` — decisiones vinculantes: presupuesto ~700 KB gzip, fallback 2D paritario, `prefers-reduced-motion`, marca blanca, validación real solo en Configurador.
- `web/src/lib/oficina-mapping.ts` — contrato; leer para no romperlo, nunca para cambiarlo.

**Doc oficial Three.js (vendida en `reference/`, fuente `mrdoob/three.js@dev/manual/pages/`):**
- Leer con `read` **solo el capítulo del ítem en curso** (son HTML del manual, el artículo está en el body). No leer los 7 de una vez.
- Mapa ítem → capítulo:
  1. pausa → `reference/rendering-on-demand.html` (renderizar solo cuando algo cambia + `setAnimationLoop(null)` para pausar).
  2. luz → `reference/shadows.html` (qué luz proyecta, `castShadow`/`receiveShadow`, tamaño del shadow map) + `reference/color-management.html` (`ACESFilmicToneMapping` + `outputColorSpace`, ya usado en `nebula-scene.ts:131`).
  3. muebles → `reference/align-html-elements-to-3d.html` (carteles HTML alineados a posiciones 3D: la forma barata y legible de nombrar cada módulo) + `reference/picking.html` (raycast oficial; comparar con el nuestro en `oficina-scene.ts:112`); controles → `three/addons/controls/OrbitControls.js` vía `three/addons/` (re-verificar el supuesto "pruning r185" de `oficina-scene.ts:3` antes de descartarlo).
  4. móvil → `reference/responsive.html` (clamp `setPixelRatio(min(devicePixelRatio, 2))`, resize por contenedor — ya en `oficina-scene.ts:140`).
  6. reduced-motion → precedente nebula + `reference/rendering-on-demand.html`: un solo `renderer.render()` y nada de `requestAnimationFrame`.
  7. presupuesto → `reference/responsive.html` + guía Astro (abajo); disposal → `reference/how-to-dispose-of-objects.html` (el cleanup debe cubrir geometrías, materiales, texturas y renderer; plantilla: `nebula-scene.ts:197`).
- Resto del manual online: `https://threejs.org/manual/` (es SPA: si el fetch falla, usar websearch dirigido). Capítulos no vendidos pero útiles: *lights*, *materials*, *scenegraph*, *optimize-lots-of-objects*.

**Guías externas verificadas (2026-09-08):**
- Astro + Three como isla sin SSR: `https://threejsresources.com/frameworks/three-js-astro` (el equivalente nuestro es vanilla `<script>` + `dynamic import()`, sin `client:`).
- Lazy-load 3D (IO + import dinámico + 3 pitfalls: render antes de assets, texturas full-res en móvil, loop corriendo off-screen): `https://svilenkovic.com/3d/how-to-lazy-load-3d-scene`.
- Scripts Astro procesados por Vite con tree-shaking + guard de doble init en view-transitions: `https://arijitk.in/posts/panorama-viewer-code-walkthrough/`.
- Ítem 5 (teclado) no es tema Three.js: el modelo es la variante B (hotspots = botones HTML reales) — espejar los 6 objetos como botones.

## La vara visual (el loop termina cuando todo está verde)

1. **Pausa fuera de pantalla** — el loop no renderiza cuando el canvas sale del viewport.
2. **Luz creíble** — sombras activas + `ACESFilmicToneMapping`, sin quemar blancos.
3. **Muebles, no cajas** — a 1280px cada objeto se reconoce (mostrador, estantería con niveles, monitor encendido, pizarrón, puerta); nombre del módulo legible.
4. **Móvil 390px** — escena usable, ficha legible, sin scroll horizontal.
5. **Teclado** — Tab recorre los 6 objetos, Enter abre la ficha.
6. **Movimiento reducido** — con `prefers-reduced-motion`, un frame fijo (sin loop).
7. **Presupuesto** — escena diferida al viewport, cero Three.js en SSR, fallback 2D funcional sin WebGL.
8. **Sin regresión lógica** — `vitest run web/src/lib/oficina-mapping.test.ts` verde.

## El loop (un ítem por iteración)

1. Elegir el primer ítem en rojo. Leer su fuente (sección Fuentes) antes de tocar código. Crear todo con `todowrite` y marcar `in_progress` de a uno.
2. Implementar el cambio mínimo que lo ponga en verde.
3. Verificar, en orden:
   - `npx vitest run src/lib/oficina-mapping.test.ts` desde `web/` (seam intacto).
   - Dev server arriba (`npm run dev -- --port 4321`); si no responde, levantarlo.
   - Screenshots con Playwright (setup una sola vez: `npx -y playwright install chromium --only-shell` — avisar que descarga ~150MB):
      `npx playwright screenshot --viewport-size="1280,800" --wait-for-timeout=4000 "http://127.0.0.1:4321/oficina" <tmp>/oficina-<item>-desktop.png`
     y lo mismo a `390,844` para móvil. Guardar en el temp pre-aprobado, nunca en el repo.
   - **Leer la imagen con `read`** y juzgar contra el ítem. Sin imagen, el ítem sigue rojo.
4. Registrar el veredicto (verde/rojo + qué se ve) en el todo y seguir al siguiente ítem.
5. Límite: **máximo 3 pasadas por ítem**. Si no llega a verde, marcarlo `Pendiente tu OK` con el screenshot como evidencia y continuar.

## Cierre

Panel único: **Hecho** (ítems verdes + screenshots) / **Pendiente tu OK** (rojos con evidencia). Preguntar al usuario (`question`) si sigue iterando un rojo, acepta el nivel actual, o archiva. Nunca commitear sin `detect_changes` limpio; nunca promocionar prototype a ruta real (eso es ticket 03, otro esfuerzo).
