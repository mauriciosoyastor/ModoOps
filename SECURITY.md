# Security Policy

## Supported Versions

| Version | Supported |
| ------- | --------- |
| `main`  | ✅        |
| otras ramas | ❌ solo se parchea `main` (backport a pedido) |

## Reporting a Vulnerability

**No abras un issue público** para vulnerabilidades.

1. Email a **mauriciomatasini@soyastor.com.ar** con asunto `[SECURITY] ModoOps — breve descripción`.
2. Incluí: pasos para reproducir, impacto, y si tenés POC o fix sugerido.
3. Recibirás acuse en **48 h**. Objetivo de triage: **5 días hábiles**. Fix o mitigación en **14 días** para severidad alta/crítica.

Si preferís canal privado en GitHub, usá **Security → Report a vulnerability** (Private vulnerability reporting) si está habilitado en el repo.

## Qué cubre

- `modoops_ia` (Odoo + lógica pura), `worker.js` (BFF/Orquestador Cloudflare Worker), `web/` (Astro BFF).
- Infra multi-DB (`modoops_<cliente>`, Control Plane `modoops_master`) en alcance de diseño; el hardening del VPS no es de este repo.

## Medidas activas

- **CI**: `pytest` (19 tests en `modoops_ia/tests`), `check:deploy-contract`, `check:grafo` opcional, `npm run build`.
- **CodeQL** semanal (JS + Python) en `.github/workflows/codeql.yml`.
- **Dependabot** semanal para `npm` y `pip` (ver `.github/dependabot.yml`).
- **Secret scanning / push protection** habilitado en GitHub (Settings → Code security). Si ves un push bloqueado por secreto, rotá la credencial y reescribí el commit.

## Buenas prácticas para contribuidores

- Nunca commitees `.dev.vars`, `serviceAccount.json`, `*.pem` ni `MODOOPS_AGENT_API_KEY`. Usá `.env.example` como plantilla.
- Toda query IA pasa por el BFF con `Contexto Tenant` (`db_name`); no agregues rutas con `auth='public'` sin ADR.
- Antes de PR: `python -m pytest -q` y `npm run check:deploy-contract` deben pasar en verde.

## Disclosure

Coordinated disclosure: publicamos advisory y release con fix; crédito al reportante si lo desea.
