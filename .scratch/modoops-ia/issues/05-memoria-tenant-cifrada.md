# 05: Memoria del Agente en Tenant (cifrada, 90d purgable)

**What to build:** Como Dueño, historial/preferencias del Agente persiste cifrado solo en `modoops_<slug>` (`modoops.agent.memory`), incluido en backup S3, nunca en master ni logs BFF, con cron purga 90d.

**Blocked by:** 02

**Status:** ready-for-agent

- [ ] `modoops.agent.memory` en Tenant, campo `value_encrypted` (pgcrypto/fernet) no en `modoops_master`
- [ ] BFF nunca loggea PII de memoria
- [ ] Cron purga 90d purgable por `ir.config_parameter`
- [ ] Backup `provision_tenant.py` incluye memoria
