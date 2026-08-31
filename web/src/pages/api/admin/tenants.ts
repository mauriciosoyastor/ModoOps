import type { APIRoute } from "astro";
import { getBackend } from "../../../lib/bff/get-backend.ts";
import { BffError } from "../../../lib/bff/errors.ts";
import { bffErrorResponse, json } from "../../../lib/bff/http.ts";

export const prerender = false;

export const GET: APIRoute = async ({ cookies, locals }) => {
  try {
    const odooSessionId = (locals as Record<string, unknown>).odooSessionId as string;
    if (!odooSessionId) return bffErrorResponse(new BffError("unauthorized", 401, "Tenés que iniciar sesión"), cookies);
    const tenants = await getBackend().getTenants(odooSessionId);
    return json({ tenants });
  } catch (err) {
    return bffErrorResponse(err, cookies);
  }
};

export const POST: APIRoute = async ({ cookies, request, locals }) => {
  try {
    const odooSessionId = (locals as Record<string, unknown>).odooSessionId as string;
    if (!odooSessionId) return bffErrorResponse(new BffError("unauthorized", 401, "Tenés que iniciar sesión"), cookies);
    let body: { name?: string; slug?: string; vertical?: string } = {};
    try { body = (await request.json()) as typeof body; } catch { /* ignore */ }
    const res = await getBackend().createTenant(odooSessionId, body as { name: string });
    return json(res, { status: 201 });
  } catch (err) {
    return bffErrorResponse(err, cookies);
  }
};
