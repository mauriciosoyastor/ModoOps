import { BffError } from "./errors.ts";

export type CaptacionInput = {
  nombre: string;
  telefono?: string;
  email?: string;
  categoria?: string;
};

export type CaptacionLeadPayload = {
  nombre: string;
  telefono?: string;
  email?: string;
  categoria?: string;
  fuente: "captacion-manual";
  estado: "nuevo" | "descartado";
};

/** Alta manual de Acceso Captación. Sin teléfono → descartado (S4). */
export function captacionLeadPayload(input: CaptacionInput): CaptacionLeadPayload {
  const nombre = String(input.nombre || "").trim();
  if (!nombre) throw new BffError("validation_error", 400, "Nombre requerido");
  const telefono = String(input.telefono || "").trim();
  const email = String(input.email || "").trim();
  const categoria = String(input.categoria || "").trim();
  return {
    nombre,
    ...(telefono ? { telefono } : {}),
    ...(email ? { email } : {}),
    ...(categoria ? { categoria } : {}),
    fuente: "captacion-manual",
    estado: telefono ? "nuevo" : "descartado",
  };
}

/** Auditoría en modoops.tenant.log: id, sin datos de la persona. */
export function captacionAuditDetail(leadId: number): string {
  return `Alta captación lead id ${leadId}`;
}

/** Fecha de captura en calendario local, es-AR. El ISO de Odoo no se muestra crudo. */
export function formatFechaCaptura(value: string | false | null | undefined): string {
  if (!value) return "—";
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(value);
  if (!match) return value;
  const date = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
  return new Intl.DateTimeFormat("es-AR", { day: "numeric", month: "short", year: "numeric" }).format(date);
}
