export type CajaConfig = { id: number; name: string };

/** Fondo inicial en pesos. Acepta coma decimal. Vacío o negativo no sirven. */

/** El número de la caja es el precio del ticket. No se convierte ni se descarta. */
export function precioDelMostrador(_moneda: string, precio: number): number {
  return precio;
}

const pesos = new Intl.NumberFormat("es-AR", {
  style: "currency",
  currency: "ARS",
  maximumFractionDigits: 0,
});
const numero = new Intl.NumberFormat("es-AR", { maximumFractionDigits: 0 });

/** Caja de hoy, en pesos. */
export function textoCajaHoy(valor: number, oculto: boolean): string {
  return oculto ? "ARS ∗∗∗" : pesos.format(valor);
}

/** Por cobrar y stock: el número, sin llamarlo pesos. */
export function textoSinMoneda(valor: number, oculto: boolean): string {
  return oculto ? "∗∗∗" : numero.format(valor);
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
