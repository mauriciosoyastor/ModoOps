/** Home hub MP — puro, testeable sin Odoo.
 *
 * Normaliza la entrada de la home (tabs por módulo + montos del día) al
 * contrato que consume la UI: tabs validadas contra el catálogo, tab activo
 * y montos saneados. Sin módulos → ancla por defecto. Día sin movimientos →
 * ceros. Los agregados reales de Odoo (caja/por cobrar/stock) entran por el
 * endpoint cuando el backend los exponga; esta capa ya deja el contrato fijo.
 */

import { CATALOGO_KEYS, CATALOGO_LABELS, type CatalogoKey } from "../catalogo.generated.ts";

/** Ancla retail: tabs por defecto de la home. */
export const HOME_TABS_ANCLA: readonly CatalogoKey[] = ["mostrador", "deposito", "compras", "fiscal_ar"];

export type HomeResumenInput = {
  modulos?: Iterable<string>;
  tab?: string;
  cajaHoy?: unknown;
  porCobrar?: unknown;
  stockValorizado?: unknown;
  vsAyerPct?: unknown;
};

export type HomeTab = { id: CatalogoKey; label: string; active: boolean };

export type HomeResumen = {
  tabs: HomeTab[];
  tab: CatalogoKey;
  cajaHoy: number;
  porCobrar: number;
  stockValorizado: number;
  vsAyerPct: number;
  moneda: "ARS";
};

export type HomeResumenOk = { ok: true; home: HomeResumen };
export type HomeResumenError = { ok: false; errores: string[] };

function monto(v: unknown): number {
  const n = typeof v === "number" ? v : Number(v ?? 0);
  if (!Number.isFinite(n) || n < 0) return 0;
  return n;
}

function pct(v: unknown): number {
  const n = typeof v === "number" ? v : Number(v);
  if (!Number.isFinite(n)) return 0;
  return n;
}

/** Entrada → resumen normalizado. Desconocidos = error; vacío = ancla. */
export function resumenHome(input: HomeResumenInput = {}): HomeResumenOk | HomeResumenError {
  const vistos: CatalogoKey[] = [];
  const errores: string[] = [];
  for (const m of input.modulos ?? []) {
    const key = String(m || "").trim();
    if (!key) continue;
    if (!CATALOGO_KEYS.has(key as CatalogoKey)) {
      errores.push(`Módulo '${key}' no existe en catálogo`);
      continue;
    }
    if (!vistos.includes(key as CatalogoKey)) vistos.push(key as CatalogoKey);
  }
  if (errores.length) return { ok: false, errores };
  const ids = vistos.length ? vistos : [...HOME_TABS_ANCLA];
  const tab = ids.includes((input.tab || "") as CatalogoKey) ? (input.tab as CatalogoKey) : ids[0];
  return {
    ok: true,
    home: {
      tabs: ids.map((id) => ({ id, label: CATALOGO_LABELS[id], active: id === tab })),
      tab,
      cajaHoy: monto(input.cajaHoy),
      porCobrar: monto(input.porCobrar),
      stockValorizado: monto(input.stockValorizado),
      vsAyerPct: pct(input.vsAyerPct),
      moneda: "ARS",
    },
  };
}
