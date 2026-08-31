import { describe, it, expect } from "vitest";
import { decide } from "./decide.ts";

const okKey = async (db: string, key: string) => key === "secret-123";
const badKey = async () => false;
const notSuspended = async () => ({ suspended: false, reason: null });
const suspended = async () => ({ suspended: true, reason: "Suspendido por mora — gracia vencida" });
const quotaOk = async () => false;
const quotaExceeded = async () => true;

describe("Orquestador decide — TDD seam", () => {
  it("rejects invalid apiKey", async () => {
    const res = await decide({
      db: "modoops_demo",
      tool: "echo",
      input: { message: "hola" },
      requestId: "123e4567-e89b-42d3-a456-426614174000",
      apiKey: "bad",
      validateApiKey: okKey,
      isSuspended: notSuspended,
      isQuotaExceeded: quotaOk,
    });
    expect(res.http).toBe(401);
    expect(res.code).toBe("unauthorized");
  });

  it("blocks suspended", async () => {
    const res = await decide({
      db: "modoops_demo",
      tool: "echo",
      input: { message: "hola" },
      requestId: "123e4567-e89b-42d3-a456-426614174000",
      apiKey: "secret-123",
      validateApiKey: okKey,
      isSuspended: suspended,
      isQuotaExceeded: quotaOk,
    });
    expect(res.http).toBe(403);
    expect(res.error).toMatch(/mora/);
  });

  it("blocks quota exceeded", async () => {
    const res = await decide({
      db: "modoops_demo",
      tool: "echo",
      input: { message: "hola" },
      requestId: "123e4567-e89b-42d3-a456-426614174000",
      apiKey: "secret-123",
      validateApiKey: okKey,
      isSuspended: notSuspended,
      isQuotaExceeded: quotaExceeded,
    });
    expect(res.http).toBe(429);
    expect(res.code).toBe("quota_exceeded");
  });

  it("falla cerrada unknown tool", async () => {
    const res = await decide({
      db: "modoops_demo",
      tool: "no.existe",
      input: {},
      requestId: "123e4567-e89b-42d3-a456-426614174000",
      apiKey: "secret-123",
      validateApiKey: okKey,
      isSuspended: notSuspended,
      isQuotaExceeded: quotaOk,
      toolExists: () => false,
    });
    expect(res.status).toBe("needs_tool");
    expect(res.http).toBe(422);
  });

  it("validates input_schema", async () => {
    const res = await decide({
      db: "modoops_demo",
      tool: "echo",
      input: {},
      requestId: "123e4567-e89b-42d3-a456-426614174000",
      apiKey: "secret-123",
      validateApiKey: okKey,
      isSuspended: notSuspended,
      isQuotaExceeded: quotaOk,
    });
    expect(res.http).toBe(422);
    expect(res.code).toBe("invalid_input");
  });

  it("ok", async () => {
    const res = await decide({
      db: "modoops_demo",
      tool: "echo",
      input: { message: "hola" },
      requestId: "123e4567-e89b-42d3-a456-426614174000",
      apiKey: "secret-123",
      validateApiKey: okKey,
      isSuspended: notSuspended,
      isQuotaExceeded: quotaOk,
    });
    expect(res.http).toBe(200);
    expect(res.status).toBe("ok");
  });

  it("rejects invalid db", async () => {
    const res = await decide({
      db: "demo",
      tool: "echo",
      input: { message: "hola" },
      requestId: "123e4567-e89b-42d3-a456-426614174000",
      apiKey: "secret-123",
      validateApiKey: okKey,
      isSuspended: notSuspended,
      isQuotaExceeded: quotaOk,
    });
    expect(res.http).toBe(400);
  });

  it("rate limit blocked", async () => {
    const res = await decide({
      db: "modoops_demo",
      tool: "echo",
      input: { message: "hola" },
      requestId: "123e4567-e89b-42d3-a456-426614174000",
      apiKey: "secret-123",
      validateApiKey: okKey,
      isSuspended: notSuspended,
      isQuotaExceeded: quotaOk,
      checkRateLimit: async () => ({ allowed: false, code: "rate_limited", error: "rate limit Tenant 10/min", retryAfter: 30 }),
    });
    expect(res.http).toBe(429);
    expect(res.code).toBe("rate_limited");
  });
});
