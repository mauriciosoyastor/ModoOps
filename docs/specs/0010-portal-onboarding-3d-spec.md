# Spec — Portal Onboarding 3D (Oficina Three.js → Borrador Tenant)

> ADR base: `0005-modoops-marca-blanca-catalogo-composable` + `0001-ancla-retail-fase-1-sin-integraciones-ni-b2b` + `0009-catalogo-ssot-generado-vs-runtime` + `0006-multitenant-centralizado-faseado`. Glosario canónico: `CONTEXT.md` — Prospecto, Cliente, Tenant, Módulo ModoOps, Catálogo ModoOps, Ancla ModoOps, Paquete ancla, Descubrimiento pago, Lista cerrada de módulos, Configurador ModoOps, Add-on. Mapa: `docs/plans/wayfinder-portal-onboarding-3d.md` (T1/T2/T4 cerrados; T3/T5 abiertos y marcados abajo como refinamiento). Triage pendiente: publicar como issue GitHub + label `ready-for-agent` cuando haya `gh auth login` (tracker sin auth en esta sesión).

## Problem Statement

El **Prospecto** que llega a ModoOps no puede *ver* qué está comprando: el **Catálogo ModoOps** es una tabla, el **Configurador ModoOps** es herramienta interna (no self-service en fase inicial), y el **Descubrimiento pago** arranca de cero con relevamiento manual. Resultado: el Prospecto no navega los **Módulos ModoOps** (Mostrador, Depósito Inteligente, Compras, Fiscal AR…), no distingue el **Ancla** (combo cerrado) de los **Add-ons** futuros para hacer crecer su negocio, y los datos que podría precargar se pierden — el consultor los vuelve a pedir en el Descubrimiento y la **Lista cerrada de módulos** se arma a mano. Se necesita una página interactiva donde el Prospecto recorra una oficina virtual, cada objeto represente un módulo, cargue sus datos por objeto, y esa carga alimente el armado del **Tenant** (`modoops_<slug>`) sin prometer self-service vinculante.

## Solution

Un portal de onboarding en el sitio Astro con una **oficina virtual Three.js**: mostrador/2 cajas, estantería/depósito, góndola, computadora, pizarrón fiscal y puerta "crecer". El Prospecto navega, clickea objetos, ve la ficha de cada **Módulo ModoOps** (qué es, ancla o futuro, horas) y tilda lo que necesita. Al terminar exporta un **borrador JSON v1** (no vinculante) que el consultor importa al **Configurador interno** durante el **Descubrimiento pago** para emitir la **Lista cerrada de módulos** y crear el **Tenant**. Tres variantes de UX prototipadas (oficina 3D libre, plano 2D, recorrido guiado); el mapa elige la ganadora antes de construir. Marca blanca: el portal nunca menciona Odoo.

## User Stories

1. Como Prospecto retail, quiero recorrer una oficina virtual y clickear el mostrador, para entender qué es el Módulo Mostrador sin leer una tabla.
2. Como Prospecto, quiero ver la ficha de cada objeto (qué módulo es, si entra en el ancla o es futuro, cuántas horas), para distinguir qué pago hoy de lo que dejo para crecer.
3. Como Prospecto, quiero tildar los módulos que necesito desde la escena, para dejar un borrador de mi interés antes de hablar con el consultor.
4. Como Prospecto, quiero cargar los datos de mi negocio por objeto (cajas, depósito, compras, fiscal borrador), para no repetir todo en el Descubrimiento.
5. Como Prospecto, quiero ver la puerta "crecer" con los Add-ons futuros (Taller, Migración Excel, B2B Básico, IA), para planear el crecimiento de mi negocio.
6. Como Prospecto sin WebGL o con móvil viejo, quiero un plano 2D funcionalmente paritario, para completar mi borrador sin la escena 3D.
7. Como Prospecto con `prefers-reduced-motion`, quiero la escena estática, para no sufrir animaciones.
8. Como Prospecto, quiero descargar o enviar mi borrador al consultor, para que mi carga alimente mi propuesta.
9. Como Consultor ModoOps, quiero importar el borrador JSON v1 al Configurador interno, para generar la Lista cerrada sin re-tipiar lo que el Prospecto ya cargó.
10. Como Consultor, quiero que el borrador sea explícitamente no vinculante, para validarlo en el Descubrimiento pago antes de emitir Propuesta comercial.
11. Como Consultor, quiero que el borrador fiscal sea solo un punto de partida, para cerrarlo con el Asesor fiscal del Cliente antes del go-live como manda el glosario.
12. Como Arquitecto ModoOps, quiero un único mapping objeto→módulo leído por todas las variantes, para que la oficina 3D, el plano y el recorrido nunca diverjan.
13. Como Arquitecto, quiero que el portal lea solo los tipos generados del Catálogo, para que un módulo nuevo aparezca por tipos y el CI fail-closed lo atrape.
14. Como Dueño de pricing, quiero que el portal nunca muestre ni prometa precio de ancla/add-ons como oferta cerrada, para no violar la política de precios públicos (solo Descubrimiento $155 es público).
15. Como Cliente futuro, quiero que mi borrador no cree ningún Tenant solo, para que ninguna base se provisione sin contrato y validación humana.
16. Como Implementador, quiero 3 variantes de UX conmutables para elegir con el dueño, para no construir la variante equivocada a ciegas.
17. Como Implementador, quiero el patrón de escena Three.js ya probado (lazy, resize, cleanup, sin framework islands), para no romper el build ni el deploy.
18. Como Implementador, quiero que la escena nunca bloquee el LCP ni pese más del presupuesto, para no espantar al prospecto retail con mala red.
19. Como Soporte, quiero que el portal deje traza de qué borrador corresponde a qué Prospecto, para retomarlo en el Descubrimiento sin confusiones.
20. Como Lector de marca blanca, quiero que el portal hable solo de Módulos ModoOps, para que Odoo aparezca únicamente en anexo técnico/licencia.

## Implementation Decisions

- **Portal = pre-carga borrador, no self-service vinculante**: lo que el Prospecto tilda genera un borrador que se valida en el **Descubrimiento pago**; el **Configurador interno** sigue siendo la única fuente de la **Lista cerrada**. `CONTEXT.md` ("no self-service en fase inicial") queda intacto; cambiarlo sería un esfuerzo nuevo, no este spec.
- **Metáfora oficina = retail 1 sucursal (ICP)**: seis objetos clicables — mostrador/2 cajas → Mostrador, estantería → Depósito Inteligente, góndola → Ventas, computadora → Compras, pizarrón → Fiscal AR, puerta "crecer" → futuros (Taller, Migración Excel, B2B Básico, IA). Contactos, Plataforma y Puente Factura van como "siempre incluidos", no como objetos.
- **Un solo seam nuevo (`oficina-mapping`)**: tabla `Objeto3D ↔ CatalogoKey` + predicado ancla/futuro + constructor del borrador. Toda variante (3D, plano, recorrido) lee por acá; la validación real (hard gate fiscal, techo 92h) vive en el Configurador, nunca en el browser. Seams existentes reutilizados sin cambiar interfaces: Catálogo SSOT generado, `generar` del Configurador como consumidor del JSON, patrón de escena del precedente Three.js del sitio, y el layout base del sitio.
- **Forma del borrador v1** (cerrada en el mapa 2026-09-07; el prototipo implementa el núcleo y se extiende así):
  `OBJETO_A_MODULO = { mostrador-3d: mostrador, estanteria-3d: deposito, gondola-3d: ventas, computadora-3d: compras, pizarron-fiscal-3d: fiscal_ar, puerta-crecer-3d: b2b_basico }` y `borradorV1 = { version: "borrador-v1", vinculante: false, origen: "portal-oficina-3d", prospecto: { nombre*, contacto_nombre*, telefono*, email, rubro, sucursales, cajas, usuarios }, objetos: { mostrador-3d: { cajas, descuento }, estanteria-3d: { almacenes, ubicaciones }, gondola-3d: { listas_precio }, computadora-3d: { proveedores, orden_compra }, pizarron-fiscal-3d: { comprobantes[], contador }, puerta-crecer-3d: { futuros[] } }, modulos_ancla[], modulos_futuros[], horas_estimadas, datos: { productos_aprox, tiene_excel }, infra: { hosting_propio, dominio_ssl, backups } }` (* = requerido; todo lo demás opcional, en lenguaje de comerciante). El borrador persiste en `localStorage` y viaja al consultor por copiar-JSON o WhatsApp comercial; cero backend.
- **Tres variantes, una ganadora**: A — oficina 3D de exploración libre con ficha lateral; B — plano cenital 2D paritario (a la vez fallback sin WebGL); C — recorrido guiado en 3 pasos (negocio → ancla → crecer) con borrador vivo. Conmutables por `?variant=` con barra flotante; al ganar una, se pliega al código real (reescrita con polish) y el resto va a rama throwaway, no a main.
- **Rendimiento y robustez**: escena 100% cliente (cero SSR, Three.js solo dentro de `<script>` con import diferido al entrar a viewport), reserva de layout contra CLS, presupuesto ~700 KB gzip, `prefers-reduced-motion` respetado, y fallback 2D que permite completar el borrador sin 3D.
- **Sin persistencia ni Tenant en este spec**: estado en memoria; nada crea `modoops_<slug>`, nada escribe en `modoops_master`. Dónde vive el borrador del Prospecto (localStorage vs leads vs link mágico) y la autenticación los define T3.
- **Marca blanca y pricing**: el portal nombra solo Módulos ModoOps; ningún precio de ancla/add-on aparece como oferta. El ancla se presenta como "combo cerrado" y los futuros como "para crecer", sin montos vinculantes.

## Testing Decisions

- **Qué hace un buen test aquí**: probar comportamiento externo a través de los seams (mapping, borrador, validación del Configurador), no detalles de render 3D. Un test construye una selección fake, llama al constructor del borrador y aserta partición ancla/futuros, suma de horas y flag no-vinculante — sin browser, sin WebGL, sin Odoo.
- **Seams elegidos (de más alto a más bajo, uno nuevo ideal)**:
  - **Seam 1 — `oficina-mapping` (más alto, preferido, ideal único)**: mapping 1:1, predicado ancla, constructor del borrador. Cubre >90% del comportamiento testeable. Es la test surface.
  - **Seam 2 — Configurador `generar` con el borrador como input**: testea que el borrador válido produce Lista cerrada y que el fiscal sin anexo da hard gate (T5).
  - **Seam 3 — drift del generado**: el check de sincronización del catálogo falla si los tipos TS difieren del SSOT; la escena hereda el cambio por tipos.
- **Prior art**: tests de lógica del Configurador (hard gate módulo inexistente, gates fiscal/sku, techo de horas) y tests offline de la interfaz del catálogo con fakes en memoria; el precedente de escena Three.js del sitio como referencia de cleanup. Reusar ese patrón: fakes en memoria, nada de filesystem ni Odoo en los tests del portal.
- **Cobertura mínima**: todo `CatalogoKey` referenciado por el mapping existe en el universo del Catálogo; `borradorV1` particiona ancla/futuros y suma horas correctamente con `vinculante: false`; el plano 2D rinde sin WebGL; el conmutador `?variant=` cicla A→B→C; la escena no importa nada en SSR. Borrar o reescribir los componentes perdedores del prototipo al plegar la ganadora; el código prototype (sin tests, sin manejo de errores) nunca se promociona directo a producción.

## Out of Scope

- Auto-creación del Tenant desde el portal sin validación humana (el portal es pre-carga; crear la base es ejecución post-mapa).
- Self-service vinculante que reemplace el Descubrimiento pago o el Configurador interno en fase inicial.
- Cierre del anexo fiscal en el portal (requiere validación del Asesor fiscal del Cliente y firma; el portal solo admite borrador).
- Carga masiva de catálogo (≤500 ítems) con upload directo, salvo que T3 lo incluya como conteo + muestra.
- Autenticación del Prospecto y persistencia del borrador (abierto en T3).
- E-commerce, CRM, MRP, multi-sucursal y B2B avanzado dentro del ancla (excluidos del ancla por glosario).
- Migración del adapter de deploy del sitio (Vercel→Cloudflare) — la escena debe ser agnóstica al adapter, la migración es otro esfuerzo.
- Cambiar Infra Multi-DB, Control Plane o el requisito del Grafo GitNexus.

## Further Notes

- Abierto que refina este spec sin invalidarlo: **Pipeline JSON v1 → Configurador → Tenant** (comando de importación, ejemplo válido, validaciones que fallan en cerrado). Si su resolución contradice una decisión de acá, se enmienda el spec, no se parcha por fuera. **Ficha por objeto + JSON v1** ya cerró (forma exacta en "Forma del borrador v1").
- Elección de variante decidida 2026-09-07: gana el recorrido guiado con la escena 3D como hero del paso 1; el plano 2D queda como fallback. Tickets de construcción en `.scratch/portal-onboarding-3d/issues/01-05`.
- Publicación pendiente: crear el issue GitHub con este contenido y aplicar label `ready-for-agent` al tener `gh auth login`.
- Nota de entorno: `web/node_modules` estaba parcialmente instalado en esta sesión (faltaban los paquetes del framework y 3D y el build colgaba); reinstalar dependencias antes de correr el prototipo.
