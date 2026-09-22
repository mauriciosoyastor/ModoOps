/** @odoo-module **/

/**
 * Hub Resumen KPI delta (ticket 10).
 * Helpers puros: Python calcula ahora/antes, acá solo se deriva %,
 * texto ES-AR y dirección del chip. Sin imports Odoo → testeable en node.
 */

/** (ahora - antes) / antes * 100. null = sin antes (previo 0 o ausente): no inventar %. */
export function pctChange(current, previous) {
    if (current === null || current === undefined) return null;
    if (previous === null || previous === undefined || previous === 0) return null;
    return ((current - previous) / previous) * 100;
}

/** "+25 %", "-67 %" (redondeo entero, nbsp antes de la unidad). null → "". */
export function formatDelta(pct) {
    if (pct === null || pct === undefined) return "";
    const rounded = Math.round(pct);
    const sign = rounded > 0 ? "+" : "";
    return `${sign}${rounded} %`;
}

/** Dirección del chip: up / down / flat / none (sin delta). */
export function deltaDirection(pct) {
    if (pct === null || pct === undefined) return "none";
    if (pct > 0) return "up";
    if (pct < 0) return "down";
    return "flat";
}

/** Subconjunto para "Acciones pendientes ›": variant warning o flag pending del payload. */
export function pendingCards(cards) {
    if (!Array.isArray(cards)) return [];
    return cards.filter((c) => c && (c.variant === "warning" || c.pending === true));
}

/** Texto del chip de estado: nunca color solo. warning = Revisar, resto sin chip. */
export function chipLabel(variant) {
    if (variant === "warning") return "Revisar";
    return "";
}
