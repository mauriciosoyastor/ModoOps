#!/usr/bin/env node
/**
 * tools/grafo/grafo.mjs — CLI helper amigable sobre GitNexus
 * Uso: node tools/grafo/grafo.mjs <command> [args]
 * Comandos: query, context, impact, trace, cypher, communities, processes, check, export
 *
 * Envia instrucciones para usar MCP tools directamente desde el agente.
 * Para ejecución directa con DB, usa npx gitnexus o el MCP en el agente.
 */
const REPO = "ModoOps";

const HELP = `
ModoOps Grafo — CLI helper (repo: ${REPO})

Uso:
  node tools/grafo/grafo.mjs query <texto> [--limit 5]
  node tools/grafo/grafo.mjs context --name <symbol> [--file <path>] [--kind <kind>]
  node tools/grafo/grafo.mjs impact --target <symbol> [--direction upstream|downstream] [--maxDepth 3]
  node tools/grafo/grafo.mjs trace --from <A> --to <B> [--maxDepth 10]
  node tools/grafo/grafo.mjs cypher "<MATCH ... RETURN ...>"
  node tools/grafo/grafo.mjs communities [--limit 10]
  node tools/grafo/grafo.mjs processes [--limit 10]
  node tools/grafo/grafo.mjs check
  node tools/grafo/grafo.mjs export

Notas:
  - Este helper imprime el COMANDO MCP / Cypher a ejecutar en el agente.
  - Para ejecución directa sin agente, usa npx gitnexus o el script export-grafo.mjs
  - Repo por defecto: ModoOps (override: --repo OtroRepo)
`;

function parseArgs(argv) {
  const cmd = argv[2];
  const rest = argv.slice(3);
  const flags = {};
  const positional = [];
  for (let i = 0; i < rest.length; i++) {
    if (rest[i].startsWith("--")) {
      const k = rest[i].slice(2);
      const v = rest[i + 1] && !rest[i + 1].startsWith("--") ? rest[++i] : true;
      flags[k] = v;
    } else if (rest[i].startsWith("-")) {
      // short not used
    } else {
      positional.push(rest[i]);
    }
  }
  return { cmd, flags, positional };
}

function repoFlag(flags) {
  return flags.repo || REPO;
}

async function main() {
  const { cmd, flags, positional } = parseArgs(process.argv);
  const repo = repoFlag(flags);

  if (!cmd || cmd === "help" || cmd === "--help" || cmd === "-h") {
    console.log(HELP);
    process.exit(0);
  }

  switch (cmd) {
    case "query": {
      const q = positional.join(" ") || flags.q || flags.query;
      if (!q) { console.error("query requiere texto: node tools/grafo/grafo.mjs query \"onboarding boot\""); process.exit(1); }
      console.log(`→ MCP: gitnexus_query({ search_query: "${q}", repo: "${repo}", limit: ${flags.limit || 5} })`);
      console.log(`   Cypher alternativo:`);
      console.log(`   MATCH (p:Process)-[r:CodeRelation]->(s) WHERE s.name CONTAINS "${q.split(" ")[0]}" RETURN p.heuristicLabel, s.name LIMIT 10`);
      break;
    }
    case "context": {
      if (!flags.name) { console.error("context requiere --name <symbol>"); process.exit(1); }
      console.log(`→ MCP: gitnexus_context({ name: "${flags.name}", repo: "${repo}"${flags.file ? `, file_path: "${flags.file}"` : ""}${flags.kind ? `, kind: "${flags.kind}"` : ""} })`);
      break;
    }
    case "impact": {
      if (!flags.target) { console.error("impact requiere --target <symbol>"); process.exit(1); }
      console.log(`→ MCP: gitnexus_impact({ target: "${flags.target}", direction: "${flags.direction || "upstream"}", repo: "${repo}", maxDepth: ${flags.maxDepth || 3} })`);
      break;
    }
    case "trace": {
      if (!flags.from || !flags.to) { console.error("trace requiere --from <A> --to <B>"); process.exit(1); }
      console.log(`→ MCP: gitnexus_trace({ from: "${flags.from}", to: "${flags.to}", repo: "${repo}", maxDepth: ${flags.maxDepth || 10} })`);
      break;
    }
    case "cypher": {
      const stmt = positional.join(" ") || flags.statement;
      if (!stmt) { console.error("cypher requiere statement entre comillas"); process.exit(1); }
      console.log(`→ MCP: gitnexus_cypher({ statement: \`${stmt}\`, repo: "${repo}" })`);
      break;
    }
    case "communities": {
      console.log(`→ MCP: gitnexus_cypher({ repo: "${repo}", statement: "MATCH (c:Community) RETURN c.heuristicLabel, c.symbolCount, c.cohesion ORDER BY c.symbolCount DESC LIMIT ${flags.limit || 10}" })`);
      break;
    }
    case "processes": {
      console.log(`→ MCP: gitnexus_cypher({ repo: "${repo}", statement: "MATCH (p:Process) RETURN p.heuristicLabel, p.stepCount, p.processType ORDER BY p.stepCount DESC LIMIT ${flags.limit || 10}" })`);
      break;
    }
    case "check": {
      console.log(`→ npx gitnexus status  (repo: ${repo})`);
      console.log(`→ gitnexus_cypher: MATCH (a)-[r:CodeRelation]->(b) RETURN r.type, count(*) ORDER BY count(*) DESC`);
      break;
    }
    case "export": {
      console.log(`→ node tools/grafo/export-grafo.mjs  (genera web/public/grafo-data.json)`);
      break;
    }
    default:
      console.error(`Comando desconocido: ${cmd}`);
      console.log(HELP);
      process.exit(1);
  }
}

main();
