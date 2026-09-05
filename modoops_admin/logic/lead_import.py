"""Import CSV de leads (captación propia) — lógica pura, sin Odoo.

Mapeo fijo validado en #91: 13 columnas kept, resto descartadas.
"""
from __future__ import annotations

import csv
import io

MAX_LEAD_IMPORT_ROWS = 500

GSOM_KEPT = [
    "nombre", "direccion", "telefono", "email", "web", "categoria",
    "rating", "lat", "lon", "place_id", "fuente", "fecha_captura", "estado",
]

GSOM_DISCARDED = [
    "reviews_texto", "review_count", "rating_desglose", "fotos",
    "horarios", "popular_times", "precio", "links_reserva", "plus_code",
]


def parse_csv_bytes(data: bytes) -> dict:
    try:
        text = data.decode("utf-8-sig")
    except (UnicodeDecodeError, AttributeError):
        return {"error": "Archivo ilegible: se espera CSV UTF-8."}
    reader = csv.DictReader(io.StringIO(text))
    headers = [h for h in (reader.fieldnames or []) if h]
    rows = [dict(r) for r in reader if any((v or "").strip() for v in r.values())]
    if not headers:
        return {"error": "El archivo no tiene encabezados."}
    if not rows:
        return {"error": "El archivo no tiene filas de datos."}
    if len(rows) > MAX_LEAD_IMPORT_ROWS:
        return {
            "error": f"El archivo tiene {len(rows)} filas; el límite por lote es {MAX_LEAD_IMPORT_ROWS}."
        }
    return {"headers": headers, "rows": rows}


def map_rows(rows: list[dict]) -> dict:
    headers = set()
    for r in rows:
        headers.update(r.keys())
    mapped = [{k: (r.get(k) or "") for k in GSOM_KEPT} for r in rows]
    discarded = sorted(set(GSOM_DISCARDED) & headers)
    return {"mapped": mapped, "discarded": discarded}


def to_lead_vals(mapped_row: dict) -> dict:
    vals = {k: (v if v != "" else False) for k, v in mapped_row.items()}
    vals["estado"] = "nuevo"
    return vals
