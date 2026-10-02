---
name: tema-papel
description: Pasa el Tema papel y cierra la ruta con la auditoría ya aplicada en login, Control Plane y la lista de Leads.
disable-model-invocation: true
---

# Tema papel

Router. No inventa paleta ni cromado. Aplica el sistema que ya usan la landing, el login y el Control Plane.

**Manda** [`web/AGENTS.md`](../../../web/AGENTS.md). Tokens y clases viven en `web/src/styles/light-app.css`. El layout de marketing ya los importa. Referencia de producto: `web/src/pages/admin/tenants.astro`, `web/src/pages/admin/leads.astro` y `web/src/pages/login.astro`.

## Steps

1. Clasificá la ruta.
   - **Producto:** admin, login, shell, gestor, captación.
   - **Marketing:** landing y cara pública.
   - Done cuando la ruta tiene una sola clase.

2. Montá el layout de esa clase.
   - Producto: `LightAppLayout` con `theme="papel"` y las clases que ya usa el Control Plane (`app-bar`, `mo-btn`, `mo-table`, `mo-panel`, `mo-pill`, `mo-badge`, `mo-field`, `mo-dialog`, `mo-banner`, `mo-empty`). Confirmaciones con `web/src/scripts/light-app-chrome.ts`.
  - Marketing: `BaseLayout` y el chrome público (header, hero, secciones). Ese layout ya importa `light-app.css`: de ahí salen los tokens. En marketing no montes `LightAppLayout` ni la barra, la tabla ni los paneles del Control Plane.
  - Done cuando la ruta de producto usa `LightAppLayout` con `theme="papel"` y dejó `BaseLayout` y las clases `mo-admin*` / `mo-*__eyebrow`. En marketing, done cuando sigue en `BaseLayout`.

3. Aplicá estas skills, en orden, solo en lo que esta ruta todavía no cumple. Leé cada archivo y seguí sus pasos:
   1. [`hobday-safe-rules`](../hobday-safe-rules/SKILL.md) — espacio, radios concéntricos, alineación, tokens `--mo-*`. Si esa skill clasifica la landing como dark-galaxia, Tema papel gana: la cara pública es papel y el único acento saturado es `--mo-accent`.
   2. [`hobday-app-visual`](../hobday-app-visual/SKILL.md) — solo producto: densidad, acciones junto al objeto, cromado más quieto que los datos.
   3. [`refactoring-ui-cheats`](../refactoring-ui-cheats/SKILL.md) — un solo botón sólido por vista, jerarquía por peso y color, un borde de acento.
   - Done cuando cada skill que tocaste cumple su propio criterio de cierre en esta ruta.

4. Cerrá la ruta en el archivo. Leé [`web-design-guidelines`](../web-design-guidelines/SKILL.md) y `web/AGENTS.md`, y compará con el login y el Control Plane.
  - Producto: cada ítem de **Cierre** está en la ruta, o queda anotado como deuda previa con archivo y motivo. Si la ruta ya usa `LightAppLayout`, igual compará el `<style>` de esa página con el Control Plane: la barra, la tabla y las herramientas de la página tienen que coincidir. Un cambio en `light-app.css` que también mueve otra ruta (la barra de selección de Tenants, el hover de todas las tablas) no cierra esta: va en su propio corte.
  - Marketing: teclado, foco visible, `<label>`, voseo, contraste, sin tokens nuevos. El acento saturado es `--mo-accent` en el camino, el puente y la selección. El header mide 44px de alto en cada enlace, incluida la marca, usa `env(safe-area-inset-*)` y el hover de color vive en `(hover: hover) and (pointer: fine)`. Igualar el acento deja la marca en una sola pieza y de un solo color. El puente conserva ese acento y no lleva una entrada escalonada. Cada hallazgo queda corregido en el archivo o anotado como deuda previa.
   - Done cuando el cambio está en el archivo. Un listado de hallazgos sin ese cambio no cierra el paso.

## Cierre (producto)

Lo que la auditoría marcó en login y Control Plane. Esas rutas ya lo cumplen. Una ruta nueva de producto copia ese comportamiento.

- Panel o filtro abierto vive en la query (`?nuevo=1`). Al cerrar, la URL vuelve al estado cerrado.
- Formulario con cambios avisa en `beforeunload`. Cancelar descarta y limpia el aviso.
- El placeholder termina en `…`. Usuario y slug llevan `spellcheck="false"` y `autocomplete="off"`. Marca, slug y nombre de base llevan `translate="no"`.
- La fecha usa `Intl.DateTimeFormat('es-AR')`. Un `YYYY-MM-DD` se parsea como fecha local: `new Date(y, m - 1, d)`. El monto usa `Intl.NumberFormat('es-AR', { style: 'currency', currency: 'USD' })`. Cero o vacío se muestra como `—`.
- El submit se deshabilita mientras el pedido corre y el rótulo dice la acción en curso («Entrando…», «Creando…»). Vuelve a habilitarse solo si falló. El error nombra el paso siguiente, va en `role="alert"`, se asocia con `aria-describedby`, marca `aria-invalid` y el foco vuelve al primer campo.
- La confirmación que dispara un pedido hace lo mismo con su botón («Purgando…», «Dando de baja…»). El fallo nombra el paso siguiente, en voseo.
- Un teléfono visible separa los grupos con espacio de no separación.
- En Leads, la purga y la baja hablan del Lead y de la auditoría de captación. Esa auditoría no se nombra como dato de un Tenant.
- Junto a la lista puede quedar una nota de operación. El pie con la API, el nombre de la base o el modelo de Odoo no va en la vista.
- El botón nombra la acción («Aplicar módulos»). El diálogo visible titula con `h2`.
- Menú `role="menu"`: al abrir, el foco entra en el primer `menuitem`. Flechas, Inicio y Fin mueven. Escape cierra y devuelve el foco al control.
- El `<label>` del checkbox de fila mide al menos 44px. El input puede ser más chico adentro.
- La fila de la tabla de esta página usa `content-visibility: auto` con tamaño intrínseco, en el `<style>` de la página.
- Barra y pantalla completa usan `env(safe-area-inset-*)`. Los títulos llevan `text-wrap: balance`.
- El enlace terciario lleva `touch-action: manipulation`. El hover de color vive en `(hover: hover) and (pointer: fine)`.
- En un control compuesto (el buscador), el anillo está en `:focus-within`. El input deja el `outline` porque el grupo ya lo muestra.
- El diálogo lleva `overscroll-behavior: contain`.
- `light-app.css` ya trae el tap highlight y el `scroll-margin` de la tabla sticky. En la página, el scroller (`.table-wrap`) lleva el `scroll-padding` equivalente.

## Guardrails

- El hero de la landing se queda en marketing. En producto entra el Tema papel, no la composición del hero.
- Igualar una lista no reestiliza el cromado compartido de otra ruta.
- Una acción sólida por vista. El destructivo usa `mo-btn--danger` solo en el diálogo de confirmación.
- No agregues hex, sombras apiladas ni `transition-all`.
