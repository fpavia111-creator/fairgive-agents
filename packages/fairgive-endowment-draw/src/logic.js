// Endowment draw from the spending policy: the average of the last `quarters` quarter-end
// market values up to the value date, times the spending rate. Funds below their corpus
// (underwater) are listed and, when the policy says no_spend, get no draw. A draw already
// booked is compared with the policy figure. A rate over the prudence figure in the
// settings is flagged for the board.
import { str, num, round2, isoDate, finding, statusOf, cmp, nameKey } from 'fairgive-core';

export const DEFAULTS = Object.freeze({ spending_rate: 4, quarters: 12, value_date: null, fiscal_year: null, prudence_rate: 7, underwater_policy: 'spend', organization: '', tolerance: 0.01 });
const LEVELS = { draw_differs: 'flag', rate_over_prudence: 'flag', underwater_no_draw: 'flag', insufficient_history: 'review', no_values: 'review', underwater: 'watch' };

export function endowmentDraw({ funds = [], values = [], draws = [] }, s = DEFAULTS) {
  const tol = Number(s.tolerance ?? 0.01); const rate = Number(s.spending_rate ?? 4); const q = Number(s.quarters ?? 12);
  const vd = isoDate(s.value_date) || values.map((v) => isoDate(v.date)).filter(Boolean).sort().pop() || null;
  const V = new Map(); for (const v of values) { const d = isoDate(v.date); const k = nameKey(v.fund); if (!d || !k || (vd && d > vd)) continue; if (!V.has(k)) V.set(k, new Map()); V.get(k).set(d, num(v.market_value)); }
  const D = new Map(); for (const d of draws) { if (s.fiscal_year && Number(d.fiscal_year) !== Number(s.fiscal_year)) continue; const k = nameKey(d.fund); if (k) D.set(k, round2((D.get(k) || 0) + (num(d.amount) || 0))); }
  const items = []; const T = { draw: 0, latest: 0, underwater: 0 };
  for (const f of [...funds].filter((x) => str(x.fund)).sort((a, b) => cmp(str(a.fund), str(b.fund)))) {
    const k = nameKey(f.fund); const list = [...(V.get(k) || new Map()).entries()].filter(([, v]) => v !== null).sort((a, b) => cmp(a[0], b[0])).slice(-q); const out = [];
    const corpus = num(f.corpus); let draw = 0; let avg = null; const latest = list.length ? list.at(-1)[1] : null;
    if (!list.length) out.push(finding('no_values', `${str(f.fund)} has no market values up to ${vd || 'the value date'}.`));
    else {
      avg = round2(list.reduce((t, [, v]) => t + v, 0) / list.length); draw = round2((avg * rate) / 100);
      if (list.length < q) out.push(finding('insufficient_history', `${str(f.fund)} has ${list.length} quarter-end value(s), fewer than the ${q} the policy averages; the draw uses the ${list.length} there are.`));
      if (corpus !== null && latest < corpus - tol) { if (s.underwater_policy === 'no_spend') { out.push(finding('underwater_no_draw', `${str(f.fund)} is ${latest}, ${round2(corpus - latest)} below its corpus of ${corpus}; the settings say no draw from an underwater fund, so the draw is 0.`, draw)); draw = 0; } else { out.push(finding('underwater', `${str(f.fund)} is ${latest}, ${round2(corpus - latest)} below its corpus of ${corpus}. The board should look at the draw before it is made.`, corpus - latest)); } T.underwater++; }
    }
    const booked = D.has(k) ? D.get(k) : null;
    if (booked !== null && Math.abs(booked - draw) > tol) out.push(finding('draw_differs', `${str(f.fund)}: ${booked} is booked as the draw; the policy gives ${draw} (${rate}% of the ${list.length}-quarter average ${avg}).`, booked - draw));
    T.draw += draw; if (latest !== null) T.latest += latest;
    items.push({ fund: str(f.fund), fund_name: str(f.fund_name), corpus, latest_value: latest, quarters_used: list.length, average_value: avg, policy_draw: draw, booked_draw: booked, status: statusOf(out, LEVELS), findings: out });
  }
  if (rate > Number(s.prudence_rate ?? 7)) { const out = [finding('rate_over_prudence', `The spending rate ${rate}% is over the ${s.prudence_rate}% prudence figure in the settings. Document why the board chose it.`)]; items.push({ fund: 'Spending policy', fund_name: '', corpus: null, latest_value: null, quarters_used: null, average_value: null, policy_draw: round2(T.draw), booked_draw: null, status: statusOf(out, LEVELS), findings: out }); }
  return { items, totals: { funds: funds.filter((x) => str(x.fund)).length, spending_rate: rate, total_draw: round2(T.draw), market_value: round2(T.latest), underwater: T.underwater }, extra: { value_date: vd, fiscal_year: s.fiscal_year || null } };
}
