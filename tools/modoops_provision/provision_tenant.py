#!/usr/bin/env python3
"""
tools/modoops_provision/provision_tenant.py — v0.1 manual (Fase 1)

Crea tenant Multi-DB: modoops_<slug> desde template, instala modoops_core, setea admin, programa backup nightly.

Uso manual (no auto desde Control Plane):
  python tools/modoops_provision/provision_tenant.py --slug pintureria_centro --name "Pinturería Centro" --vertical retail
  python tools/modoops_provision/provision_tenant.py --list
  python tools/modoops_provision/provision_tenant.py --backup modoops_pintureria_centro

Requisitos: psql, odoo-bin en PATH, acceso Postgres superuser, Odoo 19.
Fase 1 RPO 24h / RTO 60min (backup nightly a /var/backups/modoops + S3 opcional).
"""
import argparse
import datetime
import re
import subprocess
import sys
from pathlib import Path

SLUG_RE = re.compile(r"^[a-z0-9]+(?:_[a-z0-9]+)*$")
PREFIX = "modoops_"
BACKUP_ROOT = "/var/backups/modoops"
RETENTION_DUMPS = 7
CATALOGO = ["mostrador", "deposito", "compras", "fiscal_ar", "contactos", "migracion_excel", "taller"]


def slug_ok(slug: str) -> bool:
    return bool(SLUG_RE.match(slug))


def db_name(slug: str) -> str:
    return f"{PREFIX}{slug}"


def db_ok(db: str) -> bool:
    return db.startswith(PREFIX) and slug_ok(db[len(PREFIX):])


def die(msg: str) -> None:
    print(msg, file=sys.stderr)
    sys.exit(2)


def backup_filename(db: str, stamp: str | None = None) -> str:
    stamp = stamp or datetime.datetime.now().strftime("%Y%m%d_%H%M")
    return f"{BACKUP_ROOT}/{db}/{stamp}.dump"


def prune_backups(backup_dir: str, keep: int = RETENTION_DUMPS) -> list[str]:
    """Borra dumps viejos, conserva los `keep` más nuevos. Devuelve borrados."""
    base = Path(backup_dir)
    if not base.is_dir():
        return []
    dumps = sorted(p.name for p in base.iterdir() if p.is_file() and p.suffix == ".dump")
    doomed = dumps[: max(0, len(dumps) - keep)]
    for name in doomed:
        (base / name).unlink()
    return doomed


def run(cmd: list[str], dry_run=False):
    print(f"$ {' '.join(cmd)}")
    if dry_run:
        return 0
    return subprocess.call(cmd)


def cmd_provision(args):
    if not slug_ok(args.slug):
        print(f"Slug inválido '{args.slug}': solo a-z0-9_ (ej: pintureria_centro)", file=sys.stderr)
        sys.exit(2)
    db = db_name(args.slug)
    print(f"Provisionando tenant {db} — {args.name} / {args.vertical}")
    # 1. createdb desde template
    run(["createdb", "-T", "template0", db], dry_run=args.dry_run)
    # 2. instalar modoops_core base
    run(["odoo-bin", "-d", db, "-i", "modoops_core", "--stop-after-init"], dry_run=args.dry_run)
    # 3. cron backup nightly (systemd/crontab) — mock doc
    cron_line = f"0 3 * * * /usr/local/bin/modoops_backup.sh {db}  # RPO 24h Fase1"
    print(f"Cron sugerido: {cron_line}")
    print(f"Listo (dry_run={args.dry_run}). Registrar en modoops_master: modoops.tenant db_name={db}")
    print(f"Backup path: /var/backups/modoops/{db}/{{date}}.dump + S3 opcional")
    print(f"RTO 60min: restore via pg_restore + filestore S3")


def cmd_list(args):
    run(["psql", "-c", r"\l modoops\_%"], dry_run=args.dry_run)


def cmd_backup(args):
    db = args.db
    out = backup_filename(db)
    print(f"Backup {db} -> {out}")
    run(["pg_dump", "-Fc", "-f", out, db], dry_run=args.dry_run)
    if not args.dry_run:
        for name in prune_backups(f"{BACKUP_ROOT}/{db}", keep=args.keep):
            print(f"Prune {name}")
    # filestore opcional
    print(f"Filestore: /var/lib/odoo/filestore/{db} -> S3 si CONFIG_S3=1")


def cmd_restore(db: str, dump: str, dry_run: bool = False) -> None:
    """Restaura un dump -Fc sobre la DB (RTO 60min). Fail-closed ante traversal."""
    if not db_ok(db):
        die(f"DB inválida '{db}': solo modoops_<slug>.")
    backup_dir = Path(BACKUP_ROOT) / db
    candidate = (backup_dir / dump).resolve()
    if candidate.parent != backup_dir.resolve() or candidate.suffix != ".dump":
        die(f"Dump inválido '{dump}': debe ser un .dump dentro de {backup_dir}.")
    print(f"Restore {candidate} -> {db}")
    run(["pg_restore", "--clean", "--if-exists", "-d", db, str(candidate)], dry_run=dry_run)


if __name__ == "__main__":
    p = argparse.ArgumentParser(description="ModoOps provision tenant v0.1")
    p.add_argument("--dry-run", action="store_true", help="solo imprime comandos")
    sub = p.add_subparsers(dest="cmd")
    # default provision
    p.add_argument("--slug", help="slug ej: pintureria_centro")
    p.add_argument("--name", help="nombre comercial")
    p.add_argument("--vertical", default="retail", choices=["retail", "servicios", "distribucion"])
    p.add_argument("--list", action="store_true", help="alias --list")
    p.add_argument("--backup", dest="db", help="db a backupear ej: modoops_pintureria_centro")
    p.add_argument("--keep", type=int, default=RETENTION_DUMPS, help="dumps a conservar (prune)")
    p.add_argument("--restore", nargs=2, metavar=("DB", "DUMP"), help="restaura ej: --restore modoops_demo 20260101_0300.dump")

    args = p.parse_args()
    if args.list or (hasattr(args, "cmd") and args.cmd == "list"):
        cmd_list(args)
    elif args.restore:
        cmd_restore(args.restore[0], args.restore[1], dry_run=args.dry_run)
    elif args.db:
        cmd_backup(args)
    elif args.slug and args.name:
        cmd_provision(args)
    else:
        p.print_help()
        print("\nEjemplos:")
        print("  python tools/modoops_provision/provision_tenant.py --slug pintureria_centro --name \"Pinturería Centro\" --dry-run")
        print("  python tools/modoops_provision/provision_tenant.py --list")
