/** Intake de borradores del portal (G1) — puro, testeable sin Odoo.
 *
 * Valida la forma mínima del borrador v1, lo mapea a vals de `modoops.lead`
 * y trae un rate-limit en memoria por IP (provisorio: un proceso, sin estado
 * compartido; suficiente para staging, ver G6 para serverless).
 */

import { validarBorrador, type BorradorV1 } from "../oficina-mapping.ts";

export const FUENTE_PORTAL = "portal-oficina-3d";
export const MAX_BORRADOR_JSON_BYTES = 64_000;
export const INTAKE_WINDOW_MS = 60 * 60 * 1000;
export const INTAKE_MAX_POR_VENTANA = 5;

export type FormaBorradorOk = { ok: true; borrador: BorradorV1 };
export type FormaBorradorError = { ok: false; errores: string[] };

/** Valida sobre: objeto, version, vinculante, origen + prospecto mínimo. */
export function validarFormaBorrador(body: unknown): FormaBorradorOk | FormaBorradorError {
  if (!body || typeof body !== "object") return { ok: false, errores: ["Borrador vacío"] };
  const b = body as Record<string, unknown>;
  const errores: string[] = [];
  if (b.version !== "borrador-v1") errores.push("Versión de borrador no soportada");
  if (b.vinculante !== false) errores.push("Borrador inválido");
  const prospecto = b.prospecto;
  if (!prospecto || typeof prospecto !== "object") {
    errores.push("Falta el prospecto");
  } else {
    errores.push(...validarBorrador({ prospecto: prospecto as BorradorV1["prospecto"] }));
  }
  if (errores.length) return { ok: false, errores };
  return { ok: true, borrador: b as unknown as BorradorV1 };
}

export type LeadVals = {
  nombre: string;
  telefono?: string;
  email?: string;
  categoria?: string;
  fuente: string;
  borrador_json: string;
};

/** Mapea borrador v1 → vals de `modoops.lead`. Lanza si supera el tope JSON. */
export function borradorALead(b: BorradorV1): LeadVals {
  const raw = JSON.stringify(b);
  if (raw.length > MAX_BORRADOR_JSON_BYTES) {
    throw new Error("Borrador demasiado grande");
  }
  const p = b.prospecto;
  const telefono = String(p.telefono || "").trim();
  const email = String(p.email || "").trim();
  return {
    nombre: String(p.nombre || "").trim(),
    ...(telefono ? { telefono } : {}),
    ...(email ? { email } : {}),
    categoria: `portal/${p.rubro || "retail"}`,
    fuente: FUENTE_PORTAL,
    borrador_json: raw,
  };
}

export type RateLimitOptions = {
  windowMs?: number;
  max?: number;
  now?: () => number;
};

export type IpRateLimit = {
  /** true = pasa; false = excedido (no registra). */
  consume(ip: string): boolean;
};

export function createIpRateLimit(options: RateLimitOptions = {}): IpRateLimit {
  const windowMs = options.windowMs ?? INTAKE_WINDOW_MS;
  const max = options.max ?? INTAKE_MAX_POR_VENTANA;
  const now = options.now ?? Date.now;
  const hits = new Map<string, number[]>();
  return {
    consume(ip: string): boolean {
      const key = (ip || "desconocida").trim() || "desconocida";
      const t = now();
      const prev = (hits.get(key) || []).filter((at) => t - at < windowMs);
      if (prev.length >= max) {
        hits.set(key, prev);
        return false;
      }
      prev.push(t);
      hits.set(key, prev);
      return true;
    },
  };
}
