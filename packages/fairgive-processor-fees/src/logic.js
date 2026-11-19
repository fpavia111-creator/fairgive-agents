// Processor fees. Each charge's fee is compared with the rate in the settings for its
// processor (percent of gross plus a fixed amount). The CRM gift linked to the charge
// should be the gross: a gift equal to the net means the fee was taken out of revenue.
// Charges with no gift, fees kept on refunds and payouts that did not reach the bank are
// listed. Payouts are matched to deposits by payout id or by amount within payout_days.
import { str, num, round2, isoDate, daysBetween, finding, statusOf, cmp, nameKey } from 'fairgive-core';

export const DEFAULTS = Object.freeze({ rates: {}, payout_days: 5, tolerance: 0.01 });
const LEVELS = { fee_over_rate: 'flag', gift_booked_net: 'flag', gift_amount_differs: 'review', not_in_crm: 'review', payout_not_in_bank: 'review', fee_on_refund: 'watch' };

export function processorFees({ transactions = [], gifts = [], deposits = [] }, s = DEFAULTS) {
  const tol = Number(s.tolerance ?? 0.01);
  const rates = new Map(Object.entries(s.rates || {}).map(([k, v]) => [nameKey(k), v]));
  const G = new Map(); for (const g of gifts) if (str(g.gift_id)) G.set(nameKey(g.gift_id), num(g.amount));
  const items = []; const payouts = new Map(); const T = { gross: 0, fees: 0, over: 0, booked_net: 0 };
  for (const t of transactions) {
    if (!str(t.txn_id)) continue;
    const gross = num(t.gross) || 0; const fee = Math.abs(num(t.fee) || 0); const net = num(t.net) ?? round2(gross - fee); const f = [];
    const r = rates.get(nameKey(t.processor));
    if (r && gross > 0) { const expected = round2(gross * Number(r.pct || 0) / 100 + Number(r.fixed || 0)); if (fee - expected > tol) { f.push(finding('fee_over_rate', `${str(t.txn_id)} (${str(t.processor)}): fee ${fee} on ${gross}; the rate in the settings gives ${expected}.`, fee - expected)); T.over += fee - expected; } }
    const gid = nameKey(t.gift_id); const crm = gid ? G.get(gid) : undefined;
    if (gross > 0 && (!gid || crm === undefined)) f.push(finding('not_in_crm', `${str(t.txn_id)} (${str(t.processor)}, ${gross} on ${isoDate(t.date) || 'no date'}) has no gift in the CRM${gid ? ` (gift ${str(t.gift_id)} not found)` : ''}.`, gross));
    else if (crm !== undefined && crm !== null && Math.abs(crm - gross) > tol) {
      if (fee > 0 && Math.abs(crm - net) <= tol) { f.push(finding('gift_booked_net', `Gift ${str(t.gift_id)} is booked at ${crm}, the net of ${str(t.txn_id)}; the gift is ${gross} and the ${fee} fee is an expense.`, fee)); T.booked_net += fee; }
      else f.push(finding('gift_amount_differs', `Gift ${str(t.gift_id)} is booked at ${crm}; ${str(t.txn_id)} charged ${gross}.`, gross - crm));
    }
    if ((num(t.refunded) || 0) > 0 && fee > 0) f.push(finding('fee_on_refund', `${str(t.txn_id)} was refunded (${num(t.refunded)}) and its ${fee} fee was not returned.`, fee));
    T.gross += gross; T.fees += fee;
    const po = str(t.payout_id); if (po) { const p = payouts.get(po) || { id: po, processor: str(t.processor), date: isoDate(t.payout_date), amount: 0 }; p.amount = round2(p.amount + net); if (isoDate(t.payout_date) && (!p.date || isoDate(t.payout_date) > p.date)) p.date = isoDate(t.payout_date); payouts.set(po, p); }
    items.push({ item: str(t.txn_id), processor: str(t.processor), date: isoDate(t.date), gross, fee, net, gift_id: str(t.gift_id), crm_amount: crm ?? null, donor: str(t.donor), status: statusOf(f, LEVELS), findings: f });
  }
  const used = new Set(); let missing = 0;
  for (const p of [...payouts.values()].sort((a, b) => cmp(a.id, b.id))) {
    let d = deposits.find((x) => !used.has(x) && (nameKey(x.deposit_id) === nameKey(p.id) || nameKey(x.description).includes(nameKey(p.id))));
    if (!d) d = deposits.filter((x) => !used.has(x) && Math.abs((num(x.amount) || 0) - p.amount) <= tol && (!p.date || !isoDate(x.date) || (daysBetween(p.date, x.date) >= 0 && daysBetween(p.date, x.date) <= Number(s.payout_days ?? 5)))).sort((a, b) => cmp(isoDate(a.date) || '', isoDate(b.date) || ''))[0];
    const f = [];
    if (d) { used.add(d); if (Math.abs((num(d.amount) || 0) - p.amount) > tol) f.push(finding('payout_not_in_bank', `Payout ${p.id} nets to ${p.amount}; the bank deposit ${str(d.deposit_id) || isoDate(d.date)} is ${num(d.amount)}.`, p.amount - (num(d.amount) || 0))); }
    else { f.push(finding('payout_not_in_bank', `Payout ${p.id} (${p.processor}, ${p.amount} on ${p.date || 'no date'}) matches no bank deposit.`, p.amount)); missing += p.amount; }
    items.push({ item: `Payout ${p.id}`, processor: p.processor, date: p.date, gross: null, fee: null, net: p.amount, gift_id: '', crm_amount: null, donor: '', deposit: d ? (str(d.deposit_id) || isoDate(d.date)) : null, status: statusOf(f, LEVELS), findings: f });
  }
  return { items, totals: { transactions: transactions.filter((t) => str(t.txn_id)).length, gross: round2(T.gross), fees: round2(T.fees), fee_pct: T.gross ? round2((T.fees / T.gross) * 100) : 0, fees_over_rate: round2(T.over), booked_net: round2(T.booked_net), payouts_missing: round2(missing) }, extra: {} };
}
