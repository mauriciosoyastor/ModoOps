"""TenantModuleService puro — desduplica wizard batch + single.

Recibe VO + labels + action, devuelve nuevo VO.
Sin ORM, sin UserError (ValueError puro).
"""

from __future__ import annotations

from typing import Literal

from .modules_instalados import ModulesInstalados

Action = Literal["install", "remove"]


def apply_modules(
    current: ModulesInstalados,
    module_labels: list[str],
    action: Action,
) -> ModulesInstalados:
    if not module_labels:
        raise ValueError("Seleccioná al menos un módulo del Catálogo.")
    cur = current
    if action == "install":
        for lb in module_labels:
            cur = cur.add(lb)
        return cur
    # remove
    for lb in module_labels:
        cur = cur.remove(lb)
    return cur
