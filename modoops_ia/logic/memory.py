"""Memoria del Agente — cifrado Fernet real, sin Odoo (testeable offline).

La key vive por DB en ir.config_parameter `modoops.agent.memory_key`
(auto-generada por el modelo). Nunca en logs ni en `modoops_master`.
Retención default: 90 días (`RETENTION_DAYS`).
"""
from __future__ import annotations

import base64
import binascii
from datetime import date, timedelta

from cryptography.fernet import Fernet, InvalidToken

RETENTION_DAYS = 90
MAX_RETENTION_DAYS = 365
MEMORY_KEY_PARAM = "modoops.agent.memory_key"
# Fernet siempre serializa versión 0x80 → el base64 arranca con "gAAAAA".
FERNET_PREFIX = "gAAAAA"


def make_key() -> str:
    return Fernet.generate_key().decode("ascii")


def encrypt_value(value: str, key: str) -> str:
    return Fernet(key.encode("ascii")).encrypt((value or "").encode("utf-8")).decode("ascii")


def decrypt_value(token: str, key: str) -> str:
    return Fernet(key.encode("ascii")).decrypt((token or "").encode("ascii")).decode("utf-8")


def looks_fernet(token: str | None) -> bool:
    return bool(token) and token.startswith(FERNET_PREFIX)


def decrypt_maybe_legacy(token: str, key: str) -> str:
    """Lee Fernet; si falla, intenta base64 legacy (migración, una vez).

    Las filas viejas (base64 reversible) se leen y el modelo las re-escribe
    cifradas al leer (memo_get migra al vuelo). Token corrupto (ni Fernet
    ni base64) → ValueError claro, no 500 críptico.
    """
    try:
        return decrypt_value(token, key)
    except InvalidToken:
        pass
    try:
        return base64.b64decode(token.encode("ascii")).decode("utf-8")
    except (binascii.Error, ValueError, UnicodeDecodeError) as e:
        raise ValueError(f"memoria ilegible (ni Fernet ni legacy): {e}")


def default_valid_until_iso(today_iso: str) -> str:
    return (date.fromisoformat(today_iso) + timedelta(days=RETENTION_DAYS)).isoformat()


def clamp_valid_days(valid_days: int | None) -> int:
    """Retención 1..365 días (default 90): ni purga inmediata ni infinita."""
    try:
        n = int(valid_days)  # type: ignore[arg-type]
    except (TypeError, ValueError):
        return RETENTION_DAYS
    return max(1, min(n, MAX_RETENTION_DAYS))


def should_purge(valid_until_iso: str | None, today_iso: str) -> bool:
    if not valid_until_iso:
        return False
    return valid_until_iso < today_iso
