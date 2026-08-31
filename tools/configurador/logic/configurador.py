"""Lógica pura Configurador ModoOps — sin ORM, testeable offline."""

import json
import hashlib
from pathlib import Path

CATALOGO_PATH = Path(__file__).resolve().parents[1] / "catalogo.json"

# horas estimadas por módulo (para techo 92h)
HORAS = {
    "mostrador": 25,
    "deposito": 20,
    "ventas": 15,
    "compras": 15,
    "fiscal_ar": 15,
    "contactos": 5,
    "plataforma": 10,
    "puente_factura": 5,
    "taller": 20,
    "b2b_basico": 20,
    "migracion_excel": 10,
}


def _load_catalogo():
    data = json.loads(CATALOGO_PATH.read_text(encoding="utf-8"))
    return data


def generar(inp: dict) -> dict:
    catalogo = _load_catalogo()
    modules = catalogo["modules"]
    pricing = catalogo["pricing"]

    errors = []
    warnings = []

    vertical = inp.get("vertical", "retail")
    modulos = inp.get("modulos_tildados", [])
    sku = inp.get("sku_count", 0)
    anexo = inp.get("anexo_fiscal_ref")
    ars_tc = inp.get("ars_tipo_cambio")

    # Hard gate: módulo fuera de catálogo
    for m in modulos:
        if m not in modules:
            errors.append(f"Módulo '{m}' no existe en catálogo (universo = Catálogo)")

    # Hard gate: fiscal sin anexo
    if "fiscal_ar" in modulos and not anexo:
        errors.append("Falta anexo_fiscal_ref para Fiscal AR (hard gate)")

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
