# Evidencia — hooks silenciosos (#216 / ticket 01)

Fecha: 2026-09-25T15:21:50-03:00 (re-smoke post code-review)
Hook (Cursor / install): `pythonw` → `tools/indice_codigo/hooks/crg_update_hook.py`

```powershell
$before = @(Get-Process mintty,bash -ErrorAction SilentlyContinue).Count
& "$PWD\.venv-win\Scripts\pythonw.exe" tools\indice_codigo\hooks\crg_update_hook.py
$after = @(Get-Process mintty,bash -ErrorAction SilentlyContinue).Count
```

mintty+git-bash antes=0 despues=0  
Pass = after <= before (no nuevas ventanas del hook). Cursor usa **pythonw** (sin ventana); para JSON en consola se puede invocar el mismo script con `python`.

Install: `tools/indice_codigo/hooks/install_silent_hooks.ps1`
