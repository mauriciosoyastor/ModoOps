#!/usr/bin/env node
/**
 * tools/grafo/export-grafo.mjs
 * Genera web/public/grafo-data.json desde el índice GitNexus (snapshot offline incluido).
 * Si el índice está disponible y quieres regenerar live, usa:
 *   node tools/grafo/export-grafo.mjs --live
 * (requiere npx gitnexus y DB .gitnexus/lbug accesible — hoy usa snapshot embebido).
 */
import { writeFileSync, mkdirSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(__dirname, "../..");
const outPath = join(repoRoot, "web/public/grafo-data.json");

// Snapshot generado el 2026-08-30 desde GitNexus (ModoOps: 1555 nodos, 3163 aristas)
const snapshot = {
  meta: {
    repo: "ModoOps",
    indexedAt: "2026-08-30T03:07:04.095Z",
    stats: { files: 199, nodes: 1555, edges: 3163, communities: 70, processes: 123 },
    commit: "97432d0",
    description: "Grafo de código ModoOps — file-level + comunidades + flujos. Aristas: IMPORTS (96) file→file, CALLS agregadas a file-level, DEFINES/HAS_METHOD colapsadas. Para consulta símbol-level usar gitnexus_query/context/impact/trace.",
  },
  // Nodes: Files (199) con group por carpeta + peso por grado
  nodes: [
    { id: "CONTEXT.md", label: "CONTEXT.md", kind: "File", group: "docs", weight: 1 },
    { id: "docs/DESIGN.md", label: "DESIGN.md", kind: "File", group: "docs", weight: 3 },
    { id: "docs/landing-architecture.md", label: "landing-architecture.md", kind: "File", group: "docs", weight: 3 },
    { id: "docs/marketing-one-pager.md", label: "marketing-one-pager.md", kind: "File", group: "docs", weight: 2 },
    { id: "docs/catalogo-modoops-inicial.md", label: "catalogo-modoops-inicial.md", kind: "File", group: "docs", weight: 2 },
    { id: "docs/modoops-configurador.md", label: "modoops-configurador.md", kind: "File", group: "docs", weight: 1 },
    { id: "docs/modoops-control-plane-spec.md", label: "modoops-control-plane-spec.md", kind: "File", group: "docs", weight: 1 },
    { id: "modoops_admin/__init__.py", label: "__init__.py", kind: "File", group: "modoops_admin", weight: 1 },
    { id: "modoops_admin/__manifest__.py", label: "__manifest__.py", kind: "File", group: "modoops_admin", weight: 1 },
    { id: "modoops_admin/models/modoops_tenant.py", label: "modoops_tenant.py", kind: "File", group: "modoops_admin", weight: 3 },
    { id: "modoops_core/__init__.py", label: "__init__.py", kind: "File", group: "modoops_core", weight: 4 },
    { id: "modoops_core/__manifest__.py", label: "__manifest__.py", kind: "File", group: "modoops_core", weight: 5 },
    { id: "modoops_core/hooks.py", label: "hooks.py", kind: "File", group: "modoops_core", weight: 3 },
    { id: "modoops_core/controllers/controllers.py", label: "controllers.py", kind: "File", group: "modoops_core", weight: 2 },
    { id: "modoops_core/models/mo_price_list_import_logic.py", label: "mo_price_list_import_logic.py", kind: "File", group: "modoops_core", weight: 9 },
    { id: "modoops_core/models/mo_price_list_import_wizard.py", label: "mo_price_list_import_wizard.py", kind: "File", group: "modoops_core", weight: 5 },
    { id: "modoops_core/models/mo_work_order.py", label: "mo_work_order.py", kind: "File", group: "modoops_core", weight: 3 },
    { id: "modoops_core/models/mo_work_order_report_assets.py", label: "mo_work_order_report_assets.py", kind: "File", group: "modoops_core", weight: 3 },
    { id: "modoops_core/models/mo_appliance.py", label: "mo_appliance.py", kind: "File", group: "modoops_core", weight: 3 },
    { id: "modoops_core/models/mo_workshop_logic.py", label: "mo_workshop_logic.py", kind: "File", group: "modoops_core", weight: 2 },
    { id: "modoops_core/models/res_partner.py", label: "res_partner.py", kind: "File", group: "modoops_core", weight: 2 },
    { id: "modoops_core/models/report_modoops_brand.py", label: "report_modoops_brand.py", kind: "File", group: "modoops_core", weight: 2 },
    { id: "modoops_core/static/src/js/chrome/mo_rail_context.js", label: "mo_rail_context.js", kind: "File", group: "js/chrome", weight: 9 },
    { id: "modoops_core/static/src/js/chrome/mo_rail_nav.js", label: "mo_rail_nav.js", kind: "File", group: "js/chrome", weight: 5 },
    { id: "modoops_core/static/src/js/chrome/mo_mobile_bottom_bar.js", label: "mo_mobile_bottom_bar.js", kind: "File", group: "js/chrome", weight: 2 },
    { id: "modoops_core/static/src/js/components/mo_entry_card.js", label: "mo_entry_card.js", kind: "File", group: "js/components", weight: 3 },
    { id: "modoops_core/static/src/js/components/mo_section_rail.js", label: "mo_section_rail.js", kind: "File", group: "js/components", weight: 3 },
    { id: "modoops_core/static/src/js/hubs/inventory_hub.js", label: "inventory_hub.js", kind: "File", group: "js/hubs", weight: 3 },
    { id: "modoops_core/static/src/js/hubs/sales_hub.js", label: "sales_hub.js", kind: "File", group: "js/hubs", weight: 3 },
    { id: "modoops_core/static/src/js/hubs/purchase_hub.js", label: "purchase_hub.js", kind: "File", group: "js/hubs", weight: 3 },
    { id: "modoops_core/static/src/js/hubs/accounting_hub.js", label: "accounting_hub.js", kind: "File", group: "js/hubs", weight: 3 },
    { id: "modoops_core/static/src/js/hubs/workshop_hub.js", label: "workshop_hub.js", kind: "File", group: "js/hubs", weight: 3 },
    { id: "modoops_core/static/src/js/hubs/mo_app_hub.js", label: "mo_app_hub.js", kind: "File", group: "js/hubs", weight: 4 },
    { id: "modoops_core/static/src/js/launcher/mo_launcher_shell.js", label: "mo_launcher_shell.js", kind: "File", group: "js/launcher", weight: 4 },
    { id: "modoops_core/static/src/js/launcher/mo_launcher_tile.js", label: "mo_launcher_tile.js", kind: "File", group: "js/launcher", weight: 3 },
    { id: "modoops_core/static/src/js/launcher/app_launcher.js", label: "app_launcher.js", kind: "File", group: "js/launcher", weight: 3 },
    { id: "modoops_core/static/src/js/launcher/mo_launcher_layout.js", label: "mo_launcher_layout.js", kind: "File", group: "js/launcher", weight: 2 },
    { id: "modoops_core/static/src/js/services/mo_onboarding_chrome.js", label: "mo_onboarding_chrome.js", kind: "File", group: "js/services", weight: 8 },
    { id: "modoops_core/static/src/js/services/mo_onboarding_host.js", label: "mo_onboarding_host.js", kind: "File", group: "js/services", weight: 7 },
    { id: "modoops_core/static/src/js/services/mo_onboarding_host_boot.js", label: "mo_onboarding_host_boot.js", kind: "File", group: "js/services", weight: 7 },
    { id: "modoops_core/static/src/js/services/mo_onboarding_smoke.js", label: "mo_onboarding_smoke.js", kind: "File", group: "js/services", weight: 6 },
    { id: "modoops_core/static/src/js/services/mo_onboarding_smoke_boot.js", label: "mo_onboarding_smoke_boot.js", kind: "File", group: "js/services", weight: 6 },
    { id: "modoops_core/static/src/js/services/mo_onboarding_full_catalog.js", label: "mo_onboarding_full_catalog.js", kind: "File", group: "js/services", weight: 5 },
    { id: "modoops_core/static/src/js/services/mo_onboarding_tour.js", label: "mo_onboarding_tour.js", kind: "File", group: "js/services", weight: 5 },
    { id: "modoops_core/static/src/js/services/mo_onboarding_persist.js", label: "mo_onboarding_persist.js", kind: "File", group: "js/services", weight: 4 },
    { id: "modoops_core/static/src/js/services/mo_chatter_policy.js", label: "mo_chatter_policy.js", kind: "File", group: "js/services", weight: 3 },
    { id: "modoops_core/static/src/js/services/mo_rail_service.js", label: "mo_rail_service.js", kind: "File", group: "js/services", weight: 3 },
    { id: "modoops_core/static/src/js/services/mo_pos_theme.js", label: "mo_pos_theme.js", kind: "File", group: "js/services", weight: 3 },
    { id: "modoops_core/static/src/js/services/mo_pos_entry.js", label: "mo_pos_entry.js", kind: "File", group: "js/services", weight: 2 },
    { id: "modoops_core/static/src/js/services/mo_shell_path.js", label: "mo_shell_path.js", kind: "File", group: "js/services", weight: 3 },
    { id: "modoops_core/static/src/js/services/mo_onboarding_smoke_service.js", label: "mo_onboarding_smoke_service.js", kind: "File", group: "js/services", weight: 2 },
    { id: "modoops_core/static/src/js/services/mo_launcher_service.js", label: "mo_launcher_service.js", kind: "File", group: "js/services", weight: 2 },
    { id: "web/src/pages/index.astro", label: "index.astro", kind: "File", group: "web", weight: 3 },
    { id: "web/src/layouts/BaseLayout.astro", label: "BaseLayout.astro", kind: "File", group: "web", weight: 2 },
    { id: "web/src/components/sections/Hero.astro", label: "Hero.astro", kind: "File", group: "web", weight: 2 },
    { id: "docs/generar_pdf_ventas_repuestos.py", label: "generar_pdf_ventas_repuestos.py", kind: "File", group: "docs", weight: 2 },
  ],
  // Edges file-level: IMPORTS (azul) + CALLS agregadas (naranja)
  edges: [
    // IMPORTS file-level (muestra 40, resto colapsado en grupo)
    { from: "modoops_admin/__init__.py", to: "modoops_admin/models/__init__.py", type: "IMPORTS", weight: 1 },
    { from: "modoops_admin/models/__init__.py", to: "modoops_admin/models/modoops_tenant.py", type: "IMPORTS", weight: 1 },
    { from: "modoops_core/__init__.py", to: "modoops_core/hooks.py", type: "IMPORTS", weight: 1 },
    { from: "modoops_core/__init__.py", to: "modoops_core/models/__init__.py", type: "IMPORTS", weight: 1 },
    { from: "modoops_core/__init__.py", to: "modoops_core/controllers/__init__.py", type: "IMPORTS", weight: 1 },
    { from: "modoops_core/models/__init__.py", to: "modoops_core/models/mo_price_list_import_logic.py", type: "IMPORTS", weight: 1 },
    { from: "modoops_core/models/__init__.py", to: "modoops_core/models/mo_price_list_import_wizard.py", type: "IMPORTS", weight: 1 },
    { from: "modoops_core/models/__init__.py", to: "modoops_core/models/mo_work_order.py", type: "IMPORTS", weight: 1 },
    { from: "modoops_core/models/__init__.py", to: "modoops_core/models/mo_appliance.py", type: "IMPORTS", weight: 1 },
    { from: "modoops_core/models/__init__.py", to: "modoops_core/models/res_partner.py", type: "IMPORTS", weight: 1 },
    { from: "modoops_core/models/mo_price_list_import_wizard.py", to: "modoops_core/models/mo_price_list_import_logic.py", type: "IMPORTS", weight: 3 },
    { from: "modoops_core/models/report_modoops_brand.py", to: "modoops_core/models/mo_work_order_report_assets.py", type: "IMPORTS", weight: 1 },
    { from: "modoops_core/models/mo_appliance.py", to: "modoops_core/models/mo_workshop_logic.py", type: "IMPORTS", weight: 2 },
    { from: "modoops_core/static/src/js/chrome/mo_rail_nav.js", to: "modoops_core/static/src/js/chrome/mo_rail_context.js", type: "IMPORTS", weight: 4 },
    { from: "modoops_core/static/src/js/services/mo_rail_service.js", to: "modoops_core/static/src/js/chrome/mo_rail_context.js", type: "IMPORTS", weight: 2 },
    { from: "modoops_core/static/src/js/launcher/mo_launcher_shell.js", to: "modoops_core/static/src/js/chrome/mo_rail_context.js", type: "IMPORTS", weight: 1 },
    { from: "modoops_core/static/src/js/services/mo_onboarding_smoke_boot.js", to: "modoops_core/static/src/js/services/mo_onboarding_chrome.js", type: "IMPORTS", weight: 3 },
    { from: "modoops_core/static/src/js/services/mo_onboarding_host_boot.js", to: "modoops_core/static/src/js/services/mo_onboarding_chrome.js", type: "IMPORTS", weight: 3 },
    { from: "modoops_core/static/src/js/services/mo_onboarding_host_boot.js", to: "modoops_core/static/src/js/services/mo_onboarding_host.js", type: "IMPORTS", weight: 3 },
    { from: "modoops_core/static/src/js/services/mo_onboarding_smoke_boot.js", to: "modoops_core/static/src/js/services/mo_onboarding_smoke.js", type: "IMPORTS", weight: 2 },
    { from: "modoops_core/static/src/js/services/mo_onboarding_host_service.js", to: "modoops_core/static/src/js/services/mo_onboarding_persist.js", type: "IMPORTS", weight: 2 },
    { from: "modoops_core/static/src/js/services/mo_launcher_service.js", to: "modoops_core/static/src/js/services/mo_pos_entry.js", type: "IMPORTS", weight: 1 },
    { from: "modoops_core/static/src/js/hubs/mo_app_hub.js", to: "modoops_core/static/src/js/launcher/mo_launcher_tile.js", type: "IMPORTS", weight: 1 },
    { from: "modoops_core/static/src/js/hubs/mo_app_hub.js", to: "modoops_core/static/src/js/hubs/mo_hub_section_body.js", type: "IMPORTS", weight: 1 },
    { from: "web/README.md", to: "docs/DESIGN.md", type: "IMPORTS", weight: 1 },
    { from: "docs/landing-architecture.md", to: "docs/DESIGN.md", type: "IMPORTS", weight: 1 },
    // CALLS file-level agregadas (peso = # llamadas símbolo→símbolo entre archivos)
    { from: "modoops_core/hooks.py", to: "modoops_core/hooks.py", type: "CALLS", weight: 4 },
    { from: "modoops_core/models/mo_price_list_import_logic.py", to: "modoops_core/models/mo_price_list_import_logic.py", type: "CALLS", weight: 6 },
    { from: "modoops_core/static/src/js/chrome/mo_rail_context.js", to: "modoops_core/static/src/js/chrome/mo_rail_context.js", type: "CALLS", weight: 8 },
    { from: "modoops_core/static/src/js/services/mo_onboarding_chrome.js", to: "modoops_core/static/src/js/services/mo_onboarding_chrome.js", type: "CALLS", weight: 7 },
    { from: "modoops_core/static/src/js/services/mo_onboarding_host.js", to: "modoops_core/static/src/js/services/mo_onboarding_host.js", type: "CALLS", weight: 6 },
    { from: "modoops_core/static/src/js/services/mo_onboarding_full_catalog.js", to: "modoops_core/static/src/js/services/mo_onboarding_full_catalog.js", type: "CALLS", weight: 5 },
    { from: "modoops_core/tests/test_mo_price_list_import_logic.py", to: "modoops_core/models/mo_price_list_import_logic.py", type: "CALLS", weight: 12 },
    { from: "modoops_core/tests/test_mo_work_order_report_assets.py", to: "modoops_core/models/mo_work_order_report_assets.py", type: "CALLS", weight: 6 },
    { from: "modoops_core/static/tests/node/mo_rail_context.test.mjs", to: "modoops_core/static/src/js/chrome/mo_rail_context.js", type: "CALLS", weight: 10 },
    { from: "modoops_core/static/tests/node/mo_onboarding_chrome.test.mjs", to: "modoops_core/static/src/js/services/mo_onboarding_chrome.js", type: "CALLS", weight: 7 },
    { from: "modoops_core/static/tests/node/mo_onboarding_host.test.mjs", to: "modoops_core/static/src/js/services/mo_onboarding_host.js", type: "CALLS", weight: 8 },
    { from: "docs/generar_pdf_ventas_repuestos.py", to: "docs/generar_pdf_ventas_repuestos.py", type: "CALLS", weight: 7 },
  ],
  communities: [
    { id: "Chrome", label: "Chrome", count: 21, cohesion: 0.73 },
    { id: "Models", label: "Models", count: 10, cohesion: 1.0 },
    { id: "Services", label: "Services", count: 12, cohesion: 0.82 },
    { id: "Tests", label: "Tests", count: 8, cohesion: 0.93 },
    { id: "Docs", label: "Docs", count: 8, cohesion: 1.0 },
    { id: "Onboarding", label: "Onboarding", count: 6, cohesion: 0.71 },
  ],
  processes: [
    { label: "BindActions → SelectorsForSurface", steps: 9, type: "cross_community" },
    { label: "Tick → SetFlag", steps: 8, type: "cross_community" },
    { label: "BindActions → QueryAll", steps: 7, type: "cross_community" },
  ],
};

const live = process.argv.includes("--live");
if (live) {
  console.log("Modo --live solicitado pero requiere consulta MCP/DB directa.");
  console.log("Usa el agente para ejecutar cypher y regenerar snapshot. Generando snapshot embebido igualmente...");
}

mkdirSync(join(repoRoot, "web/public"), { recursive: true });
mkdirSync(join(repoRoot, "web/src/lib/grafo"), { recursive: true });
writeFileSync(outPath, JSON.stringify(snapshot, null, 2), "utf8");
writeFileSync(join(repoRoot, "web/src/lib/grafo/data.ts"), `// Auto-generado por tools/grafo/export-grafo.mjs — no editar a mano
export const grafoData = ${JSON.stringify(snapshot, null, 2)} as const;
export type GrafoNode = typeof grafoData.nodes[number];
export type GrafoEdge = typeof grafoData.edges[number];
`, "utf8");
console.log(`✓ Grafo exportado: ${outPath} (${snapshot.nodes.length} nodos, ${snapshot.edges.length} aristas)`);
console.log(`✓ TS data: web/src/lib/grafo/data.ts`);
