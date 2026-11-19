// Federal award spending by assistance listing number (ALN) for one fiscal year, against
// the single audit threshold. The default threshold follows the fiscal year's start date
// (1,000,000 for years beginning on or after 2024-10-01, 750,000 before); the settings can
// set it. This is data for the auditor and the schedule of expenditures of federal awards,
// not a determination: a person and the auditor decide.
import { str, num, round2, isoDate, fiscalYear, fiscalRange, yes, finding, statusOf, cmp, nameKey, pct } from 'fairgive-core';

export const DEFAULTS = Object.freeze({ fiscal_year_start: 1, fiscal_year: null, threshold: null, approaching_pct: 80 });
const LEVELS = { threshold_met: 'flag', missing_aln: 'review', pass_through_missing_id: 'review', unknown_grant: 'review', approaching_threshold: 'watch' };

export function singleAudit({ grants = [], expenses = [] }, s = DEFAULTS) {
  const start = Number(s.fiscal_year_start || 1);
  const fy = Number(s.fiscal_year) || Math.max(...expenses.map((x) => fiscalYear(x.date, start)).filter(Boolean), 0) || null;
  const range = fy ? fiscalRange(fy, start) : null;
  const threshold = num(s.threshold) ?? (range && range.start >= '2024-10-01' ? 1000000 : 750000);
  const G = new Map(); for (const g of grants) if (str(g.grant)) G.set(nameKey(g.grant), { grant: str(g.grant), funder: str(g.funder), federal: yes(g.federal) === true || !!str(g.aln), aln: str(g.aln), pass: str(g.pass_through), passId: str(g.pass_through_id), spent: 0 });
  const unknown = new Map();
  for (const x of expenses) { const d = isoDate(x.date); if (!range || !d || d < range.start || d > range.end) continue; const g = G.get(nameKey(x.grant)); const a = num(x.amount) || 0; if (!g) { if (str(x.grant)) unknown.set(nameKey(x.grant), { grant: str(x.grant), amount: round2((unknown.get(nameKey(x.grant))?.amount || 0) + a) }); continue; } g.spent = round2(g.spent + a); }
  const byAln = new Map(); const items = [];
  for (const g of [...G.values()].filter((x) => x.federal && x.spent).sort((a, b) => cmp(a.grant, b.grant))) {
    const k = g.aln || '(no ALN)'; if (!byAln.has(k)) byAln.set(k, { aln: k, grants: [], total: 0, f: [] }); const e = byAln.get(k); e.grants.push(g.grant); e.total = round2(e.total + g.spent);
    if (!g.aln) e.f.push(finding('missing_aln', `${g.grant} (${g.funder || 'no funder'}) is federal but has no assistance listing number; ${g.spent} cannot be placed on the schedule.`, g.spent));
    if (g.pass && !g.passId) e.f.push(finding('pass_through_missing_id', `${g.grant} comes through ${g.pass} and has no pass-through award id. The schedule shows the id the pass-through entity assigned: enter it, or confirm that none was assigned.`, g.spent));
  }
  let total = 0;
  for (const e of [...byAln.values()].sort((a, b) => cmp(a.aln, b.aln))) { total += e.total; items.push({ item: `ALN ${e.aln}`, aln: e.aln, grants: e.grants.join(' '), federal_spending: e.total, share_pct: 0, status: statusOf(e.f, LEVELS), findings: e.f }); }
  total = round2(total); for (const i of items) i.share_pct = pct(i.federal_spending, total) ?? 0;
  for (const u of [...unknown.values()].sort((a, b) => cmp(a.grant, b.grant))) { const f = [finding('unknown_grant', `${u.amount} is coded to ${u.grant}, which is not in the grant list, so it may or may not be federal.`, u.amount)]; items.push({ item: `Grant ${u.grant}`, aln: '', grants: u.grant, federal_spending: 0, share_pct: 0, status: statusOf(f, LEVELS), findings: f }); }
  const f = [];
  if (total >= threshold) f.push(finding('threshold_met', `Federal award spending in FY${fy} is ${total}, at or over the ${threshold} threshold in the settings. Talk to your auditor about a single audit.`, total));
  else if (total >= threshold * Number(s.approaching_pct ?? 80) / 100) f.push(finding('approaching_threshold', `Federal award spending in FY${fy} is ${total}, ${pct(total, threshold)}% of the ${threshold} threshold.`, total));
  items.push({ item: 'Total federal spending', aln: '', grants: '', federal_spending: total, share_pct: total ? 100 : 0, status: statusOf(f, LEVELS), findings: f });
  return { items, totals: { federal_grants: [...G.values()].filter((x) => x.federal).length, federal_spending: total, threshold, threshold_pct: pct(total, threshold) ?? 0, alns: byAln.size }, extra: { fiscal_year: fy, period: range } };
}
