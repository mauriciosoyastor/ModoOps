"""Deep module modoops_catalogo — interface pequeña, implementation profunda.

SSOT = modoops_catalogo/catalogo.json. Toda validación (hard gate módulo inexistente,
hard gate fiscal sin anexo, horas/techo) vive detrás de esta interface.
Internal seams (toTsUnion, toMarkdown, _generated_*) no son parte de la tapa pública.
"""

from __future__ import annotations

import json
from pathlib import Path
from typing import Any

CATALOGO_PATH = Path(__file__).resolve().parent / "catalogo.json"


class Catalogo:
    """Deep module: tapa chica, mucho adentro."""

    def __init__(self, data: dict[str, Any]):
        self._data = data
        self._modules: dict[str, Any] = data.get("modules", {})
        self._pricing: dict[str, Any] = data.get("pricing", {})

    @classmethod
    def load(cls, path: Path | None = None) -> "Catalogo":
        p = path or CATALOGO_PATH
        data = json.loads(p.read_text(encoding="utf-8"))
        return cls(data)

    # -- tapa pública (6 métodos) --

    def get(self, key: str) -> dict[str, Any] | None:
        return self._modules.get(key)

    def allKeys(self) -> list[str]:
        return list(self._modules.keys())

    def validate(self, keys: list[str], anexo_fiscal_ref: str | None = None) -> dict[str, Any]:
        errors: list[str] = []
        for k in keys:
            if k not in self._modules:
                errors.append(f"Módulo '{k}' no existe en catálogo (universo = Catálogo)")
        if "fiscal_ar" in keys and not anexo_fiscal_ref:
            errors.append("Falta anexo_fiscal_ref para Fiscal AR (hard gate)")
        return {"valid": len(errors) == 0, "errors": errors}

    def toSelection(self) -> list[tuple[str, str]]:
        """Para Odoo Selection: [(key, label)]"""
        out: list[tuple[str, str]] = []
        for k, v in self._modules.items():
            label = v.get("label") or v.get("modoops") or k
            out.append((k, label))
        return out

    def pricing(self) -> dict[str, Any]:
        return self._pricing

    def horasFor(self, keys: list[str]) -> int:
        total = 0
        for k in keys:
            mod = self._modules.get(k)
            if mod and isinstance(mod.get("horas"), int):
                total += mod["horas"]
            else:
                total += 10  # fallback
        return total

    # -- helpers de dominio (no exponer como tapa principal pero útiles) --
    def techoHoras(self) -> int:
        return int(self._pricing.get("ancla", {}).get("techo_horas", 92))

    def techoAjustes(self) -> int:
        return int(self._pricing.get("ancla", {}).get("techo_ajustes", 8))


# Singleton lazy para consumers que no inyectan
_catalogo_singleton: Catalogo | None = None


def get_catalogo(path: Path | None = None) -> Catalogo:
    global _catalogo_singleton
    if path is not None:
        return Catalogo.load(path)
    if _catalogo_singleton is None:
        _catalogo_singleton = Catalogo.load()
    return _catalogo_singleton


# Re-exports para `from modoops_catalogo import ...`
__all__ = ["Catalogo", "get_catalogo", "CATALOGO_PATH"]
