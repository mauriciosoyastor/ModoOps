/** Modelo comercial — alineado con consultoria/CONTEXT.md (política de precios públicos). */

export const brand = {
  name: 'GalaxyGroup',
  tagline: 'Consultoría de sistemas de gestión para comercios',
} as const;

export const contact = {
  email: 'consultoria.matasini@gmail.com',
  whatsapp: 'https://wa.me/5493547532008',
  whatsappLabel: '+54 9 354 753-2008',
  instagram: 'https://instagram.com/galaxygroup',
  instagramLabel: '@galaxygroup',
} as const;

export const footer = {
  contactLead: 'Escribinos, suscribite a la newsletter o contactanos por redes.',
  newsletterLead: 'Novedades sobre integraciones, soporte y gestión comercial — sin spam.',
  copyright: `© ${new Date().getFullYear()} GalaxyGroup. Consultoría de sistemas de gestión.`,
} as const;

/** Solo precios publicables en web/PDF. */
export const publicPricing = {
  discovery: { amount: '$155.000', currency: 'ARS', label: 'Descubrimiento pago' },
  extraDay: { amount: '$52.000', currency: 'ARS', label: 'Jornada extra' },
} as const;

export const hero = {
  signature: `${brand.name} — consultoría para comercios`,
  title: 'POS, stock, compras, contabilidad, fiscal e integraciones.',
  subtitle: 'Consultoría de sistemas de gestión para comercios, PYMEs y servicios — Argentina.',
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
  title: 'Hoy: GalaxyGroup te ofrece la solucion para tu mostrador',
  lead: 'Implementaciones personalizadas y cotizadas cuando necesites.',
  highlights: [
    { title: 'Punto de venta (POS)', detail: 'Hasta 2 cajas, 1 sucursal — canal principal.' },
    { title: 'Inventario, compras y contactos', detail: 'Un almacén integrado con la caja.' },
    {
      title: 'Contabilidad operativa',
      detail: 'Alineada a ventas y compras (cierre mensual con tu estudio).',
    },
    {
      title: 'Catálogo con variantes básicas',
    },
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
    'Los montos de implementación y soporte se definen en la propuesta tras el descubrimiento.',
} as const;

export const supportModel = {
  title: 'Soporte post go-live',
  lead: 'Hipercare incluido en la implementación; continuidad con reglas claras.',
  phases: [
    {
      name: 'Hipercare',
      duration: '10 días hábiles',
      detail:
        'Corrección de incidentes según severidad acordada (alta y media sin workaround). No incluye cambios de alcance.',
    },
    {
      name: 'Mes de transición',
      duration: '1er mes calendario post-hipercare',
      detail:
        'Best effort en horario comercial; cambios cotizados. Sin bolsa de horas incluida.',
    },
    {
      name: 'Soporte continuo',
      duration: 'Desde el mes 2',
      detail:
        'Abono mensual obligatorio para atención reactiva: bolsa de horas mensual + best effort para bugs dentro del alcance aceptado. Cambios siempre cotizados.',
    },
  ],
} as const;

export const faq = {
  title: 'Preguntas frecuentes',
  lead: 'Integraciones, soporte y continuidad — en claro.',
  items: [
    {
      q: '¿Cómo agregamos integraciones con otros sistemas?',
      a: 'Cada integración se cotiza aparte con alcance cerrado: qué sistema conectamos, qué datos viajan y en qué sentido. Mercado Libre, eCommerce, balanzas u otros se evalúan como add-on o Fase 2 — nunca mezclados en el paquete base.',
    },
    {
      q: '¿Cómo funciona el soporte técnico?',
      a: 'Post go-live incluimos hipercare (10 días hábiles) para incidentes según severidad acordada. Después hay un mes de transición y, desde el mes 2, soporte continuo con abono mensual. Los cambios de alcance siempre se cotizan aparte.',
    },
    {
      q: '¿Qué incluye el mantenimiento mensual?',
      a: 'El abono cubre atención reactiva dentro del alcance aceptado: bolsa de horas mensual, best effort para bugs y consultas operativas. Horas no usadas vencen al cierre del mes. El monto se define en propuesta y contrato — no se publica en web.',
    },
    {
      q: '¿Seguimos consultando por WhatsApp sin abono?',
      a: 'El primer mes post-hipercare es mes de transición. Desde el mes 2, soporte continuo requiere abono mensual; si no, solo trabajos cotizados.',
    },
  ],
} as const;

export const audience = {
  title: '¿Es para tu negocio?',
  yesTitle: 'Sí, si…',
  yes: [
    'PYME comercial en Argentina: retail, pinturerías, ferreterías, librerías, kioscos, almacenes, dietéticas, pet shops o mostrador.',
    'Tenés una sucursal o varias sucursales.',
    'Querés caja, ventas, stock, compras, proveedores y contabilidad en un solo sistema.',
  ],
} as const;

export const howWeWork = {
  title: 'Cómo trabajamos',
  lead: 'Alcance claro, sin sorpresas.',
  rules: [
    'Alcance y exclusiones por escrito antes de empezar.',
    'Pagos por hitos con criterios de aceptación verificables (staging y go-live).',
    'Una implementación activa a la vez; plazos calculados con dedicación real (15–18 h/semana en fase inicial).',
  ],
} as const;

export const nav = [
  { href: '#soporte', label: 'Soporte' },
  { href: '#faq', label: 'FAQ' },
  { href: '#contacto', label: 'Contacto' },
] as const;
