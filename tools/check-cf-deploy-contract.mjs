#!/usr/bin/env node
/**
 * Guards the Cloudflare Workers Builds + modoops_ia.logic contract so
 * parallel feature branches do not reintroduce conflicting package.json /
 * __init__.py stubs (see PR #12 / #14 conflict history).
 */
import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const failures = [];

function readJson(rel) {
  return JSON.parse(readFileSync(resolve(root, rel), "utf8"));
}

function assert(cond, msg) {
  if (!cond) failures.push(msg);
}

const rootPkg = readJson("package.json");
const webPkg = readJson("web/package.json");
const initPy = readFileSync(resolve(root, "modoops_ia/logic/__init__.py"), "utf8");
const hasWrangler = existsSync(resolve(root, "wrangler.toml"));
const rootWrangler = hasWrangler ? readFileSync(resolve(root, "wrangler.toml"), "utf8") : "";

assert(rootPkg.name === "modoops", 'root package.json name must be "modoops"');
assert(
  Array.isArray(rootPkg.workspaces) && rootPkg.workspaces.includes("web"),
  'root workspaces must include "web"'
);
assert(
  typeof rootPkg.scripts?.build === "string" &&
    rootPkg.scripts.build.includes("--prefix web") &&
    !rootPkg.scripts.build.includes(" -w ") &&
    !rootPkg.scripts.build.includes("--workspace"),
  'root build must use `npm --prefix web` (path), not `-w` / `--workspace` (package name)'
);
assert(
  typeof rootPkg.scripts?.deploy === "string" &&
    (rootPkg.scripts.deploy.includes("wrangler deploy") ||
      rootPkg.scripts.deploy.includes("vercel")) &&
    (rootPkg.scripts.deploy.includes("--no-autoconfig") || rootPkg.scripts.deploy.includes("vercel")),
  "root deploy must be `wrangler deploy ... --no-autoconfig` or `vercel`"
);

assert(webPkg.name === "modoops-web", 'web package name must be "modoops-web" (not galaxygroup-web)');
assert(
  typeof webPkg.scripts?.build === "string" &&
    webPkg.scripts.build.includes("npm install") &&
    webPkg.scripts.build.includes("npx astro build"),
  'web build must be `npm install && npx astro build` (CF-safe when Build command is npm --prefix web run build)'
);

if (hasWrangler) {
  assert(
    rootWrangler.includes('directory = "web/dist"') || rootWrangler.includes("directory = 'web/dist'"),
    'root wrangler.toml assets.directory must be "web/dist"'
  );
  assert(
    rootWrangler.includes('main = "worker.js"') ||
      rootWrangler.includes("main = 'worker.js'") ||
      rootWrangler.includes('main = "web/dist/_worker.js"') ||
      rootWrangler.includes("main = 'web/dist/_worker.js'"),
    'root wrangler.toml main must be root worker.js or web/dist/_worker.js (Astro server)'
  );
}
assert(
  !existsSync(resolve(root, "web/wrangler.toml")),
  "web/wrangler.toml must not exist — single config at repo root (avoids Root directory=web drift)"
);

for (const sym of [
  "stock_consulta",
  "ot_cobro",
  "memory",
  "orchestrator",
  "tool_schemas",
  "__all__",
]) {
  assert(initPy.includes(sym), `modoops_ia/logic/__init__.py must expose ${sym} (extend, do not stub)`);
}

if (failures.length) {
  console.error("CF deploy contract check FAILED:\n");
  for (const f of failures) console.error(" ✗", f);
  process.exit(1);
}

console.log("✓ CF deploy contract OK (package.json ×2, wrangler.toml, modoops_ia.logic)");
