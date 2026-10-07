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

describe("OdooAdapter agent runs (Techo IA)", () => {
  function jsonResult(result: unknown): Response {
    return new Response(JSON.stringify({ jsonrpc: "2.0", result }), {
      status: 200,
      headers: { "content-type": "application/json" },
    });
  }

  it("countAgentRuns devuelve search_count de agent.run del mes", async () => {
    const seen: unknown[] = [];
    const backend = createBackend({
      ...BASE,
      fetchImpl: (async (url: unknown, init: unknown) => {
        seen.push(JSON.parse(String((init as { body: string }).body)));
        return jsonResult(7);
      }) as typeof fetch,
    });
    const n = await backend.countAgentRuns("s1", 42, "2026-10-01");
    expect(n).toBe(7);
    const body = seen[0] as { params: { model: string; method: string; args: unknown[] } };
    expect(body.params.model).toBe("modoops.tenant.log");
    expect(body.params.method).toBe("search_count");
    expect(JSON.stringify(body.params.args[0])).toContain("agent.run");
  });
});
