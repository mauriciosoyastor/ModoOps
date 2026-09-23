#!/usr/bin/env node
/**
 * PROTOTYPE (#211) — Cursor postToolUse notify-only stub.
 *
 * Reads Cursor/Claude hook stdin JSON; if Shell/Bash ran a successful
 * git commit|merge|rebase|cherry-pick|pull and index is stale, prints
 * additional_context. NEVER spawns analyze.
 *
 * Wire sketch (not installed on main):
 *   .cursor/hooks.json → postToolUse matcher Shell → this script
 */
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const GIT_MUTATION =
  /\bgit\s+(commit|merge|rebase|cherry-pick|pull)(\s|$)/i;

function readStdin() {
  try {
    return fs.readFileSync(0, "utf8");
  } catch {
    return "";
  }
}

function findMeta(cwd) {
  let dir = cwd || ROOT;
  for (let i = 0; i < 12; i++) {
    const p = path.join(dir, ".gitnexus/gitnexus.json");
    if (fs.existsSync(p)) return p;
    const parent = path.dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
  return null;
}

function main() {
  const raw = readStdin();
  let input = {};
  try {
    input = raw.trim() ? JSON.parse(raw) : {};
  } catch {
    process.exit(0);
  }

  const tool = input.tool_name || input.toolName || "";
  const cmd =
    input.command ||
    input.tool_input?.command ||
    input.arguments?.command ||
    "";
  const exitCode =
    input.tool_output?.exit_code ??
    input.output?.exit_code ??
    input.exit_code ??
    0;

  // Accept Shell (Cursor) or Bash (Claude third-party).
  if (tool && !/^(Shell|Bash)$/i.test(tool)) {
    process.exit(0);
  }
  if (!GIT_MUTATION.test(cmd)) process.exit(0);
  if (exitCode !== 0 && exitCode !== "0") process.exit(0);

  const cwd = input.cwd || input.working_directory || ROOT;
  const metaPath = findMeta(cwd);
  if (!metaPath) process.exit(0);

  let head;
  try {
    head = execFileSync("git", ["rev-parse", "HEAD"], {
      cwd: path.dirname(path.dirname(metaPath)),
      encoding: "utf8",
    }).trim();
  } catch {
    process.exit(0);
  }

  const meta = JSON.parse(fs.readFileSync(metaPath, "utf8"));
  if (!meta.lastCommit || meta.lastCommit === head) process.exit(0);

  const emb = meta.stats?.embeddings > 0 ? " --embeddings" : "";
  const msg =
    `GitNexus index is stale (HEAD ≠ lastCommit ${String(meta.lastCommit).slice(0, 7)}). ` +
    `Run \`node .gitnexus/run.cjs analyze${emb}\` in the terminal — do not auto-analyze from hooks.`;

  // Cursor-native shape
  process.stdout.write(
    JSON.stringify({ additional_context: msg }) + "\n",
  );
}

main();
