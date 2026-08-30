#!/usr/bin/env node
// CI check: verifica `npx gitnexus doctor` paridad 384d
import { execSync } from "node:child_process";

function run(cmd) {
  try { return execSync(cmd, { encoding: "utf8", timeout: 15000 }); } catch (e) { return e.stdout || e.message; }
}

const out = run("npx gitnexus doctor");
const hasGraph = out.includes("Graph store:      available");
const hasFts = out.includes("Full-text search: available");
const hasVector = out.includes("VECTOR index:     available") || out.includes("VECTOR index: available");
const hasEmbed = (() => {
  try {
    const j = JSON.parse(execSync("node -e \"console.log(require('fs').readFileSync('.gitnexus/gitnexus.json','utf8'))\"", { encoding: "utf8" }));
    return j.stats?.embeddings > 0 && j.embeddingDims === 384;
  } catch { return false; }
})();

console.log(out);
console.log(hasGraph ? "✓ graph" : "✗ graph");
console.log(hasFts ? "✓ fts" : "✗ fts (need GITNEXUS_LBUG_EXTENSION_INSTALL=auto)");
console.log(hasVector ? "✓ vector" : "✗ vector");
console.log(hasEmbed ? "✓ embeddings 384d" : "✗ embeddings");
if (!hasFts || !hasVector) {
  console.log("\nParidad incompleta — ejecutar: GITNEXUS_LBUG_EXTENSION_INSTALL=auto npx gitnexus analyze --force --embeddings");
  process.exit(1);
}
console.log("\nParidad OK — ModoOps grafo 384d listo");
