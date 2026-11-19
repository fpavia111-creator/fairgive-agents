// Quid pro quo checks. A payment over the threshold where the donor received goods or
// services needs a written disclosure of the value received and the deductible part
// (payment less that value). Benefits within the insubstantial limits in the settings
// need no disclosure. The limits are settings because the IRS updates them each year.
import { str, num, round2, isoDate, yes, finding, statusOf } from 'fairgive-core';

export const DEFAULTS = Object.freeze({ qpq_threshold: 75, low_cost_article: 13.6, low_cost_min_payment: 68, insubstantial_pct: 2, insubstantial_cap: 136, tolerance: 0.01 });
const LEVELS = { disclosure_missing: 'flag', deductible_wrong: 'flag', fmv_missing: 'review', benefit_over_payment: 'review', insubstantial_benefit: 'watch' };

export function insubstantial(amount, value, s = DEFAULTS) {
  if (value <= 0) return true;
  if (amount >= Number(s.low_cost_min_payment) && value <= Number(s.low_cost_article)) return true;
  return value <= Math.min(amount * Number(s.insubstantial_pct) / 100, Number(s.insubstantial_cap));
}

export function quidProQuo({ payments = [] }, s = DEFAULTS) {
  const tol = Number(s.tolerance ?? 0.01); const items = [];
  for (const p of payments) {
    if (!str(p.gift_id)) continue;
    const amount = num(p.amount) || 0; const v = num(p.benefit_value); const benefit = str(p.benefit); const stated = num(p.receipt_deductible); const f = [];
    let deductible = amount;
    if (benefit && v === null) f.push(finding('fmv_missing', `Payment ${str(p.gift_id)} of ${amount} came with "${benefit}" and no value for it, so the deductible part cannot be worked out.`, amount));
    else if (v !== null && v > 0) {
      if (v >= amount) f.push(finding('benefit_over_payment', `Payment ${str(p.gift_id)} of ${amount} bought "${benefit}" valued at ${v}: nothing is a contribution.`, amount));
      if (insubstantial(amount, v, s)) { f.push(finding('insubstantial_benefit', `Payment ${str(p.gift_id)}: "${benefit}" (${v}) is within the insubstantial-benefit limits in the settings, so it can be treated as fully deductible.`)); }
      else {
        deductible = round2(Math.max(0, amount - v));
        if (amount > Number(s.qpq_threshold) && yes(p.disclosure) !== true) f.push(finding('disclosure_missing', `Payment ${str(p.gift_id)} of ${amount} is over ${s.qpq_threshold} and the donor received "${benefit}" (${v}); no written disclosure is recorded.`, amount));
        if (stated !== null && Math.abs(stated - deductible) > tol) f.push(finding('deductible_wrong', `Payment ${str(p.gift_id)}: the receipt says ${stated} is deductible; payment ${amount} less benefit ${v} is ${deductible}.`, stated - deductible));
      }
    }
    items.push({ gift_id: str(p.gift_id), donor: str(p.donor), gift_date: isoDate(p.gift_date), amount, benefit, benefit_value: v, deductible: f.some((x) => x.code === 'fmv_missing') ? null : deductible, receipt_deductible: stated, status: statusOf(f, LEVELS), findings: f });
  }
  return { items, totals: { payments: items.length, with_benefit: items.filter((i) => i.benefit).length, disclosures_missing: items.filter((i) => i.findings.some((f) => f.code === 'disclosure_missing')).length, receipts_to_correct: items.filter((i) => i.findings.some((f) => f.code === 'deductible_wrong')).length, overstated: round2(items.reduce((t, i) => t + i.findings.filter((f) => f.code === 'deductible_wrong' && f.amount > 0).reduce((u, f) => u + f.amount, 0), 0)) }, extra: {} };
}
