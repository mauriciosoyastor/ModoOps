---
name: laya-recortador
description: "Recorta candidatos (working tree o Índice de código) con Laya keep-warm a ≤2 paths para Read. Use when exploring local changes or structural questions in ModoOps."
---

# Laya recortador (ModoOps) — dual A/B

Throwaway tooling del agente de Cursor. **No** es el **Agente** / **Techo IA** del producto.

> **Path A:** status+diff → `/v1/recortar-git` → ≤2 paths → Read  
> **Path B:** Índice (code-review-graph search) → mismos candidatos → `/v1/recortar-git` → ≤2 paths → Read  

## When

- **A:** working tree sucio / “qué miro del diff”.
- **B:** tree limpio / “dónde está X” / callers (requiere Índice CRG indexed).
- El usuario nombra recortador o Laya.

## When NOT

- Commits, PRs, UI, Odoo runtime.
- Path A + tree limpio: aborta (`clean_tree`) — usá `--indice` o Grep.
- Path B sin hits: aborta (`no_indice_hits`).

## Workflow

```
1. Goal ES-AR
2. Path A: recortar_client.py -g "…" --json
   Path B: recortar_client.py --indice -g "…" -q "palabras" --json
3. Si abort: avisá; no inventes paths
4. Read SOLO expand[].path (≤2)
5. Respondé
```

## Command (PowerShell, raíz repo)

```powershell
$env:USE_TF='0'
$env:LAYA_MODEL_PATH="$PWD\.models\laya-multilingual"
$env:PYTHONIOENCODING='utf-8'

# A — git
.\.venv-win\Scripts\python.exe tools\laya\recortar_client.py -g "<goal>" --json

# B — Índice
.\.venv-win\Scripts\python.exe tools\laya\recortar_client.py --indice -g "<goal>" -q "<search>" --json
```

## Checklist

```
- [ ] Path A o B según tree limpio/sucio
- [ ] Read solo expand (≤2)
- [ ] No Grep ciego si expand ok
```

## Refs

- `tools/laya/recortar_client.py` · `recortar_git.py` · `recortar_indice.py`
- ADR `docs/adr/0010-indice-codigo-vivo-laya-dual.md`
- Índice: `tools/indice_codigo/README.md`
