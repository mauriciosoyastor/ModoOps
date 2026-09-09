import type { APIRoute } from "astro";
import { json } from "../../../lib/bff/http.ts";
import { withMasterSession } from "../../../lib/bff/tenant-status.ts";
import { createIpRateLimit } from "../../../lib/bff/borrador-intake.ts";
import { seleccionACotizar, type CotizarOpts } from "../../../lib/bff/cotizar.ts";
import type { Rubro } from "../../../lib/oficina-mapping.ts";

export const prerender = false;

// G2 puente portal→Odoo (prototipo): el Prospecto cotiza su selección actual
// contra la SSOT viva (`modoops.configurador.wizard:quote_preview`, sin
// persistencia). Público con rate-limit 5/h por IP, como el intake G1.
// El cálculo local de la página sigue; este endpoint suma la validación del
// servidor (hard gates, precio ancla, warnings).

const rateLimit = createIpRateLimit();

function clientIp(request: Request, clientAddress: string | undefined): string {
  const fwd = request.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0].trim();
  return clientAddress || "desconocida";
}

const RUBROS = new Set(["retail", "distribucion", "servicios"]);

export const POST: APIRoute = async ({ request, clientAddress }) => {
  const ip = clientIp(request, clientAddress);
  if (!rateLimit.consume(ip)) {
    return json(
      { error: { code: "rate_limited", message: "Demasiadas cotizaciones. Probá de nuevo en una hora." } },
      { status: 429 }
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return json({ error: { code: "validation_error", message: "JSON inválido" } }, { status: 400 });
  }
  const b = (body || {}) as Record<string, unknown>;
  const modulos = Array.isArray(b.modulos) ? (b.modulos as unknown[]) : [];
  const rubroRaw = String((b as { rubro?: unknown }).rubro || "retail");
  const opts: CotizarOpts = {
    ...(RUBROS.has(rubroRaw) ? { rubro: rubroRaw as Rubro } : {}),
    ...(typeof b.sku_count === "number" ? { sku_count: b.sku_count } : {}),
    ...(typeof b.sucursales === "number" ? { sucursales: b.sucursales } : {}),
    ...(typeof b.almacenes === "number" ? { almacenes: b.almacenes } : {}),
    ...(typeof b.cajas_pos === "number" ? { cajas_pos: b.cajas_pos } : {}),
  };
  const forma = seleccionACotizar(
    modulos.map((m) => String(m || "")),
    opts
  );
  if (!forma.ok) {
    return json(
      { error: { code: "validation_error", message: forma.errores.join(". ") } },
      { status: 400 }
    );
  }

  try {
    const quote = await withMasterSession(async (master, sessionId) =>
      master.quotePreview(sessionId, forma.vals)
    );
    return json({ ok: true, quote });
  } catch {
    return json({ error: { code: "odoo_unavailable", message: "No se pudo cotizar" } }, { status: 503 });
  }
};
