# PROTOTYPE — Laya recortador (solo Índice)

Throwaway. No es producción. Pesos: `.models/laya-multilingual` (gitignored).
**No** es el Agente / Techo IA del producto.

## Sesión Cursor (canónico)

Índice CRG → daemon Laya (`/v1/recortar-git`, nombre HTTP histórico) → ≤2 Reads.
Ver skill `laya-recortador` y `AGENTS.md`.

```powershell
$env:USE_TF='0'
$env:LAYA_MODEL_PATH="$PWD\.models\laya-multilingual"
.\.venv-win\Scripts\python.exe tools\laya\recortar_client.py -g "…" -q "…" --json
```

Path A (git status+diff → Laya) **retirado**. Diff local = git a mano.
Legado / harness git: `PROTOTYPE_GIT.md` + `harness_recortador_git.py`.

## Opcional — hits loop / calibración (fuera del critical path)

Harness índice y umbrales de acierto/ahorro son experimento local, no requisito de sesión:

```powershell
.\.venv-win\Scripts\python.exe tools\laya\harness_recortador_indice.py
```

Oros: `archetypes_indice.json` · evidencia: `harness_indice_last_run.json`.
**Gate fine-tune:** no disparar desde este doc.
