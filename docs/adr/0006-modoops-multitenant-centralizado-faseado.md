# ADR 0006 — ModoOps Multitenant Centralizado Faseado (Multi-DB + Failover Fase 2)

Adoptamos infra centralizada Multi-DB Single-Instance (1 VPS Hetzner 8–16GB + Docker Odoo + Postgres central, N bases `modoops_<cliente>` aisladas, filestore S3) con provisión en 2min vía script y updates masivos. Selección de módulos (incluida IA `modoops_ia`) por tenant asistida. Para no duplicar costo en fase inicial, Fase 1 usa backups nightly a S3 + snapshots (RPO 24h/RTO 60min, ~$40/mes); Fase 2 activa Hot Standby con Streaming Replication + Floating IP (RPO ms/RTO 2–5min, ~$78/mes) cuando recurrente supere ~$400/mes (10+ tenants).

## Considered Options

- **Single-tenante VPS por cliente** (aislado, sin SLA) vs **Multi-DB centralizado** (escala rápida, SLA central). Elegimos centralizado por costo operativo y provisión rápida.
- **Single-DB tenant_id** (fork Odoo, 3–6 meses) descartado por complejidad.
- **Failover inmediato** (2 VPS desde día 1) vs **faseado**. Elegimos faseado por meta $600/mes: $78/mes inicial es 13% de facturación.

## Consequences

- Se rompe "sin SLA infra": ModoOps es hosting provider. Abono $45/mes debe absorber infra central.
- Próximo paso Fase 1: implementar dumps por tenant + S3 + snapshot diario antes del primer tenant productivo.
