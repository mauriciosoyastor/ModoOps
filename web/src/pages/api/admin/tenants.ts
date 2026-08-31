import type { APIRoute } from "astro";
import { getBackend } from "../../../lib/bff/get-backend.ts";
import { bffErrorResponse, json, requireOdooSession } from "../../../lib/bff/http.ts";

export const prerender = false;

export const GET: APIRoute = async ({ cookies }) => {
  try {
    const { odooSessionId } = requireOdooSession(cookies);
    const tenants = await getBackend().getTenants(odooSessionId);
    return json({ tenants });
  } catch (err) {
    return bffErrorResponse(err, cookies);
  }
};

export const POST: APIRoute = async ({ cookies, request }) => {
  try {
    const { odooSessionId } = requireOdooSession(cookies);
    let body: { name?: string; slug?: string; vertical?: string } = {};
    try { body = (await request.json()) as typeof body; } catch { /* ignore */ }
    const res = await getBackend().createTenant(odooSessionId, body as { name: string });
    return json(res, { status: 201 });
  } catch (err) {
    return bffErrorResponse(err, cookies);
  }
};
