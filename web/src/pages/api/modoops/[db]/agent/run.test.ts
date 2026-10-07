import { describe, it, expect, afterEach } from "vitest";
import { POST } from "./run.ts";
import { __setGateCacheForTests, resetGateCache } from "../../../../../lib/bff/tenant-status.ts";

function req(db: string, body: unknown, env: Record<string, string> = {}) {
  return {
    params: { db },
    request: new Request(`http://localhost/api/modoops/${db}/agent/run`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    }),
    locals: { runtime: { env } },
  } as unknown as Parameters<typeof POST>[0];
}

describe("api/modoops/[db]/agent/run — fail-closed sin key", () => {
  afterEach(() => {
    __setGateCacheForTests(undefined);
    resetGateCache();
  });
  it("sin MODOOPS_AGENT_API_KEY_* => 401 aunque la key parezca válida", async () => {
    const res = await POST(
      req("modoops_demo", {
        tool: "echo",
        input: { message: "hola" },
        requestId: "123e4567-e89b-42d3-a456-426614174000",
        apiKey: "cualquier-key",
      })
    );
    expect(res.status).toBe(401);
    const data = (await res.json()) as { code: string };
    expect(data.code).toBe("unauthorized");
  });

  it("con key configurada y válida => 200 ok", async () => {
    const res = await POST(
      req(
        "modoops_demo",
        {
          tool: "echo",
          input: { message: "hola" },
          requestId: "223e4567-e89b-42d3-a456-426614174000",
          apiKey: "secret-123",
        },
        { MODOOPS_AGENT_API_KEY_DEMO: "secret-123" }
      )
    );
    expect(res.status).toBe(200);
    const data = (await res.json()) as { status: string };
    expect(data.status).toBe("ok");
  });

  it("master suspendido => 403 aunque env diga ok", async () => {
    __setGateCacheForTests({
      getGate: async () => ({ http: 403, code: "tenant_suspended", message: "mora" }),
      invalidate: () => {},
      clear: () => {},
    });
    const res = await POST(
      req(
        "modoops_demo",
        {
          tool: "echo",
          input: { message: "hola" },
          requestId: "323e4567-e89b-42d3-a456-426614174000",
          apiKey: "secret-123",
        },
        { MODOOPS_AGENT_API_KEY_DEMO: "secret-123", ODOO_ADMIN_LOGIN: "admin", ODOO_ADMIN_PASSWORD: "x" }
      )
    );
    expect(res.status).toBe(403);
    const data = (await res.json()) as { code: string; error: string };
    expect(data.code).toBe("tenant_suspended");
    expect(data.error).toMatch(/mora/);
  });
});
