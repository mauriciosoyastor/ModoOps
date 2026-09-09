import type { APIRoute } from "astro";
import { getBackend } from "../../../../../../lib/bff/get-backend.ts";
import { BffError } from "../../../../../../lib/bff/errors.ts";
import { bffErrorResponse, json } from "../../../../../../lib/bff/http.ts";

export const prerender = false;

// G7: estado del job de instalación real (la UI polea hasta hecho/error).
export const GET: APIRoute = async ({ cookies, params, locals }) => {
  try {
    const odooSessionId = (locals as Record<string, unknown>).odooSessionId as string;
    if (!odooSessionId) return bffErrorResponse(new BffError("unauthorized", 401, "Tenés que iniciar sesión"), cookies);
    const id = Number(params.id);
    const jobId = Number(params.jobId);
    if (!Number.isInteger(id) || id <= 0 || !Number.isInteger(jobId) || jobId <= 0) {
      return json({ error: { code: "validation_error", message: "ids inválidos" } }, { status: 400 });
    }
    const job = await getBackend().getInstallJob(odooSessionId, jobId);
    if (!job || job.tenant_id !== id) {
      return json({ error: { code: "not_found", message: "Job no encontrado" } }, { status: 404 });
    }
    const output = typeof job.output === "string" ? job.output.slice(-1500) : job.output;
    return json({ ...job, output });
  } catch (err) {
    return bffErrorResponse(err, cookies);
  }
};
