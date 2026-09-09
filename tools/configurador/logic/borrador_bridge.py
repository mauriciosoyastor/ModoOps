"""Puente borrador v1 → Configurador (ticket 02).

Función pura: convierte el borrador JSON v1 que carga el Prospecto en el
portal (`web/src/lib/oficina-mapping.ts` `construirBorrador`) al input que
entiende `generar` (`tools/configurador/logic/configurador.py`).

Reglas de traducción:
- `vertical` ← `prospecto.rubro` (el portal solo conoce retail/distribución/servicios).
- `sucursales` / `usuarios` ← prospecto.
- `cajas_pos` ← ficha del mostrador (autoridad); si es 0, cae a `prospecto.cajas`.
- `almacenes` ← ficha de la estantería.
- `lista_precios` ← ficha de la góndola.
- `sku_count` ← `datos.productos_aprox` (conteo, sin upload).
- `modulos_tildados` ← ancla + futuros, en ese orden, sin duplicados.
- `anexo_fiscal_ref` ← siempre None: el portal nunca trae anexo firmado por
  diseño; `generar` da hard gate fiscal y el consultor lo cierra en el
  Descubrimiento con la referencia real (p. ej. "AF-2026-014").

Sin filesystem, sin Odoo, sin red: todo sale del dict de entrada.
"""

from __future__ import annotations


def traducir_borrador(borrador: dict) -> dict:
    prospecto = borrador.get("prospecto") or {}
    objetos = borrador.get("objetos") or {}
    datos = borrador.get("datos") or {}

    mostrador = objetos.get("mostrador-3d") or {}
    estanteria = objetos.get("estanteria-3d") or {}
    gondola = objetos.get("gondola-3d") or {}

    cajas = _entero(mostrador.get("cajas")) or _entero(prospecto.get("cajas"))

    modulos: list[str] = []
    for m in list(borrador.get("modulos_ancla") or []) + list(borrador.get("modulos_futuros") or []):
        if m not in modulos:
            modulos.append(m)

    return {
        "vertical": prospecto.get("rubro") or "retail",
        "sucursales": _entero(prospecto.get("sucursales")) or 1,
        "almacenes": _entero(estanteria.get("almacenes")) or 1,
        "cajas_pos": cajas or 1,
        "modulos_tildados": modulos,
        "anexo_fiscal_ref": None,
        "sku_count": _entero(datos.get("productos_aprox")),
        "usuarios": _entero(prospecto.get("usuarios")) or 1,
        "lista_precios": _entero(gondola.get("listas_precio")) or 1,
    }


def _entero(v) -> int:
    try:
        n = int(v)
    except (TypeError, ValueError):
        return 0
    return max(n, 0)
