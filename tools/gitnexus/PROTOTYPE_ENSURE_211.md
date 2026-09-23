# PROTOTYPE — Ensure + smoke symbols (#211)

> Throwaway origin. Map [#207](https://github.com/mauriciosoyastor/ModoOps/issues/207) **closed** (veredicto [#212](https://github.com/mauriciosoyastor/ModoOps/issues/212)).
> Contrato [#210](https://github.com/mauriciosoyastor/ModoOps/issues/210). Branch: `prototype/ensure-smoke-211`.
> **Promovido (implement):** `.cursor/hooks.json` → `hook_notify_stale.mjs`; docs en skill `gitnexus-cli` + `AGENTS.md`; deuda attach [#213](https://github.com/mauriciosoyastor/ModoOps/issues/213).

## Question

¿Un prototipo (script + doc) de `ensure`/notify + smoke (`doctor`/status + sample `query` con symbols + opcional `recortar_client`) demuestra el camino **notify+ensure sin analyze bloqueante en cada save**?

## How to run

```bash
node tools/gitnexus/ensure_smoke.mjs
node tools/gitnexus/ensure_smoke.mjs --mode notify
node tools/gitnexus/ensure_smoke.mjs --mode ensure
node tools/gitnexus/ensure_smoke.mjs --mode smoke
# Solo ensure (fuera del hot path): incremental
node tools/gitnexus/ensure_smoke.mjs --mode ensure --analyze
```

Hook stub (no instalado en main):

```bash
# Simular postToolUse tras git commit
echo '{"tool_name":"Shell","command":"git commit -m x","tool_output":{"exit_code":0}}' | node tools/gitnexus/hook_notify_stale.mjs
```

Evidencia: `tools/gitnexus/ensure_smoke_last.json`.

## Gates

| Gate | PASS si |
|------|---------|
| **Path** | `notify` y `ensure` **no** spawnean `analyze` en el hot path; `--analyze` solo con `--mode ensure` |
| **Smoke attach** | ≥80% attach (filas reales en `process_symbols` por `process_id`) en **3** queries fijas (2 del harness Laya + tenant) |
| **Stale vs estructural** | Índice stale → smoke `cause=stale`; fresco + attach bajo → `cause=dedupe/structural` + hint #206 |

`path_pass` responde la pregunta del ticket. `smoke_attach` es el SLA de #210 (puede FAIL por dedupe #209 sin invalidar el camino).

## Out of this prototype

- Instalar `.cursor/hooks.json` en main
- CI job `grafo`
- `--force --embeddings` en el hot path
