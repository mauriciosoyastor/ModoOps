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

/** Módulos futuros que cuelgan de la puerta "crecer" (add-ons, no ancla). */
export const PUERTA_FUTURO: readonly CatalogoKey[] = [
  'taller',
  'migracion_excel',
  'b2b_basico',
  'ia',
];

export function moduloDe(objeto: Objeto3DId): CatalogoKey {
  return OBJETO_A_MODULO[objeto];
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
