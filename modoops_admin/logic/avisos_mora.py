"""Avisos de mora día 1 y 5 + acta Hito 2 — lógica pura sin Odoo.

Contrato ModoOps: abono vence del 1 al 10, se notifica y a los 7 días
se suspende. Golden path: avisar día 1 y día 5 de mora por WhatsApp,
con link wa.me listo para enviar. El cron diario llama una vez por día.
"""

from __future__ import annotations

import re
from datetime import date


def mora_days(abono_due_date: date | None, today: date) -> int | None:
    """Días de mora: >0 vencido, <=0 aún no. None sin vencimiento."""
    if not abono_due_date:
        return None
    return (today - abono_due_date).days


TASA_DIARIA_MORA_V2 = 0.0017  # 0,17% diario ≈ 5% mensual (contrato v2, sin capitalizar)


def recargo_mora(monto_vencido: float, dias_mora: int, tasa_diaria: float = TASA_DIARIA_MORA_V2) -> float:
    """Recargo por demora: monto × tasa diaria × días. Sin capitalización (art. 770)."""
    if not monto_vencido or dias_mora <= 0:
        return 0.0
    return round(monto_vencido * tasa_diaria * dias_mora, 2)


def debe_avisar(
    *,
    tenant_state: str = "activo",
    abono_due_date: date | None,
    today: date,
    last_warning_sent: date | None = None,
) -> tuple[bool, str]:
    """Solo día 1 y día 5 de mora, tenant activo, no avisado hoy."""
    if tenant_state != "activo":
        return (False, "solo se avisa a tenant activo")
    mora = mora_days(abono_due_date, today)
    if mora is None or mora < 1:
        return (False, "sin mora")
    if mora not in (1, 5):
        return (False, f"día {mora}: solo se avisa día 1 y 5")
    if last_warning_sent == today:
        return (False, "ya avisado hoy")
    return (True, f"aviso día {mora}")


def normalize_phone_ar(phone: str | None) -> str:
    """Solo dígitos, con 54 delante (golden path AR). Vacío -> ''."""
    digits = re.sub(r"\D", "", phone or "")
    digits = digits.lstrip("0")
    if not digits:
        return ""
    if digits.startswith("54"):
        return digits
    return "54" + digits


def whatsapp_link(phone: str | None, message: str) -> str:
    """Link wa.me con texto prellenado. Sin teléfono -> wa.me sin número."""
    from urllib.parse import quote

    digits = normalize_phone_ar(phone)
    base = f"https://wa.me/{digits}" if digits else "https://wa.me/"
    return f"{base}?text={quote(message)}"


def mensaje_aviso(
    *, dia_mora: int, tenant_name: str, abono_due_date: date | None, situacion: str = ""
) -> str:
    """Texto corto para WhatsApp día 1 / día 5."""
    base = (
        f"Hola {tenant_name} — ModoOps: tu abono venció el {abono_due_date} "
        f"(día {dia_mora} de mora). Pagos del 1 al 10."
    )
    if dia_mora >= 5:
        return base + " Si no se acredita, el día 8 se suspende el acceso (solo lectura, sin borrado). Pagás + recargo y se rehabilita dentro de la jornada. ¿Regularizamos hoy?"
    return base + " ¿Confirmás pago para mantener el servicio activo?"


def acta_hito1_texto(
    *,
    contrato_name: str,
    tenant_name: str,
    db_name: str = "",
    monto_total: float = 0.0,
    tramo: float = 0.0,
    moneda: str = "USD",
    pendientes: str = "",
) -> str:
    """Texto del acta de aceptación Hito 1 (staging + cobro 25%).

    Contrato v2: todo destrabe requiere acta firmada (sin silencio=aceptación).
    """
    return (
        "ACTA DE ACEPTACIÓN HITO 1 — NÚCLEO EN STAGING + COBRO 25%\n"
        "ModoOps — Sistema de Gestión Modular\n"
        f"Contrato: {contrato_name} — Cliente: {tenant_name} ({db_name})\n"
        f"Total: {monto_total} {moneda} — Tramo 25% a cobrar: {tramo} {moneda}\n"
        "Checklist staging: catálogo piloto validado / compra → recepción en 1 almacén / "
        "venta en cada caja descuenta stock / usuarios y permisos / "
        "contabilidad operativa en prueba (sin emisión real).\n"
        f"Pendientes fuera de alcance (no frenan pago, se cotizan): {pendientes or 'ninguno'}\n"
        "Con esta firma el cliente acepta el núcleo en staging. "
        "El cobro del 25% requiere acta firmada (v2: sin silencio=aceptación).\n"
        "Firma cliente (aclaración/DNI/fecha): ___________   "
        "Prestador Mauricio Matasini: ___________\n"
    )


def acta_hito2_texto(
    *,
    contrato_name: str,
    tenant_name: str,
    db_name: str = "",
    monto_total: float = 0.0,
    saldo: float = 0.0,
    moneda: str = "USD",
    go_live_date: date | None = None,
    anexo_fiscal_ok: bool = False,
    pendientes: str = "",
    tramo: str = "25% final",
) -> str:
    """Texto del acta de aceptación Hito 2 (go-live + cobro tramo final).

    Contrato v2 (ancla 50/25/25): el saldo a cobrar es el tramo final 25%,
    y todo destrabe requiere acta firmada (sin silencio=aceptación).
    """
    return (
        f"ACTA DE ACEPTACIÓN HITO 2 — GO-LIVE + COBRO SALDO {tramo}\n"
        "ModoOps — Sistema de Gestión Modular\n"
        f"Contrato: {contrato_name} — Cliente: {tenant_name} ({db_name})\n"
        f"Fecha go-live: {go_live_date or '___'}\n"
        f"Total: {monto_total} {moneda} — Saldo {tramo} a cobrar: {saldo} {moneda}\n"
        f"Anexo B fiscal cerrado: {'SI' if anexo_fiscal_ok else 'NO — bloquear emisión real hasta cierre'}\n"
        "Checklist: POS operativo cada caja / compras+stock / capacitación 6h / "
        "infra revisada sin SLA / inicio hipercare 10 días hábiles.\n"
        f"Pendientes fuera de alcance (no frenan pago, se cotizan): {pendientes or 'ninguno'}\n"
        "Con esta firma el cliente acepta producción e inicia hipercare. "
        "El cobro requiere acta firmada (v2: sin silencio=aceptación).\n"
        "Firma cliente (aclaración/DNI/fecha): ___________   "
        "Prestador Mauricio Matasini: ___________\n"
    )
