#!/usr/bin/env node
// Writes the top of every agent README from the agent itself: what it does, what it
// checks (each finding code with a real sentence from the fictional demo data), the
// settings with their defaults, and the limits. scripts/readme-sections.mjs then adds the
// generated block (demo run, tools, columns, install, modes, CLI) before "## Limits".
//
//   node scripts/readme-head.mjs [agent ...]
import { readdirSync, readFileSync, writeFileSync, existsSync, mkdtempSync, cpSync, rmSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { tmpdir } from 'node:os';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { AgentRuntime, FAIRGIVE_LIMITS } from '../packages/fairgive-core/src/index.js';

const PK = join(dirname(fileURLToPath(import.meta.url)), '..', 'packages');
const only = process.argv.slice(2).filter((a) => !a.startsWith('--'));
const esc = (s) => String(s ?? '').replace(/\|/g, '\\|').replace(/\n/g, ' ');
for (const n of readdirSync(PK).filter((x) => /^fairgive-(?!core$)/.test(x) && (!only.length || only.includes(x))).sort()) {
  const mod = await import(pathToFileURL(join(PK, n, 'src', 'index.js')).href);
  const { manifest, DEMO, DEFAULTS } = { ...mod, DEMO: (await import(pathToFileURL(join(PK, n, 'src', 'manifest.js')).href)).DEMO };
  const prefix = manifest.tools[0].name.replace(/_check$/, '');
  const root = mkdtempSync(join(tmpdir(), `${n}-head-`)); cpSync(join(PK, n, 'fixtures'), root, { recursive: true });
  const r = await new AgentRuntime(manifest, { root, audit: false, memory: false }).call(`${prefix}_check`, DEMO.files);
  rmSync(root, { recursive: true, force: true });
  const examples = new Map();
  for (const i of (r.result && r.result.items) || []) for (const f of i.findings) if (!examples.has(f.code)) examples.set(f.code, { status: i.status, detail: f.detail });
  const personal = Object.values(manifest.sources || {}).some((s) => Object.values(s.fields).some((fd) => fd && fd.personal));
  const props = manifest.configSchemas.settings ? manifest.configSchemas.settings.properties : {};
  const pkg = JSON.parse(readFileSync(join(PK, n, 'package.json'), 'utf8'));
  const desc = pkg.description.replace(/^[^:]+:\s*/, '');
  const L = [`# ${n}`, '', desc.charAt(0).toUpperCase() + desc.slice(1), '',
    `Part of **Fairgive**, the nonprofit, foundation, church and association back-office agents by Mythos Machines. The software is free (MIT); the paid part is a fixed-price setup on your own files. Every result is computed from your files with plain arithmetic, on your computer; no AI model is called by the tools. It reads files and writes reports${manifest.tools.some((t) => /_request_/.test(t.name)) ? ' and drafts' : ''}; it never files, sends, pays or changes a live system, and a person on your team decides and acts on every finding.`, '',
    '## What it needs', '', 'Exports you already have, saved as files on your computer (CSV, Excel, JSON; see "Columns it reads" and "Exports it reads" below):', '',
    ...Object.entries(manifest.tools[0].inputSchema.properties).filter(([k]) => !['limit', 'status', 'settings'].includes(k)).map(([k, v]) => `- \`${k}\`${(manifest.tools[0].inputSchema.required || []).includes(k) ? ' (required)' : ''}: ${esc(String(v.description || '').replace(/ under --root/, ''))}`),
    ...(manifest.tools[0].inputSchema.properties.settings ? ['- `settings` (optional): a JSON file with your own thresholds and rules; see "Settings" below.'] : []), '',
    '## What it checks', '', manifest.tools[0].description, '',
    '| Finding | Example from the fictional demo data |', '|---|---|',
    ...[...examples.entries()].sort((a, b) => (a[0] < b[0] ? -1 : 1)).map(([code, e]) => `| \`${code}\` | ${esc(e.detail)} |`), '',
    'Each item gets the most serious level of its findings: **flag** (act on it), **review** (data is missing or unclear; a person looks), **watch** (worth knowing) or **ok**. Every finding names the numbers it was worked out from.', ''];
  if (Object.keys(props).length) {
    L.push('## Settings', '', `Put the ones you want to change in a JSON file and pass it as \`settings\`; anything left out uses the default. The result lists the settings it used under \`settings_used\`.`, '', '| Setting | Default | Meaning |', '|---|---|---|');
    for (const [k, v] of Object.entries(props)) L.push(`| \`${k}\` | \`${esc(JSON.stringify(DEFAULTS ? DEFAULTS[k] : null))}\` | ${esc(v.description)} |`);
    L.push('');
  }
  L.push('## Limits', '', `- ${FAIRGIVE_LIMITS.files}`, `- ${FAIRGIVE_LIMITS.settings}`, `- ${FAIRGIVE_LIMITS.advice}`, ...(personal ? [`- ${FAIRGIVE_LIMITS.masking}`] : []), '- Column names for the named exports were written from knowledge of those systems and not checked against a live account; `inspect` shows how a file was read and `fairgive-sources.json` names columns by hand.', '- The bundled fixtures are fictional. Version 0.1.0; nothing has been published yet.', '');
  const f = join(PK, n, 'README.md');
  const old = existsSync(f) ? readFileSync(f, 'utf8') : '';
  const block = (/<!-- generated:start -->[\s\S]*?<!-- generated:end -->/.exec(old) || [])[0];
  let txt = L.join('\n');
  if (block) txt = txt.replace('\n## Limits', `\n${block}\n\n## Limits`);
  // Keep the "Exports it reads" block that scripts/sources-doc.mjs writes before "## Install".
  const sources = (/<!-- sources:start -->[\s\S]*?<!-- sources:end -->/.exec(old) || [])[0];
  if (sources && !txt.includes('<!-- sources:start -->')) txt = txt.replace(/\n## Install\b/, `\n${sources}\n\n## Install`);
  writeFileSync(f, txt);
  console.log(`${n}: README head written (${examples.size} finding codes)`);
}
