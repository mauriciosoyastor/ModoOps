// Tests del gate de diseño (slice 02): comportamiento externo del scan, no detalles internos.
import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, it } from "node:test";

import { scan, validateAllowlist } from "./check.js";

function withFixture(files, fn) {
  const dir = mkdtempSync(join(tmpdir(), "design-check-"));
  for (const [name, content] of Object.entries(files)) {
    const p = join(dir, name);
    mkdirSync(join(p, ".."), { recursive: true });
    writeFileSync(p, content);
  }
  try {
    return fn(dir);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

const noAllowlist = { allowlist: new Set() };

describe("design-check scan", () => {
  it("reporta prohibido en código con path:línea", () => {
    withFixture({ "a.astro": '<p class="btn transition-all">hola</p>\n' }, (dir) => {
      const hits = scan(dir, noAllowlist);
      assert.equal(hits.length, 1);
      assert.match(hits[0].loc, /^a\.astro:1$/);
    });
  });

  it("ignora prohibidos dentro de comentarios de una línea", () => {
    withFixture(
      { "a.astro": "/* nunca transition-all acá */\n// parallax no\n<!-- marquee no -->\n<p>ok</p>\n" },
      (dir) => {
        assert.deepEqual(scan(dir, noAllowlist), []);
      },
    );
  });

  it("ignora prohibidos dentro de comentarios de bloque multilínea", () => {
    withFixture({ "a.css": "/*\n  transition-all\n  parallax\n*/\n.x { color: red; }\n" }, (dir) => {
      assert.deepEqual(scan(dir, noAllowlist), []);
    });
  });

  it("reporta prohibido después de un bloque multilínea con su línea real", () => {
    withFixture({ "a.css": "/*\n  nota\n*/\n.x { transition: all 0.2s ease; }\n<p class=transition-all>\n" }, (dir) => {
      const hits = scan(dir, noAllowlist);
      assert.equal(hits.length, 1);
      assert.match(hits[0].loc, /^a\.css:5$/);
    });
  });

  it("salta directorios throwaway de prototipos", () => {
    withFixture({ "pages/prototype/x.astro": "<marquee>demo</marquee>\n" }, (dir) => {
      assert.deepEqual(scan(dir, noAllowlist), []);
    });
  });

  it("respeta excepciones con motivo (allowlist path:línea)", () => {
    withFixture({ "ui/Bar.astro": 'class="backdrop-blur-lg"\n' }, (dir) => {
      assert.equal(scan(dir, noAllowlist).length, 1);
      assert.deepEqual(scan(dir, { allowlist: new Set(["ui/Bar.astro:1"]) }), []);
    });
  });

  it("solo mira extensiones de código (.astro/.css/.ts/.js)", () => {
    withFixture({ "nota.md": "transition-all\n", "ok.txt": "parallax\n" }, (dir) => {
      assert.deepEqual(scan(dir, noAllowlist), []);
    });
  });
});

describe("design-check allowlist", () => {
  it("rechaza excepciones sin motivo escrito", () => {
    assert.deepEqual(validateAllowlist(new Set(["x:1"]), {}), ["x:1"]);
    assert.deepEqual(validateAllowlist(new Set(["x:1"]), { "x:1": "motivo" }), []);
  });
});
