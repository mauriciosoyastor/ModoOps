import type { APIRoute } from "astro";
import { getBackend } from "../../../lib/bff/get-backend.ts";
import { BffError } from "../../../lib/bff/errors.ts";
import { bffErrorResponse, json } from "../../../lib/bff/http.ts";

export const prerender = false;

const ALLOWED = new Set(["inventory", "sales", "purchase", "accounting", "workshop"]);

export const GET: APIRoute = async ({ cookies, params, url, locals }) => {
  try {
    const app = String(params.app || "");
    if (!ALLOWED.has(app)) return json({ error: { code: "not_found", message: "Hub no encontrado" } }, { status: 404 });
    const odooSessionId = (locals as Record<string, unknown>).odooSessionId as string;
    if (!odooSessionId) return bffErrorResponse(new BffError("unauthorized", 401, "Tenés que iniciar sesión"), cookies);
    const section = url.searchParams.get("section") || "summary";
    const payload = await getBackend().getHub(odooSessionId, app, section);
    return json(payload);
  } catch (err) {
    return bffErrorResponse(err, cookies);
  }
};
