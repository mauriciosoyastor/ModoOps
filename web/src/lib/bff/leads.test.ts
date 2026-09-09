import { describe, it, expect } from "vitest";
import { buildLeadDomain, LEAD_FIELDS } from "./leads.ts";

describe("Leads — buildLeadDomain", () => {
  it("sin filtros → dominio vacío", () => {
    expect(buildLeadDomain({})).toEqual([]);
  });

  it("filtro estado nuevo", () => {
    expect(buildLeadDomain({ estado: "nuevo" })).toEqual([["estado", "=", "nuevo"]]);
  });

  it("sin teléfono → OR False/vacío", () => {
    expect(buildLeadDomain({ sinTelefono: true })).toEqual([
      "|",
      ["telefono", "=", false],
      ["telefono", "=", ""],
    ]);
  });

  it("opt-out → flag true", () => {
    expect(buildLeadDomain({ optOut: true })).toEqual([["opt_out", "=", true]]);
  });

  it("combina estado + sin teléfono", () => {
    expect(buildLeadDomain({ estado: "descartado", sinTelefono: true })).toEqual([
      ["estado", "=", "descartado"],
      "|",
      ["telefono", "=", false],
      ["telefono", "=", ""],
    ]);
  });
});

describe("Leads — LEAD_FIELDS", () => {
  it("incluye campos clave de UI", () => {
    for (const f of ["nombre", "telefono", "estado", "opt_out", "fecha_captura"]) {
      expect(LEAD_FIELDS).toContain(f);
    }
  });
});
