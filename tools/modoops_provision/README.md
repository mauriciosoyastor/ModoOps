# ModoOps Provision — Fase 1 (manual)

Script v0.1 para tenant Multi-DB `modoops_<slug>` en VPS Hetzner/DO 8–16GB (1 Postgres central).

## Uso

```bash
python tools/modoops_provision/provision_tenant.py --slug pintureria_centro --name "Pinturería Centro" --vertical retail --dry-run
python tools/modoops_provision/provision_tenant.py --slug pintureria_centro --name "Pinturería Centro"
python tools/modoops_provision/provision_tenant.py --list
python tools/modoops_provision/provision_tenant.py --backup modoops_pintureria_centro
```

## Flujo Fase 1

1. `createdb -T template0 modoops_<slug>`
2. `odoo-bin -d modoops_<slug> -i modoops_core --stop-after-init` (instala catálogo base)
3. Cron nightly `0 3 * * * modoops_backup.sh <db>` → `/var/backups/modoops/<db>/` + S3 opcional
4. Registrar en `modoops_master` (Control Plane): `modoops.tenant` con `db_name`, `vertical`, `modules_installed`, `abono_due_date`

**RPO 24h / RTO 60min** — sin hot standby. Fase 2 (10+ tenants, >$400/mes recurrente) → Streaming Replication + Floating IP.

## Control Plane mock

El wizard `Instalar módulo` en `modoops_admin` es **mock**: escribe `modules_installed` + log, no ejecuta `odoo-bin` real. Ejecución real manual:

```bash
odoo-bin -d modoops_pintureria_centro -i l10n_ar  # Fiscal AR tras anexo firmado
odoo-bin -d modoops_pintureria_centro -u modoops_core  # update
```

## Suspensión por mora

- `abono_due_date` + 7 días = `suspend_grace_until` (gracia WhatsApp día 1 y 5)
- Día 8: Control Plane permite **Suspender** (bloquea login, no borra DB)
- Día 15: **Baja** solo con confirm explícita + backup final

Demo: `modoops_pintureria_centro` (retail, estado activo, vencimiento 2026-09-30).
