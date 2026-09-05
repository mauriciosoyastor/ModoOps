# Mock #86 — Acceso Video-IA en Control Plane (baja fidelidad)

Decisiones: #83 (Remotion + Turbo) · #84 (BFF link externo + `_log`, sin iframe) · #85 (interno master-only, humano siempre, solo ModoOps).

## Dónde aparece

Sección nueva en `web/src/pages/admin/tenants.astro` (no cableada en este mock), solo visible con sesión master:

```
[Tenants header]
...
+ ----------------------------------------------------------+
| Video-IA comercial (interno)                    [Nuevo video] |
| Borradores: pieza-001 (revisión) · pieza-002 (borrador)       |
| Al clic: abre pestaña nueva con el proveedor (link externo). |
| Nada se incrusta en iframe; cada acceso se audita vía _log.  |
+ ----------------------------------------------------------+
```

## Qué pasa al clic

1. `GET /api/admin/tenants/video-access` (stub en `web/src/pages/api/admin/tenants/video-access.ts`) valida sesión (401 si falta).
2. Devuelve `{ url: https://video-proveedor.stub/... }` (placeholder; en real: URL firmada efímera, sin llaves en catálogo).
3. El browser abre pestaña nueva (`target=_blank`). Sin `<iframe>` (#84: clickjacking/sesión).
4. Auditoría pendiente de cablear: `tenant._log('aviso', 'video-access master')` (`modoops_admin/models/modoops_tenant.py:147-156`).

## Qué se guarda (mock: nada persistente)

En real: `prompt`, `proveedor`, `estado (borrador|revisión|final)`, `url`, `autor`, `fecha` — en master, no en tenant; retención a definir (fog del mapa #82).

## Probar el stub

- `GET /api/admin/tenants/video-access` sin sesión → 401 `Tenés que iniciar sesión`.
- Con sesión master → JSON mock con `mode: link-externo`.
