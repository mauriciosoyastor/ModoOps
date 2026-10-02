import type { APIRoute } from "astro";
import { getBackend } from "../../lib/bff/get-backend.ts";
import { BffError } from "../../lib/bff/errors.ts";
import { bffErrorResponse, json } from "../../lib/bff/http.ts";
import type { CaptacionInput } from "../../lib/bff/captacion.ts";

export const prerender = false;

export const POST: APIRoute = async ({ cookies, request, locals }) => {
  try {
    const odooSessionId = (locals as Record<string, unknown>).odooSessionId as string;
    if (!odooSessionId) return bffErrorResponse(new BffError("unauthorized", 401, "Tenés que iniciar sesión"), cookies);
    let body: Partial<CaptacionInput> = {};
    try {
      body = (await request.json()) as typeof body;
    } catch {
      /* cuerpo vacío */
    }
    const created = await getBackend().createCaptacionLead(odooSessionId, {
      nombre: String(body.nombre || ""),
      telefono: body.telefono,
      email: body.email,
      categoria: body.categoria,
    });
    return json(created);
  } catch (err) {
    return bffErrorResponse(err, cookies);
  }
};
