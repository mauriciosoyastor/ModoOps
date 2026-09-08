"""Check de consistencia del contrato ModoOps v2 (fail-closed, para CI).

Verifica que precios, email y términos v2 estén unificados en todas las
fuentes y que no queden restos v1. Uso: python tools/contrato/check_contrato.py

Falla (exit 1) ante la primera inconsistencia, como sync_catalogo --check.
"""
from __future__ import annotations

import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]

# Fuentes de texto que deben estar unificadas (SSOT + consumidores).
FUENTES_DOC = [
    ROOT / "docs" / "contrato-modoops-completo.html",
    ROOT / "docs" / "contrato-modoops-anexo-A.md",
    ROOT / "docs" / "contrato-modoops-pedagogico.md",
]
FUENTES_EXTRA = [
    ROOT / "CONTEXT.md",
    ROOT / "docs" / "marketing-one-pager.md",
    ROOT / "web" / "src" / "data" / "business.ts",
]
FUENTES_LOGIC = [
    ROOT / "modoops_admin" / "logic" / "contrato_situacion.py",
    ROOT / "modoops_admin" / "logic" / "avisos_mora.py",
]
PDFS = [
    ROOT / "docs" / "contrato-modoops.pdf",
    ROOT / "docs" / "contrato-modoops-pedagogico.pdf",
]

# Términos v2 por archivo (las comparaciones ignoran mayúsculas).
REQUIERE_POR_ARCHIVO = {
    "docs/contrato-modoops-completo.html": [
        "mauriciomatasini27@gmail.com",
        "$800", "$50", "$12 USD/h", "$55 USD", "$150", "$110",
        "0,17%", "25%", "Ley 25.326", "dentro de la jornada",
        "domicilio electrónico",
    ],
    "docs/contrato-modoops-anexo-A.md": [
        "$150", "$12 USD/h", "$55 USD", "25%",
    ],
    "docs/contrato-modoops-pedagogico.md": [
        "$800", "$50", "$12 USD/h", "$55 USD", "$150", "$110",
        "0,17%", "25%", "Ley 25.326", "dentro de la jornada",
        "domicilio electrónico",
    ],
    "modoops_admin/logic/contrato_situacion.py": [
        "listo_cobrar_hito1", "en_go_live", "dentro de la jornada",
    ],
    "modoops_admin/logic/avisos_mora.py": [
        "acta_hito1_texto", "0.0017", "dentro de la jornada",
    ],
}

# Restos v1 prohibidos (P2 eliminó el silencio=aceptación como destrabe;
# "sin silencio=aceptación" sí es válido porque lo niega).
PROHIBIDO = [
    "consultoria.matasini@gmail.com",
    "$10.5",
    "$52 USD",
    "$155",
    "$104",
    "50/50",
    "vale como aceptado",
    "Silencio = aceptación",
]

errores: list[str] = []


def check_archivos_existen() -> None:
    for path in FUENTES_DOC + FUENTES_EXTRA + FUENTES_LOGIC + PDFS:
        if not path.exists():
            errores.append(f"falta archivo: {path.relative_to(ROOT)}")
        elif path.suffix == ".pdf" and path.stat().st_size == 0:
            errores.append(f"PDF vacío: {path.relative_to(ROOT)}")


def check_requiere(por_archivo: dict[str, list[str]]) -> None:
    for rel, terminos in por_archivo.items():
        path = ROOT / rel
        if not path.exists():
            continue
        texto = path.read_text(encoding="utf-8").lower()
        for termino in terminos:
            if termino.lower() not in texto:
                errores.append(f"{rel}: falta {termino!r}")


def check_prohibido(paths: list[Path], terminos: list[str]) -> None:
    for path in paths:
        if not path.exists():
            continue
        texto = path.read_text(encoding="utf-8")
        for termino in terminos:
            if termino in texto:
                errores.append(f"{path.relative_to(ROOT)}: resto v1 {termino!r}")


def main() -> int:
    check_archivos_existen()
    check_requiere(REQUIERE_POR_ARCHIVO)
    check_requiere({"CONTEXT.md": ["mauriciomatasini27@gmail.com"],
                    "docs/marketing-one-pager.md": ["mauriciomatasini27@gmail.com"],
                    "web/src/data/business.ts": ["mauriciomatasini27@gmail.com"]})
    check_prohibido(
        [ROOT / rel for rel in list(REQUIERE_POR_ARCHIVO)],
        PROHIBIDO,
    )
    if errores:
        print("CONTRATO v2 INCONSISTENTE:")
        for error in errores:
            print(f"  - {error}")
        return 1
    print("Contrato v2 consistente.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
