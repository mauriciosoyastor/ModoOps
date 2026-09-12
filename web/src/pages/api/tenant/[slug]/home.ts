import type { APIRoute } from "astro";
import { getBackend } from "../../../../lib/bff/get-backend.ts";
import { BffError } from "../../../../lib/bff/errors.ts";
import { bffErrorResponse, json } from "../../../../lib/bff/http.ts";
import { resumenHome } from "../../../../lib/bff/home.ts";

export const prerender = false;

// Home hub MP (spec home-hub, slice 2): contrato fijo verificable por JSON.
// Sesión de empleado/consultor vía locals; tenant por slug. Los montos llegan
// en cero hasta que el backend exponga agregados (caja/por cobrar/stock);
// tabs y tab ya son finales. Sin persistencia.

export const GET: APIRoute = async ({ locals, params, url }) => {
  try {
    const odooSessionId = (locals as Record<string, unknown>).odooSessionId as string;
    if (!odooSessionId) return bffErrorResponse(new BffError("unauthorized", 401, "Tenés que iniciar sesión"));
    const slug = String(params.slug || "").trim();
    if (!slug) return bffErrorResponse(new BffError("validation_error", 400, "Falta el tenant"), undefined);
    const q = url.searchParams;
    const modulos = (q.get("modulos") || "").split(",").map((m) => m.trim()).filter(Boolean);
    const forma = resumenHome({ modulos, tab: q.get("tab") || "" });
    if (!forma.ok) {
      return json({ error: { code: "validation_error", message: forma.errores.join(". ") } }, { status: 400 });
    }
    const row = await getBackend().getTenantBySlug(odooSessionId, slug);
    const nombre = (row?.name || slug) as string;
    return json({ ok: true, tenant: { slug, nombre }, home: forma.home });
  } catch (err) {
    return bffErrorResponse(err);
  }
};
