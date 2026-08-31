/** Modelo comercial — canónico ModoOps (CONTEXT.md). */

export const brand = {
  name: 'ModoOps',
  tagline: 'Sistema de Gestión Modular — Argentina, PYME, una sucursal.',
} as const;

export const contact = {
  email: 'consultoria.matasini@gmail.com',
  whatsapp: 'https://wa.me/5493547532008',
  whatsappLabel: '+54 9 354 753-2008',
} as const;

export function whatsappWithUtm(source: string): string {
  const utm = typeof window !== 'undefined' ? new URLSearchParams(window.location.search).toString() : '';
  const text = encodeURIComponent(`Hola ModoOps — vengo de ${source}${utm ? ` (${utm})` : ''} — rubro: __, ciudad: __, cajas: __`);
  return `${contact.whatsapp}?text=${text}`;
}

export const footer = {
  contactLead: 'Escribinos por WhatsApp o email. El descubrimiento arranca cuando hay fit.',
  newsletterLead: 'Novedades sobre ModoOps — sin spam.',
  copyright: `© ${new Date().getFullYear()} ModoOps — Sistema de Gestión Modular.`,
} as const;

/** Solo precios publicables en web/PDF — USD canónico. */
export const publicPricing = {
  discovery: { amount: '$155 USD', currency: 'USD', label: 'Descubrimiento pago' },
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
  lead: 'Mostrador, Depósito Inteligente, Compras, Fiscal AR y más — del Catálogo ModoOps validado. Sin exponer Odoo en la propuesta comercial.',
  highlights: [
    { title: 'Mostrador', detail: 'Punto de venta — hasta 2 cajas, 1 sucursal.' },
    { title: 'Depósito Inteligente', detail: 'Inventario — 1 almacén integrado con la caja.' },
    { title: 'Compras', detail: 'Proveedores y órdenes de compra básicas.' },
    { title: 'Fiscal AR', detail: 'Según anexo fiscal cerrado con tu contador (no se asume por defecto).' },
  ],
} as const;

export const path = {
  title: 'Cómo empezamos',
  lead: 'Primero diagnóstico, después implementación y soporte.',
  steps: [
    {
      step: 'Paso 1',
      title: 'Descubrimiento',
      detail: `3 días · ${publicPricing.discovery.amount} · informe + propuesta con alcance y precio.`,
    },
    {
      step: 'Paso 2',
      title: 'Implementación',
      detail: 'Retail acotado · staging y go-live con hitos y criterios de aceptación.',
    },
    {
      step: 'Paso 3',
      title: 'Soporte',
      detail: 'Hipercare incluido; después, abono mensual acordado en propuesta.',
    },
  ],
  footnote:
    'Los montos de implementación y soporte se definen en la propuesta tras el descubrimiento. Validez de propuesta: 20 días.',
} as const;

export const discovery = {
  title: 'Descubrimiento pago',
  price: '$155 USD',
  duration: '3 jornadas',
  extraDay: '$52 USD por jornada adicional',
  includes: [
    'Informe de diagnóstico — proceso actual, riesgos, gaps, recomendación técnica.',
    'Propuesta comercial — alcance, exclusiones, plazos, precio de implementación.',
  ],
} as const;

export const audience = {
  title: '¿Es para tu negocio?',
  yesTitle: 'Sí, si…',
  yes: [
    'PYME comercial en Argentina: retail, pinturerías, ferreterías, librerías, kioscos, almacenes, dietéticas, pet shops o mostrador.',
    'Tenés una sucursal (o empezás por una), equipo chico (~5 personas).',
    'Querés caja, stock y compras en un solo sistema ModoOps.',
    'Aceptás arrancar con descubrimiento ($155 USD) antes del proyecto.',
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
    'Pagos por hitos con criterios de aceptación verificables (staging y go-live).',
    'Licencia a cargo del cliente; sin SLA de infra del consultor.',
    'Fiscal: anexo cerrado con tu contador antes de emitir en producción.',
  ],
} as const;

export const nav = [
  { href: '#camino', label: 'Camino' },
  { href: '#descubrimiento', label: 'Descubrimiento' },
  { href: '#contacto', label: 'Contacto' },
] as const;
