import { describe, expect, it, vi } from "vitest";
import {
  FUENTE_PORTAL,
  borradorALead,
  createIpRateLimit,
  validarFormaBorrador,
  type BorradorV1,
} from "./borrador-intake.ts";

function borradorBase(): BorradorV1 {
  return {
    version: "borrador-v1",
    vinculante: false,
    origen: "portal-oficina-3d",
    prospecto: {
      nombre: "Pinturería Centro",
      contacto_nombre: "Juan",
      telefono: "351-555-0101",
      email: "",
      rubro: "retail",
      sucursales: 1,
      cajas: 2,
      usuarios: 5,
    },
    objetos: {
      "mostrador-3d": { cajas: 2, descuento: true },
      "estanteria-3d": { almacenes: 1, ubicaciones: false },
      "gondola-3d": { listas_precio: 1 },
      "computadora-3d": { proveedores: 3, orden_compra: false },
      "pizarron-fiscal-3d": { comprobantes: [], contador: "" },
      "puerta-crecer-3d": { futuros: [] },
    },
    modulos_ancla: ["mostrador", "ventas"],
    modulos_futuros: [],
    horas_estimadas: 10,
    datos: { productos_aprox: 120, tiene_excel: true },
    infra: { hosting_propio: false, dominio_ssl: false, backups: false },
  };
}

describe("validarFormaBorrador", () => {
  it("acepta un borrador v1 válido", () => {
    const res = validarFormaBorrador(borradorBase());
    expect(res.ok).toBe(true);
  });
  it("rechaza sobre vacío y versiones", () => {
    expect(validarFormaBorrador(null).ok).toBe(false);
    expect(validarFormaBorrador({ ...borradorBase(), version: "borrador-v9" }).ok).toBe(false);
    expect(validarFormaBorrador({ ...borradorBase(), vinculante: true }).ok).toBe(false);
  });
  it("exige nombre y contacto", () => {
    const sinNombre = borradorBase();
    sinNombre.prospecto.nombre = "  ";
    const r1 = validarFormaBorrador(sinNombre);
    expect(r1.ok).toBe(false);
    const sinContacto = borradorBase();
    sinContacto.prospecto.telefono = "";
    sinContacto.prospecto.email = "";
    expect(validarFormaBorrador(sinContacto).ok).toBe(false);
  });
});

describe("borradorALead", () => {
  it("mapea a vals de modoops.lead", () => {
    const vals = borradorALead(borradorBase());
    expect(vals.nombre).toBe("Pinturería Centro");
    expect(vals.telefono).toBe("351-555-0101");
    expect(vals.categoria).toBe("portal/retail");
    expect(vals.fuente).toBe(FUENTE_PORTAL);
    expect(JSON.parse(vals.borrador_json).version).toBe("borrador-v1");
  });
  it("revienta con JSON gigante", () => {
    const b = borradorBase();
    (b as unknown as Record<string, unknown>).relleno = "x".repeat(100_000);
    expect(() => borradorALead(b)).toThrow();
  });
});

describe("createIpRateLimit", () => {
  it("deja pasar hasta el tope por ventana", () => {
    let t = 0;
    const rl = createIpRateLimit({ windowMs: 1000, max: 2, now: () => t });
    expect(rl.consume("1.2.3.4")).toBe(true);
    expect(rl.consume("1.2.3.4")).toBe(true);
    expect(rl.consume("1.2.3.4")).toBe(false);
    t += 1001;
    expect(rl.consume("1.2.3.4")).toBe(true);
  });
  it("una IP no consume el cupo de otra", () => {
    const consume = vi.fn();
    const rl = createIpRateLimit({ windowMs: 1000, max: 1 });
    expect(rl.consume("a")).toBe(true);
    expect(rl.consume("b")).toBe(true);
    expect(consume).not.toHaveBeenCalled();
  });
});
