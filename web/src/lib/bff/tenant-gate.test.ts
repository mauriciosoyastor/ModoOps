import { describe, it, expect } from "vitest";
import { resolveTenantGate } from "./tenant-gate.ts";

describe("tenant-gate (B1/B4 suspensión y mora)", () => {
  it("tenant inexistente → 401 genérico (sin oráculo)", () => {
    const res = resolveTenantGate(null);
    expect(res.http).toBe(401);
    expect(res.code).toBe("unauthorized");
  });

  it("activo → 200", () => {
    const res = resolveTenantGate({ state: "activo", abono_due_date: "2026-10-31" });
    expect(res.http).toBe(200);
  });

  it("suspendido → 403 con mensaje de mora y vto", () => {
    const res = resolveTenantGate({ state: "suspendido", abono_due_date: "2026-10-31" });
    expect(res.http).toBe(403);
    expect(res.code).toBe("tenant_suspended");
    expect(res.message ?? "").toContain("2026-10-31");
  });

  it("baja → 403 de cierre", () => {
    const res = resolveTenantGate({ state: "baja", abono_due_date: false });
    expect(res.http).toBe(403);
    expect(res.code).toBe("tenant_suspended");
  });
});
