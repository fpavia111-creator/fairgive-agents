// Donor acknowledgements: every gift at or over the threshold should have a letter within
// the policy's days, for the gift amount, with a goods-or-services statement; a refunded
// gift should not have one standing. The threshold and days are settings (the default 250
// is the US written-acknowledgement figure; your policy may be stricter).
import { str, num, round2, isoDate, daysBetween, yes, finding, statusOf, cmp, nameKey } from 'fairgive-core';

export const DEFAULTS = Object.freeze({ threshold: 250, days_to_send: 30, as_of: null, require_statement: true, organization: '', tolerance: 0.01 });
const LEVELS = { ack_missing: 'flag', ack_amount_differs: 'flag', ack_no_statement: 'flag', ack_for_refunded_gift: 'flag', ack_late: 'watch', ack_due_soon: 'watch', no_gift_date: 'review' };
const REFUNDED = /refund|reversed|void|cancel|charge ?back/i;

export function acknowledgements({ gifts = [], letters = [] }, s = DEFAULTS) {
  const tol = Number(s.tolerance ?? 0.01);
  const asOf = isoDate(s.as_of) || gifts.map((g) => isoDate(g.gift_date)).filter(Boolean).sort().pop() || null;
  const byGift = new Map();
  for (const l of letters) { const k = nameKey(l.gift_id); if (!k) continue; const cur = byGift.get(k); if (!cur || cmp(isoDate(l.letter_date) || '', isoDate(cur.letter_date) || '') > 0) byGift.set(k, l); }
  const items = []; let missing = 0, missingAmount = 0;
  for (const g of gifts) {
    if (!str(g.gift_id)) continue;
    const amount = num(g.amount) || 0; const l = byGift.get(nameKey(g.gift_id)); const refunded = REFUNDED.test(str(g.status));
    if (amount < Number(s.threshold) && !l) continue;
    if (refunded && !l) continue;
    const date = isoDate(g.gift_date); const f = [];
    if (refunded && l) f.push(finding('ack_for_refunded_gift', `Gift ${str(g.gift_id)} was refunded but a letter dated ${isoDate(l.letter_date) || 'no date'} acknowledges ${num(l.amount) ?? amount}. Send a corrected letter.`, amount));
    else if (!l) {
      if (!date) f.push(finding('no_gift_date', `Gift ${str(g.gift_id)} has no date, so the sending window cannot be checked.`, amount));
      else { const age = asOf ? daysBetween(date, asOf) : null;
        if (age !== null && age <= Number(s.days_to_send)) f.push(finding('ack_due_soon', `Gift ${str(g.gift_id)} of ${amount} on ${date} has no letter yet; the policy allows ${s.days_to_send} days (${age} so far).`, amount));
        else { f.push(finding('ack_missing', `Gift ${str(g.gift_id)} of ${amount} on ${date} has no acknowledgement letter${age !== null ? ` after ${age} days` : ''}.`, amount)); missing++; missingAmount += amount; } }
    } else {
      const ld = isoDate(l.letter_date); const lag = date && ld ? daysBetween(date, ld) : null;
      if (lag !== null && lag > Number(s.days_to_send)) f.push(finding('ack_late', `Gift ${str(g.gift_id)}: the letter went out ${lag} days after the gift (policy ${s.days_to_send}).`));
      const la = num(l.amount); if (la !== null && Math.abs(la - amount) > tol) f.push(finding('ack_amount_differs', `Gift ${str(g.gift_id)} is ${amount} but the letter says ${la}.`, amount - la));
      if (s.require_statement !== false && yes(l.statement) === false) f.push(finding('ack_no_statement', `The letter for gift ${str(g.gift_id)} has no statement about goods or services received.`, amount));
    }
    items.push({ gift_id: str(g.gift_id), donor_id: str(g.donor_id), donor: str(g.donor), email: str(g.email), gift_date: date, amount, letter_date: l ? isoDate(l.letter_date) : null, letter_amount: l ? num(l.amount) : null, status: statusOf(f, LEVELS), findings: f });
  }
  return { items, totals: { gifts_checked: items.length, missing_letters: missing, missing_amount: round2(missingAmount), letters_to_fix: items.filter((i) => i.findings.some((x) => ['ack_amount_differs', 'ack_no_statement', 'ack_for_refunded_gift'].includes(x.code))).length }, extra: { as_of: asOf, threshold: s.threshold } };
}
