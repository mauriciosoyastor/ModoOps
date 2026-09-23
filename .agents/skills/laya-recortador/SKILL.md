---
name: laya-recortador
description: >-
  Recorta candidatos de GitNexus query a 1–2 context con Laya keep-warm
  (daemon HTTP + tools/laya/recortar_client.py). Use when exploring ModoOps with
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
2. Asegurá daemon keep-warm (abajo). Cold solo 1× al levantar el proceso.
3. Corré recortar_client.py (NO recortar.py)
4. Abrí context SOLO de los 1–2 expand
5. Recién ahí leé código / respondé
```

**Nunca** expandas todos los candidatos del `query` si el cliente devolvió `expand`.  
**Nunca** corras `recortar.py` one-shot.

## Daemon (una vez por sesión de máquina)

```powershell
# Health
Invoke-WebRequest http://127.0.0.1:8765/health -UseBasicParsing

# Si falla — Terminal aparte (cold ~33s una vez):
$env:USE_TF='0'
$env:LAYA_MODEL_PATH="$PWD\.models\laya-multilingual"
$env:PYTHONIOENCODING='utf-8'
.\.venv-win\Scripts\python.exe tools\laya\daemon_http.py
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

El cliente hace **un** `query` GitNexus y POSTea candidatos a `http://127.0.0.1:8765/v1/recortar` (Laya ya cargada).  
Alternativa sin segundo query en el cliente: MCP `query` + `--candidates-json` hacia el mismo endpoint.

Con `--json`, leé `expand[]`:

| Campo | Uso |
|-------|-----|
| `symbol` + `file` | `context({name, file_path, repo: "ModoOps"})` |
| `process_id` | referencia; no alcanza solo el id |
| `skipped: true` | no hay símbolo en payload → no inventes; seguí al siguiente o un `query` más fino (#206) |

Repo MCP siempre: `"ModoOps"` si hay varios indexados.

## Fallback

Si el daemon/cliente falla (sin pesos, sin venv, puerto caído, timeout):

1. Avisá una línea (no caigas a `recortar.py` one-shot).
2. `query` + abrí **como máximo 2** `context` (mejor summary / símbolo en el goal).
3. No abras el resto.

## Checklist

```
- [ ] Repo = ModoOps (raíz)
- [ ] Daemon /health OK (o fallback ≤2 context)
- [ ] Usé recortar_client.py — NO recortar.py
- [ ] Context solo de expand (≤2)
- [ ] No expandí todos los candidatos del query
```

## Deprecado

| Artefacto | Estado |
|-----------|--------|
| `tools/laya/recortar.py` | **Deprecated** — cold por invocación |
| Skill workflow one-shot | **Reemplazado** por daemon + `recortar_client.py` |
| `tools/laya/harness_recortador.py` | **Vigente** — regresión offline; no es UX de sesión |

## Refs

- Cliente: `tools/laya/recortar_client.py`
- Daemon: `tools/laya/daemon_http.py`
- Guía v2: `tools/laya/PROTOTYPE_GRAFO_V2.md`
- Harness / umbrales offline: `tools/laya/PROTOTYPE.md`
- Veredicto: mapa #198 / issue #204
