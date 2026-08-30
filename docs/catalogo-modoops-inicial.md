# Catálogo ModoOps Inicial — Extraído de Servigas (Caso Retail)

> Fuente: `servigas/custom_addons/servigas_core/__manifest__.py` v19.0.1.20.71 + `servigas_integrations` v19.0.1.0.2 + hubs. Validado en producción Servigas (mostrador 2 cajas, 8.767 SKU).

## Módulos ModoOps validados (ofrecibles sin add-on de evaluación)

| Módulo ModoOps | Módulo Odoo / técnico | Depends | Ancla Retail | Notas |
|----------------|------------------------|---------|--------------|-------|
| **Mostrador** | `point_of_sale` + `pos_discount` | `base`, `product` | ✅ (2 cajas) | POS con descuento manual línea % + general Desc. (ADR 0014 servigas). Tema Liquid Glass POS. |
| **Depósito Inteligente** | `stock` | `base`, `product` | ✅ (1 almacén) | Ubicaciones Recepción/Depósito/Mostrador. Hub Inventario KPI cards. |
| **Ventas** | `sale_management` | `stock`, `product` | ✅ | Flujo ligado a POS/facturación operativa. Hub Ventas. |
| **Compras** | `purchase` | `stock`, `product` | ✅ | Órdenes + recepciones 1 almacén. Hub Compras. |
| **Fiscal AR** | `account` + `l10n_ar` (EDI) | `base` | ✅ (según anexo) | Contabilidad operativa + Factura Web puente. Requiere anexo fiscal cerrado + asesor fiscal. |
| **Contactos** | `base`, `product` (Contactos) | — | ✅ | Clientes/proveedores básicos. |
| **Plataforma ModoOps** | `servigas_core` renombrado → `modoops_core` | `web`, `mail`, `product` | ✅ (siempre) | Shell Astro BFF + Liquid Glass v2, hubs, launcher, rail, onboarding. No se cobra como módulo. |
| **Puente Factura Web** | `servigas_integrations` → `modoops_integrations` | `modoops_core` | ✅ (manual) | Tile launcher + cards Factura Web/portales. Planilla `datos/import/planilla_puente_factura_web.xlsx`. |
| **Taller** | `sg_workshop` (custom Servigas) | `stock`, `sale` | ⬜ Add-on $155 (o días×$52) | Hub Taller / órdenes de trabajo. `sg_workshop_views.xml`, `hub_workshop_data.xml`. Decisión 2026-08-29: **Add-on**, no en Ancla Retail. |

## Módulos candidatos (requieren Descubrimiento + validación antes de entrar al Catálogo)

| Módulo ModoOps candidato | Odoo | Estado | Estimación |
|---------------------------|------|--------|------------|
| **B2B Básico** | Ventas B2B + cuenta corriente | Spec en CONTEXT.md, no implementado en Servigas | SKU $155 Add-on |
| **CRM Simple** | `crm` | Excluido ancla retail | Add-on |
| **eCommerce** | `website_sale` | Excluido | Fase 2 |
| **Integración Mercado Libre / TiendaNube** | API externa | No en Servigas | Fase 2 integración mín $104 (2 días) |
| **MRP Ligero** | `mrp` | No validado | Requiere descubrimiento extenso |
| **Migración Excel** | scripts `datos/import/*.py` | Validado 8.767 SKU, Maestro `maestro_import_odoo_final.xlsx` | Add-on $155 (≤500 prod) |

## Configurador ModoOps (herramienta interna) — reglas

- **Input:** Checklist de Módulos ModoOps tildados + vertical (Retail inicial).
- **Output:** Lista cerrada de módulos (nombre técnico + versión/rama), alcance funcional, exclusiones, hitos, precio ancla ($800 USD base) + add-ons, plazo (hasta 2 anclas paralelas).
- **Regla:** Solo módulos de este catálogo entran sin add-on de evaluación. Candidatos = Descubrimiento pago ($155) + Add-on cotizado.
- **Próximo paso:** Renombrar `servigas_core` → `modoops_core` como base clonable para nuevos proyectos (mantener Servigas como caso).

## Validación pendiente

- [ ] Confirmar si `sg_workshop` queda en Catálogo inicial o pasa a candidato.
- [ ] Definir `l10n_ar` módulo exacto (versión/ rama) para Fiscal AR en CE 19.
- [ ] Extraer `odoo-19/addons` lista para dependencias transitivas (no listar todo OCA).

> Este catálogo es el universo ofrecible ModoOps hoy. "Todo Odoo" = todo lo de esta tabla. Crece solo tras validar en proyecto real (ADR 0005).
