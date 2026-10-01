export type DestinoOficina = "hilo" | "zona" | "nombre";

/** Cómo se desplaza la oficina del portal. El hilo es siempre instantáneo. */
export function desplazamientoDe(destino: DestinoOficina, menosMovimiento: boolean): ScrollBehavior {
  if (menosMovimiento || destino === "hilo") return "auto";
  return "smooth";
}

/** El nombre vive dentro de «Ver/editar todos los datos». Hay que abrirlo antes de saltar. */
export function revelarDatosAntesDe(destino: DestinoOficina): boolean {
  return destino === "nombre";
}
