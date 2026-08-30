# 03: Catálogo + Herramienta lectura — consulta stock (read-only) e2e

**What to build:** Como Operativo, "¿stock de X?" → Agente invoca única Herramienta `stock.consulta` (definida en `modoops_master`, `input_schema`+`groups_id`, lógica pura + wrapper) y recibe stock real del Tenant sin ver otro Tenant. Demuestra Catálogo global / Ejecución local.

**Blocked by:** 02

**Status:** ready-for-agent

- [ ] `GET /tools` lista `stock.consulta` solo si usuario tiene `groups_id`
- [ ] `POST` stock.consulta con `product_id` válido → cantidad del Tenant correcto
- [ ] Tenant B no ve stock de Tenant A
- [ ] Wrapper valida `groups_id` y no escribe; audita corrida
