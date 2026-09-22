import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { chipLabel, deltaDirection, formatDelta, pctChange, pendingCards } from "../../src/js/hubs/mo_hub_delta.js";

describe("hub KPI delta vs período anterior (ticket 10)", () => {
    it("calcula el % como (ahora - antes) / antes * 100", () => {
        assert.equal(pctChange(100, 80), 25);
        assert.equal(pctChange(80, 100), -20);
    });

    it("no inventa % sin antes: previo 0 o ausente da null", () => {
        assert.equal(pctChange(100, 0), null);
        assert.equal(pctChange(100, null), null);
        assert.equal(pctChange(null, 80), null);
    });

    it("formatea con signo y % separado (ES-AR, nbsp en unidad)", () => {
        const nbsp = " ";
        assert.equal(formatDelta(25), `+25${nbsp}%`);
        assert.equal(formatDelta(-20), `-20${nbsp}%`);
        assert.equal(formatDelta(-66.666), `-67${nbsp}%`);
        assert.equal(formatDelta(null), "");
    });

    it("clasifica la dirección para el chip (null = sin delta)", () => {
        assert.equal(deltaDirection(25), "up");
        assert.equal(deltaDirection(-3), "down");
        assert.equal(deltaDirection(0), "flat");
        assert.equal(deltaDirection(null), "none");
    });

    it("deriva pendientes de cards warning o flag pending (ticket 10)", () => {
        const cards = [
            { id: 1, variant: "default", pending: false },
            { id: 2, variant: "warning", pending: false },
            { id: 3, variant: "default", pending: true },
        ];
        assert.deepEqual(
            pendingCards(cards).map((c) => c.id),
            [2, 3]
        );
        assert.deepEqual(pendingCards([]), []);
    });

    it("chip con texto, nunca solo color (warning = Revisar)", () => {
        assert.equal(chipLabel("warning"), "Revisar");
        assert.equal(chipLabel("default"), "");
        assert.equal(chipLabel(undefined), "");
    });
});
