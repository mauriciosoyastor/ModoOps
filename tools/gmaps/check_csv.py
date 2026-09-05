"""Checker CSV post-renombre para el import S2 (captación propia).

Uso:  python tools/gmaps/check_csv.py <archivo.csv>
Las 13 columnas canónicas viven en modoops_admin/logic/lead_import.py (GSOM_KEPT);
este script no las duplica. Sin credenciales, sin red.
"""
from __future__ import annotations

import csv
import sys
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[2]
if str(REPO_ROOT) not in sys.path:
    sys.path.insert(0, str(REPO_ROOT))

from modoops_admin.logic.lead_import import GSOM_KEPT, MAX_LEAD_IMPORT_ROWS


def check_csv(path: str | Path) -> dict:
    errors: list[str] = []
    path = Path(path)
    if not path.is_file():
        return {"ok": False, "errors": [f"No existe: {path}"]}
    try:
        raw = path.read_bytes().decode("utf-8-sig")
    except (UnicodeDecodeError, OSError):
        return {"ok": False, "errors": ["Ilegible: se espera CSV UTF-8."]}
    reader = csv.DictReader(raw.splitlines())
    headers = [h for h in (reader.fieldnames or []) if h]
    missing = [h for h in GSOM_KEPT if h not in headers]
    if missing:
        errors.append(f"Faltan columnas S2: {', '.join(missing)}")
    rows = [r for r in reader if any((v or "").strip() for v in r.values())]
    if not rows:
        errors.append("Sin filas de datos.")
    if len(rows) > MAX_LEAD_IMPORT_ROWS:
        errors.append(f"{len(rows)} filas; límite {MAX_LEAD_IMPORT_ROWS}.")
    return {"ok": not errors, "errors": errors, "rows": len(rows)}


def main(argv: list[str]) -> int:
    if len(argv) != 2:
        print("Uso: python tools/gmaps/check_csv.py <archivo.csv>")
        return 2
    result = check_csv(argv[1])
    print(f"ok={result['ok']} filas={result.get('rows', 0)}")
    for error in result["errors"]:
        print(f"- {error}")
    return 0 if result["ok"] else 1


if __name__ == "__main__":
    raise SystemExit(main(sys.argv))
