"""tenant_log pure helpers — to_csv_row sin ORM."""

from __future__ import annotations

from datetime import datetime


def csv_row(
    create_date: datetime | None,
    db_name: str | None,
    action: str | None,
    detail: str | None,
    login: str | None,
) -> list[str]:
    return [
        create_date.isoformat() if create_date else "",
        db_name or "",
        action or "",
        detail or "",
        login or "",
    ]
