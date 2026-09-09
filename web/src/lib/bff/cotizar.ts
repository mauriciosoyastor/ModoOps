/** Puente portal→Odoo G2 — puro, testeable sin Odoo.
 *
 * Espejo TS de `tools/configurador/logic/borrador_bridge.py::traducir_borrador`
 * en versión liviana para preview: la página cotiza con la selección actual
 * (sin prospecto completo) y Odoo valida contra la SSOT viva
 * (`modoops.configurador.wizard:quote_preview`, sin persistencia).
 * El detalle fino (cajas/almacenes de las fichas) lo cierra el consultor en
 * el Descubrimiento con el bridge Python completo.
 */

import { CATALOGO_KEYS, type CatalogoKey } from "../catalogo.generated.ts";
import type { Rubro } from "../oficina-mapping.ts";

export type CotizarOpts = {
  rubro?: Rubro;
  sku_count?: number;
  sucursales?: number;
  almacenes?: number;
  cajas_pos?: number;
};

export type WizardVals = {
  vertical: string;
  modulos_tildados: string;
  sucursales: number;
  almacenes: number;
  cajas_pos: number;
  sku_count: number;
};

export type CotizarOk = { ok: true; vals: WizardVals };
export type CotizarError = { ok: false; errores: string[] };

function entero(v: unknown, fallback: number): number {
  const n = typeof v === "number" ? Math.floor(v) : parseInt(String(v ?? ""), 10);
  if (!Number.isFinite(n) || n < 0) return fallback;
  return n;
}

/** Selección del portal → vals del wizard. Desconocidos y vacío = error. */
export function seleccionACotizar(modulos: Iterable<string>, opts: CotizarOpts = {}): CotizarOk | CotizarError {
  const vistos: string[] = [];
  const errores: string[] = [];
  for (const m of modulos) {
    const key = String(m || "").trim();
    if (!key) continue;
    if (!CATALOGO_KEYS.has(key as CatalogoKey)) {
      errores.push(`Módulo '${key}' no existe en catálogo`);
      continue;
    }
    if (!vistos.includes(key)) vistos.push(key);
  }
  if (errores.length) return { ok: false, errores };
  if (!vistos.length) return { ok: false, errores: ["Seleccioná al menos un módulo"] };
  return {
    ok: true,
    vals: {
      vertical: opts.rubro || "retail",
      modulos_tildados: vistos.join(","),
      sucursales: entero(opts.sucursales, 1) || 1,
      almacenes: entero(opts.almacenes, 1) || 1,
      cajas_pos: entero(opts.cajas_pos, 1) || 1,
      sku_count: entero(opts.sku_count, 0),
    },
  };
}
