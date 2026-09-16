/**
 * Efectivo ARS puro para el Mostrador — sin Odoo, sin DOM (ticket 06).
 *
 * El POS nativo ya cobra en efectivo; este servicio fija el contrato que el
 * prototipo `/prototype/pago-qr-desktop` demuestra: denominaciones canónicas,
 * pago exacto, vuelto sin negativos y confirmación bloqueada en falta.
 * Montos en pesos enteros (el efectivo no usa centavos).
 */

/** Denominaciones canónicas ARS, de mayor a menor. */
export const ARS_DENOMINATIONS = [10000, 5000, 2000, 1000, 500, 200, 100, 50, 20, 10];

/** Suma una denominación al monto recibido. */
export function addDenomination(tendered, denom) {
    if (!ARS_DENOMINATIONS.includes(denom)) {
        throw new Error(`denominación inválida: ${denom}`);
    }
    return tendered + denom;
}

/** Pago exacto: lo recibido iguala el total. */
export function payExact(total) {
    return total;
}

/** Vuelto a devolver; nunca negativo (en falta es 0, no deuda). */
export function changeDue(total, tendered) {
    return Math.max(0, tendered - total);
}

/**
 * ¿Se puede confirmar? Solo con total positivo y recibido que cubre.
 * Devuelve { ok } o { ok: false, missing } para mostrar cuánto falta.
 */
export function canConfirmCash(total, tendered) {
    if (!(total > 0)) {
        return { ok: false, missing: total > 0 ? total - tendered : 0 };
    }
    if (tendered < total) {
        return { ok: false, missing: total - tendered };
    }
    return { ok: true, missing: 0 };
}

/** Moneda es-AR con formato del ticket ($ 10.640). */
export function formatARS(amount) {
    return "$ " + amount.toLocaleString("es-AR");
}
