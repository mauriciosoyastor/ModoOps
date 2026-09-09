/** Modelo comercial — canónico ModoOps (CONTEXT.md). */

export const brand = {
  name: 'ModoOps',
  tagline: 'Sistema de Gestión Modular — Argentina, PYME, una sucursal.',
} as const;

export const contact = {
  email: 'mauriciomatasini27@gmail.com',
  whatsapp: 'https://wa.me/5493547532008',
  whatsappLabel: '+54 9 354 753-2008',
} as const;

const ALLOWED_UTM_KEYS = [
  'utm_source',
  'utm_medium',
  'utm_campaign',
  'utm_content',
  'utm_term',
  'gclid',
  'fbclid',
] as const;

const UTM_STORAGE_KEY = 'modoops_utm';

export function parseUtm(search: string): string {
  const raw = search.startsWith('?') ? search.slice(1) : search;
  if (!raw) return '';
  const params = new URLSearchParams(raw);
  const filtered = new URLSearchParams();
  for (const key of ALLOWED_UTM_KEYS) {
    const v = params.get(key);
    if (v !== null) filtered.set(key, v);
  }
  return filtered.toString();
}

export function whatsappWithUtm(source: string): string {
  let utm = '';
  if (typeof window !== 'undefined') {
    try {
      const raw = window.location.search;
      const parsed = parseUtm(raw);
      if (parsed) {
        window.sessionStorage.setItem(UTM_STORAGE_KEY, parsed);
        utm = parsed;
      } else {
        utm = window.sessionStorage.getItem(UTM_STORAGE_KEY) || '';
      }
    } catch {
      // storage blocked or SSR — fallback sin UTM
      try {
        utm = parseUtm(window.location.search);
      } catch {
        utm = '';
      }
    }
  }
  const text = encodeURIComponent(`Hola ModoOps — vengo de ${source}${utm ? ` (${utm})` : ''} — rubro: __, ciudad: __, cajas: __`);
  return `${contact.whatsapp}?text=${text}`;
}

export const footer = {
  contactLead: 'Escribinos por WhatsApp o email. Arrancamos cuando hay fit.',
  newsletterLead: 'Novedades sobre ModoOps — sin spam.',
  copyright: `© ${new Date().getFullYear()} ModoOps — Sistema de Gestión Modular.`,
} as const;

/** Solo precios publicables en web/PDF — USD canónico. */
export const publicPricing = {
  extraDay: { amount: '$52 USD', currency: 'USD', label: 'Jornada extra' },
} as const;

export const hero = {
  signature: 'ModoOps (Mauricio Matasini, arquitecto)',
  title: 'Tu operación, en modo.',
  subtitle: 'ModoOps — Sistema de Gestión Modular — Argentina, PYME, una sucursal.',
} as const;

export const problem = {
  title: 'Cuando la operación está fragmentada',
  lead: 'Planillas, caja y stock desconectados cuestan tiempo, plata y dolores de cabeza.',
  pains: [
    'Stock desactualizado (faltantes y sobrestock).',
    'Tiempo perdido cargando lo mismo en varios lugares.',
    'Errores en precios y reposición.',
    'Poca visibilidad para decidir qué comprar y qué promover.',
  ],
  closing:
    'Con una sucursal y un equipo chico no hace falta un sistema gigante: hace falta una operación clara en un solo lugar.',
} as const;

export const solution = {
  title: 'ModoOps modular — elegís los módulos que tu operación necesita',
  lead: 'Mostrador, Depósito Inteligente, Compras, Facturación electrónica y más — del Catálogo ModoOps validado.',
  highlights: [
    { title: 'Mostrador', detail: 'Punto de venta — hasta 2 cajas, 1 sucursal.' },
    { title: 'Depósito Inteligente', detail: 'Inventario — 1 almacén integrado con la caja.' },
    { title: 'Compras', detail: 'Proveedores y órdenes de compra básicas.' },
    { title: 'Facturación electrónica', detail: 'Comprobantes validados con tu contador.' },
  ],
} as const;

export const path = {
  title: 'Cómo empezamos',
  lead: 'Primero propuesta, después implementación y soporte.',
  steps: [
    {
      step: 'Paso 1',
      title: 'Propuesta',
      detail: 'Relevamiento + propuesta con alcance, precio y plazos.',
    },
    {
      step: 'Paso 2',
      title: 'Implementación',
      detail: 'Retail acotado · prueba y puesta en producción con hitos y criterios de aceptación.',
    },
    {
      step: 'Paso 3',
      title: 'Soporte',
      detail: 'Hipercare incluido; después, abono mensual acordado en propuesta.',
    },
  ],
  footnote:
    'Los montos de implementación y soporte se definen en la propuesta. Validez de propuesta: 20 días.',
} as const;

export const audience = {
  title: '¿Es para tu negocio?',
  yesTitle: 'Sí, si…',
  yes: [
    'PYME comercial en Argentina: retail, pinturerías, ferreterías, librerías, kioscos, almacenes, dietéticas, pet shops o mostrador.',
    'Tenés una sucursal (o empezás por una), equipo chico (~5 personas).',
    'Querés caja, stock y compras en un solo sistema ModoOps.',
    'Aceptás arrancar con propuesta y anticipo antes del proyecto.',
  ],
  noTitle: 'No es para vos si…',
  no: [
    'Necesitás muchas sucursales o B2B complejo desde día 1.',
    'Querés solo integración con otro sistema, sin montar la operación en ModoOps.',
    'Buscás desarrollo a medida ilimitado sin alcance.',
    'No podés dedicar tiempo a datos, fiscal con tu contador e infra propia.',
  ],
} as const;

export const howWeWork = {
  title: 'Cómo trabajamos',
  lead: 'Alcance claro, sin sorpresas.',
  rules: [
    'Alcance y exclusiones por escrito antes de empezar.',
    'Pagos por hitos con criterios de aceptación verificables (prueba y puesta en producción).',
    'Licencia a cargo del cliente; sin garantía de disponibilidad del consultor.',
    'Facturación: comprobantes validados con tu contador antes de emitir en producción.',
  ],
} as const;

export const nav = [
  { href: '#camino', label: 'Camino' },
  { href: '#contacto', label: 'Contacto' },
] as const;
