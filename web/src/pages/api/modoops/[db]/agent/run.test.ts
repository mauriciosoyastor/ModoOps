import { describe, it, expect, afterEach } from "vitest";
import { POST } from "./run.ts";
import { __setGateCacheForTests, resetGateCache } from "../../../../../lib/bff/tenant-status.ts";

function req(
  db: string,
  body: unknown,
  env: Record<string, string> = {},
  fetchImpl?: typeof fetch
) {
  return {
    params: { db },
    request: new Request(`http://localhost/api/modoops/${db}/agent/run`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    }),
    locals: { runtime: { env }, __fetchImpl: fetchImpl },
  } as unknown as Parameters<typeof POST>[0];
}

function tenantOk(output: unknown) {
  return (async () =>
    new Response(JSON.stringify({ jsonrpc: "2.0", result: { status: "ok", output, runId: "modoops_demo:echo:rid" } }), {
      status: 200,
      headers: { "content-type": "application/json" },
    })) as typeof fetch;
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

  it("con key válida y tenant ok => 200 con output del tenant (no echo local)", async () => {
    const res = await POST(
      req(
        "modoops_demo",
        {
          tool: "echo",
          input: { message: "hola" },
          requestId: "223e4567-e89b-42d3-a456-426614174000",
          apiKey: "secret-123",
        },
        { MODOOPS_AGENT_API_KEY_DEMO: "secret-123" },
        tenantOk({ echo: { message: "hola" }, desde: "tenant" })
      )
    );
    expect(res.status).toBe(200);
    const data = (await res.json()) as { status: string; output: { desde: string } };
    expect(data.status).toBe("ok");
    expect(data.output.desde).toBe("tenant");
  });

  it("tenant caído => 503 (no se finge ejecución)", async () => {
    const down = (async () => {
      throw new TypeError("fetch failed");
    }) as typeof fetch;
    const res = await POST(
      req(
        "modoops_demo",
        {
          tool: "echo",
          input: { message: "hola" },
          requestId: "523e4567-e89b-42d3-a456-426614174000",
          apiKey: "secret-123",
        },
        { MODOOPS_AGENT_API_KEY_DEMO: "secret-123" },
        down
      )
    );
    expect(res.status).toBe(503);
    const data = (await res.json()) as { code: string };
    expect(data.code).toBe("odoo_unavailable");
  });

  it("tenant needs_tool => 422 con code del tenant", async () => {
    const needsTool = (async () =>
      new Response(
        JSON.stringify({ jsonrpc: "2.0", result: { status: "needs_tool", code: "unknown_tool", error: "no existe", runId: "x" } }),
        { status: 200, headers: { "content-type": "application/json" } }
      )) as typeof fetch;
    const res = await POST(
      req(
        "modoops_demo",
        {
          tool: "echo",
          input: { message: "hola" },
          requestId: "623e4567-e89b-42d3-a456-426614174000",
          apiKey: "secret-123",
        },
        { MODOOPS_AGENT_API_KEY_DEMO: "secret-123" },
        needsTool
      )
    );
    expect(res.status).toBe(422);
    const data = (await res.json()) as { code: string };
    expect(data.code).toBe("unknown_tool");
  });

  it("master suspendido => 403 aunque env diga ok", async () => {    __setGateCacheForTests({
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

  it("replay mismo requestId => mismo 422 + header, tenant llamado una vez", async () => {
    let calls = 0;
    const needsTool = (async () => {
      calls++;
      return new Response(
        JSON.stringify({ jsonrpc: "2.0", result: { status: "needs_tool", code: "unknown_tool", error: "no existe", runId: "x" } }),
        { status: 200, headers: { "content-type": "application/json" } }
      );
    }) as typeof fetch;
    const body = {
      tool: "echo",
      input: { message: "replay" },
      requestId: "723e4567-e89b-42d3-a456-426614174000",
      apiKey: "secret-123",
    };
    const env = { MODOOPS_AGENT_API_KEY_DEMO: "secret-123" };
    const first = await POST(req("modoops_demo", body, env, needsTool));
    expect(first.status).toBe(422);
    const second = await POST(req("modoops_demo", body, env, needsTool));
    expect(second.status).toBe(422);
    expect(second.headers.get("X-Idempotent-Replayed")).toBe("true");
    const data = (await second.json()) as { code: string };
    expect(data.code).toBe("unknown_tool");
    expect(calls).toBe(1);
  });

  it("quota 0 en env => 429 quota_exceeded sin tocar master", async () => {
    const res = await POST(
      req(
        "modoops_demo",
        {
          tool: "echo",
          input: { message: "cupo" },
          requestId: "423e4567-e89b-42d3-a456-426614174000",
          apiKey: "secret-123",
        },
        { MODOOPS_AGENT_API_KEY_DEMO: "secret-123", MODOOPS_AGENT_QUOTA_DEMO: "0" }
      )
    );
    expect(res.status).toBe(429);
    const data = (await res.json()) as { code: string; quota: number };
    expect(data.code).toBe("quota_exceeded");
    expect(data.quota).toBe(0);
  });
});
