import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { describe, it } from "node:test";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const TILE_XML = join(HERE, "../../src/js/launcher/mo_launcher_tile.xml");
const BODY_XML = join(HERE, "../../src/js/hubs/mo_hub_section_body.xml");

describe("hub Resumen ticket 10: cableado en templates", () => {
    it("tile muestra delta (t-esc) y métrica tabular, sin número hero gigante", () => {
        const xml = readFileSync(TILE_XML, "utf8");
        assert.match(xml, /deltaText/, "tile rinde deltaText del componente");
        assert.match(xml, /tabular-nums/, "métrica con números tabulares");
        assert.match(xml, /chipText/, "chip de estado con texto");
        assert.match(xml, /t-on-keydown/, "tile operable por teclado (AGENTS.md MUST)");
    });

    it("section body rinde lista Acciones pendientes sobre cards", () => {
        const xml = readFileSync(BODY_XML, "utf8");
        assert.match(xml, /Acciones pendientes/, "encabezado de pendientes ES-AR");
        assert.match(xml, /pendingCards/, "itera pendientes del componente");
    });
});
