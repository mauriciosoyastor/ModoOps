import { describe, expect, it } from "vitest";
import { composicionInicio, modulosAnclaDesdeTiles } from "./inicio.ts";

const HOY = "2026-10-02";

describe("Inicio del Shell", () => {
  const base = {
    superficie: "shell" as const,
    usuario: "Marina",
    cliente: "Pinturería Centro",
    slug: "pintureria_centro",
    hoy: HOY,
  };

  it("con el ancla completo arma el mosaico y manda cada bloque a su pestaña", () => {
    const inicio = composicionInicio(base);
    expect(inicio.saludo).toBe("Hola, Marina");
    expect(inicio.bajada).toBe("Pinturería Centro");
    expect(inicio.filas).toEqual([
      ["greet", "greet", "stats"],
      ["bar", "bar", "stats"],
      ["agenda", "table", "verdict"],
      ["agenda", "series", "comp"],
    ]);
    expect(inicio.nav.map((item) => item.label)).toEqual([
      "Inicio",
      "Mostrador",
      "Depósito Inteligente",
      "Compras",
      "Fiscal AR",
    ]);
    expect(inicio.nav.some((item) => item.href.includes("/admin/tenants"))).toBe(false);
    expect(inicio.cerrarSesion).toBe("Cerrar sesión");
    expect(inicio.barra?.map((parte) => parte.href)).toEqual([
      "/tenant/pintureria_centro/app?tab=mostrador",
      "/tenant/pintureria_centro/app?tab=mostrador",
      "/tenant/pintureria_centro/app?tab=mostrador",
      "/tenant/pintureria_centro/app?tab=mostrador",
    ]);
    expect(inicio.numeros.map((n) => [n.label, n.href])).toEqual([
      ["Ventas de hoy", "/tenant/pintureria_centro/app?tab=mostrador"],
      ["Productos bajo stock", "/tenant/pintureria_centro/app?tab=deposito"],
      ["Compras sin recibir", "/tenant/pintureria_centro/app?tab=compras"],
    ]);
    expect(inicio.agenda.map((item) => item.href)).toEqual([
      "/tenant/pintureria_centro/app?tab=mostrador",
      "/tenant/pintureria_centro/app?tab=compras",
      "/tenant/pintureria_centro/app?tab=fiscal_ar",
    ]);
    expect(inicio.tabla?.href).toBe("/tenant/pintureria_centro/app?tab=compras");
    expect(inicio.veredicto?.href).toBe("/tenant/pintureria_centro/app?tab=mostrador");
    expect(inicio.serie?.href).toBe("/tenant/pintureria_centro/app?tab=mostrador");
    expect(inicio.composicion?.href).toBe("/tenant/pintureria_centro/app?tab=deposito");
    expect(inicio.numeros.every((n) => n.valor === 0)).toBe(true);
    expect(inicio.tabla?.filas).toEqual([]);
  });

  it("sin Mostrador cierra la barra, el veredicto y la serie", () => {
    const inicio = composicionInicio({
      ...base,
      modulos: ["deposito", "compras", "fiscal_ar"],
    });
    expect(inicio.barra).toBeNull();
    expect(inicio.veredicto).toBeNull();
    expect(inicio.serie).toBeNull();
    expect(inicio.numeros.map((n) => n.label)).toEqual(["Productos bajo stock", "Compras sin recibir"]);
    expect(inicio.filas).toEqual([
      ["greet", "greet", "stats"],
      ["agenda", "table", "comp"],
      ["agenda", "table", "comp"],
    ]);
    expect(inicio.nav.map((item) => item.label)).toEqual([
      "Inicio",
      "Depósito Inteligente",
      "Compras",
      "Fiscal AR",
    ]);
  });

  it("sin Compras la serie ocupa el centro", () => {
    const inicio = composicionInicio({
      ...base,
      modulos: ["mostrador", "deposito", "fiscal_ar"],
    });
    expect(inicio.tabla).toBeNull();
    expect(inicio.numeros.map((n) => n.label)).toEqual(["Ventas de hoy", "Productos bajo stock"]);
    expect(inicio.filas).toEqual([
      ["greet", "greet", "stats"],
      ["bar", "bar", "stats"],
      ["agenda", "series", "verdict"],
      ["agenda", "series", "comp"],
    ]);
  });

  it("sin Depósito el veredicto ocupa la columna derecha", () => {
    const inicio = composicionInicio({
      ...base,
      modulos: ["mostrador", "compras", "fiscal_ar"],
    });
    expect(inicio.composicion).toBeNull();
    expect(inicio.filas).toEqual([
      ["greet", "greet", "stats"],
      ["bar", "bar", "stats"],
      ["agenda", "table", "verdict"],
      ["agenda", "series", "verdict"],
    ]);
  });

  it("sin módulos de agenda el bloque de abajo se abre a todo el ancho", () => {
    const inicio = composicionInicio({ ...base, modulos: ["deposito"] });
    expect(inicio.agenda).toEqual([]);
    expect(inicio.filas).toEqual([
      ["greet", "greet", "stats"],
      ["comp", "comp", "comp"],
    ]);
  });
});

describe("Inicio del Control Plane", () => {
  const tenants = [
    { name: "Alba", state: "activo", abonoDue: "2026-10-01", modulos: "Mostrador" },
    { name: "Colorín", state: "activo", abonoDue: "2026-10-05", modulos: "Compras" },
    { name: "Sinteplast", state: "activo", abonoDue: "2026-10-02", modulos: "Fiscal AR" },
    { name: "Tersuave", state: "suspendido", abonoDue: "2026-09-01", modulos: "Mostrador" },
    { name: "Venier", state: "baja", abonoDue: null, modulos: "" },
  ];

  it("muestra los ocho bloques y solo Activo y Suspendido son enlaces", () => {
    const inicio = composicionInicio({
      superficie: "control-plane",
      consultor: "Mauricio",
      hoy: HOY,
      seccion: "inicio",
      tenants,
    });
    expect(inicio.saludo).toBe("Hola, Mauricio");
    expect(inicio.bajada).toBe("Control Plane");
    expect(inicio.filas).toEqual([
      ["greet", "greet", "stats"],
      ["bar", "bar", "stats"],
      ["agenda", "table", "verdict"],
      ["agenda", "series", "comp"],
    ]);
    expect(inicio.nav.map((item) => [item.label, item.href, item.actual])).toEqual([
      ["Inicio", "/admin/inicio", true],
      ["Tenants", "/admin/tenants", false],
      ["Leads", "/admin/leads", false],
    ]);
    expect(inicio.barra?.map((parte) => [parte.label, parte.pct, parte.href])).toEqual([
      ["Activo", 60, "/admin/tenants?estado=activo"],
      ["Suspendido", 20, "/admin/tenants?estado=suspendido"],
      ["Baja", 20, null],
    ]);
    expect(inicio.numeros.map((n) => [n.label, n.valor, n.href])).toEqual([
      ["Activos", 3, "/admin/tenants?estado=activo"],
      ["En gracia", 1, null],
      ["Abonos que vencen dentro de 7 días", 2, null],
    ]);
    expect(inicio.agenda.map((item) => item.titulo)).toEqual(["Sinteplast"]);
    expect(inicio.tabla?.filas.map((fila) => fila.celdas[0])).toEqual(["Alba"]);
    expect(inicio.veredicto?.href).toBeNull();
    expect(inicio.serie?.href).toBeNull();
    expect(inicio.composicion?.href).toBeNull();
    expect(inicio.composicion?.total).toBe(5);
  });
});

describe("módulos del ancla desde los tiles", () => {
  it("reconoce los rótulos del ancla y deja afuera el resto", () => {
    expect(
      modulosAnclaDesdeTiles([
        { label: "Mostrador" },
        { label: "Ventas" },
        { label: "Depósito Inteligente" },
      ]),
    ).toEqual(["mostrador", "deposito"]);
  });
});
