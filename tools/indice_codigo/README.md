# Índice de código — prototype (code-review-graph)

Spike local ADR `docs/adr/0010-indice-codigo-vivo-laya-dual.md` · rama `prototype/indice-codigo-crg` · follow-up [#216](https://github.com/mauriciosoyastor/ModoOps/issues/216).

## Setup

```powershell
pip install code-review-graph
code-review-graph install --platform cursor --no-instructions --no-skills
code-review-graph build
```

`--no-instructions` evita que CRG reescriba `AGENTS.md`.

MCP: [`.cursor/mcp.json`](../../.cursor/mcp.json). Reiniciá Cursor tras install.

## Frescor (sin mintty)

```powershell
powershell -ExecutionPolicy Bypass -File tools\indice_codigo\hooks\install_silent_hooks.ps1
```

Eso escribe `~/.cursor/hooks.json` → `pythonw` + `hooks/crg_update_hook.py` (`update --skip-flows`, debounce 2s, `CREATE_NO_WINDOW`).

**Si `code-review-graph install` vuelve a poner hooks `.sh`:** re-ejecutá el script (hace backup del json).

Alternativa: `code-review-graph watch` en **una** terminal.

## Seam test

```powershell
python -m pytest tools\indice_codigo\tests\test_crg_update_hook.py tools\indice_codigo\test_frescor_crg.py -q
```

Pass = hook debounce/update mocked + status/query/update &lt;5s sobre probes.

## Laya (solo Índice)

```powershell
.\.venv-win\Scripts\python.exe tools\laya\recortar_client.py -g "<goal>" -q "<search>" --json
```

Path A (git→Laya) **retirado**. Diff = git a mano. B hard: ver `AGENTS.md`.

## Notas

- DB: `.code-review-graph/` (gitignored).
- Backup motor: code-graph-mcp (research).
