import type { APIRoute } from "astro";
import { BffError } from "../../../lib/bff/errors.ts";
import { bffErrorResponse, json } from "../../../lib/bff/http.ts";

export const prerender = false;

/**
 * MOCK #86 — acceso Video-IA comercial (interno, master-only).
 * Decisiones: #83 (Remotion + Turbo), #84 (BFF link externo + _log, sin iframe),
 * #85 (interno MVP, humano siempre, solo ModoOps).
 * Sin firma real, sin llaves, sin escritura en tenant. Solo placeholder.
 */
export const GET: APIRoute = async ({ cookies, locals }) => {
  try {
    const odooSessionId = (locals as Record<string, unknown>).odooSessionId as string;
    if (!odooSessionId) return bffErrorResponse(new BffError("unauthorized", 401, "Tenés que iniciar sesión"), cookies);
    return json({
      mock: true,
      mode: "link-externo",
      provider: "remotion|turbo (a elegir en #83)",
      url: "https://video-proveedor.stub/nuevo?draft=modoops-pieza-001",
      target: "_blank",
      audit: "pendiente cablear: tenant._log('aviso', 'video-access master')",
      gate: "humano siempre (#85): borrador revisable, nunca autopublicar",
    });
  } catch (err) {
    return bffErrorResponse(err, cookies);
  }
};
