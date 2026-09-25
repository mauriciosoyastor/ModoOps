---
name: laya-recortador
description: "Recorta candidatos del Índice de código (CRG) con Laya keep-warm a ≤2 paths para Read. Solo grafo — sin path git. Use when exploring structural questions in ModoOps."
---

# Laya recortador (ModoOps) — solo Índice

Throwaway tooling del agente de Cursor. **No** es el **Agente** / **Techo IA** del producto.

> **Canon:** Índice (code-review-graph search) → daemon Laya → ≤2 paths → Read  
> Endpoint HTTP: `/v1/recortar-git` (nombre histórico; el body es Índice, **no** git status+diff).  
> Path A (git status+diff → Laya) **retirado**. Diff local = git a mano.  
> Con Índice up: **no** `Grep`/`Glob` estructurales primero.

## When

- Tree limpio o sucio: “dónde está X” / callers / exploración estructural.
- El usuario nombra recortador o Laya.

## When NOT

- Commits, PRs, UI, Odoo runtime.
- “Qué mirar del diff” — usá `git status` / diff; **no** Laya.
- Sin hits: abort `no_indice_hits` — ahí sí Grep/CLI CRG.
- Sustituir Índice por Grep “por las dudas” con Índice respondiendo.

## Workflow

```
1. Goal ES-AR + -q palabras de search
2. recortar_client.py -g "…" -q "…" --json
3. Si abort: avisá; fallback Grep solo entonces (o CRG down)
4. Read SOLO expand[].path (≤2)
5. Respondé — sin Grep estructural extra si expand ok
```

## Command (PowerShell, raíz repo)

```powershell
$env:USE_TF='0'
$env:LAYA_MODEL_PATH="$PWD\.models\laya-multilingual"
$env:PYTHONIOENCODING='utf-8'

.\.venv-win\Scripts\python.exe tools\laya\recortar_client.py -g "<goal>" -q "<search>" --json
```

## Checklist

```
- [ ] Solo Índice (no path git→Laya)
- [ ] No Grep/Glob estructurales antes de recortar / CRG
- [ ] Read solo expand (≤2)
- [ ] Grep solo tras abort o CRG down
```

## Refs

- `tools/laya/recortar_client.py` · `recortar_indice.py`
- Frescor: `tools/indice_codigo/hooks/` + README
- ADR `docs/adr/0010-indice-codigo-vivo-laya-dual.md`
- `AGENTS.md` § Exploración
