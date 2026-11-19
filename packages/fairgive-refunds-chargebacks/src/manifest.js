import { readFileSync } from 'node:fs';
import { giveAgent, GIFT_FIELDS, GIFT_PROFILES, sourceOf, REFUSE, money, rollup } from 'fairgive-core';
import { refunds, DEFAULTS } from './logic.js';

const pkg = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'));
const files = {
  events: { type: 'string', description: 'Refunds and disputes from your processor under --root (Stripe, PayPal, Givebutter or Classy export): transaction id, processor, type, date, amount, gift id, status, evidence due date' },
  gifts: { type: 'string', description: 'Gift export from your donor CRM under --root: gift id, donor, date, amount, status, acknowledgement date' },
};
const EV = { txn_id: { aliases: ['Transaction ID', 'id', 'Refund ID', 'Dispute ID', 'Case ID'], required: true }, processor: { aliases: ['Processor', 'Platform', 'Gateway'] }, type: { aliases: ['Type', 'Transaction Type', 'Event'] }, date: { aliases: ['Date', 'Created (UTC)', 'Created', 'Refund Date'], type: 'date' }, amount: { aliases: ['Amount', 'Refund Amount', 'Dispute Amount', 'Gross'], type: 'money' }, gift_id: { aliases: ['Gift ID', 'Donation ID', 'Metadata Gift ID', 'Order ID'] }, status: { aliases: ['Status', 'Refund Status', 'Dispute Status'] }, evidence_due: { aliases: ['Evidence Due', 'Evidence Due By', 'Respond By', 'Response Due'], type: 'date', translate: 'due_date' } };
const GIFTS = { ...GIFT_FIELDS, ack_date: { aliases: ['Ack Date', 'Acknowledgement Date', 'Acknowledged Date', 'Thank You Date', 'Receipt Date'], type: 'date' } };
export const DEMO = { title: 'Fairgive Refunds Chargebacks', files: { events: 'events.csv', gifts: 'gifts.csv', settings: 'settings.json' }, explain: { arg: 'txn_id', value: 'RF-2' } };

export const manifest = giveAgent({
  pkg, prefix: 'refunds',
  description: pkg.description.replace(/^[^:]+:\s*/, ''),
  check: { title: 'Refunds and chargebacks', description: 'Matches each processor refund and card dispute to its CRM gift: full refunds whose gift still stands, partial refunds with the gift unchanged, refunds larger than the gift, refunds with no gift, thank-you letters for refunded gifts, and open disputes whose evidence is due soon or overdue.' },
  args: files, required: ['events', 'gifts'],
  sources: { events: { label: 'Refunds and disputes', args: ['events'], fields: EV }, gifts: sourceOf('CRM gifts', ['gifts'], GIFTS, ['gift_id', 'donor', 'gift_date', 'amount', 'status', 'ack_date'], GIFT_PROFILES) },
  settings: { defaults: DEFAULTS, schema: { type: 'object', additionalProperties: false, properties: {
    as_of: { type: ['string', 'null'], description: 'Date the check is made at (YYYY-MM-DD); default: today' },
    evidence_warning_days: { type: 'integer', minimum: 0, maximum: 60, description: 'Disputes with evidence due within this many days are flagged (default 7)' },
    tolerance: { type: 'number', minimum: 0, maximum: 100, description: 'Difference ignored (default 0.01)' },
  } } },
  run: ({ rows, settings }) => refunds(rows, settings),
  key: { arg: 'txn_id', field: 'txn_id', label: 'refund or dispute' },
  summary: (o) => `${o.totals.events} refund(s) and dispute(s) as of ${o.extra.as_of}: ${money(o.totals.refunded)} refunded, ${money(o.totals.disputed_open)} in open disputes, ${o.totals.crm_to_fix} CRM record(s) or letter(s) to fix.`,
  report: {
    title: 'Refunds and chargebacks', base: 'refunds-chargebacks',
    row: (i) => ({ txn_id: i.txn_id ?? '', processor: i.processor ?? '', type: i.type ?? '', date: i.date ?? '', amount: i.amount ?? '', gift_id: i.gift_id ?? '', donor: i.donor ?? '', event_status: i.event_status ?? '' }),
    htmlColumns: ['txn_id', 'processor', 'type', 'date', 'amount', 'gift_id', 'event_status'],
    sections: (o) => [{ title: 'By processor', rows: rollup(o.items, 'processor', (i) => i.processor || '(none)', { amount: (i) => i.amount }), columns: ['processor', 'count', 'amount'] }],
  },
  refused: [REFUSE.refund, REFUSE.crm, { name: 'dispute_respond', category: 'binding_send', description: 'Never submits evidence or responds to a card dispute; a person does that in the processor dashboard.' }],
  memory: null,
});
