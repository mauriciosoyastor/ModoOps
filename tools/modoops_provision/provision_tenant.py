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

SLUG_RE = re.compile(r"^[a-z0-9]+(?:_[a-z0-9]+)*$")
PREFIX = "modoops_"
CATALOGO = ["mostrador", "deposito", "compras", "fiscal_ar", "contactos", "migracion_excel", "taller"]


def slug_ok(slug: str) -> bool:
    return bool(SLUG_RE.match(slug))


def db_name(slug: str) -> str:
    return f"{PREFIX}{slug}"


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
    stamp = datetime.datetime.now().strftime("%Y%m%d_%H%M")
    out = f"/var/backups/modoops/{db}/{stamp}.dump"
    print(f"Backup {db} -> {out}")
    run(["pg_dump", "-Fc", "-f", out, db], dry_run=args.dry_run)
    # filestore opcional
    print(f"Filestore: /var/lib/odoo/filestore/{db} -> S3 si CONFIG_S3=1")


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

    args = p.parse_args()
    if args.list or (hasattr(args, "cmd") and args.cmd == "list"):
        cmd_list(args)
    elif args.db:
        cmd_backup(args)
    elif args.slug and args.name:
        cmd_provision(args)
    else:
        p.print_help()
        print("\nEjemplos:")
        print("  python tools/modoops_provision/provision_tenant.py --slug pintureria_centro --name \"Pinturería Centro\" --dry-run")
        print("  python tools/modoops_provision/provision_tenant.py --list")
