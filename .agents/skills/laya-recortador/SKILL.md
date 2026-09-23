---
name: laya-recortador
description: >-
  Recorta candidatos de GitNexus query a 1–2 context con Laya keep-warm
  (ensure_daemon + tools/laya/recortar_client.py). Use when exploring ModoOps with
  GitNexus query→context, many processes, or the user mentions recortador/Laya.
  NEVER use tools/laya/recortar.py one-shot (cold ~33s; deprecated mapa #198/#205).
  Not for impact-before-edit, commits, or the tenant Agente.
---

# Laya recortador (ModoOps)

Throwaway tooling del agente de Cursor. **No** es el **Agente** / **Techo IA** del producto.

> **Veredicto mapa [#198](https://github.com/mauriciosoyastor/ModoOps/issues/198) / task [#205](https://github.com/mauriciosoyastor/ModoOps/issues/205):**  
> el camino canónico es **daemon keep-warm + cliente thin**.  
> **`tools/laya/recortar.py` (one-shot) está deprecado** — no lo invoques (cold-load ~33 s por Shell).

## When

- Vas a explorar con `query` GitNexus y después abrir `context` de varios procesos.
- El usuario pide entender un flujo / “cómo funciona X” en este repo.
- El usuario nombra recortador, Laya, o quiere explorar el grafo con menos tokens.

## When NOT

- `impact` previo a editar un símbolo (sigue el árbol GitNexus).
- Commits, PRs, UI, Odoo runtime.
- Sustituir `query` / `context` MCP: el recortador **elige**; vos igual abrís context.
- Selector de skills Matt (falló; no uses Laya para ruteo de flujos).

## Workflow (obligatorio)

```
1. Armá query + goal (ES-AR; nombres de símbolo ayudan)
2. Corré recortar_client.py (abajo) — auto-ensure del daemon en el 1er uso
3. Abrí context SOLO de los 1–2 expand
4. Recién ahí leé código / respondé
```

**Nunca** expandas todos los candidatos del `query` si el cliente devolvió `expand`.  
**Nunca** corras `recortar.py` one-shot.

## Daemon keep-warm (automático)

`recortar_client.py` llama `ensure_daemon.py` al inicio (salvo `--no-ensure`):

| Estado | Qué pasa |
|--------|----------|
| `/health` con `loaded: true` | Instantáneo — ya caliente |
| Daemon caído | Abre **consola nueva** con `daemon_http.py`, espera cold ~30–40s, sigue |
| Cerrar esa consola | Apaga el daemon (siguiente llamada vuelve a cold 1×) |

Solo ensure a mano (opcional):

```powershell
.\.venv-win\Scripts\python.exe tools\laya\ensure_daemon.py
.\.venv-win\Scripts\python.exe tools\laya\ensure_daemon.py --check
```

## Command — cliente thin (PowerShell, raíz del repo)

```powershell
$env:USE_TF='0'
$env:LAYA_MODEL_PATH="$PWD\.models\laya-multilingual"
$env:PYTHONIOENCODING='utf-8'
.\.venv-win\Scripts\python.exe tools\laya\recortar_client.py `
  --query "<conceptos / símbolos>" `
  --goal "<qué querés entender>" `
  --json
```

El cliente: **ensure daemon** → **un** `query` GitNexus → POST a `http://127.0.0.1:8765/v1/recortar`.  
Alternativa sin segundo query: MCP `query` + `--candidates-json` (sigue haciendo ensure).

Con `--json`, leé `expand[]` y `attach_mitigation` / `session_ok`:

| Campo | Uso |
|-------|-----|
| `symbol` + `file` | `context({name, file_path, repo: "ModoOps"})` |
| `process_id` | referencia; no alcanza solo el id |
| `skipped: true` | no hay símbolo en payload → no inventes; seguí al siguiente o un `query` más fino (#206) |
| `attach_mitigation` | raw vs compact: cuántos procesos vacíos recuperó #206 (tapa que miente) |
| `session_ok` | `true` si ambos expand tienen símbolo+file (listo para context) |

### Attach estructural (no es stale)

Si el índice está **fresco** y doctor en paridad pero muchos procesos llegan con `symbols: []` / `skipped` altos: suele ser **dedupe** de `process_symbols` por `symbol.id` (#209 / [#213](https://github.com/mauriciosoyastor/ModoOps/issues/213)). **No** corras `analyze` otra vez esperando curarlo. Usá recovery/fill del daemon (#206) o un `query` más fino. Smoke: `node tools/gitnexus/ensure_smoke.mjs --mode smoke` (warn, no bloquea).

Repo MCP siempre: `"ModoOps"` si hay varios indexados.

## Fallback

Si ensure/cliente falla (sin pesos, sin venv, timeout):

1. Avisá una línea (no caigas a `recortar.py` one-shot).
2. `query` + abrí **como máximo 2** `context` (mejor summary / símbolo en el goal).
3. No abras el resto.

## Checklist

```
- [ ] Repo = ModoOps (raíz)
- [ ] Corrí recortar_client.py (ensure automático; NO recortar.py)
- [ ] Context solo de expand (≤2)
- [ ] No expandí todos los candidatos del query
- [ ] Dejé la consola del daemon abierta si la abrió ensure (keep-warm)
```

## Deprecado

| Artefacto | Estado |
|-----------|--------|
| `tools/laya/recortar.py` | **Deprecated** — cold por invocación |
| Skill workflow one-shot | **Reemplazado** por ensure + `recortar_client.py` |
| `tools/laya/harness_recortador.py` | **Vigente** — regresión offline; no es UX de sesión |

## Refs

- Ensure: `tools/laya/ensure_daemon.py`
- Cliente: `tools/laya/recortar_client.py`
- Daemon: `tools/laya/daemon_http.py`
- Guía v2: `tools/laya/PROTOTYPE_GRAFO_V2.md`
- Harness / umbrales offline: `tools/laya/PROTOTYPE.md`
- Veredicto: mapa #198 / issue #204
