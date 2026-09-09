import type { APIRoute } from "astro";
import { json } from "../../../lib/bff/http.ts";
import { withMasterSession } from "../../../lib/bff/tenant-status.ts";
import {
  FUENTE_PORTAL,
  borradorALead,
  createIpRateLimit,
  validarFormaBorrador,
} from "../../../lib/bff/borrador-intake.ts";

export const prerender = false;

// G1 portal→consultor (prototipo): el Prospecto envía su borrador v1 y el BFF
// lo guarda como `modoops.lead` en master (fuente portal-oficina-3d + JSON
// adjunto). El consultor lo ve en admin/leads y corre el runbook
// (borrador_bridge + configurador). El portal jamás crea Tenants solo.
// Rate-limit en memoria por IP (provisorio, un proceso: ver G6).

const rateLimit = createIpRateLimit();

function clientIp(request: Request, clientAddress: string | undefined): string {
  const fwd = request.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0].trim();
  return clientAddress || "desconocida";
}

export const POST: APIRoute = async ({ request, clientAddress }) => {
  const ip = clientIp(request, clientAddress);
  if (!rateLimit.consume(ip)) {
    return json(
      { error: { code: "rate_limited", message: "Demasiados envíos. Probá de nuevo en una hora." } },
      { status: 429 }
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return json({ error: { code: "validation_error", message: "JSON inválido" } }, { status: 400 });
  }

  const forma = validarFormaBorrador(body);
  if (!forma.ok) {
    return json(
      { error: { code: "validation_error", message: forma.errores.join(". ") } },
      { status: 400 }
    );
  }

  let vals: ReturnType<typeof borradorALead>;
  try {
    vals = borradorALead(forma.borrador);
  } catch {
    return json({ error: { code: "validation_error", message: "Borrador demasiado grande" } }, { status: 400 });
  }

  // Sesión de servicio en master (G4: credenciales de ODOO_ADMIN_*, sin default)
  try {
    const { id } = await withMasterSession(async (master, sessionId) =>
      master.createLead(sessionId, { ...vals, fuente: FUENTE_PORTAL })
    );
    return json({ ok: true, lead_id: id });
  } catch {
    return json({ error: { code: "odoo_unavailable", message: "No se pudo registrar el borrador" } }, { status: 503 });
  }
};
