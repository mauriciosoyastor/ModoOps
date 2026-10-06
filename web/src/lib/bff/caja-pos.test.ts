import { describe, expect, it } from "vitest";
import { elegirCaja, fondoInicial, urlEntradaPos } from "./caja-pos.ts";

describe("entrada al punto de venta", () => {
  it("toma la caja 1 y la caja 2 por orden de id", () => {
    const configs = [
      { id: 8, name: "Caja B" },
      { id: 3, name: "Caja A" },
    ];
    expect(elegirCaja(configs, 1)).toEqual({ id: 3, name: "Caja A" });
    expect(elegirCaja(configs, 2)).toEqual({ id: 8, name: "Caja B" });
    expect(elegirCaja([{ id: 3, name: "Caja A" }], 2)).toBeNull();
  });

  it("lee el fondo con coma decimal y rechaza el vacío", () => {
    expect(fondoInicial("1500,50")).toBe(1500.5);
    expect(fondoInicial("0")).toBe(0);
    expect(fondoInicial("")).toBeNull();
    expect(fondoInicial("-1")).toBeNull();
  });

  it("arma la entrada al POS en el origen de Odoo", () => {
    expect(urlEntradaPos("http://localhost:8070/", "modoops_pintureria_centro", "abc")).toBe(
      "http://localhost:8070/modoops/pos/entrar?db=modoops_pintureria_centro&token=abc",
    );
  });
});
