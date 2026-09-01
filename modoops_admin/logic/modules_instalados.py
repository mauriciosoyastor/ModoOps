"""VO ModulesInstalados — pure, testeable sin Odoo.

Encapsula CSV `modules_installed` (labels Catálogo, ej: "Mostrador, Fiscal AR").
Reemplaza split/contains clonados en model + wizard.
"""

from __future__ import annotations

from dataclasses import dataclass


@dataclass(frozen=True)
class ModulesInstalados:
    _labels: tuple[str, ...]

    @classmethod
    def from_csv(cls, csv: str | None) -> "ModulesInstalados":
        if not csv:
            return cls(())
        parts = tuple(s.strip() for s in csv.split(",") if s.strip())
        return cls(parts)

    def to_csv(self) -> str | bool:
        if not self._labels:
            return False
        return ", ".join(self._labels)

    def to_list(self) -> list[str]:
        return list(self._labels)

    @property
    def count(self) -> int:
        return len(self._labels)

    def contains(self, label: str) -> bool:
        return label in self._labels

    def add(self, label: str) -> "ModulesInstalados":
        if label in self._labels:
            raise ValueError(f"Módulo '{label}' ya instalado")
        return ModulesInstalados((*self._labels, label))

    def remove(self, label: str) -> "ModulesInstalados":
        if label not in self._labels:
            raise ValueError(f"Módulo '{label}' no instalado")
        return ModulesInstalados(tuple(c for c in self._labels if c != label))

    def add_many(self, labels: list[str]) -> "ModulesInstalados":
        cur = self
        for lb in labels:
            cur = cur.add(lb)
        return cur

    def remove_many(self, labels: list[str]) -> "ModulesInstalados":
        cur = self
        for lb in labels:
            cur = cur.remove(lb)
        return cur
