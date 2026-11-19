// Expense report lines against the policy in the settings: receipts over the limit,
// meals over the per diem (per employee per day), mileage over the rate, words the
// settings list as unallowable on grant-coded lines, the same purchase claimed twice and
// reports sent long after the expense.
import { str, num, round2, isoDate, daysBetween, yes, finding, statusOf, cmp, nameKey, personKey } from 'fairgive-core';

export const DEFAULTS = Object.freeze({ receipt_over: 75, per_diem: {}, mileage_rate: null, unallowable_words: ['alcohol', 'wine', 'beer', 'liquor', 'bar tab'], grant_codes: [], late_days: 60, tolerance: 0.01 });
const LEVELS = { receipt_missing: 'flag', mileage_over_rate: 'flag', unallowable_on_grant: 'flag', duplicate_claim: 'flag', meals_over_per_diem: 'review', late_submission: 'watch' };

export function expenseReports({ lines = [] }, s = DEFAULTS) {
  const tol = Number(s.tolerance ?? 0.01);
  const words = (s.unallowable_words || []).map((w) => str(w).toLowerCase()).filter(Boolean);
  const isGrant = (g) => str(g) && ((s.grant_codes || []).length ? (s.grant_codes || []).some((p) => str(g).toUpperCase().startsWith(str(p).toUpperCase())) : true);
  const perDiem = new Map(Object.entries(s.per_diem || {}).map(([k, v]) => [nameKey(k), Number(v)]));
  const R = new Map(); const dayCat = new Map(); const claims = new Map();
  const sorted = lines.filter((l) => str(l.report_id)).map((l, i) => ({ l, i })).sort((a, b) => cmp(isoDate(a.l.submitted_date) || '', isoDate(b.l.submitted_date) || '') || cmp(str(a.l.report_id), str(b.l.report_id)) || cmp(isoDate(a.l.date) || '', isoDate(b.l.date) || '') || (num(a.l.amount) || 0) - (num(b.l.amount) || 0) || cmp(str(a.l.merchant), str(b.l.merchant)));
  for (const { l } of sorted) {
    const id = str(l.report_id); const r = R.get(id) || { report_id: id, employee: str(l.employee), lines: 0, amount: 0, submitted: isoDate(l.submitted_date), first: null, f: [] }; R.set(id, r);
    const a = num(l.amount) || 0; const d = isoDate(l.date); const cat = str(l.category); r.lines++; r.amount = round2(r.amount + a); if (d && (!r.first || d < r.first)) r.first = d;
    if (a > Number(s.receipt_over ?? 75) && yes(l.receipt) !== true && !/mileage/i.test(cat)) r.f.push(finding('receipt_missing', `${id}: ${cat || 'expense'} of ${a} on ${d || 'no date'} at ${str(l.merchant) || 'no merchant'} has no receipt (limit ${s.receipt_over}).`, a));
    if (/mileage/i.test(cat) && s.mileage_rate !== null && s.mileage_rate !== undefined && num(l.miles) !== null) { const allowed = round2(num(l.miles) * Number(s.mileage_rate)); if (a - allowed > tol) r.f.push(finding('mileage_over_rate', `${id}: ${a} claimed for ${num(l.miles)} miles; at ${s.mileage_rate} a mile that is ${allowed}.`, a - allowed)); }
    if (isGrant(l.grant)) { const w = words.find((x) => new RegExp(`\\b${x.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i').test(`${str(l.memo)} ${str(l.merchant)} ${cat}`)); if (w) r.f.push(finding('unallowable_on_grant', `${id}: ${a} on ${d} charged to grant ${str(l.grant)} mentions "${w}", which the settings list as unallowable.`, a)); }
    const pd = perDiem.get(nameKey(cat)); if (pd !== undefined && d) { const k = `${personKey(l.employee)}|${d}|${nameKey(cat)}`; const e = dayCat.get(k) || { total: 0, report: id }; e.total = round2(e.total + a); dayCat.set(k, e); }
    const ck = `${personKey(l.employee)}|${d}|${a}|${nameKey(l.merchant)}|${nameKey(cat)}`;
    if (claims.has(ck)) r.f.push(finding('duplicate_claim', `${id}: ${cat} of ${a} at ${str(l.merchant) || 'no merchant'} on ${d} was already claimed on ${claims.get(ck)}.`, a)); else claims.set(ck, id);
  }
  for (const [k, e] of [...dayCat.entries()].sort()) { const [, d, cat] = k.split('|'); const pd = perDiem.get(cat); if (e.total - pd > tol) R.get(e.report).f.push(finding('meals_over_per_diem', `${e.report}: ${e.total} of ${cat} on ${d}, over the ${pd} per diem by ${round2(e.total - pd)}.`, e.total - pd)); }
  const items = [];
  for (const r of [...R.values()].sort((a, b) => cmp(a.report_id, b.report_id))) {
    if (r.first && r.submitted) { const lag = daysBetween(r.first, r.submitted); if (lag > Number(s.late_days ?? 60)) r.f.push(finding('late_submission', `${r.report_id} was sent on ${r.submitted}, ${lag} days after its first expense (policy ${s.late_days}).`)); }
    items.push({ report_id: r.report_id, employee: r.employee, lines: r.lines, amount: r.amount, submitted: r.submitted, status: statusOf(r.f, LEVELS), findings: r.f });
  }
  return { items, totals: { reports: items.length, amount: round2(items.reduce((t, i) => t + i.amount, 0)), flagged_amount: round2(items.reduce((t, i) => t + i.findings.filter((f) => LEVELS[f.code] === 'flag').reduce((u, f) => u + (f.amount || 0), 0), 0)), duplicates: items.reduce((t, i) => t + i.findings.filter((f) => f.code === 'duplicate_claim').length, 0) }, extra: {} };
}
