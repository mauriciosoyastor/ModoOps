import { describe, it, expect } from "vitest";
import {
  INFORMATIVAS_PROSPECTO,
  agregarTurno,
  decideProspecto,
  intentoDe,
  ipAQuotaDb,
  respuestaEstatica,
  validarEntradaChat,
} from "./prospecto.ts";

describe("orquestador/prospecto — chat público sin tenant", () => {
  it("detecta intención Descubrimiento (precio solo si preguntan por él)", () => {
    expect(intentoDe("¿cuánto sale el descubrimiento?")).toBe("descubrimiento");
    expect(intentoDe("¿Cuánto cuesta arrancar?")).toBe("descubrimiento");
    expect(intentoDe("quiero un diagnóstico de mi negocio")).toBe("descubrimiento");
  });

  it("detecta intención catálogo", () => {
    expect(intentoDe("¿qué módulos ofrecen?")).toBe("catalogo");
    expect(intentoDe("¿qué incluye el sistema?")).toBe("catalogo");
  });

  it("lo demás va al LLM (libre)", () => {
    expect(intentoDe("hola")).toBe("libre");
    expect(intentoDe("¿atienden en Córdoba?")).toBe("libre");
  });

  it("respuesta Descubrimiento: solo precio público, sin ancla", () => {
    const r = respuestaEstatica("descubrimiento");
    expect(r).toContain("$155");
    expect(r).not.toContain("$800");
    expect(r.toLowerCase()).not.toContain("oferta");
  });

  it("respuesta catálogo: ancla sin precios + fiscal como borrador", () => {
    const r = respuestaEstatica("catalogo");
    expect(r).toContain("Mostrador");
    expect(r).not.toContain("$800");
    expect(r).not.toContain("$155");
    expect(r.toLowerCase()).toContain("contador");
  });

  it("decide-lite: echo válido pasa, tenant/write van a falla cerrada", () => {
    expect(decideProspecto("echo", { message: "hola" })).toEqual({ ok: true });
    const stock = decideProspecto("stock.consulta", { product_id: 42 });
    expect(stock.ok).toBe(false);
    if (!stock.ok) {
      expect(stock.fallo.code).toBe("needs_tool");
      expect(stock.fallo.cta.borrador).toBe("/oficina-chat");
    }
    const raro = decideProspecto("no.existe", {});
    expect(raro.ok).toBe(false);
  });

  it("allowlist informativa explícita", () => {
    expect(INFORMATIVAS_PROSPECTO).toContain("echo");
    expect(INFORMATIVAS_PROSPECTO).not.toContain("stock.consulta");
    expect(INFORMATIVAS_PROSPECTO).not.toContain("ot.cobro");
  });

  it("valida entrada: mensaje 1..2000, historial capado y tipado", () => {
    const ok = validarEntradaChat({ message: " hola ", history: [{ role: "user", text: "x" }] });
    expect(ok.ok).toBe(true);
    if (ok.ok) expect(ok.message).toBe("hola");
    expect(validarEntradaChat({ message: "   " }).ok).toBe(false);
    expect(validarEntradaChat({ message: "x".repeat(2001) }).ok).toBe(false);
    expect(validarEntradaChat({ message: "hola", history: [{ role: "otro", text: "x" }] }).ok).toBe(false);
    const largo = Array.from({ length: 11 }, (_, i) => ({ role: "user", text: `m${i}` }));
    expect(validarEntradaChat({ message: "hola", history: largo }).ok).toBe(false);
    expect(validarEntradaChat(null).ok).toBe(false);
  });

  it("quota por IP hasheada: estable y sin PII en la key", () => {
    const a = ipAQuotaDb("1.2.3.4");
    expect(ipAQuotaDb("1.2.3.4")).toBe(a);
    expect(a.startsWith("modoops_prospecto_")).toBe(true);
    expect(a).not.toContain("1.2.3.4");
    expect(ipAQuotaDb("5.6.7.8")).not.toBe(a);
  });

  it("historial del navegador: suma y capa a 10 sin mutar", () => {
    const h0: { role: "user" | "assistant"; text: string }[] = [];
    const h1 = agregarTurno(h0, { role: "user", text: "hola" });
    expect(h1).toHaveLength(1);
    expect(h0).toHaveLength(0);
    let h = h1;
    for (let i = 0; i < 12; i++) h = agregarTurno(h, { role: "assistant", text: `r${i}` });
    expect(h).toHaveLength(10);
    expect(h[0]).toEqual({ role: "assistant", text: "r2" });
    expect(h[9]).toEqual({ role: "assistant", text: "r11" });
  });
});
