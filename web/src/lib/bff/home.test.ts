import { describe, expect, it } from "vitest";
import { HOME_TABS_ANCLA, resumenHome } from "./home.ts";

describe("resumenHome (home hub MP)", () => {
  it("sin módulos → tabs ancla por defecto con montos en cero", () => {
    const res = resumenHome({});
    expect(res.ok).toBe(true);
    if (!res.ok) return;
    expect(res.home.tabs.map((t) => t.id)).toEqual([...HOME_TABS_ANCLA]);
    expect(res.home.tab).toBe("mostrador");
    expect(res.home.tabs.find((t) => t.id === "mostrador")?.active).toBe(true);
    expect(res.home).toMatchObject({ cajaHoy: 0, porCobrar: 0, stockValorizado: 0, vsAyerPct: 0, moneda: "ARS" });
  });

  it("respeta módulos y tab pedido", () => {
    const res = resumenHome({ modulos: ["mostrador", "taller"], tab: "taller", cajaHoy: 48500 });
    expect(res.ok).toBe(true);
    if (!res.ok) return;
    expect(res.home.tabs.map((t) => t.id)).toEqual(["mostrador", "taller"]);
    expect(res.home.tab).toBe("taller");
    expect(res.home.cajaHoy).toBe(48500);
  });

  it("dedup preserva orden", () => {
    const res = resumenHome({ modulos: ["compras", "mostrador", "compras"] });
    expect(res.ok).toBe(true);
    if (!res.ok) return;
    expect(res.home.tabs.map((t) => t.id)).toEqual(["compras", "mostrador"]);
  });

  it("módulo desconocido → error", () => {
    const res = resumenHome({ modulos: ["mostrador", "nave_espacial"] });
    expect(res.ok).toBe(false);
    if (res.ok) return;
    expect(res.errores.join(" ")).toMatch(/nave_espacial/);
  });

  it("tab inválido → cae al primero", () => {
    const res = resumenHome({ modulos: ["deposito"], tab: "mostrador" });
    expect(res.ok).toBe(true);
    if (!res.ok) return;
    expect(res.home.tab).toBe("deposito");
  });

  it("día sin movimientos: negativos e inválidos → cero", () => {
    const res = resumenHome({ cajaHoy: -10, porCobrar: NaN, stockValorizado: "x", vsAyerPct: Infinity });
    expect(res.ok).toBe(true);
    if (!res.ok) return;
    expect(res.home).toMatchObject({ cajaHoy: 0, porCobrar: 0, stockValorizado: 0, vsAyerPct: 0 });
  });

  it("vsAyer con signo se preserva", () => {
    const res = resumenHome({ vsAyerPct: -3.5 });
    expect(res.ok).toBe(true);
    if (!res.ok) return;
    expect(res.home.vsAyerPct).toBe(-3.5);
  });
});
