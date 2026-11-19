// Memberships and dues. Each member's level gives the dues and the term; the end date is
// checked against as_of (expiring soon, or lapsed past the grace days with no renewal
// payment), payments are checked against the dues, a renewal payment should move the end
// date, and an active membership should have a payment in its current term.
import { str, num, round2, isoDate, addDays, addMonths, daysBetween, finding, statusOf, cmp, nameKey } from 'fairgive-core';

export const DEFAULTS = Object.freeze({ as_of: null, expiring_days: 30, grace_days: 30, organization: '', tolerance: 0.01 });
const LEVELS = { paid_wrong_amount: 'flag', paid_not_extended: 'flag', lapsed: 'review', active_without_payment: 'review', unknown_level: 'review', expiring_soon: 'watch' };

export function memberships({ members = [], payments = [], levels = [] }, s = DEFAULTS) {
  const tol = Number(s.tolerance ?? 0.01);
  const asOf = isoDate(s.as_of) || new Date().toISOString().slice(0, 10);
  const L = new Map(); for (const l of levels) if (str(l.level)) L.set(nameKey(l.level), { dues: num(l.dues), term: num(l.term_months) || 12 });
  const P = new Map(); for (const p of payments) { const k = nameKey(p.member_id); if (!k) continue; if (!P.has(k)) P.set(k, []); P.get(k).push({ date: isoDate(p.date), amount: num(p.amount) || 0 }); }
  const items = []; const T = { active: 0, lapsed: 0, expiring: 0, expected: 0, received: 0 };
  for (const m of members) {
    if (!str(m.member_id)) continue;
    const lv = L.get(nameKey(m.level)); const exp = isoDate(m.expires); const pays = (P.get(nameKey(m.member_id)) || []).filter((p) => p.date).sort((a, b) => cmp(a.date, b.date)); const f = [];
    const term = lv ? lv.term : 12; const termStart = exp ? addMonths(exp, -term) : null;
    if (!lv && str(m.level)) f.push(finding('unknown_level', `Member ${str(m.member_id)} is at level "${str(m.level)}", which is not in the level list.`));
    for (const p of pays.filter((x) => x.date > addMonths(asOf, -12))) { T.received += p.amount; if (lv && lv.dues !== null && Math.abs(p.amount - lv.dues) > tol) f.push(finding('paid_wrong_amount', `Member ${str(m.member_id)} paid ${p.amount} on ${p.date}; ${str(m.level)} dues are ${lv.dues}.`, lv.dues - p.amount)); }
    const renewal = exp ? pays.find((p) => p.date >= addDays(exp, -60) && p.date <= asOf) : null;
    if (exp && renewal) f.push(finding('paid_not_extended', `Member ${str(m.member_id)} paid ${renewal.amount} on ${renewal.date} but the membership still ends on ${exp}.`, renewal.amount));
    if (exp && exp < asOf && !renewal) { const late = daysBetween(exp, asOf); if (late > Number(s.grace_days ?? 30)) { f.push(finding('lapsed', `Member ${str(m.member_id)}: the membership ended on ${exp} (${late} days ago) with no renewal.`, lv ? lv.dues : null)); T.lapsed++; } }
    if (exp && exp >= asOf) { T.active++; if (lv && lv.dues) T.expected += lv.dues;
      const d = daysBetween(asOf, exp); if (d <= Number(s.expiring_days ?? 30)) { f.push(finding('expiring_soon', `Member ${str(m.member_id)}: the membership ends on ${exp}, in ${d} days.`, lv ? lv.dues : null)); T.expiring++; }
      if (termStart && !pays.some((p) => p.date >= addDays(termStart, -60) && p.date <= exp)) f.push(finding('active_without_payment', `Member ${str(m.member_id)} is active until ${exp} and no payment is on file for the current term.`, lv ? lv.dues : null)); }
    items.push({ member_id: str(m.member_id), member: str(m.member), email: str(m.email), level: str(m.level), expires: exp, last_payment: pays.length ? pays.at(-1).date : null, dues: lv ? lv.dues : null, status: statusOf(f, LEVELS), findings: f });
  }
  return { items, totals: { members: items.length, active: T.active, expiring_soon: T.expiring, lapsed: T.lapsed, expected_dues: round2(T.expected), dues_received_12m: round2(T.received) }, extra: { as_of: asOf } };
}
