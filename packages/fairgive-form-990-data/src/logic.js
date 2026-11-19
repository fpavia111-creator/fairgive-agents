// Data behind common Form 990 schedules, checked for completeness. Nothing is filed and
// no schedule is decided here: the thresholds are settings and your preparer decides.
//   Schedule B: contributors at or over the threshold in the tax year need a name and
//               address, and noncash gifts a description.
//   Schedule M: noncash gifts over the threshold in total.
//   Part VII:   officers need average hours and compensation (zero is an answer).
//   Schedule I: grants over the threshold to an organization need its EIN and address.
import { str, num, round2, isoDate, fiscalYear, finding, statusOf, cmp, nameKey } from 'fairgive-core';

export const DEFAULTS = Object.freeze({ tax_year: null, fiscal_year_start: 1, schedule_b_threshold: 5000, schedule_m_threshold: 25000, schedule_i_threshold: 5000 });
const LEVELS = { scheduleb_missing_address: 'flag', schedulei_missing_ein: 'flag', scheduleb_noncash_no_description: 'review', officer_missing_hours: 'review', officer_missing_comp: 'review', schedulei_missing_address: 'review', schedule_m_likely: 'watch' };
const NONCASH = /stock|securit|noncash|non-cash|in-kind|in kind|property|vehicle|art|goods/i;

export function form990({ gifts = [], officers = [], grants_paid: grantsPaid = [] }, s = DEFAULTS) {
  const start = Number(s.fiscal_year_start || 1);
  const year = Number(s.tax_year) || Math.max(...gifts.map((g) => fiscalYear(g.gift_date, start)).filter(Boolean), 0) || null;
  const by = new Map(); let noncash = 0;
  for (const g of gifts) {
    if (!str(g.gift_id) || fiscalYear(g.gift_date, start) !== year) continue;
    const k = nameKey(g.donor_id) || nameKey(g.donor); const e = by.get(k) || { donor_id: str(g.donor_id), donor: str(g.donor), address: '', total: 0, noncash: [] };
    const a = num(g.amount) || 0; e.total = round2(e.total + a); if (str(g.address)) e.address = str(g.address);
    if (NONCASH.test(str(g.gift_type))) { e.noncash.push({ id: str(g.gift_id), amount: a, desc: str(g.description) }); noncash += a; }
    by.set(k, e);
  }
  const items = [];
  for (const e of [...by.values()].filter((x) => x.total >= Number(s.schedule_b_threshold)).sort((a, b) => cmp(a.donor_id, b.donor_id))) {
    const f = [];
    if (!e.address) f.push(finding('scheduleb_missing_address', `Contributor ${e.donor_id} gave ${e.total} in ${year}, at or over ${s.schedule_b_threshold}, and has no address on file.`, e.total));
    for (const n of e.noncash.filter((x) => !x.desc)) f.push(finding('scheduleb_noncash_no_description', `Contributor ${e.donor_id}: noncash gift ${n.id} (${n.amount}) has no description.`, n.amount));
    items.push({ item: `Schedule B ${e.donor_id}`, schedule: 'B', name: e.donor, detail: e.address ? 'address on file' : 'no address', amount: e.total, status: statusOf(f, LEVELS), findings: f });
  }
  if (noncash > 0) { const f = noncash > Number(s.schedule_m_threshold) ? [finding('schedule_m_likely', `Noncash gifts in ${year} total ${round2(noncash)}, over ${s.schedule_m_threshold}; your preparer will look at Schedule M.`, noncash)] : []; items.push({ item: 'Schedule M noncash total', schedule: 'M', name: '', detail: 'noncash gifts', amount: round2(noncash), status: statusOf(f, LEVELS), findings: f }); }
  for (const o of officers) {
    if (!str(o.name)) continue; const f = [];
    if (num(o.hours_per_week) === null) f.push(finding('officer_missing_hours', `${str(o.title) || 'An officer'} has no average hours per week.`));
    if (num(o.compensation) === null) f.push(finding('officer_missing_comp', `${str(o.title) || 'An officer'} has no compensation entered (enter 0 when unpaid).`));
    items.push({ item: `Part VII ${str(o.title) || str(o.name)}`, schedule: 'Part VII', name: str(o.name), detail: str(o.title), amount: num(o.compensation), status: statusOf(f, LEVELS), findings: f });
  }
  for (const g of grantsPaid.filter((x) => (num(x.amount) || 0) > Number(s.schedule_i_threshold)).sort((a, b) => cmp(str(a.grantee), str(b.grantee)))) {
    const f = [];
    if (!str(g.ein)) f.push(finding('schedulei_missing_ein', `Grant of ${num(g.amount)} to ${str(g.grantee)} has no EIN.`, num(g.amount)));
    if (!str(g.address)) f.push(finding('schedulei_missing_address', `Grant of ${num(g.amount)} to ${str(g.grantee)} has no address.`, num(g.amount)));
    items.push({ item: `Schedule I ${str(g.grantee)}`, schedule: 'I', name: str(g.grantee), detail: str(g.purpose), amount: num(g.amount), status: statusOf(f, LEVELS), findings: f });
  }
  return { items, totals: { tax_year: year, schedule_b_contributors: items.filter((i) => i.schedule === 'B').length, noncash_total: round2(noncash), officers: items.filter((i) => i.schedule === 'Part VII').length, schedule_i_grants: items.filter((i) => i.schedule === 'I').length, gaps: items.filter((i) => i.status === 'flag' || i.status === 'review').length }, extra: {} };
}
