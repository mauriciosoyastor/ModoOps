import type { APIRoute } from "astro";
import { getBackend } from "../../../../lib/bff/get-backend.ts";
import { BffError } from "../../../../lib/bff/errors.ts";
import { bffErrorResponse, json } from "../../../../lib/bff/http.ts";
import { parseStateAction } from "../../../../lib/bff/tenant-admin.ts";

export const prerender = false;

// G10: suspender/reactivar tenant desde Control Plane. Corre el object-method
// de Odoo con sus guardas (gracia 7d, UserError verbatim vía action_failed).
// La Baja queda afuera a propósito (día 15 + backup final, solo Odoo).
export const POST: APIRoute = async ({ cookies, request, locals }) => {
  try {
    const odooSessionId = (locals as Record<string, unknown>).odooSessionId as string;
    if (!odooSessionId) return bffErrorResponse(new BffError("unauthorized", 401, "Tenés que iniciar sesión"), cookies);
    let body: unknown = {};
    try {
      body = await request.json();
    } catch {
      return bffErrorResponse(new BffError("validation_error", 400, "JSON inválido"), cookies);
    }
    const parsed = parseStateAction(body);
    if (!parsed.ok || parsed.id === undefined) {
      const message = parsed.ok ? "Tenant inválido" : parsed.message;
      return bffErrorResponse(new BffError("validation_error", 400, message), cookies);
    }
    const res = await getBackend().setTenantStateAction(
      odooSessionId,
      parsed.id,
      parsed.method as "action_suspend" | "action_reactivate"
    );
    return json(res);
  } catch (err) {
    return bffErrorResponse(err, cookies);
  }
};
