# Wayfinder Map — Portal Onboarding 3D (Oficina Three.js → Tenant)

> Mapa local (tracker GitHub sin auth en esta sesión — `gh auth login` pendiente; se sigue precedente `wayfinder-control-plane.md:3`).
> Estado: **cerrado 2026-09-07 — T1/T2/T3/T4/T5 cerrados, frontera vacía**. Handoff a `to-tickets` hecho: 5 tickets en `.scratch/portal-onboarding-3d/issues/01-05` (variante ganadora decidida: recorrido guiado + hero 3D, 2D fallback).

## Destination

Spec handoff + prototipo Astro + Three.js navegable de una **oficina virtual** donde cada objeto representa un **Módulo ModoOps** (mostrador, estantería/depósito, computadora/compras-fiscal, etc.): el **Prospecto** navega, carga sus datos por objeto, y al terminar exporta un **JSON v1** que el consultor importa al **Configurador interno** para emitir la **Lista cerrada de módulos** y crear el **Tenant** (`modoops_<slug>`). Handoff a `to-spec`/`to-tickets` cuando el mapa cierre.

## Notes

- Dominio: **Prospecto** (sin contrato, carga en portal) vs **Cliente** (contrato vigente) vs **Tenant** (`modoops_<slug>`, base aislada — no es usuario ni sucursal) — `CONTEXT.md:44-49,243`. **Módulo ModoOps** (unidad comercial, ej Mostrador→`point_of_sale`) vs objeto 3D (su representación en la oficina) — `CONTEXT.md:54`. **Catálogo ModoOps** = universo ofrecible, SSOT `modoops_catalogo/catalogo.json` (ADR 0009) — `CONTEXT.md:531`. **Configurador interno** (no self-service fase inicial) — `CONTEXT.md:62`; el portal es **pre-carga**, no reemplazo vinculante.
- Tensión asumida (Q1/Q2 sin respuesta explícita, se fija por recomendada): portal **envuelve como borrador** → valida en **Descubrimiento pago ($155)** → Configurador emite Lista cerrada ($800 ancla). Si el humano quiere portal vinculante, se re-charta T1.
- Tech fijada por humano: **Three.js** para la oficina 3D dentro de `web/` (Astro 5 + Tailwind v4 — `docs/landing-architecture.md:1`). Metáfora: oficina = retail 1 sucursal ICP (`CONTEXT.md:174`): mostrador/caja, estanterías/depósito, computadora (compras/fiscal), puerta futura (add-ons B2B/integraciones).
- Skills por sesión: `grilling` + `domain-modeling` en grillings; `prototype` en prototipos; `research` en research (AFK).
- Términos a fijar en T1/T3: **Objeto-Módulo** (mapping objeto 3D ↔ Módulo ModoOps ↔ `catalogo.json` key), **Ficha por objeto** (qué datos pide cada uno), **JSON v1** (contrato con `tools/configurador/logic/configurador.py:28` `generar`).

## Decisions so far

- **Destino y portal vs Configurador (cerrado 2026-09-07):** destino = spec + prototipo navegable sin auto-crear Tenant; portal = borrador pre-Descubrimiento validado en Descubrimiento pago, no self-service vinculante (`CONTEXT.md:62` intacto); navega el **Prospecto**, el **Tenant** es el resultado.
- **Three.js en Astro 5 + SSOT catálogo (research cerrado 2026-09-07):** `three@0.185.1` ya en `web/`; patrón vanilla `<script>` + `dynamic import()` + `IntersectionObserver` (sin `client:only`, sin React); escena lee solo `catalogo.generated.ts` vía nuevo seam `oficina-mapping.ts`; fallback 2D paritario obligatorio; riesgo: drift adapter Vercel→Cloudflare.
- **Oficina Three.js: escena y mapping objeto→módulo (cerrado 2026-09-07):** prototipo en `web/src/pages/prototype/oficina.astro` (`?variant=A|B|C` + switcher flotante): A oficina 3D clicable (6 objetos, `scripts/oficina-scene.ts`), B plano cenital 2D sin WebGL, C recorrido guiado 3 pasos con JSON vivo; mapping único en `web/src/lib/oficina-mapping.ts`; estado en memoria, sin crear DB. Asset sin commitear (ver archivos); al ganar una variante se pliega y el resto va a rama throwaway.
- **Ficha por objeto + JSON v1 hacia Tenant (cerrado 2026-09-07):** ficha negocio = 7 campos (nombre+contacto requeridos, resto opcional; validaciones ICP las hace el consultor); dato por objeto en lenguaje comerciante todo opcional (mostrador: cajas+descuento; estantería: almacenes+ubicaciones; góndola: listas de precio; computadora: proveedores+OC; pizarrón: comprobantes que cree usar+contador, borrador sin firma; puerta: futuros multi-tildables); datos/infra = solo conteo + 3 sí/no (sin upload); borrador vive en `localStorage` + envío por WhatsApp/copiar JSON, cero backend. Forma exacta en el spec (decisión "Forma del borrador v1").
- **Pipeline JSON v1 → Configurador → Tenant (cerrado 2026-09-07):** verificado en vivo — suite `test_configurador_logic` 7/7 verde; borrador ejemplo (Pinturería Centro, 6 módulos ancla + Migración Excel) → `generar` da hard gate fiscal sin anexo (el portal nunca trae anexo firmado) y queda limpio con `AF-2026-014`; precio $800/anticipo neto $322.5/addons `[migracion_excel]`; `odoo-bin -d modoops_pintureria-centro -i account,contacts,l10n_ar,point_of_sale,pos_discount,purchase,sale_management,stock` derivado del anexo técnico (ejecutar en staging con Docker — sin Docker en esta sesión). Hallazgo: ese combo de 6 suma 95h y dispara warning de techo 92h → el consultor recorta o deriva a Fase 2.

<!-- vacías al chartar; una línea por ticket cerrado con gist + link -->

## Frontier (orden)

<!-- vacía 2026-09-07: T5 era el último ticket. El camino al destino está despejado. -->

## Not yet specified

- Anexo fiscal en portal: ¿borrador hasta qué profundidad sin **Asesor fiscal del Cliente**? (gradúa con T3; cierre real sigue pre-go-live — `CONTEXT.md:210`).
- Migración catálogo (≤500) desde el portal: ¿upload Excel directo o solo conteo + muestra? (gradúa con T3).
- Autenticación del Prospecto en el portal (¿anónimo + link mágico vs cuenta?) y dónde vive su borrador (¿`modoops_master` leads vs localStorage?).
- Liquid Glass v2 vs `DESIGN.md` (sin glassmorphism): ¿el portal 3D rompe el design system o lo extiende?
- Multi-vertical (servicios/distribución) más allá de Retail: ¿la oficina cambia por vertical?

## Out of scope

- Auto-creación de Tenant `modoops_<slug>` desde el portal sin validación humana (el portal es pre-carga; crear DB es ejecución post-mapa).
- Self-service vinculante que reemplace Descubrimiento pago / Configurador interno en fase inicial (contradice `CONTEXT.md:62` salvo que T1 lo redibuje como esfuerzo nuevo).
- E-commerce, CRM, MRP, multi-sucursal, B2B avanzado dentro del ancla (excluidos — `CONTEXT.md:377`).
