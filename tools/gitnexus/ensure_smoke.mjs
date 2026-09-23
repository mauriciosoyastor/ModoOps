#!/usr/bin/env node
/**
 * PROTOTYPE (#211 / map #207) — throwaway.
 *
 * Demuestra el camino notify + ensure + smoke attach sin `analyze` en el hot path.
 *
 *   node tools/gitnexus/ensure_smoke.mjs              # notify + ensure-check + smoke
 *   node tools/gitnexus/ensure_smoke.mjs --mode notify
 *   node tools/gitnexus/ensure_smoke.mjs --mode ensure
 *   node tools/gitnexus/ensure_smoke.mjs --mode smoke
 *   node tools/gitnexus/ensure_smoke.mjs --analyze    # solo ensure: incremental (NO en notify)
 *
 * Contrato #210: attach ≥80% en 3 queries fijas; attach bajo + fresco = FAIL estructural.
 */
import { spawnSync, execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "../..");
const OUT = path.join(__dirname, "ensure_smoke_last.json");
const ATTACH_MIN = 0.8;
const TOP_N = 10;
const REPO = "ModoOps";

const QUERIES = [
  {
    id: "harness-1",
    query: "mockLLM MockLLM callLLM orquestador",
    goal: "Dónde el agente usa mockLLM en vez del LLM real",
  },
  {
    id: "harness-2",
    query: "esAncla construirBorrador borradorV1 oficina-mapping",
    goal: "Proceso construirBorrador que llega a esAncla (no horasDe)",
  },
  {
    id: "tenant-state",
    query: "FetchTenantState estado tenant",
    goal: "Cómo se resuelve el estado de un tenant",
  },
];

function gitnexusCli() {
  const envBin = process.env.GITNEXUS_BIN;
  if (envBin) return { cmd: envBin, argsPrefix: [] };
  const cli = path.join(
    process.env.APPDATA || "",
    "npm/node_modules/gitnexus/dist/cli/index.js",
  );
  if (fs.existsSync(cli)) return { cmd: process.execPath, argsPrefix: [cli] };
  return { cmd: "gitnexus", argsPrefix: [] };
}

function runGitnexus(args, { timeoutMs = 120_000 } = {}) {
  const { cmd, argsPrefix } = gitnexusCli();
  const r = spawnSync(cmd, [...argsPrefix, ...args], {
    cwd: ROOT,
    encoding: "utf8",
    timeout: timeoutMs,
    shell: false,
  });
  const raw = `${r.stdout || ""}${r.stderr || ""}`;
  return { code: r.status ?? 1, raw, stdout: r.stdout || "", stderr: r.stderr || "" };
}

function parseJsonBlob(raw) {
  let s = raw;
  if (s.charCodeAt(0) === 0xfeff) s = s.slice(1);
  const start = s.indexOf("{");
  if (start < 0) throw new Error(`no JSON: ${s.slice(0, 200)}`);
  // Prefer last complete {...} if logs prepended; else first object (pretty).
  const pretty = s.slice(start);
  try {
    return JSON.parse(pretty);
  } catch {
    const lines = s.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
    for (let i = lines.length - 1; i >= 0; i--) {
      if (lines[i].startsWith("{")) {
        try {
          return JSON.parse(lines[i]);
        } catch {
          /* continue */
        }
      }
    }
    throw new Error(`unparseable JSON: ${s.slice(0, 300)}`);
  }
}

function revParseHead() {
  return execFileSync("git", ["rev-parse", "HEAD"], {
    cwd: ROOT,
    encoding: "utf8",
  }).trim();
}

function readIndexMeta() {
  const p = path.join(ROOT, ".gitnexus/gitnexus.json");
  const j = JSON.parse(fs.readFileSync(p, "utf8"));
  return {
    lastCommit: j.lastCommit,
    embeddings: j.stats?.embeddings ?? 0,
    embeddingDims: j.embeddingDims,
    indexedAt: j.indexedAt,
  };
}

function freshness() {
  const head = revParseHead();
  const meta = readIndexMeta();
  const stale = head !== meta.lastCommit;
  let commitsBehind = 0;
  if (stale) {
    try {
      const out = execFileSync(
        "git",
        ["rev-list", "--count", `${meta.lastCommit}..HEAD`],
        { cwd: ROOT, encoding: "utf8" },
      ).trim();
      commitsBehind = Number(out) || 0;
    } catch {
      commitsBehind = -1;
    }
  }
  return { head, lastCommit: meta.lastCommit, stale, commitsBehind, meta };
}

function doctorParity() {
  const { code, raw } = runGitnexus(["doctor"], { timeoutMs: 30_000 });
  const out = raw;
  const graph = /Graph store:\s+available/i.test(out);
  const fts = /Full-text search:\s+available/i.test(out);
  const vector = /VECTOR index:\s+available/i.test(out);
  const meta = readIndexMeta();
  const embedOk = meta.embeddings > 0 && meta.embeddingDims === 384;
  return {
    exit: code,
    graph,
    fts,
    vector,
    embedOk,
    ok: graph && fts && vector && embedOk,
    snippet: out.split(/\r?\n/).slice(0, 20).join("\n"),
  };
}

function attachRate(payload) {
  const procs = payload.processes || [];
  const syms = payload.process_symbols || [];
  const by = new Map();
  for (const s of syms) {
    const pid = s.process_id;
    if (!pid) continue;
    by.set(pid, (by.get(pid) || 0) + 1);
  }
  const n = Math.min(TOP_N, procs.length);
  let attached = 0;
  const rows = [];
  for (let i = 0; i < n; i++) {
    const p = procs[i];
    const a = by.get(p.id) || 0;
    if (a > 0) attached++;
    rows.push({
      id: p.id,
      symbol_count: p.symbol_count,
      attach: a,
    });
  }
  return {
    top_n: n,
    attached,
    rate: n ? attached / n : 0,
    rows,
  };
}

function smokeQueries() {
  const results = [];
  for (const q of QUERIES) {
    const { code, stdout, raw } = runGitnexus(
      ["query", q.query, "--repo", REPO, "--limit", String(TOP_N), "--goal", q.goal],
      { timeoutMs: 90_000 },
    );
    if (code !== 0 && !stdout.includes("{")) {
      results.push({ ...q, error: raw.slice(0, 400), pass: false });
      continue;
    }
    const payload = parseJsonBlob(stdout || raw);
    const att = attachRate(payload);
    results.push({
      id: q.id,
      query: q.query,
      goal: q.goal,
      ...att,
      pass: att.rate >= ATTACH_MIN,
    });
  }
  const allPass = results.every((r) => r.pass);
  return { results, allPass, threshold: ATTACH_MIN };
}

function notifyMessage(fresh) {
  const analyzeHint =
    fresh.meta.embeddings > 0
      ? "node .gitnexus/run.cjs analyze --embeddings"
      : "node .gitnexus/run.cjs analyze";
  return [
    `GitNexus index STALE: HEAD ${fresh.head.slice(0, 7)} ≠ lastCommit ${fresh.lastCommit.slice(0, 7)}`,
    `(~${fresh.commitsBehind} commits behind).`,
    `Run in terminal (NOT inside a hook): \`${analyzeHint}\`.`,
    `Never spawn analyze from Cursor/git hooks (timeout / Ladybug WAL risk).`,
  ].join(" ");
}

function tryRecortarOptional() {
  // Optional: ping daemon; never required for pack.
  try {
    const r = spawnSync(
      process.execPath,
      [
        "-e",
        `fetch('http://127.0.0.1:8765/health').then(r=>r.text()).then(t=>console.log(t)).catch(e=>console.log('down:'+e.message))`,
      ],
      { encoding: "utf8", timeout: 3000, cwd: ROOT },
    );
    const t = (r.stdout || "").trim();
    return { attempted: true, ok: t.includes("ok") || t.includes("healthy") || t === "ok", raw: t.slice(0, 120) };
  } catch (e) {
    return { attempted: true, ok: false, raw: String(e.message || e) };
  }
}

function parseArgs(argv) {
  const modeIdx = argv.indexOf("--mode");
  const mode = modeIdx >= 0 ? argv[modeIdx + 1] : "all";
  const doAnalyze = argv.includes("--analyze");
  return { mode, doAnalyze };
}

function main() {
  const { mode, doAnalyze } = parseArgs(process.argv.slice(2));
  const report = {
    prototype: "tools/gitnexus/ensure_smoke.mjs",
    ticket: 211,
    map: 207,
    mode,
    doAnalyze,
    analyzed: false,
    analyzeInvokedFromNotify: false,
    steps: {},
  };

  const fresh = freshness();
  report.steps.freshness = fresh;

  if (mode === "notify" || mode === "all") {
    // Hot path: NEVER call analyze.
    if (doAnalyze && mode === "notify") {
      report.steps.notify = {
        pass: false,
        error: "refuse --analyze in notify mode (contrato #210)",
      };
    } else if (fresh.stale) {
      const msg = notifyMessage(fresh);
      console.log(`[notify] ${msg}`);
      report.steps.notify = { pass: true, stale: true, message: msg, analyze_spawned: false };
    } else {
      console.log("[notify] index fresh — nothing to say");
      report.steps.notify = { pass: true, stale: false, analyze_spawned: false };
    }
  }

  if (mode === "ensure" || mode === "all") {
    const parity = doctorParity();
    report.steps.doctor = parity;
    let ensurePass = parity.ok;
    let cause = null;
    let hint = null;

    if (fresh.stale) {
      if (doAnalyze && mode !== "notify") {
        console.log("[ensure] stale → incremental analyze (fuera del hook)…");
        const emb = fresh.meta.embeddings > 0 ? ["--embeddings"] : [];
        // Prefer local runner if present.
        const runCjs = path.join(ROOT, ".gitnexus/run.cjs");
        let ar;
        if (fs.existsSync(runCjs)) {
          ar = spawnSync(process.execPath, [runCjs, "analyze", ...emb], {
            cwd: ROOT,
            encoding: "utf8",
            timeout: 600_000,
            shell: false,
          });
        } else {
          ar = runGitnexus(["analyze", ...emb], { timeoutMs: 600_000 });
        }
        report.analyzed = true;
        report.steps.analyze = {
          exit: ar.code ?? ar.status,
          tail: (ar.stdout || ar.raw || "").slice(-500),
        };
        Object.assign(report.steps.freshness, freshness());
      } else {
        ensurePass = false;
        cause = "stale";
        hint = notifyMessage(fresh);
        console.log(`[ensure] FAIL cause=${cause}`);
        console.log(`[ensure] ${hint}`);
      }
    }

    // Re-read freshness after optional analyze
    const fresh2 = freshness();
    report.steps.freshness_after = fresh2;

    if (!parity.ok) {
      ensurePass = false;
      cause = "parity";
      hint =
        "doctor fts/vector/384d incompleto — humano/ensure offline: GITNEXUS_LBUG_EXTENSION_INSTALL=auto npx gitnexus analyze --force --embeddings";
      console.log(`[ensure] FAIL cause=${cause}`);
      console.log(`[ensure] ${hint}`);
    }

    report.steps.ensure = {
      pass: ensurePass && !fresh2.stale && parity.ok,
      cause,
      hint,
      analyze_in_hook: false,
    };
  }

  if (mode === "smoke" || mode === "all") {
    const fresh3 = freshness();
    if (fresh3.stale) {
      report.steps.smoke = {
        pass: false,
        cause: "stale",
        hint: "reindex incremental antes de medir attach; no sirve como FAIL estructural",
      };
      console.log("[smoke] FAIL cause=stale — skip attach measurement");
    } else {
      const smoke = smokeQueries();
      let cause = null;
      let hint = null;
      if (!smoke.allPass) {
        cause = "dedupe/structural";
        hint =
          "attach <80% con índice fresco: NO reindex otra vez — ver #209 (dedupe symbol.id). Recovery/fill Laya #206 (compact + fill_sym).";
        console.log(`[smoke] FAIL cause=${cause}`);
        console.log(`[smoke] ${hint}`);
      } else {
        console.log("[smoke] PASS attach ≥80% × 3 queries");
      }
      const recortar = tryRecortarOptional();
      report.steps.smoke = {
        pass: smoke.allPass,
        cause,
        hint,
        threshold: ATTACH_MIN,
        queries: smoke.results,
        recortar_optional: recortar,
      };
    }
  }

  // Pack: path demo — notify never analyzed; ensure never claims analyze-in-hook.
  const notifyOk = !report.steps.notify || report.steps.notify.pass;
  const ensurePathOk =
    !report.steps.ensure || report.steps.ensure.analyze_in_hook === false;
  const pathPass = notifyOk && ensurePathOk && report.analyzeInvokedFromNotify === false;

  report.path_pass = pathPass;
  report.pack = {
    path_demonstrated: pathPass,
    smoke_attach: report.steps.smoke?.pass ?? null,
    note:
      "Path PASS = notify/ensure no spawnean analyze en hot path. Smoke attach es gate aparte (#210).",
  };

  fs.writeFileSync(OUT, JSON.stringify(report, null, 2), "utf8");
  console.log(`\nWrote ${path.relative(ROOT, OUT)}`);
  console.log(`path_pass=${pathPass} smoke=${report.steps.smoke?.pass ?? "n/a"}`);

  // Exit: path failure → 2; smoke fail alone → 1; ok → 0
  if (!pathPass) process.exit(2);
  if (report.steps.smoke && report.steps.smoke.pass === false) process.exit(1);
  process.exit(0);
}

main();
