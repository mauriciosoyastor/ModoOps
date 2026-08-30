# Catálogo ModoOps Inicial — Extraído de Servigas (Caso Retail)

> Fuente: `servigas/custom_addons/servigas_core/__manifest__.py` v19.0.1.20.71 + `servigas_integrations` v19.0.1.0.2 + hubs. Validado en producción Servigas (mostrador 2 cajas, 8.767 SKU).

## Módulos ModoOps validados (ofrecibles sin add-on de evaluación)

| Módulo ModoOps | Módulo Odoo / técnico | Depends | Ancla Retail | Notas |
|----------------|------------------------|---------|--------------|-------|
| **Mostrador** | `point_of_sale` + `pos_discount` | `base`, `product` | ✅ (2 cajas) | POS con descuento manual línea % + general Desc. (ADR 0014 servigas). Tema Liquid Glass POS. |
| **Depósito Inteligente** | `stock` | `base`, `product` | ✅ (1 almacén) | Ubicaciones Recepción/Depósito/Mostrador. Hub Inventario KPI cards. |
| **Ventas** | `sale_management` | `stock`, `product` | ✅ | Flujo ligado a POS/facturación operativa. Hub Ventas. |
| **Compras** | `purchase` | `stock`, `product` | ✅ | Órdenes + recepciones 1 almacén. Hub Compras. |
| **Fiscal AR** | `account` + `l10n_ar` (OCA, CE 19) | `base`, `l10n_ar` | ✅ (según anexo) | Contabilidad operativa + Factura Web puente. `modoops_core` depende `l10n_ar` pero emisión bloqueada por `ir.config_parameter` `modoops.fiscal_enabled=False` hasta firma anexo + validación asesor fiscal (`modoops_fiscal_guard.py`). |
| **Contactos** | `base`, `product` (Contactos) | — | ✅ | Clientes/proveedores básicos. |
| **Plataforma ModoOps** | `servigas_core` renombrado → `modoops_core` | `web`, `mail`, `product` | ✅ (siempre) | Shell Astro BFF + Liquid Glass v2, hubs, launcher, rail, onboarding. No se cobra como módulo. |
| **Puente Factura Web** | `servigas_integrations` → `modoops_integrations` | `modoops_core` | ✅ (manual) | Tile launcher + cards Factura Web/portales. Planilla `datos/import/planilla_puente_factura_web.xlsx`. |
| **Taller** | `sg_workshop` → `mo.work.order`/`mo.appliance` en `modoops_core` | `stock`, `sale` | ⬜ Add-on $155 (o días×$52) | Hub Taller / órdenes de trabajo. En core pero oculto por grupo `modoops_core.group_modoops_workshop` (`mo_workshop_views.xml` actions con `groups_id`). Activación Add-on = asignar grupo. Decisión 2026-08-30: **mantener en core con visibilidad condicional** (no extraer módulo). |

## Módulos candidatos (requieren Descubrimiento + validación antes de entrar al Catálogo)

| Módulo ModoOps candidato | Odoo | Estado | Estimación |
|---------------------------|------|--------|------------|
| **B2B Básico** | Ventas B2B + cuenta corriente | Spec en CONTEXT.md, no implementado en Servigas | SKU $155 Add-on |
| **CRM Simple** | `crm` | Excluido ancla retail | Add-on |
| **eCommerce** | `website_sale` | Excluido | Fase 2 |
| **Integración Mercado Libre / TiendaNube** | API externa | No en Servigas | Fase 2 integración mín $104 (2 días) |
| **MRP Ligero** | `mrp` | No validado | Requiere descubrimiento extenso |
| **Migración Excel** | `mo.price.list.import.wizard` + `mo_price_list_import_logic.py` | Validado 8.767 SKU, Maestro `maestro_import_odoo_final.xlsx` | Add-on $155 (≤500 prod) | Wizard E2E `CSV/XLSX → preview/classify_rows → create/update` con tope `MAX_IMPORT_ROWS=500` (validado en `wizard:63,116,156`). |

## Configurador ModoOps (herramienta interna) — reglas

- **Input:** Checklist de Módulos ModoOps tildados + vertical (Retail inicial).
- **Output:** Lista cerrada de módulos (nombre técnico + versión/rama), alcance funcional, exclusiones, hitos, precio ancla ($800 USD base) + add-ons, plazo (hasta 2 anclas paralelas).
- **Regla:** Solo módulos de este catálogo entran sin add-on de evaluación. Candidatos = Descubrimiento pago ($155) + Add-on cotizado.
- **Próximo paso:** Renombrar `servigas_core` → `modoops_core` como base clonable para nuevos proyectos (mantener Servigas como caso).

## Validación pendiente

- [x] `sg_workshop` → Add-on $155 en core con grupo `group_modoops_workshop` (2026-08-30)
- [x] `l10n_ar` OCA CE 19 en `depends` + feature-flag `modoops.fiscal_enabled` (2026-08-30)
- [x] Price List wizard E2E + tope 500 (`MAX_IMPORT_ROWS`) (2026-08-30)
- [ ] Extraer `odoo-19/addons` lista para dependencias transitivas (no listar todo OCA).

> Este catálogo es el universo ofrecible ModoOps hoy. "Todo Odoo" = todo lo de esta tabla. Crece solo tras validar en proyecto real (ADR 0005).
