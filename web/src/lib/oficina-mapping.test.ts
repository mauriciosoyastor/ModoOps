import { describe, it, expect } from "vitest";
import {
  CATALOGO_KEYS,
  GUION_CHAT,
  OBJETO_A_MODULO,
  PUERTA_FUTURO,
  SIEMPRE_INCLUIDOS,
  cargarBorrador,
  construirBorrador,
  esAncla,
  guardarBorrador,
  horasDe,
  validarBorrador,
  traducirBorradorAGenerar,
  mensajeWhatsApp,
  enlaceWhatsApp,
  type BorradorInput,
  type CatalogoKey,
  type Objeto3DId,
} from "./oficina-mapping.ts";

const fichasBase = (): BorradorInput => ({
  prospecto: {
    nombre: "Pinturería Centro",
    contacto_nombre: "Ana",
    telefono: "3547000000",
    email: "",
    rubro: "retail",
    sucursales: 1,
    cajas: 2,
    usuarios: 5,
  },
  objetos: {
    "mostrador-3d": { cajas: 2, descuento: true },
    "estanteria-3d": { almacenes: 1, ubicaciones: true },
    "gondola-3d": { listas_precio: 1 },
    "computadora-3d": { proveedores: 12, orden_compra: true },
    "pizarron-fiscal-3d": { comprobantes: ["factura-b"], contador: "Estudio López" },
    "puerta-crecer-3d": { futuros: ["migracion_excel"] },
  },
  seleccion: ["mostrador", "deposito", "ventas", "compras", "fiscal_ar", "contactos", "migracion_excel"],
  datos: { productos_aprox: 350, tiene_excel: true },
  infra: { hosting_propio: false, dominio_ssl: false, backups: false },
});

const memoria = () => {
  const m = new Map<string, string>();
  return {
    getItem: (k: string) => (m.has(k) ? m.get(k)! : null),
    setItem: (k: string, v: string) => void m.set(k, v),
    removeItem: (k: string) => void m.delete(k),
  };
};

describe("oficina-mapping — seam único objeto↔módulo", () => {
  it("mapea los 6 objetos a keys del universo del Catálogo", () => {
    const objetos = Object.keys(OBJETO_A_MODULO) as Objeto3DId[];
    expect(objetos).toHaveLength(6);
    for (const o of objetos) {
      expect(CATALOGO_KEYS.has(OBJETO_A_MODULO[o])).toBe(true);
    }
  });

  it("la puerta crecer solo ofrece futuros (add-ons, no ancla)", () => {
    for (const k of PUERTA_FUTURO) {
      expect(esAncla(k)).toBe(false);
    }
    expect(esAncla("mostrador")).toBe(true);
    expect(esAncla("b2b_basico")).toBe(false);
  });

  it("construye el borrador particionado, con horas y no vinculante", () => {
    const b = construirBorrador(fichasBase());
    expect(b.version).toBe("borrador-v1");
    expect(b.vinculante).toBe(false);
    expect([...b.modulos_ancla].sort()).toEqual(
      ["compras", "contactos", "deposito", "fiscal_ar", "mostrador", "ventas"],
    );
    expect(b.modulos_futuros).toEqual(["migracion_excel"]);
    expect(b.horas_estimadas).toBe(
      ["mostrador", "deposito", "ventas", "compras", "fiscal_ar", "contactos", "migracion_excel"]
        .map(horasDe)
        .reduce((a, h) => a + h, 0),
    );
    expect(b.prospecto.nombre).toBe("Pinturería Centro");
    expect(b.datos.productos_aprox).toBe(350);
  });

  it("valida solo nombre y contacto; el resto es opcional", () => {
    expect(validarBorrador(construirBorrador(fichasBase()))).toEqual([]);
    const sinNombre = construirBorrador({
      ...fichasBase(),
      prospecto: { ...fichasBase().prospecto, nombre: "  " },
    });
    expect(validarBorrador(sinNombre)).toHaveLength(1);
    const sinContacto = construirBorrador({
      ...fichasBase(),
      prospecto: { ...fichasBase().prospecto, telefono: "", email: "" },
    });
    expect(validarBorrador(sinContacto)).toHaveLength(1);
  });

  it("persiste y recupera el borrador; corrupto o ausente da null", () => {
    const store = memoria();
    const b = construirBorrador(fichasBase());
    expect(guardarBorrador(b, store)).toBe(true);
    expect(cargarBorrador(store)).toEqual(b);
    expect(cargarBorrador(memoria())).toBeNull();
    const roto = memoria();
    roto.setItem("modoops.borrador.v1", "{no-json");
    expect(cargarBorrador(roto)).toBeNull();
  });

  it("sin almacenamiento no rompe (SSR)", () => {
    expect(guardarBorrador(construirBorrador(fichasBase()), null)).toBe(false);
    expect(cargarBorrador(null)).toBeNull();
  });

  it("el guion cubre ancla y futuros con mapping a objetos y catálogo", () => {
    const keys = new Set(GUION_CHAT.flatMap((p) => p.keys));
    const ancla: CatalogoKey[] = ["mostrador", "deposito", "ventas", "compras", "fiscal_ar"];
    for (const k of ancla) {
      expect(keys.has(k)).toBe(true);
    }
    for (const k of PUERTA_FUTURO) {
      expect(keys.has(k)).toBe(true);
    }
    for (const p of GUION_CHAT) {
      expect(Object.keys(OBJETO_A_MODULO)).toContain(p.objeto);
      for (const k of p.keys) {
        expect(CATALOGO_KEYS.has(k)).toBe(true);
      }
    }
    for (const k of SIEMPRE_INCLUIDOS) {
      expect(esAncla(k)).toBe(true);
    }
  });

  it("traduce el borrador al input de generar con gate fiscal esperado", () => {
    const inp = traducirBorradorAGenerar(construirBorrador(fichasBase()));
    expect(inp.vertical).toBe("retail");
    expect(inp.modulos_tildados).toEqual(
      expect.arrayContaining(["mostrador", "fiscal_ar", "contactos", "migracion_excel"]),
    );
    expect(inp.sku_count).toBe(350);
    expect(inp.cajas_pos).toBe(2);
    expect(inp.almacenes).toBe(1);
    expect(inp.anexo_fiscal_ref).toBeUndefined();
  });

  it("arma el mensaje legible sin precios y el enlace wa.me", () => {
    const texto = mensajeWhatsApp(construirBorrador(fichasBase()));
    expect(texto).toContain("Pinturería Centro");
    expect(texto).toContain("no vinculante");
    expect(texto).toContain("Descubrimiento");
    expect(texto).not.toContain("$800");
    expect(texto).not.toContain("$155");
    expect(texto.toLowerCase()).not.toContain("oferta");
    const url = enlaceWhatsApp(texto);
    expect(url.startsWith("https://wa.me/5493547532008?text=")).toBe(true);
    expect(decodeURIComponent(url.split("?text=")[1])).toBe(texto);
  });
});
