#!/usr/bin/env python3
"""Sync catalogo.json → docs y modoops_tenant.py (single-source)."""
import json
from pathlib import Path

REPO = Path(__file__).resolve().parents[2]
CATALOGO = REPO / "tools" / "configurador" / "catalogo.json"
TENANT_PY = REPO / "modoops_admin" / "models" / "modoops_tenant.py"


def main():
    data = json.loads(CATALOGO.read_text(encoding="utf-8"))
    mods = data["modules"]
    print(f"Catálogo: {len(mods)} módulos, pricing ancla ${data['pricing']['ancla']['amount']}")
    # Verifica tenant.py contiene todos los keys
    txt = TENANT_PY.read_text(encoding="utf-8")
    missing = [k for k in mods if f'"{k}"' not in txt and f"'{k}'" not in txt]
    if missing:
        print(f"WARN: tenant.py no lista: {missing}")
    else:
        print("OK: tenant.py sincronizado (subset)")
    print("Sync check done — para CI, comparar docs/catalogo-modoops-inicial.md con catalogo.json")


if __name__ == "__main__":
    main()
