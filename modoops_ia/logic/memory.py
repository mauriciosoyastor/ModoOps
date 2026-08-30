"""Lógica pura para Memoria del Agente — cifrado simulado sin depender de Odoo.

En prod usa pgcrypto/fernet; aquí base64 reversible para tests offline.
"""
from __future__ import annotations

import base64
import json


def encrypt_value(value: str) -> str:
    return base64.b64encode(value.encode("utf-8")).decode("ascii")


def decrypt_value(enc: str) -> str:
    return base64.b64decode(enc.encode("ascii")).decode("utf-8")


def should_purge(valid_until_iso: str | None, today_iso: str) -> bool:
    if not valid_until_iso:
        return False
    return valid_until_iso < today_iso
