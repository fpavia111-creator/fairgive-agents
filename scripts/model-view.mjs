#!/usr/bin/env node
// What reaches the AI model when an assistant calls each agent's check tool: which input
// columns are masked, and which columns' values appear in the result in clear. Measured by
// running the check on the fictional fixtures and looking for every fixture value in the JSON
// the model receives (report and draft files on disk are not counted: they stay on the machine).
//
//   node scripts/model-view.mjs            print the table and write docs/model-view-<date>.json and .md
import { readdirSync, readFileSync, writeFileSync, mkdtempSync, cpSync, rmSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { tmpdir } from 'node:os';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { AgentRuntime, parseCsv } from '../packages/fairgive-core/src/index.js';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const PK = join(ROOT, 'packages'); const DATE = '2026-11-19';
// Free-text columns: a person could type anything here, including a donor's or a colleague's name
// ("In memory of ...", "MOBILE DEPOSIT J SMITH"). Record ids (donor, gift, employee, volunteer) are
// sent in clear too: they name no one by themselves but link back to your own systems.
const FREE_TEXT = new Set(['memo', 'description', 'benefit', 'purpose', 'note', 'merchant', 'employer', 'title', 'daf_sponsor', 'grantee']);
const out = [];
for (const n of readdirSync(PK).filter((x) => /^fairgive-(?!core$)/.test(x)).sort()) {
  const { manifest } = await import(pathToFileURL(join(PK, n, 'src', 'index.js')).href);
  const { DEMO } = await import(pathToFileURL(join(PK, n, 'src', 'manifest.js')).href);
  const prefix = manifest.tools[0].name.replace(/_check$/, '');
  const root = mkdtempSync(join(tmpdir(), 'mv-')); cpSync(join(PK, n, 'fixtures'), root, { recursive: true });
  const r = await new AgentRuntime(manifest, { root, audit: false, memory: false }).call(`${prefix}_check`, { ...DEMO.files, limit: 5000 });
  rmSync(root, { recursive: true, force: true });
  const json = JSON.stringify(r);
  const masked = new Set(); const fieldsOf = new Map();
  for (const s of Object.values(manifest.sources || {})) for (const [f, fd] of Object.entries(s.fields)) { fieldsOf.set(f, fd || {}); if (fd && fd.personal) masked.add(`${f}${typeof fd.personal === 'string' ? ` (${fd.personal}#…)` : ''}`); }
  const clear = new Set(), clearFree = new Set();
  for (const file of Object.values(DEMO.files).filter((x) => /\.csv$/i.test(x))) {
    for (const row of parseCsv(readFileSync(join(PK, n, 'fixtures', file), 'utf8'))) for (const [h, v] of Object.entries(row)) {
      const s = String(v ?? '').trim(); const fd = fieldsOf.get(h);
      if (!fd || fd.personal || s.length < 3 || /^-?[\d.,]+$/.test(s) || /^\d{4}-\d\d-\d\d/.test(s)) continue;
      if (json.includes(JSON.stringify(s).slice(1, -1))) { clear.add(h); if (FREE_TEXT.has(h)) clearFree.add(h); }
    }
  }
  out.push({ agent: n, masked: [...masked].sort(), text_in_clear: [...clear].sort(), free_text_in_clear: [...clearFree].sort(), plus: 'amounts, quantities, dates, rates and finding codes in clear' });
}
for (const o of out) console.log(`${o.agent}\n  masked: ${o.masked.join(', ') || '-'}\n  text in clear: ${o.text_in_clear.join(', ') || '-'}`);
mkdirSync(join(ROOT, 'docs'), { recursive: true });
writeFileSync(join(ROOT, 'docs', `model-view-${DATE}.json`), JSON.stringify(out, null, 2) + '\n');
const L = [`# What reaches the AI model (${DATE})`, '', 'Made by `node scripts/model-view.mjs`: each check is run on its fictional fixtures and every fixture value is looked for in the JSON result the assistant\'s model receives. Masked columns (donor, giver, member, volunteer, employee, officer and vendor names, e-mails, phone numbers, street addresses and taxpayer ids) are replaced by tokens such as `A.R.#3f9a2c`, `email#…`, `phone#…`, `address#…` or `tin#…` (the same value always gives the same token, so the model can still group by it; the report and draft files on your machine keep the real values). Everything else in the result is sent in clear: amounts, dates, rates, finding codes, record ids (donor, gift, employee, volunteer ids, which name no one by themselves but link back to your systems) and the text columns listed. Free-text columns (memos, bank descriptions, benefit and in-kind descriptions, grant purposes) are sent as typed: if someone types "In memory of Jane Doe" into a gift memo, the model sees that name, unless the same name is in a masked column of the files read in that call (checked on 19 Nov 2026: a gift memo "in memory of Juniper Vance", a donor in the same file, reached the model as "in memory of J.V.#c84c20"; "Ada Stranger", in no masked column, reached it as typed).', '', 'The result goes to whatever model the user\'s assistant uses. For donor, staff and volunteer data, use a model covered by your own agreements or a local model. No compliance claim is made.', '', '| Agent | Masked | Text sent in clear | Free text among them |', '|---|---|---|---|',
  ...out.map((o) => `| ${o.agent} | ${o.masked.join(', ') || '-'} | ${o.text_in_clear.join(', ') || '-'} | ${o.free_text_in_clear.join(', ') || '-'} |`), ''];
writeFileSync(join(ROOT, 'docs', `model-view-${DATE}.md`), L.join('\n'));
console.log(`Wrote docs/model-view-${DATE}.json and .md`);
