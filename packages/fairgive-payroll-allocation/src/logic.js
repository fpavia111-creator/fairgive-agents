// Payroll allocation against effort. For each employee and period: the effort split by
// program or grant (percent, or hours turned into percent), the salary charged by code,
// and the payroll gross. Charges that differ from effort by more than the tolerance,
// effort over 100%, pay not charged anywhere, charges to codes with no effort, and
// grant-coded charges with no effort certification are listed.
import { str, num, round2, finding, statusOf, cmp, nameKey } from 'fairgive-core';

export const DEFAULTS = Object.freeze({ tolerance_pct: 5, certify_codes: [], tolerance: 0.01 });
const LEVELS = { charge_differs_from_effort: 'flag', effort_over_100: 'flag', charged_without_effort: 'flag', payroll_not_allocated: 'review', certification_missing: 'review', no_effort_report: 'review' };

export function payrollAllocation({ payroll = [], effort = [], charges = [], certifications = [] }, s = DEFAULTS) {
  const tol = Number(s.tolerance ?? 0.01); const tp = Number(s.tolerance_pct ?? 5);
  const key = (r) => `${nameKey(r.employee_id)}|${nameKey(r.period)}`;
  const P = new Map(); for (const p of payroll) if (str(p.employee_id)) { const k = key(p); const e = P.get(k) || { employee_id: str(p.employee_id), employee: str(p.employee), period: str(p.period), gross: 0 }; e.gross = round2(e.gross + (num(p.gross) || 0)); P.set(k, e); }
  const E = new Map(); for (const r of effort) { const k = key(r); if (!E.has(k)) E.set(k, []); E.get(k).push({ code: str(r.code), pct: num(r.pct), hours: num(r.hours) }); }
  const C = new Map(); for (const r of charges) { const k = key(r); if (!C.has(k)) C.set(k, new Map()); const m = C.get(k); m.set(str(r.code), round2((m.get(str(r.code)) || 0) + (num(r.amount) || 0))); if (!P.has(k)) P.set(k, { employee_id: str(r.employee_id), employee: '', period: str(r.period), gross: null }); }
  const cert = new Set(certifications.filter((c) => str(c.certified_date)).map(key));
  const needsCert = (code) => (s.certify_codes || []).some((p) => str(p) && str(code).toUpperCase().startsWith(str(p).toUpperCase()));
  const items = []; const T = { gross: 0, charged: 0, unallocated: 0, moved: 0, to_certify: 0 };
  for (const [k, p] of [...P.entries()].sort((a, b) => cmp(a[0], b[0]))) {
    const f = []; const eff = E.get(k) || []; const ch = C.get(k) || new Map(); const charged = round2([...ch.values()].reduce((t, v) => t + v, 0));
    const hours = eff.reduce((t, x) => t + (x.hours || 0), 0); const pct = new Map();
    for (const x of eff) pct.set(x.code, round2((pct.get(x.code) || 0) + (x.pct !== null ? x.pct : hours ? (100 * (x.hours || 0)) / hours : 0)));
    const totalPct = round2([...pct.values()].reduce((t, v) => t + v, 0));
    if (!eff.length) f.push(finding('no_effort_report', `${p.employee_id} has salary charged for ${p.period} and no effort report.`, charged));
    if (totalPct > 100 + tol) f.push(finding('effort_over_100', `${p.employee_id} reports ${totalPct}% effort for ${p.period}.`));
    if (eff.length) for (const code of [...new Set([...pct.keys(), ...ch.keys()])].sort()) {
      const amt = ch.get(code) || 0; const cp = charged ? (100 * amt) / charged : 0; const ep = pct.get(code) || 0;
      if (amt && !ep) { f.push(finding('charged_without_effort', `${p.employee_id}: ${amt} charged to ${code} in ${p.period} with no effort reported there.`, amt)); T.moved += amt; continue; }
      if (Math.abs(cp - ep) > tp) { const should = round2((charged * ep) / (totalPct || 100)); f.push(finding('charge_differs_from_effort', `${p.employee_id}: ${code} carries ${round2(cp)}% of the pay charged (${amt}); effort says ${ep}% (about ${should}).`, amt - should)); if (amt > should) T.moved += amt - should; }
    }
    if (p.gross !== null && p.gross - charged > tol) f.push(finding('payroll_not_allocated', `${p.employee_id}: payroll ${p.gross} for ${p.period}, ${charged} charged to programs and grants; ${round2(p.gross - charged)} is not charged anywhere.`, p.gross - charged));
    const grantAmt = round2([...ch.entries()].filter(([c]) => needsCert(c)).reduce((t, [, v]) => t + v, 0));
    if (grantAmt && !cert.has(k)) { f.push(finding('certification_missing', `${p.employee_id}: ${grantAmt} charged to grants in ${p.period} and no effort certification is on file.`, grantAmt)); T.to_certify += grantAmt; }
    T.gross += p.gross || 0; T.charged += charged; if (p.gross !== null && p.gross > charged) T.unallocated += p.gross - charged;
    items.push({ item: `${p.employee_id} ${p.period}`, employee_id: p.employee_id, employee: p.employee, period: p.period, gross: p.gross, charged, effort_pct: totalPct, grant_charges: grantAmt, status: statusOf(f, LEVELS), findings: f });
  }
  return { items, totals: { employee_periods: items.length, payroll: round2(T.gross), charged: round2(T.charged), unallocated: round2(T.unallocated), charged_against_effort: round2(T.moved), grant_charges_uncertified: round2(T.to_certify) }, extra: {} };
}
