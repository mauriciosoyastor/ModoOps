// Gate de diseño (slice 02): fail-closed sobre patrones prohibidos.
// Uso CLI: `node tools/design-check/check.js` (audita web/src, sale 0 verde / 1 rojo).
// Uso test: `import { scan } from "./check.js"` — scan(rootDir, { allowlist }) → hits [{ loc, why, line }].
// Alcance: web/src (landing + shell). Control Plane (modoops_admin) entra en spec final.
import { readdirSync, readFileSync, statSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { join, extname } from "node:path";

const EXTS = new Set([".astro", ".css", ".ts", ".js"]);

// Patrón → por qué (autoridad entre paréntesis)
export const FORBIDDEN = [
  [/transition-all/, "transition-all: propiedades explícitas (web/AGENTS.md NEVER)"],
  [/<marquee|marquee\s*\(/, "marquee: quietud por defecto (vercel design.md)"],
  [/parallax/, "parallax: prohibido salvo decisión explícita (vercel design.md)"],
  [/\.animate-bounce(?!.*sr-only)/, "bounce decorativo (motion brief: prohibido)"],
  [/backdrop-blur(?!.*chrome)/, "glass decorativo: solo estático en chrome UI (web/AGENTS.md SHOULD)"],
  [/linear-gradient\(.*(cyan|fuchsia|lime|neon)/i, "gradiente decorativo neon (DESIGN.md Don't + vercel)"],
  [/text-transparent\s+bg-clip-text/, "gradient text (vercel hard reject)"],
];

// "path:línea" → motivo (estructural: sin motivo no hay excepción).
export const ALLOWLIST_REASONS = {
  "components/ui/SiteHeader.astro:6":
    "glass estático en chrome UI (permitido por web/AGENTS.md SHOULD)",
};
export const ALLOWLIST = new Set(Object.keys(ALLOWLIST_REASONS));

// Toda excepción necesita motivo escrito; si falta, el gate falla cerrado.
export function validateAllowlist(allowlist = ALLOWLIST, reasons = ALLOWLIST_REASONS) {
  return [...allowlist].filter((loc) => !reasons[loc]);
}

// Throwaway (skill prototype: fuera de main conceptual) — no se audita.
export const SKIP_DIRS = ["pages/prototype/"];

const norm = (p) => p.replace(/\\/g, "/");

// Quita comentarios de bloque multilínea preservando números de línea.
export function stripBlockComments(content) {
  const blankLines = (m) => "\n".repeat((m.match(/\n/g) || []).length);
  return content
    .replace(/\/\*[\s\S]*?\*\//g, blankLines)
    .replace(/<!--[\s\S]*?-->/g, blankLines);
}

export function stripLineComment(line) {
  return line.replace(/\/\/.*$/, ""); // JS/TS line comments
}

function* walk(dir) {
  for (const e of readdirSync(dir)) {
    const p = join(dir, e);
    if (statSync(p).isDirectory()) yield* walk(p);
    else if (EXTS.has(extname(p))) yield p;
  }
}

export function scan(rootDir, { allowlist = ALLOWLIST } = {}) {
  const hits = [];
  for (const file of walk(rootDir)) {
    const normalizedPath = norm(file);
    if (SKIP_DIRS.some((d) => normalizedPath.includes(d))) continue;
    // Relativizar: prefiere el prefijo web/src/, si no al root escaneado (fixtures).
    const underWebSrc = normalizedPath.split("web/src/")[1];
    const displayPath = underWebSrc ?? normalizedPath.replace(norm(rootDir) + "/", "");
    const content = stripBlockComments(readFileSync(file, "utf8"));
    content.split("\n").forEach((line, i) => {
      const code = stripLineComment(line);
      for (const [re, why] of FORBIDDEN) {
        if (re.test(code) && !allowlist.has(`${displayPath}:${i + 1}`)) {
          hits.push({ loc: `${displayPath}:${i + 1}`, why, line: line.trim().slice(0, 120) });
        }
      }
    });
  }
  return hits;
}

// CLI: solo corre al ejecutar directo, no al importar desde tests.
const isMain = norm(process.argv[1] ?? "").endsWith("tools/design-check/check.js");
if (isMain) {
  const rootFlag = process.argv.find((a) => a.startsWith("--root="));
  const ROOT = rootFlag ? rootFlag.slice("--root=".length) : join(fileURLToPath(new URL("../../web/src", import.meta.url)));
  const reasonless = validateAllowlist();
  if (reasonless.length > 0) {
    for (const loc of reasonless) console.log(`${loc}: excepción sin motivo escrito (agregalo a ALLOWLIST_REASONS)`);
    console.log(`design-check: ROJO (${reasonless.length} excepciones sin motivo)`);
    process.exit(1);
  }
  const hits = scan(ROOT);
  for (const h of hits) console.log(`${h.loc}: ${h.why}\n    ${h.line}`);
  console.log(hits.length === 0 ? "design-check: VERDE (0 prohibidos)" : `design-check: ROJO (${hits.length} hallazgos)`);
  process.exit(hits.length === 0 ? 0 : 1);
}
