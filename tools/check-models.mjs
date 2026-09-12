// Check fail-closed del pipeline de assets 3D (ticket #171).
// Valida web/public/models/models.manifest.json: archivos presentes,
// sha256 coincidente y suma gzip dentro del presupuesto. Sin dependencias.
import { createHash } from 'node:crypto';
import { gzipSync } from 'node:zlib';
import { readFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const publicDir = join(root, 'web', 'public');
const manifestPath = join(publicDir, 'models', 'models.manifest.json');

const fail = (msg) => {
  console.error(`check-models: FAIL — ${msg}`);
  process.exit(1);
};

if (!existsSync(manifestPath)) fail(`falta ${manifestPath}`);
const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
if (!Array.isArray(manifest.models) || manifest.models.length === 0) fail('manifest sin modelos');
if (typeof manifest.budgetGzipBytes !== 'number') fail('manifest sin budgetGzipBytes');

let totalGzip = 0;
for (const m of manifest.models) {
  for (const k of ['file', 'bytes', 'gzipBytes', 'sha256', 'license', 'sourceUrl']) {
    if (m[k] === undefined) fail(`${m.file ?? '?'} sin campo ${k}`);
  }
  if (!m.file.startsWith('models/')) fail(`${m.file} fuera de models/`);
  const p = join(publicDir, m.file.replace(/^models\//, 'models/'));
  if (!existsSync(p)) fail(`falta archivo ${m.file}`);
  const raw = readFileSync(p);
  if (raw.length !== m.bytes) fail(`${m.file}: bytes ${raw.length} != manifest ${m.bytes}`);
  const sha = createHash('sha256').update(raw).digest('hex');
  if (sha !== m.sha256) fail(`${m.file}: sha256 no coincide`);
  totalGzip += gzipSync(raw).length;
}
console.log(`check-models: OK — ${manifest.models.length} modelos, gzip ${totalGzip}B / presupuesto ${manifest.budgetGzipBytes}B`);
if (totalGzip > manifest.budgetGzipBytes) {
  fail(`presupuesto excedido: ${totalGzip} > ${manifest.budgetGzipBytes}`);
}
