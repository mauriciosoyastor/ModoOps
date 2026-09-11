// Seam único Objeto3D ↔ Módulo ModoOps + constructor del borrador JSON v1.
// Toda variante del portal (3D, plano 2D, recorrido) lee por acá; la validación
// real (hard gate fiscal, techo de horas) vive en el Configurador, nunca en el browser.
// Fuente SSOT: modoops_catalogo/catalogo.json vía catalogo.generated.ts (ADR 0009).
import {
  CATALOGO_HORAS,
  CATALOGO_KEYS,
  CATALOGO_LABELS,
  type CatalogoKey,
} from './catalogo.generated';

export type Objeto3DId =
  | 'mostrador-3d'
  | 'estanteria-3d'
  | 'gondola-3d'
  | 'computadora-3d'
  | 'pizarron-fiscal-3d'
  | 'puerta-crecer-3d';

export const OBJETO_A_MODULO = {
  'mostrador-3d': 'mostrador',
  'estanteria-3d': 'deposito',
  'gondola-3d': 'ventas',
  'computadora-3d': 'compras',
  'pizarron-fiscal-3d': 'fiscal_ar',
  'puerta-crecer-3d': 'b2b_basico',
} as const satisfies Record<Objeto3DId, CatalogoKey>;

export const OBJETO_LABEL: Record<Objeto3DId, string> = {
  'mostrador-3d': 'Mostrador / caja',
  'estanteria-3d': 'Estantería / depósito',
  'gondola-3d': 'Góndola / ventas',
  'computadora-3d': 'Computadora / compras',
  'pizarron-fiscal-3d': 'Pizarrón fiscal',
  'puerta-crecer-3d': 'Puerta "crecer" (futuro)',
};

const ANCLA: ReadonlySet<CatalogoKey> = new Set([
  'mostrador',
  'deposito',
  'ventas',
  'compras',
  'fiscal_ar',
  'contactos',
  'plataforma',
  'puente_factura',
]);

/** Módulos futuros que cuelgan de la puerta "crecer": candidatos a desarrollar (ticket 02). */
export const PUERTA_FUTURO: readonly CatalogoKey[] = [
  'logistica',
  'ecommerce',
  'web',
  'crm',
  'otro',
];

/** Módulos que van siempre, no se preguntan: se informan al final del chat. */
export const SIEMPRE_INCLUIDOS: readonly CatalogoKey[] = [
  'contactos',
  'plataforma',
  'puente_factura',
];

/** Una pregunta del chat: texto comerciante + a qué módulos y objeto construye. */
export interface PreguntaChat {
  id: string;
  bloque: 'Tu ancla' | 'Para crecer';
  texto: string;
  objeto: Objeto3DId;
  keys: CatalogoKey[];
  multi?: string[];
  /** Guion v2 (ticket 01 panel-chat): P1 abre, P2/P3 profundizan; `texto` === P1. */
  preguntas?: [string, string, string];
  /** Respuestas fuera del estándar: van a Descubrimiento, no al ancla. */
  flags?: FlagGuion[];
}

/** Un disparo fuera de estándar: pregunta hija (1|2), valor que lo prende y texto para el consultor. */
export interface FlagGuion {
  q: 1 | 2;
  cuando: 'si' | 'no';
  texto: string;
}

/** Guion T1: rama única con ejemplos por vertical; el "sí" construye el objeto. */
export const GUION_CHAT: readonly PreguntaChat[] = [
  {
    id: 'mostrador',
    bloque: 'Tu ancla',
    texto: '¿Atendés en mostrador o en persona en tu local?',
    objeto: 'mostrador-3d',
    keys: ['mostrador'],
    preguntas: [
      '¿Atendés en mostrador o en persona en tu local?',
      '¿Cobrás ahí mismo, en caja?',
      '¿Cobrás en más de 2 bocas?',
    ],
    flags: [{ q: 2, cuando: 'si', texto: 'Más de 2 bocas: re-cotizar (el ancla cubre máx 2)' }],
  },
  {
    id: 'deposito',
    bloque: 'Tu ancla',
    texto: '¿Tenés depósito o estantería con stock?',
    objeto: 'estanteria-3d',
    keys: ['deposito'],
    preguntas: [
      '¿Tenés depósito o estantería con stock?',
      '¿Todo en un solo almacén?',
      '¿Separás recepción, depósito y mostrador?',
    ],
    flags: [{ q: 1, cuando: 'no', texto: 'Multi-almacén: a evaluar, rompe el ICP de 1 almacén' }],
  },
  {
    id: 'ventas',
    bloque: 'Tu ancla',
    texto: '¿Vendés con listas de precio?',
    objeto: 'gondola-3d',
    keys: ['ventas'],
    preguntas: [
      '¿Vendés con listas de precio?',
      '¿Con una sola lista te alcanza?',
      '¿Precios distintos por cliente?',
    ],
    flags: [
      { q: 1, cuando: 'no', texto: 'Varias listas: a evaluar en Descubrimiento' },
      { q: 2, cuando: 'si', texto: 'Precios por cliente complejos: a evaluar (lista científica excluida del ancla)' },
    ],
  },
  {
    id: 'compras',
    bloque: 'Tu ancla',
    texto: '¿Comprás a proveedores?',
    objeto: 'computadora-3d',
    keys: ['compras'],
    preguntas: [
      '¿Comprás a proveedores?',
      '¿A menos de 10 proveedores?',
      '¿Trabajás con orden de compra?',
    ],
    flags: [{ q: 1, cuando: 'no', texto: 'Muchos proveedores: volumen a evaluar' }],
  },
  {
    id: 'fiscal',
    bloque: 'Tu ancla',
    texto: '¿Facturás?',
    objeto: 'pizarron-fiscal-3d',
    keys: ['fiscal_ar'],
    preguntas: [
      '¿Facturás?',
      '¿Sabés qué comprobantes usás (A/B/C/Ticket/Recibo)?',
      '¿Tenés contador que lo cierre?',
    ],
    flags: [{ q: 2, cuando: 'no', texto: 'Sin contador: el anexo fiscal queda pendiente, frena el go-live' }],
    multi: ['Factura A', 'Factura B', 'Factura C', 'Ticket', 'Recibo'],
  },
  {
    id: 'crecer',
    bloque: 'Para crecer',
    texto: '¿Para dónde querés crecer? Tildá todo lo que te sirva (a desarrollar, a cotizar).',
    objeto: 'puerta-crecer-3d',
    keys: ['logistica', 'ecommerce', 'web', 'crm', 'otro'],
    multi: ['Logística / reparto', 'Ecommerce', 'Página web', 'Seguimiento de clientes (CRM)', 'Otro (contanos)'],
  },
];

export function moduloDe(objeto: Objeto3DId): CatalogoKey {
  return OBJETO_A_MODULO[objeto];
}

/** Respuesta a una sub-pregunta del guion v2: sí, no o sin responder. */
export type RespuestaGuion = 'si' | 'no' | null;

/** Estado del guion v2: por módulo ancla, sus 3 respuestas [P1, P2, P3]. */
export type EstadoGuion = Record<string, [RespuestaGuion, RespuestaGuion, RespuestaGuion]>;

/** Módulos ancla con tripleta (el crecer multi-tilde no entra al reducer). */
const IDS_GUION_V2 = ['mostrador', 'deposito', 'ventas', 'compras', 'fiscal'];

/** Estado inicial: todo sin responder (oficina apagada). */
export function estadoInicialGuion(): EstadoGuion {
  const e: EstadoGuion = {};
  for (const id of IDS_GUION_V2) e[id] = [null, null, null];
  return e;
}

/**
 * Responde una sub-pregunta (inmutable). Regla de salteo: las hijas (q 1|2)
 * se ignoran sin Sí en P1, y el No en P1 las limpia. Levantable al panel (T3).
 */
export function responderGuion(
  estado: EstadoGuion,
  id: string,
  q: 0 | 1 | 2,
  valor: RespuestaGuion,
): EstadoGuion {
  const actual = estado[id];
  if (!actual) return estado;
  if (q > 0 && actual[0] !== 'si') return estado;
  const copia: EstadoGuion = { ...estado, [id]: [...actual] as [RespuestaGuion, RespuestaGuion, RespuestaGuion] };
  copia[id][q] = valor;
  if (q === 0 && valor !== 'si') {
    copia[id][1] = null;
    copia[id][2] = null;
  }
  return copia;
}

/** Estado visual del objeto: apagado, fantasma (No en P1) o encendido (algún Sí). */
export function estadoObjetoGuion(estado: EstadoGuion, id: string): 'apagado' | 'fantasma' | 'encendido' {
  const arr = estado[id];
  if (!arr) return 'apagado';
  if (arr.some((v) => v === 'si')) return 'encendido';
  if (arr[0] === 'no') return 'fantasma';
  return 'apagado';
}

/** Flags fuera de estándar disparados: van a Descubrimiento, no al ancla. */
export function flagsGuion(estado: EstadoGuion): string[] {
  const out: string[] = [];
  for (const p of GUION_CHAT) {
    if (!p.preguntas || !p.flags) continue;
    const arr = estado[p.id];
    if (!arr) continue;
    for (const f of p.flags) {
      if (arr[f.q] === f.cuando) out.push(f.texto);
    }
  }
  return out;
}

/** Keys del catálogo con algún Sí en el guion (alimenta `borradorV1`). */
export function seleccionDeGuion(estado: EstadoGuion): CatalogoKey[] {
  const out: CatalogoKey[] = [];
  for (const p of GUION_CHAT) {
    if (!p.preguntas) continue;
    const arr = estado[p.id];
    if (arr && arr.some((v) => v === 'si')) out.push(...p.keys);
  }
  return [...new Set(out)].sort();
}

export function labelDe(key: CatalogoKey): string {
  return CATALOGO_LABELS[key];
}

export function horasDe(key: CatalogoKey): number {
  return CATALOGO_HORAS[key];
}

export function esAncla(key: CatalogoKey): boolean {
  return ANCLA.has(key);
}

/** Borrador JSON v1 (pre-Descubrimiento, no vinculante): lo que el Prospecto tildó. */
export function borradorV1(seleccion: Iterable<CatalogoKey>) {
  const modulos = [...seleccion].sort();
  const horas = modulos.reduce((acc, k) => acc + horasDe(k), 0);
  return {
    version: 'borrador-v1',
    vinculante: false,
    origen: 'portal-oficina-3d',
    modulos_ancla: modulos.filter(esAncla),
    modulos_futuros: modulos.filter((k) => !esAncla(k)),
    horas_estimadas: horas,
  };
}

// ---- Forma completa del borrador (ticket 01) ----

export type Rubro = 'retail' | 'distribucion' | 'servicios';

export interface Prospecto {
  nombre: string;
  contacto_nombre: string;
  telefono: string;
  email: string;
  rubro: Rubro;
  sucursales: number;
  cajas: number;
  usuarios: number;
}

export interface FichasObjetos {
  'mostrador-3d': { cajas: number; descuento: boolean };
  'estanteria-3d': { almacenes: number; ubicaciones: boolean };
  'gondola-3d': { listas_precio: number };
  'computadora-3d': { proveedores: number; orden_compra: boolean };
  'pizarron-fiscal-3d': { comprobantes: string[]; contador: string };
  'puerta-crecer-3d': { futuros: CatalogoKey[] };
}

export interface DatosCatalogo {
  productos_aprox: number;
  tiene_excel: boolean;
}

export interface Infra {
  hosting_propio: boolean;
  dominio_ssl: boolean;
  backups: boolean;
}

export interface BorradorInput {
  prospecto: Prospecto;
  objetos: FichasObjetos;
  seleccion: Iterable<CatalogoKey>;
  datos: DatosCatalogo;
  infra: Infra;
}

export interface BorradorV1 {
  version: 'borrador-v1';
  vinculante: false;
  origen: 'portal-oficina-3d';
  prospecto: Prospecto;
  objetos: FichasObjetos;
  modulos_ancla: CatalogoKey[];
  modulos_futuros: CatalogoKey[];
  horas_estimadas: number;
  datos: DatosCatalogo;
  infra: Infra;
}

/** Construye el borrador completo a partir de lo que cargó el Prospecto. */
export function construirBorrador(input: BorradorInput): BorradorV1 {
  const base = borradorV1(input.seleccion);
  return {
    ...base,
    version: 'borrador-v1',
    vinculante: false,
    origen: 'portal-oficina-3d',
    prospecto: input.prospecto,
    objetos: input.objetos,
    datos: input.datos,
    infra: input.infra,
  };
}

/** WhatsApp comercial (wa.me exige país + móvil, sin `+` ni espacios). */
export const WHATSAPP_COMERCIAL = 'https://wa.me/5493547532008';

/**
 * Mensaje legible del borrador (contrato T3): criollo, sin precios de ancla o
 * add-ons, con cierre no vinculante. El JSON viaja por copiar, no acá.
 */
export function mensajeWhatsApp(b: BorradorV1): string {
  const nombre = b.prospecto.contacto_nombre || b.prospecto.nombre;
  const contacto = [b.prospecto.telefono, b.prospecto.email].filter(Boolean).join(' · ');
  const lineas = [
    `Hola ModoOps, soy ${nombre} de ${b.prospecto.nombre} (${b.prospecto.rubro}${contacto ? `, ${contacto}` : ''}).`,
    'Armé mi borrador no vinculante en la oficina virtual:',
  ];
  for (const k of b.modulos_ancla) {
    if (!(SIEMPRE_INCLUIDOS as readonly string[]).includes(k)) lineas.push(`- ${labelDe(k)}`);
  }
  if (b.modulos_futuros.length) {
    lineas.push(`Para crecer: ${b.modulos_futuros.map(labelDe).join(', ')}.`);
  }
  lineas.push(`Van siempre incluidos: ${SIEMPRE_INCLUIDOS.map(labelDe).join(', ')}.`);
  lineas.push('Te paso el JSON borrador-v1 por acá mismo para el Descubrimiento. ¡Gracias!');
  return lineas.join('\n');
}

/** Enlace wa.me con el texto codificado. */
export function enlaceWhatsApp(texto: string): string {
  return `${WHATSAPP_COMERCIAL}?text=${encodeURIComponent(texto)}`;
}

/** Input del `generar` del Configurador (contrato T3): lo que el consultor importa. */
export interface GenerarInput {
  vertical: string;
  sucursales: number;
  almacenes: number;
  cajas_pos: number;
  usuarios: number;
  lista_precios: number;
  modulos_tildados: CatalogoKey[];
  sku_count: number;
  anexo_fiscal_ref?: string;
}

/**
 * Traduce el borrador al input de `generar`: síes + siempre-incluidos a
 * tildados, rubro a vertical, conteos a sus campos. Sin anexo fiscal: el
 * portal nunca trae anexo firmado, el gate lo cierra el consultor.
 */
export function traducirBorradorAGenerar(b: BorradorV1): GenerarInput {
  const tildados = new Set<CatalogoKey>([...b.modulos_ancla, ...b.modulos_futuros]);
  for (const k of SIEMPRE_INCLUIDOS) tildados.add(k);
  return {
    vertical: b.prospecto.rubro,
    sucursales: b.prospecto.sucursales,
    almacenes: b.objetos['estanteria-3d'].almacenes,
    cajas_pos: b.objetos['mostrador-3d'].cajas,
    usuarios: b.prospecto.usuarios,
    lista_precios: b.objetos['gondola-3d'].listas_precio,
    modulos_tildados: [...tildados].sort(),
    sku_count: b.datos.productos_aprox,
  };
}

/**
 * Valida lo único requerido del borrador: nombre del negocio y un contacto
 * (teléfono o email). Todo lo demás es opcional; las validaciones duras
 * (1 sucursal, 2 cajas, ~5 usuarios ICP) las hace el consultor en el Descubrimiento.
 */
export function validarBorrador(b: Pick<BorradorV1, 'prospecto'>): string[] {
  const errores: string[] = [];
  if (!b.prospecto.nombre.trim()) errores.push('Falta el nombre del negocio');
  if (!b.prospecto.telefono.trim() && !b.prospecto.email.trim()) {
    errores.push('Falta un contacto (teléfono o email)');
  }
  return errores;
}

// ---- Persistencia local (cero backend) ----

export const CLAVE_BORRADOR = 'modoops.borrador.v1';

export interface Almacenamiento {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

function almacenamientoDefault(): Almacenamiento | null {
  if (typeof localStorage === 'undefined') return null;
  return localStorage;
}

export function guardarBorrador(
  b: BorradorV1,
  almacenamiento: Almacenamiento | null = almacenamientoDefault(),
): boolean {
  if (!almacenamiento) return false;
  try {
    almacenamiento.setItem(CLAVE_BORRADOR, JSON.stringify(b));
    return true;
  } catch {
    return false;
  }
}

export function cargarBorrador(
  almacenamiento: Almacenamiento | null = almacenamientoDefault(),
): BorradorV1 | null {
  if (!almacenamiento) return null;
  try {
    const raw = almacenamiento.getItem(CLAVE_BORRADOR);
    if (!raw) return null;
    const b = JSON.parse(raw) as BorradorV1;
    if (b?.version !== 'borrador-v1') return null;
    return b;
  } catch {
    return null;
  }
}

export { CATALOGO_KEYS };
export type { CatalogoKey };
