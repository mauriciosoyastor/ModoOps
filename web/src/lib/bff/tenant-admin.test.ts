import { describe, expect, it } from "vitest";
import { parseStateAction } from "./tenant-admin.ts";

describe("parseStateAction", () => {
  it("acepta suspend/reactivate con id", () => {
    expect(parseStateAction({ id: 3, action: "suspend" })).toEqual({ ok: true, id: 3, method: "action_suspend" });
    expect(parseStateAction({ id: 3, action: "reactivate" })).toEqual({
      ok: true,
      id: 3,
      method: "action_reactivate",
    });
  });
  it("rechaza baja, ids rotos y vacío", () => {
    expect(parseStateAction({ id: 3, action: "baja" }).ok).toBe(false);
    expect(parseStateAction({ id: 0, action: "suspend" }).ok).toBe(false);
    expect(parseStateAction(null).ok).toBe(false);
    expect(parseStateAction({ action: "suspend" }).ok).toBe(false);
  });
});
