// Pledges receivable. Each pledge is split into equal installments from its first due
// date at its frequency; what is due by as_of, less payments, is past due and aged from
// the oldest unpaid installment. Write-offs need an approver and cannot exceed the
// balance. Conditional pledges and pledges paid beyond one year are listed for a person.
import { str, num, round2, isoDate, addMonths, daysBetween, ageBucket, yes, finding, statusOf, cmp, nameKey } from 'fairgive-core';

export const DEFAULTS = Object.freeze({ as_of: null, buckets: [30, 60, 90], discount_rate: 0, organization: '', tolerance: 0.01 });
const LEVELS = { overdue_90: 'flag', overpaid: 'flag', writeoff_no_approval: 'flag', writeoff_over_balance: 'flag', overdue_installment: 'review', paid_still_open: 'review', conditional_booked: 'review', multi_year_not_discounted: 'watch' };
const STEP = { monthly: 1, quarterly: 3, semiannual: 6, annual: 12, annually: 12, yearly: 12, once: 0, 'one time': 0, single: 0 };

export function pledges({ pledges: list = [], payments = [], writeoffs = [] }, s = DEFAULTS) {
  const tol = Number(s.tolerance ?? 0.01);
  const asOf = isoDate(s.as_of) || new Date().toISOString().slice(0, 10);
  const paid = new Map(); for (const p of payments) { const k = nameKey(p.pledge_id); if (k) paid.set(k, round2((paid.get(k) || 0) + (num(p.amount) || 0))); }
  const wo = new Map(); for (const w of writeoffs) { const k = nameKey(w.pledge_id); if (!k) continue; if (!wo.has(k)) wo.set(k, []); wo.get(k).push({ amount: num(w.amount) || 0, date: isoDate(w.date), by: str(w.approved_by) }); }
  const items = []; const T = { receivable: 0, conditional: 0, past_due: 0, written_off: 0 };
  for (const p of list) {
    if (!str(p.pledge_id)) continue;
    const total = num(p.total) || 0; const n = Math.max(1, Math.round(num(p.installments) || 1)); const step = STEP[str(p.frequency).toLowerCase()] ?? 1;
    const first = isoDate(p.first_due) || isoDate(p.pledge_date); const each = total / n;
    const sched = []; for (let i = 0; i < n; i++) sched.push({ due: first ? (step ? addMonths(first, i * step) : first) : null, amount: i === n - 1 ? round2(total - each * (n - 1)) : round2(each) });
    const k = nameKey(p.pledge_id); const got = paid.get(k) || 0; const offs = wo.get(k) || []; const off = round2(offs.reduce((t, w) => t + w.amount, 0));
    const dueToDate = round2(sched.filter((x) => x.due && x.due <= asOf).reduce((t, x) => t + x.amount, 0));
    const pastDue = off ? 0 : Math.max(0, round2(dueToDate - got)); const balance = Math.max(0, round2(total - got - off));
    let cover = got; let oldest = null; for (const x of sched) { const c = Math.min(cover, x.amount); cover -= c; if (x.amount - c > tol && x.due && x.due <= asOf) { oldest = x.due; break; } }
    const days = oldest ? daysBetween(oldest, asOf) : 0; const f = [];
    const conditional = yes(p.conditional) === true; const open = !/closed|paid|written|cancel/i.test(str(p.status));
    if (pastDue > tol) f.push(finding(days > 90 ? 'overdue_90' : 'overdue_installment', `Pledge ${str(p.pledge_id)}: ${dueToDate} was due by ${asOf}, ${got} paid; ${pastDue} past due since ${oldest} (${days} days).`, pastDue));
    if (got - total > tol) f.push(finding('overpaid', `Pledge ${str(p.pledge_id)} is ${total} and ${got} was paid (${round2(got - total)} over).`, got - total));
    else if (got >= total - tol && open && total) f.push(finding('paid_still_open', `Pledge ${str(p.pledge_id)} is paid in full (${got}) and still marked "${str(p.status)}".`));
    for (const w of offs) { if (!w.by) f.push(finding('writeoff_no_approval', `Pledge ${str(p.pledge_id)}: ${w.amount} written off on ${w.date || 'no date'} with no approver recorded.`, w.amount)); }
    if (off - Math.max(0, total - got) > tol) f.push(finding('writeoff_over_balance', `Pledge ${str(p.pledge_id)}: ${off} written off against a balance of ${round2(total - got)}.`, off - (total - got)));
    if (conditional && open && balance > tol) f.push(finding('conditional_booked', `Pledge ${str(p.pledge_id)} is marked conditional with ${balance} open. A conditional pledge is usually not booked until its condition is met; check how it is recorded.`, balance));
    const last = sched.at(-1).due; const pd = isoDate(p.pledge_date) || first;
    if (!conditional && balance > tol && last && pd && last > addMonths(pd, 12) && !(Number(s.discount_rate) > 0)) f.push(finding('multi_year_not_discounted', `Pledge ${str(p.pledge_id)} runs to ${last}, more than a year after ${pd}, and no discount rate is set for its present value.`, balance));
    let pv = null; if (Number(s.discount_rate) > 0 && !conditional) { const r = Number(s.discount_rate) / 100; let cv = got + off; pv = 0; for (const x of sched) { const c = Math.min(cv, x.amount); cv -= c; const left = x.amount - c; if (left <= tol) continue; const yrs = Math.max(0, daysBetween(asOf, x.due || asOf) / 365); pv += left / Math.pow(1 + r, yrs); } pv = round2(pv); }
    if (conditional) T.conditional += balance; else T.receivable += balance; T.past_due += pastDue; T.written_off += off;
    items.push({ pledge_id: str(p.pledge_id), donor_id: str(p.donor_id), donor: str(p.donor), email: str(p.email), total, paid: got, written_off: off, balance, past_due: pastDue, aging: pastDue > tol ? ageBucket(days, s.buckets || [30, 60, 90]) : 'current', present_value: pv, status: statusOf(f, LEVELS), findings: f });
  }
  return { items, totals: { pledges: items.length, receivable: round2(T.receivable), conditional: round2(T.conditional), past_due: round2(T.past_due), written_off: round2(T.written_off), present_value: Number(s.discount_rate) > 0 ? round2(items.reduce((t, i) => t + (i.present_value || 0), 0)) : null }, extra: { as_of: asOf } };
}
