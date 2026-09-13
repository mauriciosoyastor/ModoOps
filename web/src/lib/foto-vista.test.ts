import { describe, it, expect } from "vitest";
import { parseVista, serializeVista } from "./foto-vista.ts";

describe("foto-vista — estado de vista camara en URL", () => {
  it("?vista=lateral → lateral", () => {
    expect(parseVista("?vista=lateral")).toBe("lateral");
  });

  it("sin query → frontal (default)", () => {
    expect(parseVista("")).toBe("frontal");
  });

  it("?vista=x → frontal (valor invalido)", () => {
    expect(parseVista("?vista=x")).toBe("frontal");
  });

  it("serialize hace round-trip en las tres vistas", () => {
    for (const v of ["frontal", "lateral", "lente"] as const) {
      expect(parseVista("?" + serializeVista(v))).toBe(v);
    }
  });
});
