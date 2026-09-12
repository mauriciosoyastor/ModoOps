import type { APIRoute } from "astro";
import { json } from "../../../lib/bff/http.ts";
import { createIpRateLimit } from "../../../lib/bff/borrador-intake.ts";
import { createMemoryQuotaStore, getEnv } from "../../../lib/orquestador/adapters.ts";
import { callLLM } from "../../../lib/orquestador/llm.ts";
import {
  decideProspecto,
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

export const POST: APIRoute = async ({ request, clientAddress, locals }) => {
  const ip = clientIp(request, clientAddress);
  if (!rateLimit.consume(ip)) {
    return json(
      { error: { code: "rate_limited", message: "Demasiadas consultas. Probá de nuevo en una hora." } },
      { status: 429 }
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return json({ error: { code: "validation_error", message: "JSON inválido" } }, { status: 400 });
  }
  const entrada = validarEntradaChat(body);
  if (!entrada.ok) {
    return json({ error: { code: "validation_error", message: entrada.error } }, { status: 400 });
  }

  const quota = createMemoryQuotaStore(getEnv(locals), quotaMensual);
  const quotaDb = ipAQuotaDb(ip);
  if (await quota.isQuotaExceeded(quotaDb)) {
    return json(
      { error: { code: "quota_exceeded", message: "Techo mensual de consultas excedido. Seguí por WhatsApp." } },
      { status: 429 }
    );
  }

  const intento = intentoDe(entrada.message);
  if (intento === "descubrimiento" || intento === "catalogo") {
    return json({
      ok: true,
      reply: respuestaEstatica(intento),
      tool: intento === "descubrimiento" ? "precio.descubrimiento" : "catalogo.info",
      source: "estatica",
    });
  }

  const llm = await callLLM(entrada.message);
  const decision = decideProspecto(llm.tool, llm.input);
  await quota.increment(quotaDb);
  if (!decision.ok) {
    return json(
      { ok: false, error: decision.fallo.error, code: decision.fallo.code, cta: decision.fallo.cta },
      { status: 422 }
    );
  }
  return json({ ok: true, reply: respuestaEcho(), tool: "echo", source: llm.source });
};
