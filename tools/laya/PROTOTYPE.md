# PROTOTYPE — Laya recortador (mapa #192 / loop aprendizaje + #198)

Throwaway. No es producción. Pesos: `.models/laya-multilingual` (gitignored).

## Sesión Cursor (canónico — solo Índice)

**Daemon keep-warm + CRG search → `/v1/recortar-git`.** Ver skill `laya-recortador`.

```powershell
.\.venv-win\Scripts\python.exe tools\laya\recortar_client.py --indice -g "…" -q "…" --json
.\.venv-win\Scripts\python.exe tools\laya\harness_recortador_indice.py
```

## Umbral vigente (índice / hits loop)

- Acierto ≥ **4/5**; ahorro ≥ **40%** vs leer todos los candidatos del search; wall mediana ≤ **2 s**
- Oros: `archetypes_indice.json` · evidencia: `harness_indice_last_run.json`

### Ciclo calibración 1 (2026-09-24)

| | hits | save_A | wall med | nota |
|---|---|---|---|---|
| baseline | 4/5 | 55% | ~0.42s | oro #1 miss: search no traía `ensure_daemon.py` |
| post-query #1 | **5/5** | 50% | ~0.50s | query con path explícito → gold_in_cands |

**Gate fine-tune:** no disparar. Regla: ≥2 ciclos datos+calibración sin subir hits, con save_A≥40%. Este tranche solo midió + calibró query.

## Legado git harness

Fixtures status+diff: `harness_recortador_git.py` / `PROTOTYPE_GIT.md` (path A retirado en sesión).

## Plan vigente

- Sesión: `recortar_client.py --indice` + daemon `/v1/recortar-git`
- Skill: `.agents/skills/laya-recortador`
