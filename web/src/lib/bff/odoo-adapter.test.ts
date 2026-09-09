import { describe, expect, it } from "vitest";
import { createBackend } from "./get-backend.ts";
import { BffError } from "./errors.ts";

const BASE = { baseUrl: "http://odoo:8069", db: "modoops_master" };

function html404(): Response {
  return new Response("<!DOCTYPE html><title>404 Not Found</title>", {
    status: 404,
    headers: { "content-type": "text/html" },
  });
}

describe("OdooAdapter sesión muerta (polish replay)", () => {
  it("call_kw con 404 HTML → unauthorized 401 (no 503)", async () => {
    const backend = createBackend({ ...BASE, fetchImpl: (async () => html404()) as typeof fetch });
    const err = await backend.getLauncher("sesion-m muerta").catch((e) => e);
    expect(err).toBeInstanceOf(BffError);
    expect(err.code).toBe("unauthorized");
    expect(err.status).toBe(401);
  });

  it("call_kw con 200 no-JSON → unauthorized 401 (no 503)", async () => {
    const backend = createBackend({
      ...BASE,
      fetchImpl: (async () => new Response("no-json", { status: 200 })) as typeof fetch,
    });
    const err = await backend.getLauncher("sesion-muerta").catch((e) => e);
    expect(err).toBeInstanceOf(BffError);
    expect(err.code).toBe("unauthorized");
  });

  it("500 real de Odoo → 503 odoo_unavailable (no se disfraza de 401)", async () => {
    const backend = createBackend({
      ...BASE,
      fetchImpl: (async () => new Response("boom", { status: 500 })) as typeof fetch,
    });
    const err = await backend.getLauncher("sesion-viva").catch((e) => e);
    expect(err).toBeInstanceOf(BffError);
    expect(err.code).toBe("odoo_unavailable");
    expect(err.status).toBe(503);
  });

  it("red caída (fetch rechaza) → sigue 503 odoo_unavailable", async () => {
    const backend = createBackend({
      ...BASE,
      fetchImpl: (async () => {
        throw new TypeError("fetch failed");
      }) as typeof fetch,
    });
    const err = await backend.getLauncher("cualquiera").catch((e) => e);
    expect(err).toBeInstanceOf(BffError);
    expect(err.code).toBe("odoo_unavailable");
    expect(err.status).toBe(503);
  });
});
