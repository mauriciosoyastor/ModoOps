"""Situación de contrato por tenant — lógica pura sin Odoo.

Golden path: un tenant tiene 0..N contratos, pero el análisis mira el
contrato vigente (o el último). Devuelve (semaforo, detalle) para el
tree/form y para decidir suspender/cobrar.

Reglas (alineadas a contrato ModoOps v2: ancla 50/25/25 + abono 1-10 + gracia 7 días):
- sin_contrato: no hay contrato vigente
- en_implementacion: ancla firmada, falta hito1/staging, 25% sin destrabar
- listo_cobrar_hito1: hito1 OK con acta firmada pero 25% sin cobrar
- en_go_live: hito1 cobrado, rumbo a go-live, falta hito2 (25% final)
- listo_cobrar_saldo: hito2 OK con acta firmada pero 25% final sin cobrar
- en_hipercare: go-live hecho, dentro de 10 días hábiles (~14 corridos)
- al_dia: abono al día o sin vencimiento futuro superado
- en_gracia: venció abono (día 1-7), avisar WhatsApp
- suspendible: día 8+, gracia vencida, tenant aún activo
- suspendido / baja: espeja state del tenant
"""

from __future__ import annotations

from datetime import date, timedelta


def situacion_contrato(
    *,
    tenant_state: str = "activo",
    contrato_state: str | None = None,
    hito1_ok: bool = False,
    hito1_cobrado: bool = False,
    hito2_ok: bool = False,
    saldo_cobrado: bool = False,
    go_live_date: date | None = None,
    abono_due_date: date | None = None,
    today: date | None = None,
) -> tuple[str, str]:
    """Retorna (semaforo, detalle). Puro y testeable."""
    day = today or date.today()

    # Espejo de lifecycle: si el tenant ya está fuera, el contrato no manda.
    if tenant_state == "suspendido":
        return ("suspendido", "Tenant suspendido — regularizar abono para reactivar dentro de la jornada.")
    if tenant_state == "baja":
        return ("baja", "Tenant en baja — backup final, requiere re-alta.")


    if not contrato_state or contrato_state in ("borrador", "rescindido"):
        return ("sin_contrato", "Sin contrato vigente — firmar Anexo A+B antes de Fase 1.")
    if contrato_state == "finalizado":
        return ("finalizado", "Contrato finalizado — solo add-ons o nuevo proyecto.")

    # Contrato vigente: implementación por hitos (ancla 50/25/25).
    # Todo destrabe requiere acta firmada (v2: sin silencio=aceptación).
    if not hito1_ok:
        return ("en_implementacion", "En implementación — falta Hito 1 staging para destrabar 25% con acta firmada.")
    if not hito1_cobrado:
        return ("listo_cobrar_hito1", "Hito 1 OK — cobrar 25% contra acta Hito 1 firmada.")
    if not hito2_ok:
        return ("en_go_live", "Hito 1 cobrado — rumbo a go-live, falta acta Hito 2 para 25% final.")
    if not saldo_cobrado:
        return ("listo_cobrar_saldo", "Go-live OK — cobrar 25% final contra acta Hito 2 firmada.")

    # Post go-live: hipercare ~14 corridos como proxy de 10 hábiles.
    if go_live_date and day <= go_live_date + timedelta(days=14):
        return ("en_hipercare", "En hipercare — solo bugs, cambios se cotizan.")

    # Soporte/abono: vence del 1 al 10, gracia 7 días, día 8 suspendible.
    if abono_due_date:
        grace_until = abono_due_date + timedelta(days=7)
        if day <= abono_due_date:
            return ("al_dia", f"Abono al día — vence {abono_due_date} (pagar 1-10).")
        if day <= grace_until:
            left = (grace_until - day).days
            return ("en_gracia", f"En gracia — venció {abono_due_date}, quedan {left} días. Avisar WhatsApp.")
        return ("suspendible", f"Suspendible desde {grace_until} — día 8 de mora, bloquear login (solo lectura).")

    return ("en_transicion", "Mes transición — best effort sin bolsa, abono desde mes 2.")
