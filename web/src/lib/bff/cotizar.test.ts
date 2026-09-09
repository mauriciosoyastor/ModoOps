import { describe, expect, it } from "vitest";
import { seleccionACotizar } from "./cotizar.ts";

describe("seleccionACotizar (G2)", () => {
  it("mapea selección a vals del wizard con defaults", () => {
    const res = seleccionACotizar(["mostrador", "deposito", "ventas"], {});
    expect(res.ok).toBe(true);
    if (!res.ok) return;
    expect(res.vals).toMatchObject({
      vertical: "retail",
      modulos_tildados: "mostrador,deposito,ventas",
      sucursales: 1,
      almacenes: 1,
      cajas_pos: 1,
      sku_count: 0,
    });
  });

  it("dedup preserva orden y respeta rubro/sku", () => {
    const res = seleccionACotizar(["ventas", "mostrador", "ventas", "taller"], {
      rubro: "distribucion",
      sku_count: 120,
    });
    expect(res.ok).toBe(true);
    if (!res.ok) return;
    expect(res.vals.modulos_tildados).toBe("ventas,mostrador,taller");
    expect(res.vals.vertical).toBe("distribucion");
    expect(res.vals.sku_count).toBe(120);
  });

  it("módulo desconocido → error sin vals", () => {
    const res = seleccionACotizar(["mostrador", "nave_espacial"], {});
    expect(res.ok).toBe(false);
    if (res.ok) return;
    expect(res.errores.join(" ")).toMatch(/nave_espacial/);
  });

  it("selección vacía → error", () => {
    const res = seleccionACotizar([], {});
    expect(res.ok).toBe(false);
  });
});
