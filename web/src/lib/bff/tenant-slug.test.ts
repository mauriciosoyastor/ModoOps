import { describe, it, expect } from "vitest";
import { isValidTenantSlug } from "./tenant-slug.ts";

describe("tenant-slug (B1)", () => {
  it("acepta slugs válidos", () => {
    expect(isValidTenantSlug("servigas")).toBe(true);
    expect(isValidTenantSlug("pintureria_centro")).toBe(true);
  });

  it("rechaza vacío, mayúsculas, guiones y no-strings", () => {
    expect(isValidTenantSlug("")).toBe(false);
    expect(isValidTenantSlug("Servigas")).toBe(false);
    expect(isValidTenantSlug("servi-gas")).toBe(false);
    expect(isValidTenantSlug("../master")).toBe(false);
    expect(isValidTenantSlug(undefined)).toBe(false);
  });
});
