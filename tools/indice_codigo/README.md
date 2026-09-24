# Índice de código — prototype (code-review-graph)

Spike local ADR `docs/adr/0010-indice-codigo-vivo-laya-dual.md` · rama `prototype/indice-codigo-crg`.

## Setup

```powershell
pip install code-review-graph
code-review-graph install --platform cursor --no-instructions --no-skills
code-review-graph build
```

`--no-instructions` evita que CRG reescriba `AGENTS.md` (dual A+B lo dueña ModoOps).

MCP: [`.cursor/mcp.json`](../../.cursor/mcp.json). Reiniciá Cursor tras install.

Frescor: preferí `code-review-graph watch` en una terminal, o `update` a mano.
**Windows:** `code-review-graph install` mete hooks `.sh` en `~/.cursor/hooks.json` que abren **mintty/git-bash por cada edit** — desactivalos (hooks vacíos). El repo deja `.cursor/hooks.json` vacío a propósito.

## Seam test

```powershell
python tools\indice_codigo\test_frescor_crg.py
```

Pass = status + `file_summary`/callers sobre probes en `tools/indice_codigo/probes/` + `update --brief` &lt;5s (warm) tras tocar `.ts` y `.astro`. Watch/hooks = manual.

## Notas

- DB: `.code-review-graph/` (gitignored).
- Backup si falla Windows: code-graph-mcp (research).
- Laya path B: `tools/laya/recortar_indice.py` + `recortar_client.py --indice` (ticket 03).
