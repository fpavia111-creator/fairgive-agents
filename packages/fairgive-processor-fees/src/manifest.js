import { readFileSync } from 'node:fs';
import { giveAgent, PROCESSOR_FIELDS, PROCESSOR_PROFILES, GIFT_FIELDS, DEPOSIT_FIELDS, sourceOf, REFUSE, money, rollup } from 'fairgive-core';
import { processorFees, DEFAULTS } from './logic.js';

const pkg = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'));
const files = {
  transactions: { type: 'string', description: 'Processor transactions under --root (Stripe balance or payments export, PayPal activity download, Givebutter or Classy transactions): id, processor, date, gross, fee, net, payout id and date, linked gift id, refunded amount' },
  gifts: { type: 'string', description: 'Gift export from your donor CRM under --root: gift id, amount' },
  deposits: { type: 'string', description: 'Optional bank deposits under --root, to check that each payout arrived' },
};
export const DEMO = { title: 'Fairgive Processor Fees', files: { transactions: 'transactions.csv', gifts: 'gifts.csv', deposits: 'deposits.csv', settings: 'settings.json' }, explain: { arg: 'item', value: 'T-3' } };

export const manifest = giveAgent({
  pkg, prefix: 'fees',
  description: pkg.description.replace(/^[^:]+:\s*/, ''),
  check: { title: 'Payment processor fees', description: 'Compares each charge\'s fee with the rate in the settings for its processor (percent of gross plus a fixed amount), checks that the CRM gift linked to the charge is the gross and not the net, and lists charges with no gift, fees kept on refunds and payouts that do not match a bank deposit by payout id or amount.' },
  args: files, required: ['transactions', 'gifts'],
  sources: {
    transactions: sourceOf('Processor transactions', ['transactions'], PROCESSOR_FIELDS, ['txn_id', 'processor', 'date', 'type', 'gross', 'fee', 'net', 'payout_id', 'payout_date', 'gift_id', 'refunded', 'donor', 'email'], PROCESSOR_PROFILES),
    gifts: sourceOf('CRM gifts', ['gifts'], GIFT_FIELDS, ['gift_id', 'donor', 'gift_date', 'amount', 'method']),
    deposits: { label: 'Bank deposits', args: ['deposits'], fields: DEPOSIT_FIELDS },
  },
  settings: { defaults: DEFAULTS, schema: { type: 'object', additionalProperties: false, properties: {
    rates: { type: 'object', additionalProperties: { type: 'object', additionalProperties: false, properties: { pct: { type: 'number', minimum: 0, maximum: 20, description: 'Percent of the gross' }, fixed: { type: 'number', minimum: 0, maximum: 10, description: 'Fixed amount per charge' } } }, description: 'Your contracted rate per processor, e.g. {"Stripe": {"pct": 2.2, "fixed": 0.30}}; processors not listed are not rate-checked' },
    payout_days: { type: 'integer', minimum: 0, maximum: 30, description: 'Days after the payout date a matching bank deposit may arrive (default 5)' },
    tolerance: { type: 'number', minimum: 0, maximum: 100, description: 'Difference ignored (default 0.01)' },
  } } },
  run: ({ rows, settings }) => processorFees(rows, settings),
  key: { arg: 'item', field: 'item', label: 'transaction id or payout ("Payout PO-1")' },
  summary: (o) => `${o.totals.transactions} transaction(s): gross ${money(o.totals.gross)}, fees ${money(o.totals.fees)} (${o.totals.fee_pct}%); fees over the rate ${money(o.totals.fees_over_rate)}, fees taken out of gifts ${money(o.totals.booked_net)}, payouts not in the bank ${money(o.totals.payouts_missing)}.`,
  report: {
    title: 'Payment processor fees', base: 'processor-fees',
    row: (i) => ({ item: i.item ?? '', processor: i.processor ?? '', date: i.date ?? '', gross: i.gross ?? '', fee: i.fee ?? '', net: i.net ?? '', gift_id: i.gift_id ?? '', crm_amount: i.crm_amount ?? '' }),
    htmlColumns: ['item', 'processor', 'date', 'gross', 'fee', 'net', 'crm_amount'],
    sections: (o) => [{ title: 'By processor', rows: rollup(o.items.filter((i) => i.gross !== null), 'processor', (i) => i.processor || '(none)', { gross: (i) => i.gross, fee: (i) => i.fee }), columns: ['processor', 'count', 'gross', 'fee'] }],
  },
  refused: [REFUSE.refund, REFUSE.transfer, REFUSE.crm],
  memory: null,
});
