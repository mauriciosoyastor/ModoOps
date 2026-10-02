# 001 — Entrada del pane «Con» desde Hoy

- **Status**: DONE
- **Commit**: 8037114
- **Severity**: LOW
- **Category**: Missed opportunities (explanation)
- **Estimated scope**: 2 files, ~20 lines

## Problem

En la landing, cada fila de Contraste muestra el estado analógico («Hoy») y el estado del sistema («Con ModoOps») al mismo tiempo, sin puente. El prospecto ve la sección una sola vez; el movimiento que falta es explicación, no decoración.

El pane «Con» está en `web/src/components/sections/Contraste.astro:59` y no tiene `data-lp-enter`. El observer de entrada ya existe y no hay que tocarlo: `web/src/layouts/BaseLayout.astro:94-96` llama `initLandingEnter()`, que marca `.is-in` una sola vez en cada `[data-lp-enter]` (`web/src/scripts/landing-enter.ts:18-50`).

La receta compartida, que este plan extiende y no reemplaza, está en `web/src/styles/landing-enter.css:5-17`:

```css
/* web/src/styles/landing-enter.css:5 — current */
html.lp-enter-js [data-lp-enter] {
  opacity: 0;
  transform: translateY(6px);
  transition:
    opacity 280ms var(--mo-ease-out),
    transform 280ms var(--mo-ease-out);
  transition-delay: var(--lp-enter-delay, 0ms);
}

html.lp-enter-js [data-lp-enter].is-in {
  opacity: 1;
  transform: none;
}
```

`--mo-ease-out` ya vale `cubic-bezier(0.23, 1, 0.32, 1)` en `web/src/styles/light-app.css:37`. No declares otra curva.

El markup actual del pane «Con» (`web/src/components/sections/Contraste.astro:59`):

```astro
<div class="cx-pane cx-pane--con" aria-label="Con ModoOps">
```

El callback del map ya recibe el índice `i` (`Contraste.astro:25`).

## Target

Solo el pane «Con» entra. «Hoy», la flecha y los mocks quedan quietos.

Dirección: el estado nuevo sale del estado viejo.

- Bajo `720px` los panes se apilan (`.cx-row` es una columna hasta el media de `Contraste.astro:112`). «Con» está debajo de «Hoy», así que arranca en `translateY(-6px)`.
- Desde `720px` «Con» está a la derecha. Arranca en `translateX(-6px)` (corrido hacia Hoy) y se asienta en `transform: none`.
- Distancia `6px`, la misma que `landing-enter.css:7`. No uses `8px`, ni `translateX(100%)`, ni `scale(0)`.

Tiempos, en el elemento, vía `--lp-enter-delay`:

- Fila `i`: `160 + i * 40` milisegundos. La primera espera `160ms` para que «Hoy» se lea antes. El paso entre filas es `40ms` (el mismo stagger que `Circuito.astro:21`).
- Duración: `280ms` en `opacity` y `transform`, con `var(--mo-ease-out)`.

Sin JS (`html` sin `.lp-enter-js`) el pane sigue visible. Eso ya lo garantiza el selector existente; no lo rompas.

Reduced motion (el bloque de `landing-enter.css:19-29` tiene que seguir ganando por orden de fuente): sin desplazamiento, opacidad `120ms`, `transition-delay: 0ms`.

```css
/* web/src/styles/landing-enter.css — target, insertar DESPUÉS de la regla .is-in
   y ANTES de @media (prefers-reduced-motion: reduce) */
html.lp-enter-js [data-lp-enter="from-hoy"] {
  transform: translateY(-6px);
}

@media (min-width: 720px) {
  html.lp-enter-js [data-lp-enter="from-hoy"] {
    transform: translateX(-6px);
  }
}
```

No hace falta una regla `.is-in` extra: `html.lp-enter-js [data-lp-enter].is-in { transform: none }` ya cubre este atributo.

Markup target en el pane «Con»:

```astro
<div
  class="cx-pane cx-pane--con"
  aria-label="Con ModoOps"
  data-lp-enter="from-hoy"
  style={`--lp-enter-delay: ${160 + i * 40}ms`}
>
```

## Repo conventions to follow

- Un solo observer. Los nodos declaran `data-lp-enter` y `--lp-enter-delay`. El CSS vive en `web/src/styles/landing-enter.css`. Ejemplar: `web/src/components/sections/Circuito.astro:21`.

```astro
<li class="ci-step" data-lp-enter style={`--lp-enter-delay: ${i * 40}ms`}>
```

- Easing: `var(--mo-ease-out)`, nunca un cubic-bezier nuevo y nunca `ease-in`.
- Propiedades animables: `opacity` y `transform` nada más. Prohibido `transition: all`.
- `filter: blur(2px)` en `.cx-mock__blur` (`Contraste.astro:211-215`) es un estilo estático. No lo animes. El reduced-motion de ese blur (`Contraste.astro:289-294`) se deja como está.

## Steps

1. En `web/src/styles/landing-enter.css`, después del bloque `html.lp-enter-js [data-lp-enter].is-in` (líneas 14-17) y antes de `@media (prefers-reduced-motion: reduce)` (línea 19), insertá exactamente el CSS de Target. No muevas el media de reduced-motion: tiene que quedar último para que `transform: none` gane sobre `from-hoy` cuando las dos media queries matchean (especificidad empatada: un elemento + una clase + un atributo).
2. En `web/src/components/sections/Contraste.astro`, en el `div` de la línea 59 (`class="cx-pane cx-pane--con"`), agregá `data-lp-enter="from-hoy"` y `style={`--lp-enter-delay: ${160 + i * 40}ms`}`. No cambies clases, `aria-label`, ni el contenido del pane.
3. No edites `landing-enter.ts` ni su test. El query es `[data-lp-enter]`; el valor `from-hoy` no cambia el JS.

## Boundaries

- No toques `web/src/scripts/landing-enter.ts`, `web/src/scripts/landing-enter.test.ts`, `web/src/layouts/BaseLayout.astro`, `Circuito.astro`, el hero, ni `web/src/data/business.ts`.
- No animes `.cx-pane--hoy`, `.cx-arrow`, ni `.cx-mock__blur`.
- No agregues `@keyframes`, librerías de motion, ni un segundo `IntersectionObserver`.
- No cambies la regla base `translateY(6px)` / `280ms` de `[data-lp-enter]` sin valor.
- Si el `div.cx-pane--con` o el orden de `landing-enter.css` no coinciden con este plan (drift desde `8037114`), pará y reportá. No improvises.

## Verification

- **Mechanical**: desde `web/`, `npx vitest run src/scripts/landing-enter.test.ts`. Los 4 tests existentes pasan. No se espera un test nuevo.
- **Feel check**: `npm run dev` en `web/`, abrir `/#contraste`.
  - Desktop (≥720px): «Hoy» y la flecha no se mueven. «Con» aparece un pelo desde la izquierda (`6px`) y se asienta. En el panel Animations de DevTools, playback al 10%: se ve `translateX(-6px)` → `none`, opacidad `0` → `1`, `280ms`, curva `--mo-ease-out`.
  - La fila 0 espera `160ms`; cada fila siguiente suma `40ms`. El stagger no bloquea scroll ni clicks.
  - Mobile (&lt;720px): el mismo pane entra desde arriba (`translateY(-6px)`), no desde la derecha.
  - Scrollear fuera y volver no reinicia la animación: el observer hace `unobserve` al marcar `.is-in`.
  - Rendering → `prefers-reduced-motion: reduce`: no hay desplazamiento; queda un fade de opacidad de `120ms` sin delay. El blur del mock «memoria» sigue apagado por la regla que ya existe.
  - Con JS deshabilitado, los panes «Con» se ven de entrada (sin `html.lp-enter-js`).
- **Done when**: el único nodo nuevo con `data-lp-enter` en Contraste es el pane «Con», el CSS de `from-hoy` está antes del media de reduced-motion, y el feel check de arriba se cumple en los dos anchos.
