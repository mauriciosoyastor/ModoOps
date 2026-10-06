import { describe, expect, it } from "vitest";
import { elegirCaja, fondoInicial, precioDelMostrador, textoCajaHoy, textoSinMoneda, urlEntradaPos } from "./caja-pos.ts";

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

  it("el precio de la caja es el del ticket", () => {
    expect(precioDelMostrador("USD", 9200)).toBe(9200);
    expect(precioDelMostrador("ARS", 9200)).toBe(9200);
  });

  it("la caja de hoy se muestra en pesos y el resto sin moneda", () => {
    expect(textoCajaHoy(9200, false)).toBe("$\u00a09.200");
    expect(textoCajaHoy(9200, true)).toBe("ARS \u2217\u2217\u2217");
    expect(textoSinMoneda(9200, false)).toBe("9.200");
    expect(textoSinMoneda(9200, true)).toBe("\u2217\u2217\u2217");
  });

  it("arma la entrada al POS en el origen de Odoo", () => {
    expect(urlEntradaPos("http://localhost:8070/", "modoops_pintureria_centro", "abc")).toBe(
      "http://localhost:8070/modoops/pos/entrar?db=modoops_pintureria_centro&token=abc",
    );
  });
});
