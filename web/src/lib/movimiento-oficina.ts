export type DestinoOficina = "hilo" | "zona" | "nombre";

/** Cómo se desplaza la oficina del portal. El hilo es siempre instantáneo. */
export function desplazamientoDe(destino: DestinoOficina, menosMovimiento: boolean): ScrollBehavior {
  if (menosMovimiento || destino === "hilo") return "auto";
  return "smooth";
}
