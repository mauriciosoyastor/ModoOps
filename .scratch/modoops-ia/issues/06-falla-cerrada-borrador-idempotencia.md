# 06: Falla cerrada / Modo borrador + idempotencia + deriva humana

**What to build:** Sin Herramienta no hay write: el Agente devuelve `{status:'needs_tool', draft:{csv|preview}}` o crea `mail.activity` para humano; reintento con mismo `requestId` no duplica ejecución.

**Blocked by:** 02

**Status:** ready-for-agent

- [ ] Tool inexistente → 422 `needs_tool` + `draft` sin escritura
- [ ] Falla cerrada no llama `env[model].write`
- [ ] Mismo `requestId` + tool + Tenant → segunda llamada devuelve mismo `runId` sin duplicar
- [ ] `mail.activity` creada cuando `needs_human`
