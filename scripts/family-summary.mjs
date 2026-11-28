#!/usr/bin/env node
// Prints one line per agent (name, tool prefix, tools, eval cases, draft and its one-click
// category, memory) and family totals. Used for docs/.
import { readdirSync, readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const PK = join(dirname(fileURLToPath(import.meta.url)), '..', 'packages');
let tools = 0, cases = 0, refused = 0; const drafts = []; const memory = [];
for (const n of readdirSync(PK).filter((x) => /^fairgive-(?!core$)/.test(x)).sort()) {
  const { manifest: m } = await import(pathToFileURL(join(PK, n, 'src', 'manifest.js')).href);
  const prefix = m.tools[0].name.replace(/_check$/, '');
  const c = JSON.parse(readFileSync(join(PK, n, 'evals', 'cases.json'), 'utf8')).cases.length;
  const req = m.tools.find((t) => /_request_/.test(t.name));
  const r = m.policy.rules.filter((x) => x.decision === 'block' && x.tool !== '*').length;
  tools += m.tools.length; cases += c; refused += r;
  if (req) drafts.push(`${n} (${req.category})`);
  if (m.memory && Object.keys(m.memory.kinds || {}).length) memory.push(n);
  console.log(`| ${n} | \`${prefix}_*\` | ${m.tools.length} | ${c} | ${req ? req.category : '-'} |`);
}
console.log(`\ntools ${tools}, eval cases ${cases}, refused tools ${refused}\ndrafts ${drafts.length}: ${drafts.join(', ')}\nmemory: ${memory.join(', ')}`);
