// Leads captación propia — tipos + dominio Odoo puros (testeable sin Odoo).
// Espejo de `modoops.lead`: lista solo-lectura + opt-out + purga 90d + S4.

export type LeadRow = {
  id: number;
  nombre: string;
  telefono: string | false;
  email: string | false;
  categoria: string | false;
  estado: "nuevo" | "contactado" | "descartado" | string;
  opt_out: boolean;
  fecha_captura: string | false;
};

export type LeadFilters = {
  estado?: "nuevo" | "contactado" | "descartado" | "";
  sinTelefono?: boolean;
  optOut?: boolean;
};

export const LEAD_FIELDS = [
  "id",
  "nombre",
  "telefono",
  "email",
  "categoria",
  "estado",
  "opt_out",
  "fecha_captura",
] as const;

type Criterion = [string, string, unknown];
type Junction = "|" | "&" | "!";

/** Construye el dominio Odoo `search_read` desde filtros UI. Puro. */
export function buildLeadDomain(filters: LeadFilters): (Criterion | Junction)[] {
  const domain: (Criterion | Junction)[] = [];
  const estado = (filters.estado || "").trim();
  if (estado) domain.push(["estado", "=", estado]);
  if (filters.optOut) domain.push(["opt_out", "=", true]);
  if (filters.sinTelefono) {
    domain.push("|");
    domain.push(["telefono", "=", false]);
    domain.push(["telefono", "=", ""]);
  }
  return domain;
}
