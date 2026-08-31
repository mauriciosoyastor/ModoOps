// AUTO-GENERADO — no editar a mano. Fuente: modoops_catalogo/catalogo.json
// Generado por: python tools/configurador/sync_catalogo.py --generate

export type CatalogoKey = "mostrador" | "deposito" | "ventas" | "compras" | "fiscal_ar" | "contactos" | "plataforma" | "puente_factura" | "taller" | "migracion_excel" | "b2b_basico" | "ia";

export const CATALOGO_KEYS = new Set<CatalogoKey>(["mostrador", "deposito", "ventas", "compras", "fiscal_ar", "contactos", "plataforma", "puente_factura", "taller", "migracion_excel", "b2b_basico", "ia"]);

export const CATALOGO_LABELS: Record<CatalogoKey, string> = {
  "mostrador": "Mostrador (POS 2 cajas)",
  "deposito": "Depósito Inteligente (1 almacén)",
  "ventas": "Ventas",
  "compras": "Compras",
  "fiscal_ar": "Fiscal AR",
  "contactos": "Contactos",
  "plataforma": "Plataforma ModoOps",
  "puente_factura": "Puente Factura Web",
  "taller": "Taller (Add-on $155)",
  "migracion_excel": "Migración Excel (≤500 prod)",
  "b2b_basico": "B2B Básico (Add-on $155)",
  "ia": "IA ModoOps — Agente herramental (Tools + Memoria)"
} as const;

export const CATALOGO_HORAS: Record<CatalogoKey, number> = {
  "mostrador": 25,
  "deposito": 20,
  "ventas": 15,
  "compras": 15,
  "fiscal_ar": 15,
  "contactos": 5,
  "plataforma": 10,
  "puente_factura": 5,
  "taller": 20,
  "migracion_excel": 10,
  "b2b_basico": 20,
  "ia": 15
} as const;

export const CATALOGO_PRICING = {
  "tarifa_diaria": 52,
  "descubrimiento": {
    "amount": 155,
    "extra_day": 52,
    "credito": 77.5,
    "validez_dias": 20
  },
  "ancla": {
    "amount": 800,
    "anticipo": 400,
    "hito1": 200,
    "hito2": 200,
    "techo_horas": 92,
    "techo_ajustes": 8,
    "validez_dias": 20,
    "plazo_horas_semana": "15-18"
  },
  "abono": {
    "amount": 45,
    "horas": 4,
    "nota": "horas vencen, best effort bugs"
  },
  "tarifa_hora_adicional": 10.5,
  "addons": {
    "migracion_excel": {
      "amount": 155,
      "tope": 500,
      "nota": "≤500 prod, tramo extra días×52"
    },
    "b2b_basico": {
      "amount": 155
    },
    "integracion_min": {
      "amount": 104,
      "dias_min": 2,
      "nota": "días×52 por sistema externo"
    },
    "fiscal_dias": {
      "amount": 52,
      "unidad": "día"
    }
  }
} as const;
