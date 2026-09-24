# PROTOTYPE — Laya recortador (mapa #192 / loop aprendizaje + #198)

Throwaway. No es producción. Pesos: `.models/laya-multilingual` (gitignored).

## Sesión Cursor (canónico)

**Daemon keep-warm + status+diff → `/v1/recortar-git`.** Ver [PROTOTYPE_GIT.md](./PROTOTYPE_GIT.md).

```powershell
.\.venv-win\Scripts\python.exe tools\laya\recortar_client.py -g "…" --json
.\.venv-win\Scripts\python.exe tools\laya\harness_recortador_git.py
```

## Umbral vigente (git sesión)

- Acierto ≥ **4/5**; ahorro ≥ **40%** vs A; wall mediana ≤ **2 s**; no peor que B
- Evidencia: `harness_git_last_run.json`

## Plan vigente

- Sesión: `recortar_client.py` git + `daemon_http.py` `/v1/recortar-git`
- Skill: `.agents/skills/laya-recortador`
