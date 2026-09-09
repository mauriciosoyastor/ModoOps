import type { APIRoute } from "astro";
import { getBackend, getBackendForDb } from "../../lib/bff/get-backend.ts";
import { BffError } from "../../lib/bff/errors.ts";
import { bffErrorResponse, json } from "../../lib/bff/http.ts";

export const prerender = false;

export const GET: APIRoute = async ({ cookies, locals }) => {
  try {
    const odooSessionId = (locals as Record<string, unknown>).odooSessionId as string;
    if (!odooSessionId) return bffErrorResponse(new BffError("unauthorized", 401, "Tenés que iniciar sesión"), cookies);
    // G8: sesión de empleado resuelve su db; sin tenantDb = master (consultor)
    const tenantDb = (locals as Record<string, unknown>).tenantDb as string | undefined;
    const payload = await (tenantDb ? getBackendForDb(tenantDb) : getBackend()).getLauncher(odooSessionId);
    return json(payload);
  } catch (err) {
    return bffErrorResponse(err, cookies);
  }
};
