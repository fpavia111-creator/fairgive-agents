// Releases from restriction. For each restricted fund in the fund list:
//   inflow   = credits to its net asset and revenue accounts (not expenses, not releases)
//   spending = debits to its expense accounts
//   released = debits to the release accounts
// A purpose restriction is met by spending, so min(spending, inflow) should be released.
// A time restriction is met on its release date, so everything left should be released
// once that date is on or before as_of, and nothing before it.
import { str, num, round2, isoDate, glAmount, restrictionOf, finding, statusOf, cmp, nameKey } from 'fairgive-core';

export const DEFAULTS = Object.freeze({ release_accounts: ['39'], expense_from: '5', as_of: null, tolerance: 0.01 });
const LEVELS = { release_due: 'flag', release_over_spending: 'flag', release_over_balance: 'flag', time_restriction_ended: 'flag', release_before_time: 'flag', time_no_release_date: 'review' };

export function releases({ funds = [], gl = [] }, s = DEFAULTS) {
  const tol = Number(s.tolerance ?? 0.01);
  const isRelease = (a) => (s.release_accounts || []).some((p) => str(p) && str(a).startsWith(str(p)));
  const isExpense = (a) => str(a) >= str(s.expense_from || '5');
  const asOf = isoDate(s.as_of) || gl.map((r) => isoDate(r.date)).filter(Boolean).sort().pop() || null;
  const acc = new Map();
  for (const r of gl) {
    const k = nameKey(r.fund); if (!k) continue;
    const e = acc.get(k) || { inflow: 0, spending: 0, released: 0, releaseDates: [] };
    const a = glAmount(r, num);
    if (isRelease(r.account)) { e.released = round2(e.released + a); if (a > 0 && isoDate(r.date)) e.releaseDates.push([isoDate(r.date), a]); }
    else if (isExpense(r.account)) e.spending = round2(e.spending + a);
    else if (str(r.account) >= '3') e.inflow = round2(e.inflow - a);
    acc.set(k, e);
  }
  const items = []; let due = 0; let over = 0;
  for (const f of [...funds].filter((x) => str(x.fund)).sort((a, b) => cmp(nameKey(a.fund), nameKey(b.fund)))) {
    const r = restrictionOf(f.restriction); if (r.cls !== 'with' || r.sub === 'perpetual') continue;
    const e = acc.get(nameKey(f.fund)) || { inflow: 0, spending: 0, released: 0, releaseDates: [] };
    const out = []; let toRelease = 0;
    if (r.sub === 'time') {
      const when = isoDate(f.release_date);
      if (!when) out.push(finding('time_no_release_date', `Fund ${str(f.fund)} is time restricted but has no release date in the fund list.`));
      else if (asOf && when <= asOf) { toRelease = round2(e.inflow - e.released); if (toRelease > tol) out.push(finding('time_restriction_ended', `Fund ${str(f.fund)}: the time restriction ended on ${when} and ${toRelease} is still restricted (inflow ${e.inflow}, released ${e.released}).`, toRelease)); }
      else { const early = round2(e.releaseDates.filter(([d]) => d < when).reduce((t, [, a]) => t + a, 0)); if (early > tol) out.push(finding('release_before_time', `Fund ${str(f.fund)}: ${early} was released before the restriction ends on ${when}.`, early)); }
    } else {
      const met = Math.min(e.spending, e.inflow); toRelease = round2(met - e.released);
      if (toRelease > tol) out.push(finding('release_due', `Fund ${str(f.fund)}: ${e.spending} was spent on its purpose and ${e.released} released; ${toRelease} more should be released (limited to the ${e.inflow} the fund received).`, toRelease));
      if (e.released - e.spending > tol) out.push(finding('release_over_spending', `Fund ${str(f.fund)}: ${e.released} released but only ${e.spending} spent on its purpose (${round2(e.released - e.spending)} too much).`, e.released - e.spending));
      if (e.released - e.inflow > tol) out.push(finding('release_over_balance', `Fund ${str(f.fund)}: ${e.released} released but the fund only received ${e.inflow} (${round2(e.released - e.inflow)} more than it had).`, e.released - e.inflow));
    }
    if (toRelease > tol) due = round2(due + toRelease);
    for (const x of out) if (x.code !== 'release_due' && x.code !== 'time_restriction_ended' && x.amount) over = round2(over + x.amount);
    items.push({ fund: str(f.fund), fund_name: str(f.fund_name), restriction: r.sub, release_date: isoDate(f.release_date), inflow: e.inflow, spending: e.spending, released: e.released, to_release: toRelease > tol ? toRelease : 0, status: statusOf(out, LEVELS), findings: out });
  }
  return { items, totals: { restricted_funds: items.length, to_release: due, released_in_error: over }, extra: { as_of: asOf } };
}
