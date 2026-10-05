import { describe, expect, it } from "vitest";
import { composicionInicio, modulosAnclaDesdeTiles, sesionDelPuesto } from "./inicio.ts";

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
      ["greet", "bar", "stats"],
      ["agenda", "table", "verdict"],
      ["series", "series", "series"],
      ["comp", "comp", "comp"],
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
    expect(inicio.barraTitulo).toBe("Tickets del día");
    expect(inicio.barra?.map((parte) => parte.pct)).toEqual([63, 17, 12, 8]);
    expect(inicio.barra?.reduce((suma, parte) => suma + parte.pct, 0)).toBe(100);
    expect(inicio.numeros.map((n) => n.valor)).toEqual([24, 7, 4]);
    expect(inicio.veredicto?.principal).toBe("US$\u00a048.500,00 cobrado");
    expect(inicio.veredicto?.secundario).toBe("US$\u00a04.200,00 sigue abierto");
    expect(inicio.tabla?.filas.map((fila) => fila.celdas[0])).toEqual([
      "Alba",
      "Colorín",
      "Sinteplast",
      "Tersuave",
    ]);
    expect(inicio.serie?.puntos.map((punto) => punto.valor)).toEqual([86, 74, 91, 68]);
    expect(inicio.composicion?.total).toBe(80);
    expect(inicio.composicion?.partes).toEqual([
      { label: "En condición normal", pct: 91 },
      { label: "Bajo mínimo", pct: 9 },
    ]);
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
      ["greet", "bar", "stats"],
      ["agenda", "series", "verdict"],
      ["comp", "comp", "comp"],
    ]);
  });

  it("sin Depósito el veredicto ocupa la columna derecha", () => {
    const inicio = composicionInicio({
      ...base,
      modulos: ["mostrador", "compras", "fiscal_ar"],
    });
    expect(inicio.composicion).toBeNull();
    expect(inicio.filas).toEqual([
      ["greet", "bar", "stats"],
      ["agenda", "table", "verdict"],
      ["series", "series", "series"],
    ]);
  });

  it("sin módulos del ancla solo queda el saludo", () => {
    const inicio = composicionInicio({ ...base, modulos: [] });
    expect(inicio.barra).toBeNull();
    expect(inicio.numeros).toEqual([]);
    expect(inicio.filas).toEqual([["greet", "greet", "greet"]]);
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

describe("Sesión del puesto", () => {
  it("el puesto abierto ofrece bloquear y no anuncia un cierre", () => {
    const sesion = sesionDelPuesto({ persona: "Lucía Gómez", caja: "Caja 1", bloqueado: false });
    expect(sesion.persona).toBe("Lucía Gómez");
    expect(sesion.caja).toBe("Caja 1");
    expect(sesion.accion).toBe("Bloquear puesto");
    expect(sesion.aviso).toBeNull();
  });

  it("bloquear el puesto deja la sesión de esa persona abierta", () => {
    const sesion = sesionDelPuesto({ persona: "Lucía Gómez", caja: "Caja 1", bloqueado: true });
    expect(sesion.accion).toBe("Desbloquear puesto");
    expect(sesion.aviso).toBe("Puesto bloqueado. La sesión de Lucía Gómez sigue abierta.");
    expect(sesion.caja).toBe("Caja 1");
  });
});

describe("Inicio del Control Plane", () => {
  const tenants = [
    { name: "Alba", state: "activo", abonoDue: "2026-10-01", graciaHasta: "2026-10-08", modulos: "Mostrador" },
    { name: "Colorín", state: "activo", abonoDue: "2026-10-05", graciaHasta: null, modulos: "Compras" },
    { name: "Sinteplast", state: "activo", abonoDue: "2026-10-02", graciaHasta: null, modulos: "Fiscal AR" },
    { name: "Tersuave", state: "suspendido", abonoDue: "2026-09-01", graciaHasta: "2026-09-08", modulos: "Mostrador" },
    { name: "Venier", state: "baja", abonoDue: null, graciaHasta: null, modulos: "" },
  ];

  it("muestra saludo, estado, cola y serie, y solo Activo y Suspendido son enlaces", () => {
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
      ["bar", "bar", "bar"],
      ["table", "table", "table"],
      ["series", "series", "series"],
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
      ["En gracia", 1, "#inicio-tabla"],
    ]);
    expect(inicio.agenda.map((item) => item.titulo)).toEqual(["Sinteplast"]);
    expect(inicio.tabla?.filas.map((fila) => fila.celdas[0])).toEqual(["Alba"]);
    expect(inicio.tabla?.filas[0]?.celdas[2]).toBe("08/10/2026");
    expect(inicio.veredicto?.href).toBeNull();
    expect(inicio.serie?.href).toBeNull();
    expect(inicio.composicion?.href).toBeNull();
    expect(inicio.composicion?.total).toBe(5);
    expect(inicio.serie?.puntos.map((punto) => punto.valor)).toEqual([3, 0, 0, 0, 0]);
  });

  it("con la cartera vacía la barra sigue en tres partes y el total es cero", () => {
    const inicio = composicionInicio({
      superficie: "control-plane",
      consultor: "Mauricio",
      hoy: HOY,
      seccion: "inicio",
      tenants: [],
    });
    expect(inicio.barra?.map((parte) => [parte.label, parte.pct])).toEqual([
      ["Activo", 0],
      ["Suspendido", 0],
      ["Baja", 0],
    ]);
    expect(inicio.composicion?.total).toBe(0);
    expect(JSON.stringify(inicio)).not.toMatch(/Moroso/);
  });

  it("un activo vencido sin gracia no entra en la cola", () => {
    const inicio = composicionInicio({
      superficie: "control-plane",
      consultor: "Mauricio",
      hoy: HOY,
      seccion: "inicio",
      tenants: [{ name: "Alba", state: "activo", abonoDue: "2026-10-01", graciaHasta: null, modulos: "Mostrador" }],
    });
    expect(inicio.numeros.find((n) => n.label === "En gracia")?.valor).toBe(0);
    expect(inicio.tabla?.filas).toEqual([]);
  });

  it("la serie cuenta un vencimiento tardío del mes fuera de la ventana de 7 días", () => {
    const inicio = composicionInicio({
      superficie: "control-plane",
      consultor: "Mauricio",
      hoy: HOY,
      seccion: "inicio",
      tenants: [...tenants, { name: "Plavicon", state: "activo", abonoDue: "2026-10-20", graciaHasta: null, modulos: "Compras" }],
    });
    expect(inicio.veredicto?.secundario).toBe("2 abonos vencen dentro de 7 días");
    expect(inicio.serie?.puntos.map((punto) => punto.valor)).toEqual([3, 0, 1, 0, 0]);
  });
});

describe("módulos del ancla desde los tiles", () => {
  it("reconoce el nombre del módulo y no un texto parecido", () => {
    expect(modulosAnclaDesdeTiles([{ label: "Comprar pintura" }, { label: "Fiscalía" }])).toEqual([]);
    expect(modulosAnclaDesdeTiles([{ label: "Compras" }, { label: "Fiscal AR" }])).toEqual(["compras", "fiscal_ar"]);
  });
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
