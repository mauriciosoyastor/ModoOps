/** @odoo-module **/

/**
 * KPI card grid inset contracts.
 * Keep in sync with `modoops_launcher.scss`:
 * - home → `.mo-launcher-shell--root .mo-launcher-body`
 * - hub  → `.mo-launcher-shell--hub .mo-launcher-body` / `.mo-hub-section-body`
 */

/** Shared top air so launcher home and hub Resumen are not flush with the canvas. */
export const KPI_GRID_TOP_INSET = "3.25rem";

export function resolveLauncherHomeGridInset() {
    return {
        paddingTop: KPI_GRID_TOP_INSET,
        paddingInline: "1.5rem",
        paddingBottom: "2.5rem",
    };
}

export function resolveHubKpiGridInset() {
    return {
        paddingTop: KPI_GRID_TOP_INSET,
        paddingInline: "1.5rem",
        paddingBottom: "2.5rem",
    };
}
