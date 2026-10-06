import type { APIRoute } from "astro";
import { getBackendForDb, getTenantBackend } from "../../../../lib/bff/get-backend.ts";
import { getMasterCredentials } from "../../../../lib/bff/tenant-status.ts";
import { BffError } from "../../../../lib/bff/errors.ts";
import { bffErrorResponse, json } from "../../../../lib/bff/http.ts";
import { BFF_COOKIE } from "../../../../lib/bff/config.ts";
import { sessionStore } from "../../../../lib/bff/session-store.ts";
import { fondoInicial } from "../../../../lib/bff/caja-pos.ts";
import { isValidTenantSlug } from "../../../../lib/bff/tenant-slug.ts";

export const prerender = false;

export const POST: APIRoute = async ({ request, cookies, params }) => {
  try {
    const sid = cookies.get(BFF_COOKIE)?.value;
    const entry = sid ? sessionStore.get(sid) : undefined;
    if (!entry?.odooSessionId) {
      return bffErrorResponse(new BffError("unauthorized", 401, "Tenés que iniciar sesión"));
    }
    const slug = String(params.slug || "").trim();
    if (!isValidTenantSlug(slug)) {
      return bffErrorResponse(new BffError("validation_error", 400, "Tenant inválido"));
    }
    if (entry.slug && entry.slug !== slug) {
      return bffErrorResponse(new BffError("forbidden", 403, "Esa caja no es de esta sesión."));
    }
    let body: { caja?: unknown; fondo?: unknown };
    try {
      body = (await request.json()) as typeof body;
    } catch {
      return bffErrorResponse(new BffError("validation_error", 400, "JSON inválido"));
    }
    const caja = body.caja === 1 || body.caja === 2 ? body.caja : null;
    if (!caja) return bffErrorResponse(new BffError("validation_error", 400, "Esa caja no existe."));
    const fondo = fondoInicial(String(body.fondo ?? ""));
    if (fondo === null) {
      return bffErrorResponse(new BffError("validation_error", 400, "Indicá el fondo inicial."));
    }
    const db = `modoops_${slug}`;
    let sessionId = entry.odooSessionId;
    if (entry.db !== db) {
      const { login, password } = getMasterCredentials();
      const logged = await getTenantBackend(slug).login(login, password);
      sessionId = logged.sessionId;
    }
    const { url } = await getBackendForDb(db).entrarAlPuntoDeVenta(sessionId, caja, fondo, db);
    return json({ ok: true, url });
  } catch (err) {
    return bffErrorResponse(err);
  }
};
