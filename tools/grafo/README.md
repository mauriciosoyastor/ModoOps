# Grafo (re-export desde Índice)

La UI vive en `/grafo`. El JSON público y el binding TS se regeneran desde el **Índice de código** (code-review-graph).

## Regenerar

```powershell
# Requiere graph.db actualizado (build/update/watch)
.\.venv-win\Scripts\python.exe tools\grafo\export_grafo_crg.py --force
```

Escribe `web/public/grafo-data.json` y `web/src/lib/grafo/data.ts`.

**Scope A (#217):** solo file-level `nodes`/`edges`. `communities` y `processes` vacíos (sin inventar).

## Tests

```powershell
.\.venv-win\Scripts\python.exe -m pytest tools\grafo\tests\test_export_grafo_crg.py -q
```

## Nota

Los agentes no usan este JSON: usan Laya + CRG (`AGENTS.md`). `/grafo` es superficie humana/demo.
