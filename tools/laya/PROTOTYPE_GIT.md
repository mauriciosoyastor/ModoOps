# PROTOTYPE — Recortador Laya (solo Índice)

Throwaway. Sesión Cursor: **Índice CRG** → Laya `/v1/recortar-git` → ≤2 Reads.
Path A (git→Laya) **retirado**. Skill: `.agents/skills/laya-recortador` · ADR `docs/adr/0010-indice-codigo-vivo-laya-dual.md` · #216.

## Question

¿Índice search → Laya → ≤2 Reads pasa umbrales de expand útiles (session_ok, sin Grep previo)?

## Run

```powershell
$env:USE_TF='0'
$env:LAYA_MODEL_PATH="$PWD\.models\laya-multilingual"
$env:PYTHONIOENCODING='utf-8'
.\.venv-win\Scripts\python.exe tools\laya\ensure_daemon.py

.\.venv-win\Scripts\python.exe tools\laya\recortar_client.py -g "…" -q "…" --json

.\.venv-win\Scripts\python.exe -m pytest tools\laya\tests\test_recortar_indice.py tools\laya\tests\test_recortar_client_solo_indice.py tools\laya\tests\test_ensure_daemon.py -q
```

## Files

| File | Role |
|------|------|
| `recortar_indice.py` | CRG search → candidatos |
| `recortar_git.py` | filter/rank/pick (shared); collect git **no** es sesión |
| `daemon_http.py` | `POST /v1/recortar-git` |
| `recortar_client.py` | sesión solo índice |
| `ensure_daemon.py` | keep-warm anti double-spawn |
