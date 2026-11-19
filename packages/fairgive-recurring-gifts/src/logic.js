// Recurring gift plans against processor charges. For each plan: the trailing run of
// failed charges, the next charge the schedule expects (from the last attempt, or the
// start date), the card expiry, charges after a cancellation and charges for another
// amount. Amounts at risk are shown as a monthly equivalent.
import { str, num, round2, isoDate, addDays, addMonths, daysBetween, finding, statusOf, cmp, nameKey } from 'fairgive-core';

export const DEFAULTS = Object.freeze({ as_of: null, failures_in_a_row: 2, expiry_warning_days: 45, grace_days: 7, organization: '', tolerance: 0.01 });
const LEVELS = { repeated_failures: 'flag', failed_last_charge: 'flag', charge_after_cancel: 'flag', missed_charge: 'review', card_expired: 'review', card_expiring: 'watch', amount_changed: 'watch', unknown_frequency: 'review' };
const MONTHS = { monthly: 1, month: 1, quarterly: 3, quarter: 3, semiannual: 6, 'semi annual': 6, annual: 12, annually: 12, yearly: 12, year: 12, weekly: 0.25 };
const FAILED = /fail|declin|error|unpaid|past due|uncollect/i;
const OK = /succe|paid|captur|complet|settled|approved/i;

/** Last day of the card's expiry month from "11/2026", "11/26", "2026-11" or a date. */
export function expiryDate(v) {
  const s = str(v); let m = /^(\d{1,2})\s*\/\s*(\d{2}|\d{4})$/.exec(s);
  if (m) { const y = m[2].length === 2 ? 2000 + Number(m[2]) : Number(m[2]); return new Date(Date.UTC(y, Number(m[1]), 0)).toISOString().slice(0, 10); }
  m = /^(\d{4})-(\d{1,2})$/.exec(s); if (m) return new Date(Date.UTC(Number(m[1]), Number(m[2]), 0)).toISOString().slice(0, 10);
  return isoDate(s);
}

export function recurring({ plans = [], charges = [] }, s = DEFAULTS) {
  const tol = Number(s.tolerance ?? 0.01);
  const asOf = isoDate(s.as_of) || charges.map((c) => isoDate(c.date)).filter(Boolean).sort().pop() || null;
  const byPlan = new Map();
  for (const c of charges) { const k = nameKey(c.plan_id); if (!k) continue; if (!byPlan.has(k)) byPlan.set(k, []); byPlan.get(k).push(c); }
  const items = []; let monthly = 0, atRisk = 0;
  for (const p of plans) {
    if (!str(p.plan_id)) continue;
    const list = (byPlan.get(nameKey(p.plan_id)) || []).map((c) => ({ date: isoDate(c.date), amount: num(c.amount), ok: OK.test(str(c.status)) && !FAILED.test(str(c.status)), failed: FAILED.test(str(c.status)) })).filter((c) => c.date).sort((a, b) => cmp(a.date, b.date));
    const months = MONTHS[str(p.frequency).toLowerCase()] ?? null; const amount = num(p.amount) || 0;
    const cancelled = /cancel|inactive|ended|closed|stopped/i.test(str(p.status)); const f = [];
    if (months === null) f.push(finding('unknown_frequency', `Plan ${str(p.plan_id)} has frequency "${str(p.frequency)}", which is not monthly, quarterly, semiannual, annual or weekly.`));
    let trail = 0; for (let i = list.length - 1; i >= 0 && list[i].failed; i--) trail++;
    if (!cancelled && trail >= Number(s.failures_in_a_row ?? 2)) f.push(finding('repeated_failures', `Plan ${str(p.plan_id)}: the last ${trail} charges failed (latest ${list.at(-1).date}).`, amount * trail));
    else if (!cancelled && trail >= 1) f.push(finding('failed_last_charge', `Plan ${str(p.plan_id)}: the charge on ${list.at(-1).date} failed and has not been retried successfully${trail > 1 ? ` (${trail} failures in a row)` : ''}.`, amount));
    if (!cancelled && months !== null && asOf) {
      const last = list.length ? list.at(-1).date : isoDate(p.start_date);
      const next = last ? (list.length ? (months < 1 ? addDays(last, 7) : addMonths(last, months)) : last) : null;
      if (next && addDays(next, Number(s.grace_days ?? 7)) < asOf) f.push(finding('missed_charge', `Plan ${str(p.plan_id)} expected a charge on ${next} and none was attempted by ${asOf}.`, amount));
    }
    const exp = expiryDate(p.card_expiry);
    if (!cancelled && exp && asOf) { const d = daysBetween(asOf, exp);
      if (d < 0) f.push(finding('card_expired', `Plan ${str(p.plan_id)}: the card on file expired on ${exp}. Check whether the processor updated it.`, amount));
      else if (d <= Number(s.expiry_warning_days ?? 45)) f.push(finding('card_expiring', `Plan ${str(p.plan_id)}: the card expires on ${exp}, ${d} days from ${asOf}.`, amount)); }
    const cancelDate = isoDate(p.cancel_date);
    if (cancelDate) for (const c of list.filter((x) => x.ok && x.date > cancelDate)) f.push(finding('charge_after_cancel', `Plan ${str(p.plan_id)} was cancelled on ${cancelDate} but ${c.amount} was charged on ${c.date}.`, c.amount));
    for (const c of list.filter((x) => x.ok && x.amount !== null && Math.abs(x.amount - amount) > tol && (!cancelDate || x.date <= cancelDate))) f.push(finding('amount_changed', `Plan ${str(p.plan_id)} is ${amount} but ${c.amount} was charged on ${c.date}.`, c.amount - amount));
    const perMonth = months ? round2(amount / months) : 0;
    if (!cancelled) { monthly += perMonth; if (f.some((x) => ['repeated_failures', 'failed_last_charge', 'missed_charge', 'card_expired', 'card_expiring'].includes(x.code))) atRisk += perMonth; }
    items.push({ plan_id: str(p.plan_id), donor_id: str(p.donor_id), donor: str(p.donor), email: str(p.email), processor: str(p.processor), frequency: str(p.frequency), amount, monthly_equivalent: perMonth, plan_status: cancelled ? 'cancelled' : 'active', last_charge: list.length ? list.at(-1).date : null, card_expiry: exp, status: statusOf(f, LEVELS), findings: f });
  }
  return { items, totals: { plans: items.length, active: items.filter((i) => i.plan_status === 'active').length, monthly_value: round2(monthly), at_risk_monthly: round2(atRisk), failing: items.filter((i) => i.findings.some((x) => /fail/.test(x.code))).length, missed: items.filter((i) => i.findings.some((x) => x.code === 'missed_charge')).length, cards_to_update: items.filter((i) => i.findings.some((x) => /^card_/.test(x.code))).length }, extra: { as_of: asOf } };
}
