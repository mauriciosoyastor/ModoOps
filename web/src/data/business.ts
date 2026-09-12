/** Modelo comercial — canónico ModoOps (CONTEXT.md). */

export const brand = {
  name: 'ModoOps',
  tagline: 'Sistema de Gestión Modular — Argentina, PYME, una sucursal.',
} as const;

export const contact = {
  email: 'mauriciomatasini27@gmail.com',
  whatsapp: 'https://wa.me/5493547532008',
  whatsappLabel: '+54 9 354 753-2008',
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
  subtitle: 'Para comercios de una sucursal: mostrador, depósito y compras en un solo lugar.',
} as const;

export const problem = {
  title: 'Cuando la operación está fragmentada',
  lead: 'Planillas, caja y depósito desconectados cuestan tiempo, plata y dolores de cabeza.',
  pains: [
    'Depósito desactualizado: falta lo que más se vende y sobra lo que no sale.',
    'Tiempo perdido cargando lo mismo en varios lugares.',
    'Errores en precios y reposición.',
    'Poca visibilidad para decidir qué comprar y qué promover.',
  ],
  closing:
    'Con una sucursal y un equipo chico no hace falta un sistema gigante: hace falta tu local en orden, en un solo lugar.',
} as const;

export const solution = {
  title: 'Elegís lo que tu operación necesita',
  lead: 'Del catálogo validado: lo que tildás hoy funciona junto desde el primer día.',
  highlights: [
    { title: 'Mostrador', detail: 'La caja — hasta 2 cajas en la misma sucursal.' },
    { title: 'Depósito Inteligente', detail: 'El depósito — 1 almacén que se mueve con la caja.' },
    { title: 'Compras', detail: 'Proveedores y órdenes de compra básicas.' },
    { title: 'Fiscal AR', detail: 'Facturar tranquilo, con tu contador.' },
    { title: 'Contactos', detail: 'Clientes y proveedores en un solo lugar.' },
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
  title: '¿Es para vos?',
  yesTitle: 'Sí, si…',
  yes: [
    'Tenés un comercio de una sucursal: pinturería, ferretería, distribución chica o venta presencial.',
    'Son un equipo chico, unas 5 personas.',
    'Querés caja, depósito y compras en un solo lugar.',
    'Aceptás arrancar con el Descubrimiento antes del proyecto.',
  ],
  noTitle: 'No es para vos si…',
  no: [
    'Necesitás muchas sucursales o venta mayorista compleja desde el día 1.',
    'Querés solo conectar otro sistema, sin ordenar tu operación acá.',
    'Buscás trabajo a medida sin alcance.',
    'No podés dedicar tiempo a datos, fiscal con tu contador e infra propia.',
  ],
} as const;

export const howWeWork = {
  title: 'Cómo trabajamos',
  lead: 'Alcance claro, sin sorpresas.',
  rules: [
    'Alcance cerrado por escrito: qué entra y qué queda fuera.',
    'Hitos contra aceptación: se paga cuando funciona en prueba y en vivo.',
    'Tu parte: datos, contador y accesos a tiempo.',
    '8 h de ajustes y 6 h de capacitación incluidas; lo demás se cotiza.',
  ],
} as const;

export const ejemplo = {
  eyebrow: 'Un negocio como el tuyo',
  title: 'Pinturería Centro',
  fictitious: 'Ejemplo ficticio',
  body: 'Dos cajas, una lista de Excel desactualizada y las compras por WhatsApp.',
  signs: [
    '2 cajas en el mostrador',
    'Lista de Excel desactualizada',
    'Compras por WhatsApp',
  ],
  closing: 'Si te suena parecido, lo tuyo también se ordena.',
} as const;

export const contraste = {
  title: 'Hoy vs con ModoOps',
  lead: 'Lo mismo que hacés hoy, sin el doble trabajo.',
  rows: [
    { hoy: 'La lista, en el cuaderno', con: 'El precio sale del sistema' },
    { hoy: 'El precio, de memoria', con: 'La caja descuenta del depósito sola' },
    { hoy: 'El cierre, a mano', con: 'El cierre canta solo' },
    { hoy: 'La compra, por WhatsApp', con: 'La compra entra al depósito con orden' },
  ],
} as const;

export const circuito = {
  title: 'Tu local en 5 pasos',
  lead: 'Del camión a la factura, sin papeles sueltos.',
  steps: [
    'Entra la compra al depósito.',
    'Pasás al salón.',
    'Vendés por color o código.',
    'Cobrás o le anotás al pintor.',
    'Sale la factura tranquila.',
  ],
} as const;

export const descubrimiento = {
  title: 'Qué te llevás por $155',
  lead: 'Tres días y salís con informe y propuesta.',
  agenda: [
    'Día 1: tu proceso (mostrador, compras, depósito).',
    'Día 2: fiscal con tu contador, datos e infra.',
    'Día 3: cerramos alcance y te llevás informe + propuesta.',
  ],
  closing: 'Día extra, si hace falta, se cotiza.',
} as const;

export const migracion = {
  title: 'Traé tu Excel sin frenar la venta',
  lead: 'Un finde pasamos tu lista y tu depósito; el lunes vendés.',
  detail: 'Hasta 500 ítems, se valida en prueba. Se cotiza aparte.',
} as const;

export const fiscal = {
  title: 'Facturar tranquilo, con tu contador',
  lead: 'Probamos todo en ambiente de prueba.',
  detail: 'Sin la firma de tu contador, nada sale en vivo. Lo que exceda lo acordado se cotiza aparte.',
} as const;

export const faq = {
  title: 'Preguntas que nos hacen',
  lead: 'Las que escuchamos en cada primera charla.',
  items: [
    {
      q: '¿Freno las ventas?',
      a: 'No: la migración se hace un finde y el lunes vendés. La prueba es en ambiente aparte, nunca en tu caja real.',
    },
    {
      q: '¿Capacitan a mi equipo?',
      a: 'Sí: 6 h incluidas al salir en vivo, en tu local y con tus datos.',
    },
    { q: '¿Mis datos?', a: 'Tuyos: lista, depósito y clientes se cargan en tu sistema y quedan ahí.' },
    {
      q: '¿Y si no sigo?',
      a: 'Te llevás el informe y la propuesta igual. Sin ataduras ni letra chica.',
    },
    {
      q: '¿La factura es válida?',
      a: 'Sí: se prueba con tu contador en ambiente de prueba antes de emitir en vivo.',
    },
  ],
} as const;

export const despues = {
  title: 'Después de salir en vivo',
  lead: 'Te acompañamos al salir + 10 días de fallas.',
  detail: 'El WhatsApp comercial no es soporte: post contrato rigen las reglas acordadas.',
} as const;

export const crecer = {
  title: 'Para crecer después',
  lead: 'Venta mayorista, tienda online e integraciones.',
  detail: 'Lo dejás anotado y se cotiza aparte. El arranque es mostrador.',
} as const;

export const garantia = {
  title: 'Si no encaja, te lo decimos',
  lead: 'Si el primer día vemos que no encaja, te lo decimos y te llevás el diagnóstico igual.',
  detail: 'Propuesta válida por 20 días.',
} as const;

export const puenteOficina = {
  title: 'Recorré tu local antes de comprar nada',
  lead: 'Armamos tu borrador conversando: tu negocio, lo que necesitás hoy y para dónde querés crecer.',
  cta: 'Entrar a mi oficina',
  href: '/oficina#camino',
  note: 'La oficina no te vende nada: es tu borrador, lo valida el consultor en el Descubrimiento.',
} as const;

export const nav = [
  { href: '/oficina', label: 'Recorré tu oficina' },
  { href: '#camino', label: 'Camino' },
  { href: '#contacto', label: 'Contacto' },
] as const;
