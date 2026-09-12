import type { APIRoute } from "astro";
import { json } from "../../../lib/bff/http.ts";
import { createIpRateLimit } from "../../../lib/bff/borrador-intake.ts";
import { createMemoryQuotaStore, getEnv } from "../../../lib/orquestador/adapters.ts";
import { callLLM } from "../../../lib/orquestador/llm.ts";
import {
  decideProspecto,
  hashIp,
  intentoDe,
  ipAQuotaDb,
  respuestaEstatica,
  respuestaEcho,
  validarEntradaChat,
} from "../../../lib/orquestador/prospecto.ts";

export const prerender = false;

// Chat público de prospecto (ticket 05): sin Tenant, sin Odoo, sin PII persistida.
// - Rate 20/h por IP + techo mensual por IP (reusa QuotaStore con db ficticia).
// - Intención informativa (Descubrimiento/catálogo) responde estático, $0.
// - Lo libre pasa por el LLM y solo echo llega a responder; stock/cobros u
//   otra tool caen a falla cerrada con CTA. Mapas en memoria, un proceso
//   (misma salvedad serverless que borrador-intake G6).

const rateLimit = createIpRateLimit({ windowMs: 60 * 60 * 1000, max: 20 });
const quotaMensual = new Map<string, { count: number; reset: number }>();

function clientIp(request: Request, clientAddress: string | undefined): string {
  const fwd = request.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0].trim();
  return clientAddress || "desconocida";
}

// Observabilidad portal (spec 0012): comanda mínima sin PII.
// - Nunca guarda IP cruda, nombre, teléfono ni email: solo ip_hash + texto
//   truncado, sanitizado y con números largos/emails redactados.
// - Una línea JSON por consulta, incluye 400/429/422 para debug + cuota.
function truncSeguro(mensaje: string): string {
  const limpio = (mensaje || "")
    .replace(/[\r\n\t]+/g, " ")
    .replace(/[\x00-\x1F\x7F]/g, "")
    .trim()
    .slice(0, 200);
  return limpio
    .replace(/[\w.+-]+@[\w-]+\.[\w.]+/g, "[email]")
    .replace(/\d{6,}/g, "[num]");
}

function logPortal(detalle: Record<string, unknown>): void {
  try {
    console.log(JSON.stringify({ svc: "portal-chat", ...detalle }));
  } catch {
    /* log best-effort: nunca rompe la respuesta */
  }
}

export const POST: APIRoute = async ({ request, clientAddress, locals }) => {
  const ip = clientIp(request, clientAddress);
  const ip_hash = hashIp(ip);
  const t0 = Date.now();
  if (!rateLimit.consume(ip)) {
    logPortal({ t: new Date().toISOString(), ip_hash, code: "rate_limited", ok: false, latency_ms: Date.now() - t0 });
    return json(
      { error: { code: "rate_limited", message: "Demasiadas consultas. Probá de nuevo en una hora." } },
      { status: 429 }
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    logPortal({ t: new Date().toISOString(), ip_hash, code: "validation_error", ok: false, latency_ms: Date.now() - t0 });
    return json({ error: { code: "validation_error", message: "JSON inválido" } }, { status: 400 });
  }
  const entrada = validarEntradaChat(body);
  if (!entrada.ok) {
    const crudo = typeof (body as { message?: unknown })?.message === "string" ? ((body as { message: string }).message as string) : "";
    logPortal({
      t: new Date().toISOString(),
      ip_hash,
      code: "validation_error",
      ok: false,
      latency_ms: Date.now() - t0,
      message_trunc: truncSeguro(crudo),
    });
    return json({ error: { code: "validation_error", message: entrada.error } }, { status: 400 });
  }

  const quota = createMemoryQuotaStore(getEnv(locals), quotaMensual);
  const quotaDb = ipAQuotaDb(ip);
  if (await quota.isQuotaExceeded(quotaDb)) {
    logPortal({
      t: new Date().toISOString(),
      ip_hash,
      code: "quota_exceeded",
      ok: false,
      latency_ms: Date.now() - t0,
      message_trunc: truncSeguro(entrada.message),
      history_len: entrada.history.length,
    });
    return json(
      { error: { code: "quota_exceeded", message: "Techo mensual de consultas excedido. Seguí por WhatsApp." } },
      { status: 429 }
    );
  }
  // El techo cuenta toda consulta (estática o LLM): sin ramas exentas.
  await quota.increment(quotaDb);

  const intento = intentoDe(entrada.message);
  if (intento === "descubrimiento" || intento === "catalogo") {
    const tool = intento === "descubrimiento" ? "precio.descubrimiento" : "catalogo.info";
    const latency_ms = Date.now() - t0;
    logPortal({
      t: new Date().toISOString(),
      ip_hash,
      intento,
      tool,
      source: "estatica",
      ok: true,
      latency_ms,
      message_trunc: truncSeguro(entrada.message),
      history_len: entrada.history.length,
    });
    return json({
      ok: true,
      reply: respuestaEstatica(intento),
      tool,
      source: "estatica",
      latency_ms,
    });
  }

  const tLlm = Date.now();
  const llm = await callLLM(entrada.message);
  const latency_ms = Date.now() - t0;
  const decision = decideProspecto(llm.tool, llm.input);
  if (!decision.ok) {
    logPortal({
      t: new Date().toISOString(),
      ip_hash,
      intento,
      llm_tool: llm.tool,
      tool: "none",
      source: llm.source,
      ok: false,
      code: decision.fallo.code,
      latency_ms,
      llm_latency_ms: Date.now() - tLlm,
      message_trunc: truncSeguro(entrada.message),
      history_len: entrada.history.length,
    });
    return json(
      { ok: false, error: decision.fallo.error, code: decision.fallo.code, cta: decision.fallo.cta, source: llm.source, latency_ms },
      { status: 422 }
    );
  }
  logPortal({
    t: new Date().toISOString(),
    ip_hash,
    intento,
    tool: "echo",
    source: llm.source,
    ok: true,
    latency_ms,
    llm_latency_ms: Date.now() - tLlm,
    message_trunc: truncSeguro(entrada.message),
    history_len: entrada.history.length,
  });
  return json({ ok: true, reply: respuestaEcho(), tool: "echo", source: llm.source, latency_ms });
};
