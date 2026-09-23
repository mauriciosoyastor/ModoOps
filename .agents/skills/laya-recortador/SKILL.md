---
name: laya-recortador
description: "Recorta candidatos del working tree (status+diff) con Laya keep-warm a ≤2 paths para Read. Use when exploring local changes in ModoOps without depending on a stale GitNexus index."
---

# Laya recortador (ModoOps) — sesión git

Throwaway tooling del agente de Cursor. **No** es el **Agente** / **Techo IA** del producto.

> **Canónico:** working tree **status+diff** → daemon `/v1/recortar-git` → ≤2 paths → **Read**.  
> El path grafo→Laya queda **soft-deprecated** (harness offline puede vivir; la sesión no lo usa).
> ADR: `docs/adr/0010-laya-recortador-git-not-grafo.md`.

## When

- Vas a explorar código tocado en el working tree y querés elegir qué leer primero.
- El usuario pide entender un cambio local / “qué miro del diff”.
- El usuario nombra recortador, Laya, o quiere menos tokens sin depender del índice GitNexus.

## When NOT

- `impact` previo a editar un símbolo (sigue el árbol GitNexus).
- Commits, PRs, UI, Odoo runtime.
- Sustituir `impact` / `context` cuando necesitás callers tipados — eso sigue siendo grafo.
- Tree limpio: la skill **aborta** (no cae al grafo).

## Workflow (obligatorio)

```
1. Armá goal (ES-AR; nombres de símbolo/path ayudan)
2. Corré recortar_client.py (ensure daemon; status+diff automático)
3. Si abort (clean_tree): avisá; no inventes paths ni abras grafo-Laya
4. Abrí Read SOLO de expand[].path (≤2)
5. Recién ahí respondé
```

**Nunca** expandas todos los archivos sucios si el cliente devolvió `expand`.  
**Nunca** corras `recortar.py` one-shot.  
**Nunca** uses `--grafo` en sesión salvo diagnóstico legacy explícito.

## Daemon keep-warm (automático)

`recortar_client.py` llama `ensure_daemon.py` al inicio (salvo `--no-ensure`).

Si el daemon es viejo (404 en `/v1/recortar-git`): cerrá su consola y volvé a ensure.

## Command — cliente thin (PowerShell, raíz del repo)

```powershell
$env:USE_TF='0'
$env:LAYA_MODEL_PATH="$PWD\.models\laya-multilingual"
$env:PYTHONIOENCODING='utf-8'
.\.venv-win\Scripts\python.exe tools\laya\recortar_client.py `
  --goal "<qué querés entender>" `
  --json
```

Opcional: `--query` con palabras clave; `--candidates-json` para fixtures.

Con `--json`, leé `expand[]` y `session_ok` / `abort`:

| Campo | Uso |
|-------|-----|
| `expand[].path` / `file` | `Read` de ese path |
| `abort: true` + `abort_reason: clean_tree` | no hay candidatos — no inventes |
| `session_ok` | `true` si expand tiene paths legibles |

### Legacy (soft-deprecated)

```powershell
.\.venv-win\Scripts\python.exe tools\laya\recortar_client.py `
  --grafo -q "<query grafo>" -g "<goal>" --json
```

Solo harness/diagnóstico. Preferí git.

## Fallback

Si ensure/cliente falla (sin pesos, sin venv, timeout, 404 de endpoint viejo):

1. Avisá una línea (no caigas a `recortar.py` one-shot ni a grafo-Laya).
2. `Read` como máximo 2 paths del `git status` elegidos a mano.
3. No abras el resto.

## Checklist

```
- [ ] Repo = ModoOps (raíz)
- [ ] Corrí recortar_client.py sin --grafo
- [ ] Read solo de expand (≤2) o abort limpio
- [ ] No expandí todos los archivos sucios
- [ ] Dejé la consola del daemon abierta si la abrió ensure
```

## Harness

```powershell
.\.venv-win\Scripts\python.exe tools\laya\harness_recortador_git.py
```

Umbrales: hits ≥4/5, ahorro vs A ≥40%, wall mediana ≤2s, no peor que B.

## Refs

- Ensure: `tools/laya/ensure_daemon.py`
- Cliente: `tools/laya/recortar_client.py`
- Módulo git: `tools/laya/recortar_git.py`
- Daemon: `tools/laya/daemon_http.py` (`/v1/recortar-git`)
- PROTOTYPE: `tools/laya/PROTOTYPE_GIT.md`
- ADR: `docs/adr/0010-laya-recortador-git-not-grafo.md`
