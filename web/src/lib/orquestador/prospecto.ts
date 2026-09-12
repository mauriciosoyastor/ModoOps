/** Chat público de prospecto (ticket 05) — lógica pura, sin Odoo ni env.
 *
 * El portal no tiene Tenant: no hay `db_name`, api_key, memoria ni auditoría.
 * El BFF responde con allowlist informativa (estática, sin costo) y todo lo
 * demás cae a falla cerrada con CTA a borrador/WhatsApp. El LLM solo se usa
 * como fallback para lo libre (echo); stock/cobros exigen cursor Tenant.
 */

import { validateToolInput } from "./tool-catalog.ts";

/** Tools informativas servibles sin Tenant (echo se valida contra el catálogo). */
export const INFORMATIVAS_PROSPECTO: readonly string[] = ["echo"];

export type IntentoProspecto = "descubrimiento" | "catalogo" | "libre";

const RE_DESCUBRIMIENTO =
  /descubrimiento|diagn[oó]stico|cu[aá]nto (cuesta|sale|vale)|precio|costo|arrancar|empezar/i;
const RE_CATALOGO = /m[oó]dulos?|cat[aá]logo|qu[eé] incluye|qu[eé] ofrecen|sistema|funcionalidades/i;

/** Router local por keywords (instantáneo, $0): lo informativo no toca el LLM. */
export function intentoDe(mensaje: string): IntentoProspecto {
  const m = (mensaje || "").trim();
  if (RE_DESCUBRIMIENTO.test(m)) return "descubrimiento";
  if (RE_CATALOGO.test(m)) return "catalogo";
  return "libre";
}

const RESPUESTA_DESCUBRIMIENTO = [
  "El Descubrimiento sale $155 USD: 3 días para relevar tu negocio y entregarte informe de diagnóstico + propuesta comercial.",
  "El precio del ancla y los agregados se definen tras el diagnóstico, a medida. Si querés, pedilo con el botón Quiero el Descubrimiento.",
].join(" ");

const RESPUESTA_CATALOGO = [
  "Tu ancla puede llevar: Mostrador (caja), Depósito Inteligente, Ventas, Compras y Fiscal AR, más Contactos y Plataforma que van siempre.",
  "Para crecer estamos desarrollando Logística, Ecommerce, Página web y CRM (a cotizar).",
  "Lo fiscal siempre es borrador: lo cierra tu contador antes del go-live.",
].join(" ");

/** Respuestas estáticas en voseo: único precio público ($155), sin ancla ni add-ons. */
export function respuestaEstatica(intento: "descubrimiento" | "catalogo"): string {
  return intento === "descubrimiento" ? RESPUESTA_DESCUBRIMIENTO : RESPUESTA_CATALOGO;
}

/** Orientación cuando el mensaje libre no pide nada accionable. */
export function respuestaEcho(): string {
  return "Te leo. Seguí con las preguntas del panel para armar tu borrador no vinculante; si querés saber qué incluye o cuánto sale arrancar, preguntame.";
}

export type FalloCerrado = {
  code: "needs_tool";
  error: string;
  cta: { borrador: string; whatsapp: string };
};

function falla(motivoTenant: boolean): FalloCerrado {
  return {
    code: "needs_tool",
    error: motivoTenant
      ? "Eso lo vemos dentro de tu sistema, no desde el portal: armá tu borrador y lo seguimos por WhatsApp."
      : "Eso no lo puedo hacer desde acá: armá tu borrador y lo seguimos por WhatsApp.",
    cta: { borrador: "/oficina-chat", whatsapp: "https://wa.me/5493547532008" },
  };
}

export type DecisionProspecto = { ok: true } | { ok: false; fallo: FalloCerrado };

/**
 * Decide-lite del portal: echo con input válido pasa; todo lo que exige
 * cursor Tenant (stock, cobros) o no existe va a falla cerrada con CTA.
 */
export function decideProspecto(tool: string, input: unknown): DecisionProspecto {
  if ((INFORMATIVAS_PROSPECTO as readonly string[]).includes(tool)) {
    const obj =
      typeof input === "object" && input !== null && !Array.isArray(input)
        ? (input as Record<string, unknown>)
        : {};
    const [ok] = validateToolInput(tool, obj);
    if (ok) return { ok: true };
    return { ok: false, fallo: falla(false) };
  }
  return { ok: false, fallo: falla(tool === "stock.consulta" || tool === "ot.cobro") };
}

export const MAX_MENSAJE = 2000;
export const MAX_HISTORIA = 10;

export type EntradaChatOk = { ok: true; message: string; history: { role: string; text: string }[] };
export type EntradaChatError = { ok: false; error: string };

/** Valida cuerpo del chat: mensaje 1..2000, historial opcional capado y tipado (no se persiste). */
export function validarEntradaChat(body: unknown): EntradaChatOk | EntradaChatError {
  if (!body || typeof body !== "object") return { ok: false, error: "Mensaje vacío" };
  const b = body as Record<string, unknown>;
  const message = typeof b.message === "string" ? b.message.trim() : "";
  if (message.length < 1 || message.length > MAX_MENSAJE) {
    return { ok: false, error: "Mensaje de 1 a 2000 caracteres" };
  }
  const history: { role: string; text: string }[] = [];
  if (b.history !== undefined) {
    if (!Array.isArray(b.history) || b.history.length > MAX_HISTORIA) {
      return { ok: false, error: "Historial inválido (máx 10 turnos)" };
    }
    for (const t of b.history) {
      if (
        !t ||
        typeof t !== "object" ||
        !((t as { role?: unknown }).role === "user" || (t as { role?: unknown }).role === "assistant") ||
        typeof (t as { text?: unknown }).text !== "string" ||
        ((t as { text: string }).text.length > MAX_MENSAJE)
      ) {
        return { ok: false, error: "Historial inválido (máx 10 turnos)" };
      }
      history.push({ role: (t as { role: string }).role, text: (t as { text: string }).text });
    }
  }
  return { ok: true, message, history };
}

/** djb2 hex: key de techo mensual por IP (estable, sin PII persistida). */
export function hashIp(ip: string): string {
  let h = 5381;
  const s = (ip || "desconocida").trim() || "desconocida";
  for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) >>> 0;
  return h.toString(16).padStart(8, "0");
}

/** db ficticia para reusar el QuotaStore por IP (nunca toca Odoo). */
export function ipAQuotaDb(ip: string): string {
  return `modoops_prospecto_${hashIp(ip)}`;
}
