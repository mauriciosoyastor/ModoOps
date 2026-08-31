"""Lógica pura Configurador ModoOps — sin ORM, testeable offline."""

import json
import hashlib
from pathlib import Path

CATALOGO_PATH = Path(__file__).resolve().parents[2] / "modoops_catalogo" / "catalogo.json"  # SSOT (ADR 0009)

# horas estimadas por módulo — SSOT modoops_catalogo/catalogo.json (ADR 0009)
from modoops_catalogo import get_catalogo as _get_catalogo

_cat = _get_catalogo()
HORAS = {k: _cat.get(k).get("horas", 10) for k in _cat.allKeys()}


def _load_catalogo():
    # intenta SSOT modoops_catalogo, fallback legacy
    try:
        from modoops_catalogo import get_catalogo

        c = get_catalogo()
        return {"modules": {k: c.get(k) for k in c.allKeys()}, "pricing": c.pricing(), "_catalogo_obj": c}
    except Exception:
        data = json.loads(CATALOGO_PATH.read_text(encoding="utf-8"))
        return data


def generar(inp: dict, catalogo=None) -> dict:
    # seam inyectable: catalogo puede ser dict legacy o Catalogo object; si None, carga SSOT
    vertical = inp.get("vertical", "retail")
    modulos = inp.get("modulos_tildados", [])
    sku = inp.get("sku_count", 0)
    anexo = inp.get("anexo_fiscal_ref")
    ars_tc = inp.get("ars_tipo_cambio")

    _loaded = catalogo if catalogo is not None else _load_catalogo()
    # soporta Catalogo object (tiene pricing() method) o dict
    if hasattr(_loaded, "pricing") and callable(getattr(_loaded, "pricing")):
        # Catalogo object
        c_obj = _loaded
        modules = {k: c_obj.get(k) for k in c_obj.allKeys()}
        pricing = c_obj.pricing()
        # delega validate a interface si existe
        val = c_obj.validate(modulos, anexo)
        _pre_errors = val.get("errors", [])
    else:
        c_obj = None
        modules = _loaded["modules"]
        pricing = _loaded["pricing"]
        _pre_errors = []

    # si tenemos Catalogo object, delega hard gates a interface (single seam)
    if c_obj is not None:
        errors = list(_pre_errors)
    else:
        errors = []
        # Hard gate: módulo fuera de catálogo
        for m in modulos:
            if m not in modules:
                errors.append(f"Módulo '{m}' no existe en catálogo (universo = Catálogo)")

        # Hard gate: fiscal sin anexo
        if "fiscal_ar" in modulos and not anexo:
            errors.append("Falta anexo_fiscal_ref para Fiscal AR (hard gate)")
    warnings = []

    # Soft gate: sku >500
    if sku and sku > 500:
        warnings.append(f"SKU {sku} supera tope 500 → tramo extra días×52 (migración)")

    # Techo horas
    total_horas = sum(HORAS.get(m, 10) for m in modulos)
    # plataforma siempre suma aunque no tildada? ya está en modulos si tildada
    if total_horas > pricing["ancla"]["techo_horas"]:
        warnings.append(f"Total horas {total_horas} supera techo 92h → oferta Fase 2 días×52")
    if total_horas > pricing["ancla"]["techo_horas"] + pricing["ancla"]["techo_ajustes"]:
        # ya cubierto
        pass

    # precio
    precio = {
        "ancla": pricing["ancla"]["amount"],
        "validez_dias": pricing["ancla"]["validez_dias"],
        "anticipo": pricing["ancla"]["anticipo"],
        "credito": pricing["descubrimiento"]["credito"],
        "anticipo_neto": pricing["ancla"]["anticipo"] - pricing["descubrimiento"]["credito"],
        "tarifa_hora_adicional": pricing["tarifa_hora_adicional"],
        "addons": [],
    }
    if sku and sku > 0:
        # migracion add-on si sku >0 y no supera? pero para test, no afecta precio ancla
        precio["addons"].append("migracion_excel")
    if ars_tc:
        precio["ars_tipo_cambio"] = ars_tc

    # Lista cerrada (comercial sin odoo, técnico con mapeo)
    lista = []
    for m in modulos:
        if m in modules:
            lista.append({"key": m, "modoops": modules[m]["modoops"]})

    anexo_tecnico = {"mapeo": {k: {"odoo": v.get("odoo", []), "version": v.get("version")} for k, v in modules.items() if k in modulos}}

    # Propuesta comercial MD (marca blanca)
    comercial_md = f"# Propuesta Comercial ModoOps — {vertical}\n\n## Lista cerrada\n"
    for item in lista:
        comercial_md += f"- {item['modoops']}\n"
    comercial_md += f"\nPrecio ancla ${precio['ancla']} validez {precio['validez_dias']}d anticipo ${precio['anticipo_neto']} (crédito ${precio['credito']})\n"
    if warnings:
        comercial_md += "\n> Warnings: " + "; ".join(warnings) + "\n"

    propuesta = {"comercial_md": comercial_md, "validez": precio["validez_dias"]}

    # hash para auditoría
    hash_input = hashlib.sha256(json.dumps(inp, sort_keys=True).encode()).hexdigest()[:12]

    return {
        "lista_cerrada": lista,
        "propuesta": propuesta,
        "anexo_tecnico": anexo_tecnico,
        "precio": precio,
        "errors": errors,
        "warnings": warnings,
        "hash": hash_input,
    }
