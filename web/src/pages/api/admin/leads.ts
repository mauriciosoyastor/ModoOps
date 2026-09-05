import type { APIRoute } from "astro";
import { getBackend } from "../../../lib/bff/get-backend.ts";
import { BffError } from "../../../lib/bff/errors.ts";
import { bffErrorResponse, json } from "../../../lib/bff/http.ts";
import type { LeadFilters } from "../../../lib/bff/leads.ts";

export const prerender = false;

const ESTADOS = new Set(["nuevo", "contactado", "descartado"]);

export const GET: APIRoute = async ({ cookies, locals, url }) => {
  try {
    const odooSessionId = (locals as Record<string, unknown>).odooSessionId as string;
    if (!odooSessionId) return bffErrorResponse(new BffError("unauthorized", 401, "Tenés que iniciar sesión"), cookies);
    const params = url.searchParams;
    const estado = params.get("estado") || "";
    const filters: LeadFilters = {
      estado: (ESTADOS.has(estado) ? estado : "") as LeadFilters["estado"],
      sinTelefono: params.get("sin_telefono") === "1",
      optOut: params.get("opt_out") === "1",
    };
    const leads = await getBackend().getLeads(odooSessionId, filters);
    return json({ leads });
  } catch (err) {
    return bffErrorResponse(err, cookies);
  }
};

export const POST: APIRoute = async ({ cookies, request, locals }) => {
  try {
    const odooSessionId = (locals as Record<string, unknown>).odooSessionId as string;
    if (!odooSessionId) return bffErrorResponse(new BffError("unauthorized", 401, "Tenés que iniciar sesión"), cookies);
    let body: { action?: string; id?: number } = {};
    try { body = (await request.json()) as typeof body; } catch { /* ignore */ }
    if (body.action === "purge") {
      const res = await getBackend().purgeLeads(odooSessionId);
      return json(res);
    }
    if (body.action === "opt_out") {
      const res = await getBackend().optOutLead(odooSessionId, Number(body.id));
      return json(res);
    }
    return bffErrorResponse(new BffError("validation_error", 400, "Acción inválida (purge | opt_out)"), cookies);
  } catch (err) {
    return bffErrorResponse(err, cookies);
  }
};
