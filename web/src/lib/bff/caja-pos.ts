export type CajaConfig = { id: number; name: string };

/** Fondo inicial en pesos. Acepta coma decimal. Vacío o negativo no sirven. */

/** El precio del ticket es el de la caja, en pesos. Otra moneda no entra. */
export function precioDelMostrador(
  moneda: string,
  precio: number,
): { moneda: "ARS"; precio: number } | null {
  if (moneda !== "ARS") return null;
  if (!Number.isFinite(precio) || precio < 0) return null;
  return { moneda: "ARS", precio };
}
export function fondoInicial(raw: string): number | null {
  const t = raw.trim().replace(/\s/g, "").replace(",", ".");
  if (!/^\d+(\.\d{1,2})?$/.test(t)) return null;
  const n = Number(t);
  if (!Number.isFinite(n)) return null;
  return n;
}

/** Caja 1 es la primera configuración POS; caja 2, la segunda. */
export function elegirCaja(configs: readonly CajaConfig[], numero: 1 | 2): CajaConfig | null {
  const ordered = [...configs]
    .filter((c) => Number.isInteger(c.id) && c.id > 0)
    .sort((a, b) => a.id - b.id);
  return ordered[numero - 1] ?? null;
}

/** Entrada de un solo uso al POS de Odoo, en el origen que ve el browser. */
export function urlEntradaPos(origen: string, db: string, token: string): string {
  const base = origen.replace(/\/+$/, "");
  const q = new URLSearchParams({ db, token });
  return `${base}/modoops/pos/entrar?${q.toString()}`;
}
