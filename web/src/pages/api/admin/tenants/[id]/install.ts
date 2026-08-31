import type { APIRoute } from "astro";
import { getBackend } from "../../../../../lib/bff/get-backend.ts";
import { bffErrorResponse, json, requireOdooSession } from "../../../../../lib/bff/http.ts";
import { CATALOGO_KEYS } from "../../../../../lib/catalogo.generated.ts";

export const prerender = false;

export const POST: APIRoute = async ({ cookies, request, params }) => {
  try {
    const { odooSessionId } = requireOdooSession(cookies);
    const id = Number(params.id);
    if (!Number.isInteger(id) || id <= 0) {
      return json({ error: { code: "validation_error", message: "id inválido" } }, { status: 400 });
    }
    let body: { modules?: string[]; action?: string; notes?: string } = {};
    try {
      body = (await request.json()) as typeof body;
    } catch {
      return json({ error: { code: "validation_error", message: "JSON inválido" } }, { status: 400 });
    }
    const modules = (body.modules || []).map((m) => String(m).trim()).filter(Boolean);
    if (!modules.length) {
      return json({ error: { code: "validation_error", message: "Seleccioná al menos un módulo" } }, { status: 400 });
    }
    for (const m of modules) {
      if (!CATALOGO_KEYS.has(m as never)) {
        return json({ error: { code: "validation_error", message: `Módulo inválido '${m}'` } }, { status: 400 });
      }
    }
    const action = body.action === "remove" ? "remove" : "install";
    const res = await getBackend().installTenantModules(odooSessionId, id, {
      modules,
      action: action as "install" | "remove",
      notes: body.notes,
    });
    return json(res);
  } catch (err) {
    return bffErrorResponse(err, cookies);
  }
};
