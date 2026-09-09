# ModoOps web — reglas de interfaz para agentes

Fuente: Vercel Web Interface Guidelines adaptadas a ES-AR (decisiones #112, spec #114, slices S1–S6). Esta guía manda sobre el gusto del modelo: ante la duda, obedecerla y auditar lo generado.

## MUST (no entregar sin esto)

- Todo flujo operable por teclado; foco `:focus-visible` siempre visible (regla global, no redefinir).
- Cada control con `<label>`; errores junto al campo, con foco y anuncio (`aria-live` / `role="alert"`).
- Transiciones con propiedades explícitas; NEVER `transition-all`.
- Respetar `prefers-reduced-motion` (el guard global existe; no animar `blur` jamás).
- Estado en la URL (filtros, tabs, variantes, objeto) para compartir y refrescar.
- Copy ES-AR con voseo; precio en USD sin mezclar monedas en la misma vista; marca `ModoOps` con `translate="no"`.
- Contraste WCAG AA medido en textos críticos (4.5 texto normal); APCA solo informativo.

## SHOULD

- Bordes crisp sutiles; NEVER sombras por capas ni glassmorphism decorativo (glass solo estático en chrome UI).
- Dark-galaxia vigente (tokens del stylesheet mandan; el doc solo blanquea). Nada de superficies claras nuevas.
- Radios hijo ≤ padre y concéntricos; hits ≥24px (44px mobile); `touch-action: manipulation`.
- Inputs a 16px con `type` / `inputmode` / `autocomplete` correctos; NEVER bloquear pegado ni typing.
- `scroll-margin-top` en anclas; `theme-color` + `color-scheme` ya globales (no duplicar).
- `Intl es-AR` para moneda/fecha; `&nbsp;` en unidades y teléfonos; `…` en vez de `...`.
- CTA primario: fondo `star-warm` OBLIGATORIAMENTE con texto oscuro (4.78:1; en blanco falla AA).

## NEVER

- `transition-all`, focos invisibles, Title Case inglés, `&` por `y`, placeholders en inglés.
- UI que solo funciona con mouse (todo gesto necesita alternativa teclado/lista).
- Precios ARS sueltos en web (ARS solo a pedido del cliente, con tipo de cambio, según glosario).
- Nuevos tokens que dupliquen la paleta; el drift se reporta, no se esconde.
