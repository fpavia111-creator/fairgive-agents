#!/usr/bin/env node
// Real public data, in its published format, through the agents. Nothing private is used:
// donor, gift and payroll data are private by nature, so the public sources below are the
// ones that fit (government filings and registers). Downloads go to _realdata/ (git-ignored);
// only this script and the results (docs/realdata-<date>.json and .md) are committed.
//
//   node scripts/realdata.mjs --download     fetch the public files (needs the network)
//   node scripts/realdata.mjs                convert, run the agents, re-count, write the results
//
// Sources
//   1. Federal Audit Clearinghouse (GSA), api.fac.gov: single audits that nonprofits filed for
//      fiscal years ending 2025-12-31 (threshold 1,000,000) and 2024-06-30 (threshold 750,000):
//      the general record, every federal award line and the pass-through records. Run through
//      fairgive-single-audit and re-counted from the same rows.
//   2. IRS Form 990 e-file data (TEOS XML), apps.irs.gov: a sample of returns read straight out
//      of the IRS's January 2025 zip with byte-range requests. Schedule I grants and Part VII
//      officers go through fairgive-form-990-data; Part IX (statement of functional expenses)
//      goes through fairgive-functional-expenses and is compared with the return's own totals.
//   3. IRS Exempt Organizations Business Master File extract, Vermont (eo_vt.csv): every
//      registered exempt organization in one state, as organization records for
//      fairgive-duplicate-donors, once as published (every EIN is a different organization) and
//      once with planted duplicates written the way people retype names and addresses.
import { existsSync, mkdirSync, readFileSync, writeFileSync, readdirSync, rmSync, mkdtempSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { tmpdir } from 'node:os';
import { inflateRawSync } from 'node:zlib';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { AgentRuntime, parseCsv, toCsv } from '../packages/fairgive-core/src/index.js';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const RD = join(ROOT, '_realdata'); const RAW = join(RD, 'raw');
const DATE = '2026-11-19';
const UA = { 'User-Agent': 'fairgive-agents real-data test (open source; github.com/fpavia111-creator/fairgive-agents)' };

const FAC = 'https://api.fac.gov';
const FAC_KEY = process.env.FAC_API_KEY || 'DEMO_KEY'; // api.data.gov's public demo key: a few requests an hour
const FAC_SETS = [['2025-12-31', 40], ['2024-06-30', 30]];
const TEOS_ZIP = 'https://apps.irs.gov/pub/epostcard/990/xml/2025/2025_TEOS_XML_01A.zip';
const TEOS_SAMPLE = 90;
const BMF_URL = 'https://www.irs.gov/pub/irs-soi/eo_vt.csv';

// ------------------------------------------------------------------ download ----
async function fetchBuf(url, headers = {}) {
  for (let i = 1; i <= 3; i++) {
    try {
      const r = await fetch(url, { headers: { ...UA, ...headers }, signal: AbortSignal.timeout(120000) });
      if (!r.ok && r.status !== 206) throw new Error(`HTTP ${r.status}`);
      return Buffer.from(await r.arrayBuffer());
    } catch (e) { if (i === 3) throw new Error(`${url}: ${e.message}`); await new Promise((res) => setTimeout(res, 2000 * i)); }
  }
}
const range = (url, a, b) => fetchBuf(url, { Range: `bytes=${a}-${b}` });

// A zip read with byte ranges: the end record, the central directory, then each chosen entry.
async function zipEntries(url) {
  const tail = await fetchBuf(url, { Range: 'bytes=-65536' });
  const eocd = tail.lastIndexOf(Buffer.from([0x50, 0x4b, 0x05, 0x06]));
  if (eocd < 0) throw new Error('no end-of-central-directory record');
  let cdSize = tail.readUInt32LE(eocd + 12); let cdOff = tail.readUInt32LE(eocd + 16);
  const loc = tail.lastIndexOf(Buffer.from([0x50, 0x4b, 0x06, 0x07]));
  if (loc >= 0 && (cdOff === 0xffffffff || cdSize === 0xffffffff || tail.readUInt16LE(eocd + 10) === 0xffff)) {
    const z64 = tail.lastIndexOf(Buffer.from([0x50, 0x4b, 0x06, 0x06]));
    cdSize = Number(tail.readBigUInt64LE(z64 + 40)); cdOff = Number(tail.readBigUInt64LE(z64 + 48));
  }
  const cd = await range(url, cdOff, cdOff + cdSize - 1); const out = [];
  for (let p = 0; p + 46 <= cd.length && cd.readUInt32LE(p) === 0x02014b50;) {
    const method = cd.readUInt16LE(p + 10); let comp = cd.readUInt32LE(p + 20); let size = cd.readUInt32LE(p + 24);
    const nl = cd.readUInt16LE(p + 28), xl = cd.readUInt16LE(p + 30), cl = cd.readUInt16LE(p + 32); let off = cd.readUInt32LE(p + 42);
    const name = cd.slice(p + 46, p + 46 + nl).toString('utf8');
    for (let x = p + 46 + nl; x < p + 46 + nl + xl;) { const id = cd.readUInt16LE(x), len = cd.readUInt16LE(x + 2); if (id === 1) { let q = x + 4; if (size === 0xffffffff) { size = Number(cd.readBigUInt64LE(q)); q += 8; } if (comp === 0xffffffff) { comp = Number(cd.readBigUInt64LE(q)); q += 8; } if (off === 0xffffffff) off = Number(cd.readBigUInt64LE(q)); } x += 4 + len; }
    out.push({ name, method, comp, size, off }); p += 46 + nl + xl + cl;
  }
  return out;
}
async function zipEntry(url, e) {
  const b = await range(url, e.off, e.off + 30 + 1024 + e.comp);
  const start = 30 + b.readUInt16LE(26) + b.readUInt16LE(28); const data = b.slice(start, start + e.comp);
  return e.method === 8 ? inflateRawSync(data) : data;
}

if (process.argv.includes('--download')) {
  mkdirSync(join(RAW, '990'), { recursive: true });
  const fac = async (path) => JSON.parse((await fetchBuf(`${FAC}${path}`, { 'X-Api-Key': FAC_KEY })).toString('utf8'));
  const general = [];
  for (const [end, n] of FAC_SETS) general.push(...await fac(`/general?${new URLSearchParams({ entity_type: 'eq.non-profit', fy_end_date: `eq.${end}`, select: 'report_id,auditee_name,auditee_state,fy_start_date,fy_end_date,total_amount_expended,entity_type', order: 'report_id', limit: String(n) })}`));
  const ids = `in.(${general.map((g) => g.report_id).join(',')})`;
  const awards = await fac(`/federal_awards?${new URLSearchParams({ report_id: ids, select: 'report_id,award_reference,federal_agency_prefix,federal_award_extension,federal_program_name,amount_expended,is_direct,is_loan,cluster_name', limit: '20000' })}`);
  const passthrough = await fac(`/passthrough?${new URLSearchParams({ report_id: ids, limit: '20000' })}`);
  writeFileSync(join(RAW, 'fac.json'), JSON.stringify({ general, awards, passthrough }, null, 1));
  const entries = (await zipEntries(TEOS_ZIP)).filter((e) => /\.xml$/i.test(e.name) && e.size >= 120000 && e.size <= 1500000).sort((a, b) => (a.name < b.name ? -1 : 1));
  const step = Math.max(1, Math.floor(entries.length / TEOS_SAMPLE)); const picked = entries.filter((_, i) => i % step === 0).slice(0, TEOS_SAMPLE);
  for (const e of picked) writeFileSync(join(RAW, '990', e.name.split('/').pop()), await zipEntry(TEOS_ZIP, e));
  writeFileSync(join(RAW, 'eo_vt.csv'), await fetchBuf(BMF_URL));
  writeFileSync(join(RAW, 'downloaded.json'), JSON.stringify({ date: new Date().toISOString(), fac: { api: FAC, sets: FAC_SETS, audits: general.length, award_lines: awards.length, passthrough_lines: passthrough.length }, teos: { zip: TEOS_ZIP, xml_entries_in_size_range: entries.length, sampled: picked.length }, bmf: BMF_URL }, null, 2));
  console.log(`Downloaded to ${RD}: ${general.length} audits, ${awards.length} award lines, ${picked.length} returns, eo_vt.csv`);
}
if (!existsSync(join(RAW, 'downloaded.json'))) { console.error('Run with --download first.'); process.exit(1); }
const downloaded = JSON.parse(readFileSync(join(RAW, 'downloaded.json'), 'utf8'));

// ------------------------------------------------------------------ helpers ----
async function run(agent, args, files) {
  const { manifest } = await import(pathToFileURL(join(ROOT, 'packages', agent, 'src', 'index.js')).href);
  const root = mkdtempSync(join(tmpdir(), 'rd-'));
  try {
    for (const [f, rows] of Object.entries(files)) writeFileSync(join(root, f), f.endsWith('.json') ? JSON.stringify(rows) : toCsv(rows));
    const prefix = manifest.tools[0].name.replace(/_check$/, '');
    const r = await new AgentRuntime(manifest, { root, audit: false, memory: false }).call(`${prefix}_check`, { ...args, limit: 5000 });
    if (r.status !== 'executed') throw new Error(`${agent}: ${r.status} ${r.error || JSON.stringify(r).slice(0, 300)}`);
    return r.result;
  } finally { rmSync(root, { recursive: true, force: true }); }
}
const codesOf = (items) => { const m = {}; for (const i of items) for (const f of i.findings) m[f.code] = (m[f.code] || 0) + 1; return m; };
const r2 = (x) => Math.round(x * 100) / 100;
const results = { date: DATE, downloaded, sources: [] };

// ------------------------------------------------- 1. FAC single audits ----
{
  const { general, awards, passthrough } = JSON.parse(readFileSync(join(RAW, 'fac.json'), 'utf8'));
  const ptBy = new Map(); for (const p of passthrough) { const k = `${p.report_id}|${p.award_reference}`; if (!ptBy.has(k)) ptBy.set(k, []); ptBy.get(k).push(p); }
  const BLANK_ID = /^\s*(?:|n\/?a|none|unknown|not ?available|not ?applicable|-+)\s*$/i;
  const per = []; let disagree = 0;
  for (const g of general) {
    const lines = awards.filter((a) => a.report_id === g.report_id);
    const start = Number(g.fy_start_date.slice(5, 7)); const fy = Number(g.fy_end_date.slice(0, 4));
    const grants = lines.map((a) => { const pts = ptBy.get(`${a.report_id}|${a.award_reference}`) || []; const direct = String(a.is_direct).toUpperCase() === 'Y';
      return { grant: a.award_reference, grant_name: a.federal_program_name, funder: `Agency ${a.federal_agency_prefix}`, federal: 'yes', aln: `${a.federal_agency_prefix}.${a.federal_award_extension}`, pass_through: direct ? '' : pts.map((p) => p.passthrough_name).filter(Boolean).join('; ') || 'pass-through entity (name not given)', pass_through_id: direct ? '' : pts.map((p) => p.passthrough_id).filter((x) => x && !BLANK_ID.test(x)).join('; ') }; });
    const expenses = lines.map((a, i) => ({ entry_id: `L${i + 1}`, date: g.fy_end_date, grant: a.award_reference, amount: a.amount_expended }));
    const res = await run('fairgive-single-audit', { grants: 'grants.csv', expenses: 'expenses.csv', settings: 'settings.json' }, { 'grants.csv': grants, 'expenses.csv': expenses, 'settings.json': { fiscal_year_start: start, fiscal_year: fy } });
    // Independent re-count from the same rows.
    const total = r2(lines.reduce((t, a) => t + (Number(a.amount_expended) || 0), 0));
    const threshold = g.fy_start_date >= '2024-10-01' ? 1000000 : 750000;
    const ptNoId = grants.filter((x) => x.pass_through && !x.pass_through_id).length; // one finding per award line
    const codes = codesOf(res.items);
    const agree = res.federal_spending === total && res.threshold === threshold && Boolean(codes.threshold_met) === (total >= threshold) && (codes.pass_through_missing_id || 0) === ptNoId;
    if (!agree) disagree++;
    per.push({ report_id: g.report_id, fy_end: g.fy_end_date, fac_total: g.total_amount_expended, award_lines: lines.length, agent_total: res.federal_spending, recount_total: total, threshold: res.threshold, threshold_met: Boolean(codes.threshold_met), approaching: Boolean(codes.approaching_threshold), alns: res.alns, pass_through_without_id: codes.pass_through_missing_id || 0, pass_through_lines: grants.filter((x) => x.pass_through).length, odd_alns: grants.filter((x) => !/^\d{2}\.\d{3}$/.test(x.aln)).map((x) => x.aln), agree });
  }
  const sum = (k) => per.reduce((t, x) => t + (typeof x[k] === 'number' ? x[k] : x[k] ? 1 : 0), 0);
  results.sources.push({ id: 'fac', name: 'Federal Audit Clearinghouse single audits (nonprofits)', url: 'https://www.fac.gov/ (api.fac.gov)', licence: 'U.S. government data, public domain', agent: 'fairgive-single-audit',
    summary: { audits: per.length, award_lines: sum('award_lines'), agent_total_matches_fac_total: per.filter((x) => Math.abs(x.agent_total - x.fac_total) < 0.5).length, threshold_met: sum('threshold_met'), approaching: sum('approaching'), under_threshold: per.filter((x) => !x.threshold_met && !x.approaching).length, pass_through_award_lines: sum('pass_through_lines'), pass_through_award_lines_without_id: sum('pass_through_without_id'), audits_with_odd_alns: per.filter((x) => x.odd_alns.length).length, odd_aln_examples: [...new Set(per.flatMap((x) => x.odd_alns))].slice(0, 12), disagreements_with_recount: disagree }, per });
}

// ------------------------------------------------- 2. IRS Form 990 XML ----
{
  const tag = (x, t) => { const m = new RegExp(`<${t}>([^<]*)</${t}>`).exec(x); return m ? m[1].trim() : ''; };
  // Real returns open some elements with attributes (<IRS990 documentId="IRS990">).
  const blocks = (x, t) => [...x.matchAll(new RegExp(`<${t}(?:\\s[^>]*)?>([\\s\\S]*?)</${t}>`, 'g'))].map((m) => m[1]);
  const unesc = (s) => s.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&apos;/g, "'");
  const LABEL = { FeesForServicesProfFundraising: 'Fees for services: professional fundraising', FeesForServicesLobbyingGrp: 'Fees for services: lobbying' };
  const human = (t) => LABEL[t] || t.replace(/Grp$/, '').replace(/([a-z])([A-Z])/g, '$1 $2');
  const files = readdirSync(join(RAW, '990')).filter((f) => f.endsWith('.xml')).sort();
  const types = {}; const sI = { returns: 0, grants: 0, over_threshold: 0, recount_no_ein: 0, agent_no_ein: 0, agent_no_address: 0, recount_no_address: 0, no_ein_kinds: {} };
  const p7 = { returns: 0, people: 0, agent_missing_hours: 0, agent_missing_comp: 0, recount_missing_hours: 0, recount_missing_comp: 0 };
  const p9 = { returns: 0, lines: 0, matches: 0, differs: [], fundraising_coded_program: 0, fcp_examples: [], unassigned: 0 };
  for (const f of files) {
    const x = readFileSync(join(RAW, '990', f), 'utf8'); const type = tag(x, 'ReturnTypeCd'); types[type] = (types[type] || 0) + 1;
    if (type !== '990') continue;
    const year = Number(tag(x, 'TaxYr')) || null; const main = (blocks(x, 'IRS990')[0] || '');
    // Schedule I grants and Part VII officers through form-990-data.
    const recipients = blocks(x, 'RecipientTable').map((b) => ({ grantee: unesc(tag(b, 'BusinessNameLine1Txt') || tag(b, 'BusinessNameLine1')), ein: tag(b, 'RecipientEIN'), address: [tag(b, 'AddressLine1Txt'), tag(b, 'CityNm'), tag(b, 'StateAbbreviationCd'), tag(b, 'ZIPCd')].filter(Boolean).join(' ') || [tag(b, 'AddressLine1Txt'), tag(b, 'CityNm'), tag(b, 'CountryCd')].filter(Boolean).join(' '), amount: (Number(tag(b, 'CashGrantAmt')) || 0) + (Number(tag(b, 'NonCashAssistanceAmt')) || 0), purpose: unesc(tag(b, 'PurposeOfGrantTxt')), irc: tag(b, 'IRCSectionDesc') }));
    const officers = blocks(main, 'Form990PartVIISectionAGrp').map((b) => ({ name: unesc(tag(b, 'PersonNm') || tag(b, 'BusinessNameLine1Txt')), title: unesc(tag(b, 'TitleTxt')), hours_per_week: tag(b, 'AverageHoursPerWeekRt'), compensation: tag(b, 'ReportableCompFromOrgAmt') }));
    if (recipients.length || officers.length) {
      const res = await run('fairgive-form-990-data', { gifts: 'gifts.csv', officers: 'officers.csv', grants_paid: 'grants_paid.csv', settings: 'settings.json' }, { 'gifts.csv': [{ gift_id: '', donor_id: '', donor: '', address: '', gift_date: '', amount: '', gift_type: '', description: '' }], 'officers.csv': officers.length ? officers : [{ name: '', title: '', hours_per_week: '', compensation: '' }], 'grants_paid.csv': recipients.length ? recipients.map(({ irc, ...r }) => r) : [{ grantee: '', ein: '', address: '', amount: '', purpose: '' }], 'settings.json': { tax_year: year } });
      const c = codesOf(res.items);
      if (recipients.length) { sI.returns++; sI.grants += recipients.length; const over = recipients.filter((r) => r.amount > 5000); sI.over_threshold += over.length;
        const noEin = over.filter((r) => !r.ein); sI.recount_no_ein += noEin.length; sI.agent_no_ein += c.schedulei_missing_ein || 0;
        sI.recount_no_address += over.filter((r) => !r.address).length; sI.agent_no_address += c.schedulei_missing_address || 0;
        for (const r of noEin) { const k = r.irc || (/(city|county|state|town|school district|department|university of|government)/i.test(r.grantee) ? 'government (by name)' : 'not stated'); sI.no_ein_kinds[k] = (sI.no_ein_kinds[k] || 0) + 1; } }
      if (officers.length) { p7.returns++; p7.people += officers.length; p7.agent_missing_hours += c.officer_missing_hours || 0; p7.agent_missing_comp += c.officer_missing_comp || 0; p7.recount_missing_hours += officers.filter((o) => o.hours_per_week === '').length; p7.recount_missing_comp += officers.filter((o) => o.compensation === '').length; }
    }
    // Part IX through functional-expenses: every flat line group (a description, a total and the
    // three columns; "other expenses" lines start with their description), one ledger row per column.
    const PART_IX = '(?:Desc|TotalAmt|ProgramServicesAmt|ManagementAndGeneralAmt|FundraisingAmt)';
    const groups = [...main.matchAll(new RegExp(`<(\\w+)>((?:\\s*<${PART_IX}>[^<]*</${PART_IX}>)+)\\s*</\\1>`, 'g'))].filter((m) => !/^Total/.test(m[1]) && /<TotalAmt>/.test(m[2]) && /ProgramServicesAmt|ManagementAndGeneralAmt|FundraisingAmt/.test(m[2]));
    const totalG = (/<TotalFunctionalExpensesGrp>([\s\S]*?)<\/TotalFunctionalExpensesGrp>/.exec(main) || [])[1];
    if (groups.length && totalG) {
      p9.returns++; const gl = []; let n = 0;
      for (const [, name, body] of groups) { n++; const label = `${human(name)}${tag(body, 'Desc') ? `: ${unesc(tag(body, 'Desc'))}` : ''}`; p9.lines++;
        for (const [fn, t] of [['Program', 'ProgramServicesAmt'], ['Management', 'ManagementAndGeneralAmt'], ['Fundraising', 'FundraisingAmt']]) { const a = Number(tag(body, t)) || 0; if (a) gl.push({ entry_id: `IX-${n}`, date: `${year}-12-31`, account: String(900 + n), account_name: label, program: '', function: fn, debit: a, credit: '', memo: label }); } }
      const res = await run('fairgive-functional-expenses', { gl: 'gl.csv', settings: 'settings.json' }, { 'gl.csv': gl.length ? gl : [{ entry_id: '', account: '', debit: '' }], 'settings.json': { expense_from: '9' } });
      const want = { program: Number(tag(totalG, 'ProgramServicesAmt')) || 0, management: Number(tag(totalG, 'ManagementAndGeneralAmt')) || 0, fundraising: Number(tag(totalG, 'FundraisingAmt')) || 0 };
      const ok = ['program', 'management', 'fundraising'].every((k) => Math.abs(res[k] - want[k]) < 1);
      if (ok) p9.matches++; else p9.differs.push({ file: f, agent: { program: res.program, management: res.management, fundraising: res.fundraising }, return: want });
      const fcp = res.items.flatMap((i) => i.findings.filter((y) => y.code === 'fundraising_coded_program').map(() => `${i.account_name} (${i.program} program)`));
      p9.fundraising_coded_program += fcp.length; p9.fcp_examples.push(...fcp.slice(0, 2)); p9.unassigned += res.unassigned ? 1 : 0;
    }
  }
  p9.fcp_examples = p9.fcp_examples.slice(0, 12);
  results.sources.push({ id: 'irs990', name: 'IRS Form 990 e-file data (TEOS XML), January 2025 release, sample of returns', url: TEOS_ZIP, licence: 'IRS public information (U.S. government work)', agent: 'fairgive-form-990-data, fairgive-functional-expenses', summary: { xml_files: files.length, return_types: types, schedule_i: sI, part_vii: p7, part_ix: { ...p9, differs: p9.differs.slice(0, 10), differs_count: p9.differs.length } } });
}

// ------------------------------------------------- 3. IRS EO BMF, Vermont ----
{
  const rows = parseCsv(readFileSync(join(RAW, 'eo_vt.csv'), 'utf8'));
  const name = (r) => [r.NAME, r.SORT_NAME].filter((x) => x && x.trim()).join(' ');
  const base = rows.map((r) => ({ donor_id: r.EIN, donor: name(r), email: '', phone: '', address: r.STREET, postal: r.ZIP, created: r.RULING ? `${r.RULING.slice(0, 4)}-${r.RULING.slice(4, 6)}-01` : '' }));
  const S = { max_ids_shown: 100 };
  const asIs = await run('fairgive-duplicate-donors', { constituents: 'constituents.csv', settings: 'settings.json' }, { 'constituents.csv': base, 'settings.json': S });
  const kinds = (items) => { const k = { groups: items.filter((i) => i.findings.length).length, by_code: codesOf(items), name_groups: 0, address_only_groups: 0 }; for (const i of items) { if (!i.findings.length) continue; const c = i.findings.map((f) => f.code); if (c.some((x) => /name/.test(x))) k.name_groups++; else if (c.every((x) => x === 'same_address')) k.address_only_groups++; } return k; };
  const asIsK = kinds(asIs.items);
  // The register is public, so the review shows the organizations' real names (the agent masks them).
  const byId = new Map(base.map((r) => [r.donor_id, r]));
  const addrKind = (a) => (/\bP\.?\s*O\.?\s*BOX\b/i.test(a) ? ', PO box' : '');
  const ids = (i) => String(i.records || '').split(/[,\s]+/).filter(Boolean);
  const examples = asIs.items.filter((i) => i.findings.some((f) => /name/.test(f.code))).map((i) => `${ids(i).map((id) => { const r = byId.get(id); return r ? `${r.donor} (${String(r.postal).slice(0, 5)}${addrKind(r.address)})` : id; /* street left out: it sometimes holds a contact person's name */ }).join(' | ')} [${[...new Set(i.findings.map((f) => f.code))].join(', ')}]`);
  // Planted duplicates: 150 records chosen by a fixed rule, each copied once and retyped the way
  // people do (abbreviated street words, mixed case, "INC" dropped, ZIP+4 cut to five digits).
  const ABBR = [[/\bSTREET\b/, 'ST'], [/\bAVENUE\b/, 'AVE'], [/\bROAD\b/, 'RD'], [/\bDRIVE\b/, 'DR'], [/\bPO BOX\b/, 'P.O. Box'], [/\bLANE\b/, 'LN']];
  const title = (s) => s.toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());
  const pick = base.filter((r, i) => r.address && r.donor && i % Math.floor(base.length / 150) === 0).slice(0, 150);
  const planted = pick.map((r, i) => { let a = r.address; for (const [re, s] of ABBR) a = a.replace(re, s); const nm = i % 3 === 0 ? title(r.donor) : i % 3 === 1 ? r.donor.replace(/,?\s+INC\.?$|,?\s+INCORPORATED$/i, '') : `${r.donor}.`; return { ...r, donor_id: `DUP-${r.donor_id}`, donor: nm, address: i % 2 ? title(a) : a, postal: String(r.postal).slice(0, 5) }; });
  const withDup = await run('fairgive-duplicate-donors', { constituents: 'constituents.csv', settings: 'settings.json' }, { 'constituents.csv': [...base, ...planted], 'settings.json': S });
  const groupOf = new Map(); for (const i of withDup.items) if (i.findings.length) for (const id of String(i.records || '').split(/[,\s]+/).filter(Boolean)) groupOf.set(id, i);
  let found = 0, foundAsName = 0; const missed = [], addressOnly = [];
  for (const p of planted) { const g = groupOf.get(p.donor_id); const orig = p.donor_id.slice(4); if (g && String(g.records).split(/[,\s]+/).includes(orig)) { found++; if (g.findings.some((f) => /name/.test(f.code))) foundAsName++; else addressOnly.push(`${p.donor} / ${byId.get(orig).donor}`); } else missed.push(`${p.donor} (original: ${byId.get(orig).donor})`); }
  results.sources.push({ id: 'bmf', name: 'IRS Exempt Organizations Business Master File extract, Vermont', url: BMF_URL, licence: 'IRS public information (U.S. government work)', agent: 'fairgive-duplicate-donors',
    summary: { organizations: base.length, as_published: asIsK, as_published_name_examples: examples, planted_duplicates: planted.length, planted_found: found, planted_found_with_a_name_finding: foundAsName, planted_missed_examples: missed.slice(0, 10), planted_found_by_address_only: addressOnly, with_planted: kinds(withDup.items) } });
}

// ------------------------------------------------------------------ write ----
mkdirSync(join(ROOT, 'docs'), { recursive: true });
writeFileSync(join(ROOT, 'docs', `realdata-${DATE}.json`), JSON.stringify(results, null, 2) + '\n');
for (const s of results.sources) console.log(`\n## ${s.name}\n${JSON.stringify(s.summary, null, 1).slice(0, 3000)}`);
// A short table of what ran; REVIEW-ver1.md explains what was found and fixed.
const [fac, irs, bmf] = results.sources.map((s) => s.summary);
const md = [`# Real public data through the agents (${DATE})`, '', 'Made by `node scripts/realdata.mjs` (downloads with `--download` into the git-ignored `_realdata/`). Each public file is converted to the agent\'s columns, run through the agent, and the answer is re-counted from the same rows by separate code in the script. Details per audit, return and group: `realdata-' + DATE + '.json`.', '',
  '| Source | Agent | What ran | Agent vs re-count |', '|---|---|---|---|',
  `| Federal Audit Clearinghouse, nonprofit single audits (FY ending 2025-12-31 and 2024-06-30) | fairgive-single-audit | ${fac.audits} audits, ${fac.award_lines} award lines | federal total equals the FAC total in ${fac.agent_total_matches_fac_total} of ${fac.audits}; ${fac.disagreements_with_recount} disagreements; threshold met in ${fac.threshold_met}; ${fac.pass_through_award_lines_without_id} of ${fac.pass_through_award_lines} pass-through award lines have no pass-through id |`,
  `| IRS Form 990 e-file XML, Schedule I and Part VII | fairgive-form-990-data | ${irs.schedule_i.grants} Schedule I grants in ${irs.schedule_i.returns} returns; ${irs.part_vii.people} people in ${irs.part_vii.returns} returns | grants with no EIN: agent ${irs.schedule_i.agent_no_ein}, re-count ${irs.schedule_i.recount_no_ein}; people with no hours: agent ${irs.part_vii.agent_missing_hours}, re-count ${irs.part_vii.recount_missing_hours} |`,
  `| IRS Form 990 e-file XML, Part IX | fairgive-functional-expenses | ${irs.part_ix.lines} expense lines in ${irs.part_ix.returns} returns | program, management and fundraising totals equal the return's own totals in ${irs.part_ix.matches} of ${irs.part_ix.returns} |`,
  `| IRS Exempt Organizations Business Master File, Vermont | fairgive-duplicate-donors | ${bmf.organizations} organizations (every one a different EIN), then ${bmf.planted_duplicates} planted retyped copies | as published: ${bmf.as_published.name_groups} groups by name (${bmf.as_published.by_code.same_name || 0} same name, ${bmf.as_published.by_code.similar_name || 0} similar name, ${bmf.as_published.by_code.same_name_other_postal || 0} same name in another postal code) and ${bmf.as_published.address_only_groups} by address only; planted copies found ${bmf.planted_found} of ${bmf.planted_duplicates} (${bmf.planted_found_with_a_name_finding} through the name) |`, ''];
writeFileSync(join(ROOT, 'docs', `realdata-${DATE}.md`), md.join('\n'));
console.log(`\nWrote docs/realdata-${DATE}.json and .md`);
