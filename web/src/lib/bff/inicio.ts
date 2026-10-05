/** Composición del Inicio. Pura: sin Odoo y sin el documento de origen de las cifras del Shell. */

export type ModuloAncla = "mostrador" | "deposito" | "compras" | "fiscal_ar";

export type Celda = "greet" | "bar" | "stats" | "agenda" | "table" | "verdict" | "series" | "comp";

export type NavItem = { label: string; href: string; actual: boolean };

export type Tono = "accent" | "ok" | "warn" | "ink" | "line";

export type ParteBarra = { label: string; pct: number; href: string | null; tono?: Tono };

export type NumeroInicio = { label: string; valor: number; href: string | null; tono?: Tono };

export type ItemAgenda = { titulo: string; detalle: string; href: string | null };

export type FilaTabla = { celdas: string[]; tonos?: (Tono | null)[] };

export type BloqueTabla = { titulo: string; href: string | null; columnas: string[]; filas: FilaTabla[] };

export type BloqueVeredicto = {
  titulo: string;
  principal: string;
  secundario: string;
  href: string | null;
};

export type BloqueSerie = {
  titulo: string;
  href: string | null;
  puntos: { label: string; valor: number }[];
};

export type BloqueComposicion = {
  titulo: string;
  href: string | null;
  total: number;
  partes: { label: string; pct: number }[];
};

export type Inicio = {
  saludo: string;
  bajada: string;
  nav: NavItem[];
  cerrarSesion: "Cerrar sesión";
  filas: Celda[][];
  barraTitulo: string | null;
  barra: ParteBarra[] | null;
  numeros: NumeroInicio[];
  agenda: ItemAgenda[];
  tabla: BloqueTabla | null;
  veredicto: BloqueVeredicto | null;
  serie: BloqueSerie | null;
  composicion: BloqueComposicion | null;
};

export type TenantCartera = {
  name: string;
  state: string;
  abonoDue: string | null;
  graciaHasta: string | null;
  modulos: string;
};

const ANCLA: readonly ModuloAncla[] = ["mostrador", "deposito", "compras", "fiscal_ar"];

const ROTULO: Record<ModuloAncla, string> = {
  mostrador: "Mostrador",
  deposito: "Depósito Inteligente",
  compras: "Compras",
  fiscal_ar: "Fiscal AR",
};

function tonoEstado(estado: string): Tono | null {
  if (estado === "Por recibir") return "warn";
  if (estado === "En camino") return "accent";
  if (estado === "Confirmada") return "ok";
  return null;
}

const usd = new Intl.NumberFormat("es-AR", { style: "currency", currency: "USD" });
const fechaEs = new Intl.DateTimeFormat("es-AR", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  timeZone: "UTC",
});

export function modulosAnclaDesdeTiles(tiles: readonly { label: string }[]): ModuloAncla[] {
  const found = new Set<ModuloAncla>();
  for (const tile of tiles) {
    const label = tile.label.toLocaleLowerCase("es-AR");
    if (esNombreDeModulo(label, "mostrador")) found.add("mostrador");
    if (esNombreDeModulo(label, "depósito inteligente") || esNombreDeModulo(label, "deposito inteligente")) {
      found.add("deposito");
    }
    if (esNombreDeModulo(label, "compras")) found.add("compras");
    if (esNombreDeModulo(label, "fiscal ar")) found.add("fiscal_ar");
  }
  return ANCLA.filter((id) => found.has(id));
}

function esNombreDeModulo(label: string, nombre: string): boolean {
  return label === nombre || label.startsWith(`${nombre} `);
}

type ShellInput = {
  superficie: "shell";
  usuario: string;
  cliente: string;
  slug: string;
  hoy: string;
  modulos?: readonly ModuloAncla[];
  seccion?: "inicio" | ModuloAncla;
};

type ControlPlaneInput = {
  superficie: "control-plane";
  consultor: string;
  hoy: string;
  seccion: "inicio" | "tenants" | "leads";
  tenants: readonly TenantCartera[];
};

export function composicionInicio(input: ShellInput | ControlPlaneInput): Inicio {
  if (input.superficie === "control-plane") return controlPlane(input);
  return shell(input);
}

function shell(input: ShellInput): Inicio {
  const presentes = new Set(input.modulos ?? ANCLA);
  const tiene = (id: ModuloAncla) => presentes.has(id);
  const href = (id: ModuloAncla) => `/tenant/${input.slug}/app?tab=${id}`;
  const seccion = input.seccion ?? "inicio";

  const numeros: NumeroInicio[] = [];
  if (tiene("mostrador")) numeros.push({ label: "Ventas de hoy", valor: 24, href: href("mostrador"), tono: "accent" });
  if (tiene("deposito")) numeros.push({ label: "Productos bajo stock", valor: 7, href: href("deposito"), tono: "warn" });
  if (tiene("compras")) numeros.push({ label: "Compras sin recibir", valor: 4, href: href("compras"), tono: "warn" });

  const agenda: ItemAgenda[] = [];
  if (tiene("mostrador")) agenda.push({ titulo: "Cierre de caja", detalle: "", href: href("mostrador") });
  if (tiene("compras")) agenda.push({ titulo: "Recepción", detalle: "", href: href("compras") });
  if (tiene("fiscal_ar")) agenda.push({ titulo: "Vencimiento fiscal", detalle: "", href: href("fiscal_ar") });

  return {
    saludo: input.usuario ? `Hola, ${input.usuario}` : "Hola",
    bajada: input.cliente,
    nav: [
      { label: "Inicio", href: `/tenant/${input.slug}/app`, actual: seccion === "inicio" },
      ...ANCLA.filter((id) => tiene(id)).map((id) => ({
        label: ROTULO[id],
        href: href(id),
        actual: seccion === id,
      })),
    ],
    cerrarSesion: "Cerrar sesión",
    filas: filasShell(presentes),
    barraTitulo: tiene("mostrador") ? "Tickets del día" : null,
    barra: tiene("mostrador")
      ? [
          { label: "Efectivo", pct: 63, href: href("mostrador"), tono: "ok" },
          { label: "QR", pct: 17, href: href("mostrador"), tono: "accent" },
          { label: "Tarjeta", pct: 12, href: href("mostrador"), tono: "ink" },
          { label: "Sin cobrar", pct: 8, href: href("mostrador"), tono: "warn" },
        ]
      : null,
    numeros,
    agenda,
    tabla: tiene("compras")
      ? {
          titulo: "Compras sin recibir",
          href: href("compras"),
          columnas: ["Proveedor", "Estado", "Monto"],
          filas: [
            ["Alba", "Por recibir", 1240],
            ["Colorín", "En camino", 860],
            ["Sinteplast", "Por recibir", 410],
            ["Tersuave", "Confirmada", 220],
          ].map(([proveedor, estado, monto]) => ({
            celdas: [String(proveedor), String(estado), usd.format(Number(monto))],
            tonos: [null, tonoEstado(String(estado)), null],
          })),
        }
      : null,
    veredicto: tiene("mostrador")
      ? {
          titulo: "Caja",
          principal: `${usd.format(48500)} cobrado`,
          secundario: `${usd.format(4200)} sigue abierto`,
          href: href("mostrador"),
        }
      : null,
    serie: tiene("mostrador")
      ? {
          titulo: "Ventas por semana",
          href: href("mostrador"),
          puntos: [
            { label: "Semana 1", valor: 86 },
            { label: "Semana 2", valor: 74 },
            { label: "Semana 3", valor: 91 },
            { label: "Semana 4", valor: 68 },
          ],
        }
      : null,
    composicion: tiene("deposito")
      ? {
          titulo: "Stock",
          href: href("deposito"),
          total: 80,
          partes: [
            { label: "En condición normal", pct: 91 },
            { label: "Bajo mínimo", pct: 9 },
          ],
        }
      : null,
  };
}

function filasShell(presentes: ReadonlySet<ModuloAncla>): Celda[][] {
  const tiene = (id: ModuloAncla) => presentes.has(id);
  const bar = tiene("mostrador");
  const stats = tiene("mostrador") || tiene("deposito") || tiene("compras");
  const agenda = tiene("mostrador") || tiene("compras") || tiene("fiscal_ar");
  const table = tiene("compras");
  const series = tiene("mostrador");
  const verdict = tiene("mostrador");
  const comp = tiene("deposito");

  const filas: Celda[][] = [];
  if (bar && stats) filas.push(["greet", "bar", "stats"]);
  else if (!stats) filas.push(["greet", "greet", "greet"]);
  else filas.push(["greet", "greet", "stats"]);

  const medio: Celda | null = table ? "table" : series ? "series" : null;
  const trabajo: Celda[] = [];
  if (agenda) trabajo.push("agenda");
  if (medio) trabajo.push(medio);
  if (verdict) trabajo.push("verdict");
  else if (comp && !series) trabajo.push("comp");

  if (trabajo.length === 1) {
    const solo = trabajo[0]!;
    filas.push([solo, solo, solo]);
  } else if (trabajo.length === 2) {
    filas.push([trabajo[0]!, trabajo[1]!, trabajo[1]!]);
  } else if (trabajo.length === 3) {
    filas.push([trabajo[0]!, trabajo[1]!, trabajo[2]!]);
  }

  if (series && !trabajo.includes("series")) filas.push(["series", "series", "series"]);
  if (comp && !trabajo.includes("comp")) filas.push(["comp", "comp", "comp"]);
  return filas;
}

function controlPlane(input: ControlPlaneInput): Inicio {
  const hoy = parseDia(input.hoy);
  const activos = input.tenants.filter((t) => t.state === "activo");
  const suspendidos = input.tenants.filter((t) => t.state === "suspendido");
  const bajas = input.tenants.filter((t) => t.state === "baja");
  const enGracia = activos.filter((t) => estaEnGracia(t, hoy));
  const ventana = activos.filter((t) => {
    const due = parseDia(t.abonoDue);
    if (!hoy || !due) return false;
    return due >= hoy && due <= addDias(hoy, 7);
  });
  const vencenHoy = ventana.filter((t) => {
    const due = parseDia(t.abonoDue);
    return Boolean(hoy && due && due === hoy);
  });
  const [pctActivo, pctSuspendido, pctBaja] = porcentajes([activos.length, suspendidos.length, bajas.length]);
  const resto = input.tenants.length - ventana.length;
  const partes = porcentajes([ventana.length, resto]);

  return {
    saludo: input.consultor ? `Hola, ${input.consultor}` : "Hola",
    bajada: "Control Plane",
    nav: [
      { label: "Inicio", href: "/admin/inicio", actual: input.seccion === "inicio" },
      { label: "Tenants", href: "/admin/tenants", actual: input.seccion === "tenants" },
      { label: "Leads", href: "/admin/leads", actual: input.seccion === "leads" },
    ],
    cerrarSesion: "Cerrar sesión",
    filas: [
      ["greet", "greet", "stats"],
      ["bar", "bar", "bar"],
      ["table", "table", "table"],
      ["series", "series", "series"],
    ],
    barraTitulo: "Estado Tenant",
    barra: [
      { label: "Activo", pct: pctActivo, href: "/admin/tenants?estado=activo" },
      { label: "Suspendido", pct: pctSuspendido, href: "/admin/tenants?estado=suspendido" },
      { label: "Baja", pct: pctBaja, href: null },
    ],
    numeros: [
      { label: "Activos", valor: activos.length, href: "/admin/tenants?estado=activo" },
      { label: "En gracia", valor: enGracia.length, href: "#inicio-tabla" },
    ],
    agenda: vencenHoy.map((t) => ({ titulo: t.name, detalle: "Vence el abono", href: null })),
    tabla: {
      titulo: "Tenants en gracia",
      href: null,
      columnas: ["Nombre", "Estado", "Vencimiento", "Módulos"],
      filas: enGracia.map((t) => ({
        celdas: [t.name, "Activo", fechaVisible(t.graciaHasta), t.modulos],
      })),
    },
    veredicto: {
      titulo: "Cartera",
      principal: enGracia.length === 1 ? "1 tenant en gracia" : `${enGracia.length} tenants en gracia`,
      secundario:
        ventana.length === 1
          ? "1 abono vence dentro de 7 días"
          : `${ventana.length} abonos vencen dentro de 7 días`,
      href: null,
    },
    serie: {
      titulo: "Abonos que vencen por semana",
      href: null,
      puntos: semanasDelMes(hoy).map((label) => ({
        label,
        valor: input.tenants.filter((t) => semanaDe(parseDia(t.abonoDue), hoy) === label).length,
      })),
    },
    composicion: {
      titulo: "Vencimientos",
      href: null,
      total: input.tenants.length,
      partes: [
        { label: "Vencen dentro de 7 días", pct: partes[0] ?? 0 },
        { label: "El resto", pct: partes[1] ?? 0 },
      ],
    },
  };
}

function estaEnGracia(tenant: TenantCartera, hoy: number | null): boolean {
  if (tenant.state !== "activo" || hoy == null) return false;
  const vencio = parseDia(tenant.abonoDue);
  const hasta = parseDia(tenant.graciaHasta);
  if (vencio == null || hasta == null) return false;
  return vencio < hoy && hoy <= hasta;
}

function fechaVisible(iso: string | null): string {
  const dia = parseDia(iso);
  if (dia == null) return "";
  return fechaEs.format(new Date(dia));
}

function parseDia(iso: string | null | undefined): number | null {
  if (!iso) return null;
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso);
  if (!match) return null;
  return Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
}

function addDias(dia: number, cantidad: number): number {
  return dia + cantidad * 86_400_000;
}

function porcentajes(valores: number[]): number[] {
  const total = valores.reduce((suma, valor) => suma + valor, 0);
  if (total <= 0) return valores.map(() => 0);
  const exactos = valores.map((valor) => (valor * 100) / total);
  const pisos = exactos.map((valor) => Math.floor(valor));
  let resto = 100 - pisos.reduce((suma, valor) => suma + valor, 0);
  const orden = exactos
    .map((valor, indice) => ({ indice, fraccion: valor - Math.floor(valor) }))
    .sort((a, b) => b.fraccion - a.fraccion || a.indice - b.indice);
  const salida = [...pisos];
  for (const item of orden) {
    if (resto <= 0) break;
    salida[item.indice] += 1;
    resto -= 1;
  }
  return salida;
}

function semanasDelMes(hoy: number | null): string[] {
  if (hoy == null) return ["Semana 1", "Semana 2", "Semana 3", "Semana 4"];
  const fecha = new Date(hoy);
  const ultimo = new Date(Date.UTC(fecha.getUTCFullYear(), fecha.getUTCMonth() + 1, 0)).getUTCDate();
  const cantidad = Math.ceil(ultimo / 7);
  return Array.from({ length: cantidad }, (_, indice) => `Semana ${indice + 1}`);
}

export type SesionPuesto = {
  persona: string;
  caja: string;
  accion: "Bloquear puesto" | "Desbloquear puesto";
  aviso: string | null;
};

export function sesionDelPuesto(input: { persona: string; caja: string; bloqueado: boolean }): SesionPuesto {
  const persona = input.persona.trim();
  return {
    persona,
    caja: input.caja,
    accion: input.bloqueado ? "Desbloquear puesto" : "Bloquear puesto",
    aviso: input.bloqueado
      ? persona
        ? `Puesto bloqueado. La sesión de ${persona} sigue abierta.`
        : "Puesto bloqueado. La sesión sigue abierta."
      : null,
  };
}

function semanaDe(dia: number | null, hoy: number | null): string | null {
  if (dia == null || hoy == null) return null;
  const fecha = new Date(dia);
  const mes = new Date(hoy);
  if (fecha.getUTCFullYear() !== mes.getUTCFullYear() || fecha.getUTCMonth() !== mes.getUTCMonth()) return null;
  return `Semana ${Math.ceil(fecha.getUTCDate() / 7)}`;
}
