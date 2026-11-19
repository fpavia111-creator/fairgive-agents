// LYBUNT and SYBUNT by fiscal year. A fiscal year is named by the calendar year it ends in.
// lybunt: gave in the last fiscal year, nothing this year so far.
// sybunt: gave in an earlier year inside the look-back, nothing last year or this year.
// downgraded: this year so far is below last year by more than the setting (a partial
// year, so it is something to watch, not a loss). Retention = last year's donors who gave
// again this year.
import { str, num, round2, isoDate, fiscalYear, finding, statusOf, cmp, pct } from 'fairgive-core';

export const DEFAULTS = Object.freeze({ fiscal_year_start: 1, as_of: null, lookback_years: 4, downgrade_pct: 25 });
const LEVELS = { lybunt: 'flag', sybunt: 'review', downgraded: 'watch' };

export function lapsed({ gifts = [] }, s = DEFAULTS) {
  const start = Number(s.fiscal_year_start || 1);
  const asOf = isoDate(s.as_of) || gifts.map((g) => isoDate(g.gift_date)).filter(Boolean).sort().pop() || null;
  const cur = asOf ? fiscalYear(asOf, start) : null; const last = cur === null ? null : cur - 1; const earliest = cur === null ? null : cur - Number(s.lookback_years ?? 4);
  const donors = new Map();
  for (const g of gifts) {
    const id = str(g.donor_id) || str(g.donor); const d = isoDate(g.gift_date); if (!id || !d || (asOf && d > asOf)) continue;
    const fy = fiscalYear(d, start); const e = donors.get(id) || { donor_id: id, donor: str(g.donor), by: new Map(), last: null };
    e.by.set(fy, round2((e.by.get(fy) || 0) + (num(g.amount) || 0))); if (!e.last || d > e.last) e.last = d; if (!e.donor) e.donor = str(g.donor);
    donors.set(id, e);
  }
  const items = []; let lastYearDonors = 0, retained = 0, newDonors = 0;
  for (const e of [...donors.values()].sort((a, b) => cmp(a.donor_id, b.donor_id))) {
    const thisYear = e.by.get(cur) || 0; const lastYear = e.by.get(last) || 0;
    const earlier = [...e.by.keys()].filter((y) => y < last && y >= earliest);
    if (!thisYear && !lastYear && !earlier.length) continue;
    const f = [];
    if (lastYear) { lastYearDonors++; if (thisYear) retained++; }
    if (thisYear && !lastYear && ![...e.by.keys()].some((y) => y < cur)) newDonors++;
    if (lastYear && !thisYear) f.push(finding('lybunt', `Gave ${lastYear} in FY${last} and nothing yet in FY${cur} (last gift ${e.last}).`, lastYear));
    else if (!lastYear && !thisYear) { const y = Math.max(...earlier); f.push(finding('sybunt', `Last gave in FY${y} (${e.by.get(y)}; last gift ${e.last}), nothing in FY${last} or FY${cur}.`, e.by.get(y))); }
    else if (lastYear && thisYear < lastYear * (1 - Number(s.downgrade_pct ?? 25) / 100)) f.push(finding('downgraded', `FY${cur} so far ${thisYear}, against ${lastYear} in FY${last}.`, thisYear - lastYear));
    items.push({ donor_id: e.donor_id, donor: e.donor, this_year: thisYear, last_year: lastYear, last_gift: e.last, segment: f.length ? f[0].code : thisYear && !lastYear ? (newDonors && ![...e.by.keys()].some((y) => y < cur) ? 'new' : 'returning') : 'retained', status: statusOf(f, LEVELS), findings: f });
  }
  const sumOf = (code) => round2(items.reduce((t, i) => t + i.findings.filter((x) => x.code === code).reduce((u, x) => u + (x.amount || 0), 0), 0));
  return { items, totals: { donors: items.length, last_year_donors: lastYearDonors, retained, retention_pct: pct(retained, lastYearDonors) ?? 0, new_donors: newDonors, lybunt: items.filter((i) => i.segment === 'lybunt').length, lybunt_amount: sumOf('lybunt'), sybunt: items.filter((i) => i.segment === 'sybunt').length, sybunt_amount: sumOf('sybunt') }, extra: { fiscal_year: cur, as_of: asOf } };
}
