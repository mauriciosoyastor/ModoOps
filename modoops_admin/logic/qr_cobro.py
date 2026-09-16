"""QR cobro desktop puro — sin Odoo, sin red, `now` inyectado.

Máquina: idle (sin orden) → processing → success | error.
El reintento crea una orden nueva con el mismo ticket (mismo total).
Éxito solo vía webhook `approved`: ningún otro camino llega a `success`
y los estados terminales son inmutables (webhooks duplicados/retrasados se ignoran).

El wrapper Odoo/MP (Orders API + webhook HTTP + confirmación en `pos.order`)
vive fuera: necesita credenciales del adquirente (ver ticket 05).
"""

from __future__ import annotations

from dataclasses import dataclass, replace
from datetime import datetime, timedelta

TIMEOUT_SECONDS = 300

STATE_PROCESSING = "processing"
STATE_SUCCESS = "success"
STATE_ERROR = "error"

_CAUSES = {
    "rejected": "Rechazado por la billetera: fondos insuficientes o cancelado por el cliente.",
    "cancelled": "Cancelado por el cliente antes de autorizar.",
    "expired": "Expirado: el QR venció a los 5 minutos. Generá uno nuevo sin perder el ticket.",
}


@dataclass(frozen=True)
class QrOrder:
    """Orden de cobro QR. `paid_ref` es la referencia MP (o la nueva, tras reintento)."""

    total_cents: int
    caja: str
    paid_ref: str
    state: str
    expires_at: datetime
    cause: str = ""
    ignored: bool = False


def new_qr_order(total_cents: int, caja: str, ref: str, now: datetime) -> QrOrder:
    if total_cents <= 0:
        raise ValueError("El total debe ser positivo (centavos).")
    if not ref:
        raise ValueError("Se requiere referencia de orden (emitida por Orders API o simulada).")
    return QrOrder(
        total_cents=total_cents,
        caja=caja,
        paid_ref=ref,
        state=STATE_PROCESSING,
        expires_at=now + timedelta(seconds=TIMEOUT_SECONDS),
    )


def apply_webhook(order: QrOrder, event: str, now: datetime) -> QrOrder:
    del now  # el evento manda; el tiempo lo evalúa check_timeout
    if order.state != STATE_PROCESSING:
        return replace(order, ignored=True)
    if event == "approved":
        return replace(order, state=STATE_SUCCESS, cause="")
    cause = _CAUSES.get(event, f"Evento desconocido '{event}': no se confirma el pago.")
    return replace(order, state=STATE_ERROR, cause=cause)


def check_timeout(order: QrOrder, now: datetime) -> QrOrder:
    if order.state == STATE_PROCESSING and now >= order.expires_at:
        return replace(order, state=STATE_ERROR, cause=_CAUSES["expired"])
    return order


def retry_order(order: QrOrder, ref: str, now: datetime) -> QrOrder:
    if order.state != STATE_ERROR:
        return order
    return new_qr_order(order.total_cents, order.caja, ref, now)
