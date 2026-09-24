# PROTOTYPE — Recortador (sesión dual A/B)

Throwaway. Sesión Cursor: **A** status+diff o **B** Índice CRG → Laya `/v1/recortar-git` → ≤2 Reads.
Skill: `.agents/skills/laya-recortador` · ADR `docs/adr/0010-indice-codigo-vivo-laya-dual.md`.

## Question

¿Status+diff → Laya (`/v1/recortar-git`) → ≤2 Reads pasa umbrales (hits ≥4/5, ahorro ≥40% vs A, wall ≤2s, no peor que B)?

Path B (Índice): mismos umbrales de expand ≤2; candidatos desde `code-review-graph search`.

## Run

```powershell
# Daemon (si cold o sin /v1/recortar-git: cerrar consola vieja y ensure)
# ensure no abre segunda consola si :8765 ya está ocupado
$env:USE_TF='0'
$env:LAYA_MODEL_PATH="$PWD\.models\laya-multilingual"
$env:PYTHONIOENCODING='utf-8'
.\.venv-win\Scripts\python.exe tools\laya\ensure_daemon.py

# Harness fixtures (path A)
.\.venv-win\Scripts\python.exe tools\laya\harness_recortador_git.py

# Cliente — path A (git)
.\.venv-win\Scripts\python.exe tools\laya\recortar_client.py -g "…" --json

# Cliente — path B (Índice)
.\.venv-win\Scripts\python.exe tools\laya\recortar_client.py --indice -g "…" -q "…" --json

# Unit seams
.\.venv-win\Scripts\python.exe -m pytest tools\laya\tests\test_recortar_git.py tools\laya\tests\test_recortar_indice.py tools\laya\tests\test_ensure_daemon.py -q
```

## Files

| File | Role |
|------|------|
| `recortar_git.py` | filter/top-20, serialize, pick, collect status+diff |
| `recortar_indice.py` | path B: CRG search → candidatos forma git |
| `daemon_http.py` | `POST /v1/recortar-git` |
| `recortar_client.py` | sesión A/B (`--indice`) |
| `ensure_daemon.py` | keep-warm idempotente (anti double-spawn) |
| `harness_recortador_git.py` | A/B/Laya fixtures |
| `harness_recortador.py` | helpers Laya compartidos |
| `archetypes_git.json` | gold_path + candidates |
| `harness_git_last_run.json` | última evidencia |
