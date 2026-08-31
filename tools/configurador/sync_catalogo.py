#!/usr/bin/env python3
"""Sync modoops_catalogo/catalogo.json → generated Selection/TS/docs (SSOT).

SSOT: modoops_catalogo/catalogo.json
Generados (commiteados):
  - modoops_catalogo/_generated_selection.py  (CATALOGO_MODOOPS for Odoo)
  - web/src/lib/catalogo.generated.ts        (CatalogoKey + CATALOGO_KEYS + labels/horas)
  - docs/catalogo-modoops-inicial.md         (tabla markdown)

Uso:
  python tools/configurador/sync_catalogo.py --generate  # regenera
  python tools/configurador/sync_catalogo.py --check     # fail-closed CI: exit 1 si drift
  python tools/configurador/sync_catalogo.py             # check legacy (warn only, compat)
"""
import argparse
import json
import sys
from pathlib import Path

REPO = Path(__file__).resolve().parents[2]
SSOT = REPO / "modoops_catalogo" / "catalogo.json"
GEN_SELECTION = REPO / "modoops_catalogo" / "_generated_selection.py"
GEN_TS = REPO / "web" / "src" / "lib" / "catalogo.generated.ts"
GEN_MD = REPO / "docs" / "catalogo-modoops-inicial.md"
# legacy fallback
LEGACY_CATALOGO = REPO / "tools" / "configurador" / "catalogo.json"
LEGACY_TENANT_PY = REPO / "modoops_admin" / "models" / "modoops_tenant.py"


def load_ssot() -> dict:
    path = SSOT if SSOT.exists() else LEGACY_CATALOGO
    return json.loads(path.read_text(encoding="utf-8"))


def render_selection(modules: dict) -> str:
    lines = [
        "# AUTO-GENERADO — no editar a mano. Fuente: modoops_catalogo/catalogo.json",
        "# Generado por: python tools/configurador/sync_catalogo.py --generate",
        "",
        "CATALOGO_MODOOPS = [",
    ]
    for key, mod in modules.items():
        label = mod.get("label") or mod.get("modoops") or key
        # escape single quotes
        label_esc = label.replace("'", "\\'")
        lines.append(f"    (\"{key}\", \"{label_esc}\"),")
    lines.append("]")
    lines.append("")
    lines.append("CATALOGO_DICT = dict(CATALOGO_MODOOPS)")
    lines.append("")
    return "\n".join(lines) + "\n"


def render_ts(modules: dict, pricing: dict) -> str:
    keys = list(modules.keys())
    union = " | ".join(f'"{k}"' for k in keys)
    labels = {k: (modules[k].get("label") or modules[k].get("modoops") or k) for k in keys}
    horas = {k: modules[k].get("horas", 10) for k in keys}
    labels_json = json.dumps(labels, ensure_ascii=False, indent=2)
    horas_json = json.dumps(horas, indent=2)
    return f"""// AUTO-GENERADO — no editar a mano. Fuente: modoops_catalogo/catalogo.json
// Generado por: python tools/configurador/sync_catalogo.py --generate

export type CatalogoKey = {union};

export const CATALOGO_KEYS = new Set<CatalogoKey>([{", ".join(f'"{k}"' for k in keys)}]);

export const CATALOGO_LABELS: Record<CatalogoKey, string> = {labels_json} as const;

export const CATALOGO_HORAS: Record<CatalogoKey, number> = {horas_json} as const;

export const CATALOGO_PRICING = {json.dumps(pricing, ensure_ascii=False, indent=2)} as const;
"""


def render_md(modules: dict) -> str:
    header = """# Catálogo ModoOps Inicial — Extraído de Servigas (Caso Retail)

> Fuente SSOT: `modoops_catalogo/catalogo.json` — AUTO-GENERADO, no editar a mano. Generado por `python tools/configurador/sync_catalogo.py --generate`. Crece solo tras validar en proyecto real (ADR 0005).

## Módulos ModoOps validados (ofrecibles sin add-on de evaluación)

| Módulo ModoOps | Módulo Odoo / técnico | Depends | Ancla Retail | Horas | Notas |
|----------------|------------------------|---------|--------------|-------|-------|
"""
    rows = []
    for key, mod in modules.items():
        modoops = mod.get("modoops", key)
        odoo = ", ".join(f"`{x}`" for x in mod.get("odoo", [])) or "—"
        depends = ", ".join(f"`{x}`" for x in mod.get("depends", [])) or "—"
        ancla = mod.get("ancla_retail")
        if ancla is True:
            ancla_str = "✅"
        elif ancla is False:
            ancla_str = "⬜"
        else:
            ancla_str = str(ancla) if ancla else "—"
        horas = mod.get("horas", "—")
        nota = mod.get("nota") or mod.get("addon") or ""
        # escape pipe
        nota = nota.replace("|", "\\|")
        rows.append(f"| **{modoops}** (`{key}`) | {odoo} | {depends} | {ancla_str} | {horas} | {nota} |")
    footer = """
## Módulos candidatos (requieren Descubrimiento + validación antes de entrar al Catálogo)

> Candidatos ya incluidos como módulos con `ancla_retail: false` (Taller, B2B Básico, Migración Excel, IA). Para añadir un candidato, agregarlo a `modoops_catalogo/catalogo.json` y regenerar.

## Configurador ModoOps (herramienta interna) — reglas

- **Input:** Checklist de Módulos ModoOps tildados + vertical (Retail inicial).
- **Output:** Lista cerrada de módulos (nombre técnico + versión/rama), alcance funcional, exclusiones, hitos, precio ancla ($800 USD base) + add-ons, plazo (hasta 2 anclas paralelas).
- **Regla:** Solo módulos de este catálogo entran sin add-on de evaluación.

> Este catálogo es el universo ofrecible ModoOps hoy. "Todo Odoo" = todo lo de esta tabla.
"""
    return header + "\n".join(rows) + footer


def write_if_changed(path: Path, content: str) -> bool:
    if path.exists() and path.read_text(encoding="utf-8") == content:
        return False
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(content, encoding="utf-8")
    return True


def do_generate() -> None:
    data = load_ssot()
    modules = data["modules"]
    pricing = data["pricing"]
    sel = render_selection(modules)
    ts = render_ts(modules, pricing)
    md = render_md(modules)
    c1 = write_if_changed(GEN_SELECTION, sel)
    c2 = write_if_changed(GEN_TS, ts)
    c3 = write_if_changed(GEN_MD, md)
    # also sync legacy copy for compat until contract
    if LEGACY_CATALOGO.exists():
        legacy_content = json.dumps(data, ensure_ascii=False, indent=2) + "\n"
        # keep legacy in sync but don't fail if missing
        try:
            if LEGACY_CATALOGO.read_text(encoding="utf-8") != legacy_content:
                LEGACY_CATALOGO.write_text(legacy_content, encoding="utf-8")
                print(f"Synced legacy {LEGACY_CATALOGO}")
        except Exception:
            pass
    print(f"Catálogo: {len(modules)} módulos, pricing ancla ${pricing['ancla']['amount']}")
    print(f"Generated: {GEN_SELECTION} ({'updated' if c1 else 'unchanged'})")
    print(f"Generated: {GEN_TS} ({'updated' if c2 else 'unchanged'})")
    print(f"Generated: {GEN_MD} ({'updated' if c3 else 'unchanged'})")
    # legacy warn check
    if LEGACY_TENANT_PY.exists():
        txt = LEGACY_TENANT_PY.read_text(encoding="utf-8")
        # if it still has hard-coded CATALOGO_MODOOPS, warn but not fail in generate mode
        if "CATALOGO_MODOOPS = [" in txt and GEN_SELECTION.exists():
            print("NOTE: modoops_tenant.py still has hard-coded CATALOGO_MODOOPS — migrate to _generated_selection in T02a")


def do_check() -> int:
    data = load_ssot()
    modules = data["modules"]
    pricing = data["pricing"]
    expected_sel = render_selection(modules)
    expected_ts = render_ts(modules, pricing)
    expected_md = render_md(modules)
    drift = []
    for path, expected in [(GEN_SELECTION, expected_sel), (GEN_TS, expected_ts), (GEN_MD, expected_md)]:
        if not path.exists():
            drift.append(f"MISSING: {path.relative_to(REPO)}")
        elif path.read_text(encoding="utf-8") != expected:
            drift.append(f"DRIFT: {path.relative_to(REPO)} desactualizado — corre --generate")
    if drift:
        print("FAIL: drift detectado:")
        for d in drift:
            print(f"  - {d}")
        print("Corre: python tools/configurador/sync_catalogo.py --generate")
        return 1
    # also check tenant.py migration (warn -> fail in strict mode)
    if LEGACY_TENANT_PY.exists():
        txt = LEGACY_TENANT_PY.read_text(encoding="utf-8")
        # if tenant.py still defines CATALOGO_MODOOPS inline instead of importing, it's drift for contract phase
        # For now only warn; strict check will be enabled after T02a
        if 'from modoops_catalogo._generated_selection import' not in txt and 'from modoops_catalogo import' not in txt:
            # not strict yet, just info
            print("INFO: modoops_tenant.py aún no importa desde modoops_catalogo (pendiente T02a) — no es drift aún")
    print(f"OK: {len(modules)} módulos sincronizados, sin drift")
    return 0


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--generate", action="store_true", help="regenera artefactos")
    parser.add_argument("--check", action="store_true", help="fail-closed CI check")
    args = parser.parse_args()
    if args.generate:
        do_generate()
        sys.exit(0)
    if args.check:
        sys.exit(do_check())
    # legacy compat: old behavior (warn only)
    data = load_ssot()
    mods = data["modules"]
    print(f"Catálogo: {len(mods)} módulos, pricing ancla ${data['pricing']['ancla']['amount']}")
    # legacy check tenant.py contains keys
    if LEGACY_TENANT_PY.exists():
        txt = LEGACY_TENANT_PY.read_text(encoding="utf-8")
        missing = [k for k in mods if f'"{k}"' not in txt and f"'{k}'" not in txt]
        if missing:
            print(f"WARN: tenant.py no lista: {missing}")
        else:
            print("OK: tenant.py sincronizado (subset)")
    print("Sync check done — usa --generate / --check para SSOT")
    sys.exit(0)


if __name__ == "__main__":
    main()
