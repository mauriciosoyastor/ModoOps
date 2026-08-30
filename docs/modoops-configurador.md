# ModoOps Configurador — Herramienta interna (no self-service)

> Herramienta interna ModoOps para armar propuestas composables desde el Catálogo ModoOps. No es portal del cliente en fase inicial. Output = Lista cerrada de módulos + alcance + precio + hitos.

## Propósito

Traducir el relevamiento del **Descubrimiento pago ($155 USD)** en una propuesta cerrada sin prometer "todo OCA". El Configurador es la única fuente para generar la **Lista cerrada de módulos** que va al contrato.

## Entradas (checklist Descubrimiento)

- Vertical (Retail hoy; Servicios/Distribución futuro)
- Número de sucursales / almacenes / cajas POS (ICP: 1 sucursal, 1 almacén, 2 cajas)
- Módulos ModoOps tildados del **Catálogo ModoOps Inicial** (`catalogo-modoops-inicial.md`)
- Anexo fiscal borrador (tipos comprobante, NC/devoluciones, asesor fiscal)
- Datos/catálogo (Migración Excel ≤500 o carga manual)
- Infra (hosting, backups, SSL) y recursos cliente (tiempo, contador)

## Catálogo consultado

Solo módulos en `catalogo-modoops-inicial.md` entran sin add-on de evaluación:
- Mostrador, Depósito Inteligente, Ventas, Compras, Fiscal AR, Contactos, Plataforma ModoOps, Puente Factura Web
- Taller y candidatos = requieren Add-on ($155 o días×$52)

## Reglas de negocio

1. **Ancla = combo base cerrado por vertical.** Ej Retail: Mostrador+Depósito+Compras+Fiscal+Plataforma = $800 USD (50/25/25), techo 92h, 8h ajustes técnicos.
2. **Módulo extra = Add-on.** Seleccionar módulo fuera del combo base genera línea Add-on con precio SKU o días×$52 / $10.5h.
3. **Techo:** Si suma de módulos supera 92h, el Configurador alerta y propone Fase 2 o re-cotización, no infla ancla.
4. **Capacidad:** Hasta 2 anclas en paralelo (red a demanda). Si se tildan 3 proyectos simultáneos, bloquea y sugiere replanificar.
5. **Marca blanca:** Output comercial nunca menciona Odoo; anexo técnico lista `Odoo CE 19` + mapeo ModoOps→Odoo.

## Flujo (3 pasos)

1. **Tildar** módulos del Catálogo + definir vertical → 2. **Generar** Lista cerrada (nombre técnico, versión/rama, repo) + exclusiones + hitos → 3. **Emitir** Propuesta comercial (10 secciones obligatorias, validez 20 días, anticipo $400 menos crédito $77.5 si aplica).

## Output — plantilla Lista cerrada

```md
- ModoOps Core 19.0.1.0.1 — Plataforma (siempre)
- Mostrador — point_of_sale + pos_discount — CE 19 — 2 cajas
- Depósito Inteligente — stock — CE 19 — 1 almacén
- Compras — purchase — CE 19
- Fiscal AR — account + l10n_ar — CE 19 — según anexo fiscal 2026-XX
- Puente Factura Web — modoops_integrations — manual
Excluidos: CRM, eCommerce, MRP, multi-sucursal (Add-on/Fase 2)
```

## Ejemplo — Ancla Retail

Input: Retail 1 sucursal, 2 cajas, 500 prod migración.
→ Configurador → Ancla $800 (Mostrador+Depósito+Compras+Fiscal) + Add-on Migración $155 + Abono $45/mes post-hipercare.
→ Hito 1 $200 en staging, Hito 2 $200 go-live.

## No hacer

- No tildar módulos fuera del Catálogo sin pasar por Descubrimiento.
- No prometer "todo Odoo" sin validar (usar Catálogo como universo).
- No exponer Configurador al cliente como Lego self-service hasta validar 2-3 anclas.

> Mantenimiento: actualizar este doc y `catalogo-modoops-inicial.md` cada vez que se valida un nuevo Módulo ModoOps en proyecto real (ADR si cambia regla).
