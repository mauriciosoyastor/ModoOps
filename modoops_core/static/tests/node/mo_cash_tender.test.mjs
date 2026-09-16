import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
    ARS_DENOMINATIONS,
    addDenomination,
    canConfirmCash,
    changeDue,
    formatARS,
    payExact,
} from "../../src/js/services/mo_cash_tender.js";

describe("POS cash tender en efectivo ARS (ticket 06)", () => {
    it("expone denominaciones canónicas de mayor a menor", () => {
        assert.deepEqual(ARS_DENOMINATIONS, [10000, 5000, 2000, 1000, 500, 200, 100, 50, 20, 10]);
    });

    it("suma denominaciones al monto recibido", () => {
        assert.equal(addDenomination(0, 5000), 5000);
        assert.equal(addDenomination(5000, 2000), 7000);
    });

    it("rechaza denominaciones fuera del set", () => {
        assert.throws(() => addDenomination(0, 3), /denominación/);
    });

    it("pago exacto iguala el total", () => {
        assert.equal(payExact(10640), 10640);
    });

    it("calcula vuelto sin negativos", () => {
        assert.equal(changeDue(10640, 11000), 360);
        assert.equal(changeDue(10640, 10640), 0);
        assert.equal(changeDue(10640, 5000), 0);
    });

    it("no confirma en falta e informa cuánto falta", () => {
        const short = canConfirmCash(10640, 5000);
        assert.equal(short.ok, false);
        assert.equal(short.missing, 5640);
        assert.equal(canConfirmCash(10640, 10640).ok, true);
        assert.equal(canConfirmCash(10640, 20000).ok, true);
    });

    it("no confirma total no positivo", () => {
        assert.equal(canConfirmCash(0, 10000).ok, false);
    });

    it("formatea moneda es-AR", () => {
        assert.equal(formatARS(10640), "$ 10.640");
    });
});
