# ModoOps Control Plane — Spec v0.1 (`modoops_admin` en `modoops_master`)

> Panel interno ModoOps para gestionar Tenants Multi-DB. Base `modoops_master` en mismo VPS/Postgres central. No es base de Cliente.

## Modelo

- **Tenant** = `modoops_<slug_cliente>` (ej: `modoops_pintureria_centro`) — una DB por Cliente, aislada, creada por script provisión.
- **Estado:** `Activo` → `Suspendido` (login bloqueado, read-only) → `Baja` (backup + cierre). Transición por mora.
- **Módulos:** solo del **Catálogo ModoOps** (`catalogo-modoops-inicial.md`). Instalar/quitar ejecuta `odoo-bin -d <tenant> -i <modulo>` / `-u`.

## MVP — User Stories

1. **Lista Tenants:** tabla con nombre, DB, vertical, módulos instalados, estado, vencimiento abono, último backup.
2. **Instalar/Quitar módulo:** selector del Catálogo → botón "Instalar en tenant X" → log + estado. Valida dependencias.
3. **Suspender/Reactiva:** botón "Suspender" (set `active=False` + bloquea login) / "Reactivar". Solo desde Control Plane.
4. **Logs:** historial por tenant (fecha, acción, usuario ModoOps, resultado).

## Fuera de MVP (Fase 2)

- Editor de vistas/campos sin código (B).
- Facturación/billing automático + corte auto (C) — hoy manual + aviso WhatsApp 7 días gracia.
- Self-service tenant (cliente tilda módulos).

## Regla Suspensión por mora

- Vencimiento abono $45/mes → **gracia 7 días** con 2 avisos (día 1 y 5) → día 8 `Suspendido` (no borra DB, solo bloquea login) → día 15 backup final + `Baja` si no paga. Documentado en contrato.

## Stack

- Módulo `modoops_admin` (depende `base`, `web`, `mail`) en base `modoops_master`. Reutiliza `modoops_core` tema Liquid Glass + hubs. Acceso solo rol ModoOps.
- Comandos orquestados vía `hooks` / `ir.actions.server` que llaman script `tools/modoops_provision/provision_tenant.py`.

## Próximo paso

- Mock UI en Odoo (lista + formulario Tenant) + script provisión v0.1.
