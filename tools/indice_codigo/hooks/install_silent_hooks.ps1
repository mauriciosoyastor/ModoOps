# Install silent CRG hooks for Cursor (Windows) — no mintty.
# Run from repo root:
#   powershell -ExecutionPolicy Bypass -File tools\indice_codigo\hooks\install_silent_hooks.ps1

$ErrorActionPreference = "Stop"
$RepoRoot = (Resolve-Path (Join-Path $PSScriptRoot "..\..\..")).Path
$VenvPyw = Join-Path $RepoRoot ".venv-win\Scripts\pythonw.exe"
$VenvPy = Join-Path $RepoRoot ".venv-win\Scripts\python.exe"
$HookPy = Join-Path $RepoRoot "tools\indice_codigo\hooks\crg_update_hook.py"
$CursorHooksDir = Join-Path $env:USERPROFILE ".cursor\hooks"
$HooksJson = Join-Path $env:USERPROFILE ".cursor\hooks.json"

if (-not (Test-Path $HookPy)) { throw "Missing $HookPy" }

$Py = if (Test-Path $VenvPyw) { $VenvPyw } elseif (Test-Path $VenvPy) { $VenvPy } else { (Get-Command python -ErrorAction Stop).Source }

# Prefer pythonw (no console). Paths without spaces → no nested quotes in JSON.
$cmd = "$Py $HookPy"

$payload = [ordered]@{
  version = 1
  hooks = [ordered]@{
    afterFileEdit = @(
      [ordered]@{ command = $cmd; timeout = 30 }
    )
  }
}
$json = $payload | ConvertTo-Json -Depth 6

New-Item -ItemType Directory -Force -Path $CursorHooksDir | Out-Null
# Backup existing
if (Test-Path $HooksJson) {
  Copy-Item $HooksJson "$HooksJson.bak-$(Get-Date -Format 'yyyyMMddHHmmss')" -Force
}
Set-Content -Path $HooksJson -Value $json -Encoding utf8
Write-Host "Wrote $HooksJson"
Write-Host "command=$cmd"
Write-Host "If code-review-graph install rewrites hooks to .sh, re-run this script."
