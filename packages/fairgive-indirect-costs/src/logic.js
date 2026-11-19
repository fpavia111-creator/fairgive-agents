// Indirect cost recovery per grant. The base is modified total direct costs (MTDC):
// direct costs less the excluded categories in the settings and less each subaward above
// its first `subaward_cap`; or total direct costs (TDC) when the grant says so. The rate is
// the grant's own, or the de minimis rate by award start date (15% for awards on or after
// 2024-10-01, 10% before), never above a funder cap. Indirect charged is compared with
// rate x base. The figures are settings and award terms a person confirms.
import { str, num, round2, isoDate, finding, statusOf, cmp, nameKey } from 'fairgive-core';

export const DEFAULTS = Object.freeze({ excluded_categories: ['equipment', 'capital', 'rent', 'participant support', 'tuition remission', 'patient care', 'scholarships'], indirect_categories: ['indirect', 'f&a', 'overhead'], subaward_cap: null, de_minimis: null, tolerance: 0.01 });
const LEVELS = { indirect_overcharged: 'flag', rate_expired: 'review', no_rate: 'review', unknown_grant: 'review', indirect_undercharged: 'watch', subaward_over_cap: 'watch' };

export function indirectCosts({ grants = [], expenses = [] }, s = DEFAULTS) {
  const tol = Number(s.tolerance ?? 0.01);
  const ex = (s.excluded_categories || []).map(nameKey); const ind = (s.indirect_categories || []).map(nameKey);
  const G = new Map(); for (const g of grants) if (str(g.grant)) G.set(nameKey(g.grant), g);
  const by = new Map();
  for (const x of expenses) { const k = nameKey(x.grant); if (!k) continue; if (!by.has(k)) by.set(k, { grant: str(x.grant), lines: [] }); by.get(k).lines.push(x); }
  const items = []; const T = { base: 0, allowed: 0, charged: 0, over: 0, under: 0 };
  for (const [k, e] of [...by.entries()].sort((a, b) => cmp(a[1].grant, b[1].grant))) {
    const g = G.get(k); const f = [];
    if (!g) { const amt = round2(e.lines.reduce((t, x) => t + (num(x.amount) || 0), 0)); f.push(finding('unknown_grant', `${e.grant} has ${amt} of costs and is not in the grant list.`, amt)); items.push({ grant: e.grant, rate: null, base_type: '', direct: amt, excluded: 0, base: 0, allowed: 0, charged: 0, status: statusOf(f, LEVELS), findings: f }); continue; }
    const start = isoDate(g.award_start) || '9999-12-31'; const recent = start >= '2024-10-01';
    const cap = num(s.subaward_cap) ?? (recent ? 50000 : 25000); const dm = num(s.de_minimis) ?? (recent ? 15 : 10);
    let rate = num(g.rate); if (rate === null && /de ?minimis/i.test(str(g.rate_type))) rate = dm; const fcap = num(g.cap); if (rate !== null && fcap !== null) rate = Math.min(rate, fcap);
    const tdc = /tdc|total direct/i.test(str(g.base)) && !/mtdc|modified/i.test(str(g.base));
    let direct = 0, excluded = 0, charged = 0; const subs = new Map(); let last = null;
    for (const x of e.lines) { const a = num(x.amount) || 0; const c = nameKey(x.category); const d = isoDate(x.date); if (d && (!last || d > last)) last = d;
      if (ind.some((w) => c === w || c.includes(w))) { charged = round2(charged + a); continue; }
      direct = round2(direct + a);
      if (tdc) continue;
      if (ex.some((w) => c.includes(w))) { excluded = round2(excluded + a); continue; }
      if (/subaward|subcontract|subgrant/.test(c)) { const sid = str(x.subaward_id) || '(no id)'; subs.set(sid, round2((subs.get(sid) || 0) + a)); } }
    let overCap = 0; for (const [, a] of subs) if (a > cap) overCap = round2(overCap + a - cap);
    excluded = round2(excluded + overCap); const base = round2(direct - excluded);
    if (overCap > tol) f.push(finding('subaward_over_cap', `${e.grant}: ${overCap} of subaward costs above the first ${cap} of each subaward is left out of the base.`, overCap));
    if (rate === null) f.push(finding('no_rate', `${e.grant} has no indirect rate and is not marked de minimis.`, charged));
    const allowed = rate === null ? 0 : round2((base * rate) / 100);
    if (rate !== null && charged - allowed > tol) { f.push(finding('indirect_overcharged', `${e.grant}: ${charged} of indirect charged; ${rate}% of the ${tdc ? 'total' : 'modified total'} direct cost base ${base} is ${allowed}.`, charged - allowed)); T.over += charged - allowed; }
    else if (rate !== null && allowed - charged > tol) { f.push(finding('indirect_undercharged', `${e.grant}: ${charged} of indirect charged; ${rate}% of the base ${base} allows ${allowed}, so ${round2(allowed - charged)} is not recovered.`, allowed - charged)); T.under += allowed - charged; }
    const rend = isoDate(g.rate_end); if (rend && last && last > rend) f.push(finding('rate_expired', `${e.grant}: the rate ended on ${rend} and costs run to ${last}; check the rate that applies after it.`));
    T.base += base; T.allowed += allowed; T.charged += charged;
    items.push({ grant: e.grant, rate, base_type: tdc ? 'TDC' : 'MTDC', direct, excluded, base, allowed, charged, status: statusOf(f, LEVELS), findings: f });
  }
  return { items, totals: { grants: items.length, base: round2(T.base), allowed: round2(T.allowed), charged: round2(T.charged), overcharged: round2(T.over), not_recovered: round2(T.under) }, extra: {} };
}
