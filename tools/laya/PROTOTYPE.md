# PROTOTYPE — Laya recortador (mapa #192 / loop aprendizaje + #198)

Throwaway. No es producción. Pesos: `.models/laya-multilingual` (gitignored).

## Sesión Cursor (canónico — mapa #198 / #205)

**Daemon keep-warm + cliente thin.** No uses one-shot.

Ver: [PROTOTYPE_GRAFO_V2.md](./PROTOTYPE_GRAFO_V2.md) · skill `.agents/skills/laya-recortador`.

```powershell
# Terminal 1: daemon (cold 1×)
$env:USE_TF='0'; $env:LAYA_MODEL_PATH="$PWD\.models\laya-multilingual"
.\.venv-win\Scripts\python.exe tools\laya\daemon_http.py

# Terminal 2 / agente: cliente thin
.\.venv-win\Scripts\python.exe tools\laya\recortar_client.py `
  --query "…" --goal "…" --json
```

## One-shot — DEPRECATED (#205)

`tools/laya/recortar.py` carga Laya en cada Shell (~33 s). **No lo uses en sesión.**  
Queda solo por compatibilidad / comparación; el agente debe ignorarlo.

```powershell
# DEPRECATED — no invocar desde la skill
.\.venv-win\Scripts\python.exe tools\laya\recortar.py -q "…" -g "…" --json
```

## Harness (medir acierto / ahorro)

```powershell
$env:USE_TF='0'
$env:LAYA_MODEL_PATH="$PWD\.models\laya-multilingual"
$env:PYTHONIOENCODING='utf-8'
.\.venv-win\Scripts\python.exe tools\laya\harness_recortador.py
```

## Umbral vigente

- Acierto ≥ **4/5** (meta extra: 5/5); set mayor → ≥ **80%**
- Ahorro ≥ **40%**
- Oro: `gold_symbol` + `gold_file`
- Híbrido: `|Δprio|<0.02` / `|Δp|<0.15`; `prio_tie` → choice + peer

## Plan vigente

Loop — [laya-loop-aprendizaje.md](../../docs/research/laya-loop-aprendizaje.md)

- **Ciclo 3** → **PASS 5/5 · 46.7%**
- Sesión: `daemon_http.py` + `recortar_client.py` (`recortar.py` **deprecated** #205)
- Skill Cursor: `.agents/skills/laya-recortador`
- Veredicto #204: Recortador daemon; Selector Matt archivado

## Corridas

| Paso | Hits | Ahorro | Verdict |
|------|------|--------|---------|
| PASS híbrido / ciclo 0–1 | 4/5 | ~46% | PASS |
| Ciclo 2 (overlap) | 3/5 | 41.4% | FAIL → revertido |
| **Ciclo 3** (sustituir `#5` hub copy) | **5/5** | **46.7%** | **PASS** |

Oros: `mockLLM`, `esAncla`, `validarBorrador`, `fetchTenantState`, `apply_sales_hub_copy`.
