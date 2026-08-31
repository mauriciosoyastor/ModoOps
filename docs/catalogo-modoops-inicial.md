# Catálogo ModoOps Inicial — Extraído de Servigas (Caso Retail)

> Fuente SSOT: `modoops_catalogo/catalogo.json` — AUTO-GENERADO, no editar a mano. Generado por `python tools/configurador/sync_catalogo.py --generate`. Crece solo tras validar en proyecto real (ADR 0005).

## Módulos ModoOps validados (ofrecibles sin add-on de evaluación)

| Módulo ModoOps | Módulo Odoo / técnico | Depends | Ancla Retail | Horas | Notas |
|----------------|------------------------|---------|--------------|-------|-------|
| **Mostrador** (`mostrador`) | `point_of_sale`, `pos_discount` | `base`, `product` | ✅ | 25 | 2 cajas POS, descuento línea % + general |
| **Depósito Inteligente** (`deposito`) | `stock` | `base`, `product` | ✅ | 20 | 1 almacén, ubicaciones Recepción/Depósito/Mostrador |
| **Ventas** (`ventas`) | `sale_management` | `stock`, `product` | ✅ | 15 |  |
| **Compras** (`compras`) | `purchase` | `stock`, `product` | ✅ | 15 |  |
| **Fiscal AR** (`fiscal_ar`) | `account`, `l10n_ar` | `base`, `l10n_ar` | según anexo | 15 |  |
| **Contactos** (`contactos`) | `contacts` | `base` | ✅ | 5 |  |
| **Plataforma ModoOps** (`plataforma`) | `modoops_core` | `web`, `mail`, `product` | ✅ | 10 | Shell Astro BFF + Liquid Glass v2, siempre |
| **Puente Factura Web** (`puente_factura`) | `modoops_integrations` | `modoops_core` | ✅ | 5 | Tile launcher + planilla puente |
| **Taller** (`taller`) | `modoops_core` | `stock`, `sale` | ⬜ | 20 | SKU 155 o días×52 |
| **Migración Excel** (`migracion_excel`) | — | — | ⬜ | 10 | SKU 155 ≤500 prod |
| **B2B Básico** (`b2b_basico`) | — | — | ⬜ | 20 | SKU 155 post Fase 1 |
| **IA ModoOps — Agente herramental** (`ia`) | `modoops_ia` | `modoops_core`, `modoops_admin` | ⬜ | 15 | incluido en Abono con Techo IA |
## Módulos candidatos (requieren Descubrimiento + validación antes de entrar al Catálogo)

> Candidatos ya incluidos como módulos con `ancla_retail: false` (Taller, B2B Básico, Migración Excel, IA). Para añadir un candidato, agregarlo a `modoops_catalogo/catalogo.json` y regenerar.

## Configurador ModoOps (herramienta interna) — reglas

- **Input:** Checklist de Módulos ModoOps tildados + vertical (Retail inicial).
- **Output:** Lista cerrada de módulos (nombre técnico + versión/rama), alcance funcional, exclusiones, hitos, precio ancla ($800 USD base) + add-ons, plazo (hasta 2 anclas paralelas).
- **Regla:** Solo módulos de este catálogo entran sin add-on de evaluación.

> Este catálogo es el universo ofrecible ModoOps hoy. "Todo Odoo" = todo lo de esta tabla.
