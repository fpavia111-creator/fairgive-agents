// Refunds and card disputes against the CRM. A full refund should leave the gift marked
// refunded (and any thank-you letter corrected); a partial refund should reduce the gift;
// a refund larger than the gift is an error; an open dispute has an evidence deadline.
// Nothing is refunded, reversed or answered by the agent.
import { str, num, round2, isoDate, daysBetween, finding, statusOf, cmp, nameKey } from 'fairgive-core';

export const DEFAULTS = Object.freeze({ as_of: null, evidence_warning_days: 7, tolerance: 0.01 });
const LEVELS = { refund_not_reversed_in_crm: 'flag', refund_over_gift: 'flag', dispute_evidence_due: 'flag', dispute_evidence_overdue: 'flag', ack_sent_for_refunded: 'review', partial_refund_not_adjusted: 'review', refund_no_gift: 'review' };
const REVERSED = /refund|revers|void|adjust|cancel|charge ?back/i;
const CLOSED = /won|lost|closed|resolved|accepted|warning_closed/i;

export function refunds({ events = [], gifts = [] }, s = DEFAULTS) {
  const tol = Number(s.tolerance ?? 0.01);
  const asOf = isoDate(s.as_of) || new Date().toISOString().slice(0, 10);
  const G = new Map(); for (const g of gifts) if (str(g.gift_id)) G.set(nameKey(g.gift_id), g);
  const items = []; const T = { refunded: 0, disputed_open: 0, crm_to_fix: 0 };
  for (const e of events) {
    if (!str(e.txn_id)) continue;
    const a = Math.abs(num(e.amount) || 0); const dispute = /dispute|charge ?back/i.test(str(e.type)); const g = str(e.gift_id) ? G.get(nameKey(e.gift_id)) : null; const f = [];
    if (dispute) {
      if (!CLOSED.test(str(e.status))) { T.disputed_open += a; const due = isoDate(e.evidence_due);
        if (due && due < asOf) f.push(finding('dispute_evidence_overdue', `${str(e.txn_id)}: the ${a} dispute on gift ${str(e.gift_id) || '?'} had evidence due on ${due}.`, a));
        else if (due && daysBetween(asOf, due) <= Number(s.evidence_warning_days ?? 7)) f.push(finding('dispute_evidence_due', `${str(e.txn_id)}: evidence for the ${a} dispute on gift ${str(e.gift_id) || '?'} is due on ${due}, in ${daysBetween(asOf, due)} day(s). Gather the receipt and any thank-you letter for the person who responds.`, a)); }
    } else {
      T.refunded += a;
      if (!g) f.push(finding('refund_no_gift', `${str(e.txn_id)}: a ${a} refund on ${isoDate(e.date) || 'no date'} ${str(e.gift_id) ? `names gift ${str(e.gift_id)}, which is not in the CRM export` : 'has no gift id'}.`, a));
      else { const amount = num(g.amount) || 0;
        if (a - amount > tol) f.push(finding('refund_over_gift', `${str(e.txn_id)}: ${a} refunded on a gift of ${amount}.`, a - amount));
        else if (amount - a > tol) { if (!REVERSED.test(str(g.status))) f.push(finding('partial_refund_not_adjusted', `${str(e.txn_id)}: ${a} of gift ${str(g.gift_id)} (${amount}) was refunded and the gift still shows ${amount}.`, a)); }
        else if (!REVERSED.test(str(g.status))) f.push(finding('refund_not_reversed_in_crm', `${str(e.txn_id)}: gift ${str(g.gift_id)} (${amount}) was refunded in full and is still "${str(g.status) || 'not marked'}" in the CRM.`, a));
        if (a >= amount - tol && isoDate(g.ack_date)) f.push(finding('ack_sent_for_refunded', `Gift ${str(g.gift_id)} was thanked on ${isoDate(g.ack_date)} and then refunded; send a corrected letter.`, a)); }
    }
    if (f.some((x) => /crm|adjusted|ack_/.test(x.code))) T.crm_to_fix++;
    items.push({ txn_id: str(e.txn_id), processor: str(e.processor), type: dispute ? 'dispute' : 'refund', date: isoDate(e.date), amount: a, gift_id: str(e.gift_id), donor: g ? str(g.donor) : '', event_status: str(e.status), status: statusOf(f, LEVELS), findings: f });
  }
  return { items, totals: { events: items.length, refunded: round2(T.refunded), disputed_open: round2(T.disputed_open), crm_to_fix: T.crm_to_fix }, extra: { as_of: asOf } };
}
