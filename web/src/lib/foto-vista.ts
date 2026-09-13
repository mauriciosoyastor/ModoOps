/** Estado de vista de la camara 3D en la URL (?vista=frontal|lateral|lente). */

export type VistaId = "frontal" | "lateral" | "lente";

const VISTAS: readonly VistaId[] = ["frontal", "lateral", "lente"];

export function parseVista(search: string): VistaId {
  const raw = search.startsWith("?") ? search.slice(1) : search;
  if (!raw) return "frontal";
  const v = new URLSearchParams(raw).get("vista");
  return (VISTAS as readonly string[]).includes(v ?? "") ? (v as VistaId) : "frontal";
}

export function serializeVista(vista: VistaId): string {
  return new URLSearchParams({ vista }).toString();
}
