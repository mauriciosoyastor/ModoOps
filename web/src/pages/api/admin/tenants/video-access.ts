import type { APIRoute } from "astro";
import { getEnv } from "../../../../lib/bff/config.ts";
import { BffError } from "../../../../lib/bff/errors.ts";
import { bffErrorResponse, json } from "../../../../lib/bff/http.ts";
import { resolveVideoAccess } from "../../../../lib/bff/video-access.ts";

export const prerender = false;

/**
 * Video-IA S1 (#92) — acceso interno master-only.
 * Link externo en pestaña nueva (sin iframe); decisiones #83–#85.
 * Falla cerrada: sin env → 503, nunca placeholder silencioso.
 */
export const GET: APIRoute = async ({ cookies, locals }) => {
  try {
    const odooSessionId = (locals as Record<string, unknown>).odooSessionId as string;
    const res = resolveVideoAccess({ odooSessionId, env: getEnv(locals) });
    if (res.http !== 200) {
      const message = res.message || (res.code === "unauthorized" ? "Tenés que iniciar sesión" : "No se pudo completar la acción");
      return bffErrorResponse(new BffError(res.code, res.http, message), cookies);
    }
    return json(res.body);
  } catch (err) {
    return bffErrorResponse(err, cookies);
  }
};
