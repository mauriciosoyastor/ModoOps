import type { APIRoute } from "astro";
import { getBackend } from "../../lib/bff/get-backend.ts";
import { BffError } from "../../lib/bff/errors.ts";
import { bffErrorResponse, json } from "../../lib/bff/http.ts";

export const prerender = false;

export const GET: APIRoute = async ({ cookies, locals }) => {
  try {
    const odooSessionId = (locals as Record<string, unknown>).odooSessionId as string;
    if (!odooSessionId) return bffErrorResponse(new BffError("unauthorized", 401, "Tenés que iniciar sesión"), cookies);
    const payload = await getBackend().getLauncher(odooSessionId);
    return json(payload);
  } catch (err) {
    return bffErrorResponse(err, cookies);
  }
};
