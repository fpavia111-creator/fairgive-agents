import { readFileSync } from 'node:fs';
import { giveAgent, GIFT_FIELDS, GIFT_PROFILES, DEPOSIT_FIELDS, GL_FIELDS, GL_PROFILES, sourceOf, REFUSE, money, rollup } from 'fairgive-core';
import { reconcile, DEFAULTS } from './logic.js';

const pkg = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'));
const files = {
  gifts: { type: 'string', description: 'Gift export from your donor CRM under --root (Raiser\'s Edge NXT, Salesforce NPSP, Bloomerang, DonorPerfect, Little Green Light, Neon, Givebutter or Classy): gift id, donor, date, amount, type, batch' },
  deposits: { type: 'string', description: 'Bank deposits or the bank statement credits under --root: date, amount, description, and the gift batch when your deposit slips name it' },
  gl: { type: 'string', description: 'Optional general ledger detail under --root (QuickBooks Online, Aplos, Sage Intacct or Financial Edge NXT) to compare contribution revenue month by month' },
};
export const DEMO = { title: 'Fairgive Gift Deposits', files: { gifts: 'gifts.csv', deposits: 'deposits.csv', gl: 'gl.csv', settings: 'settings.json' }, explain: { arg: 'item', value: 'Batch B-102' } };

export const manifest = giveAgent({
  pkg, prefix: 'deposits',
  description: pkg.description.replace(/^[^:]+:\s*/, ''),
  check: { title: 'Gifts against deposits and the ledger', description: 'Groups cash gifts by gift batch and matches each batch to the bank deposit that names it, or to a deposit of the same amount within the day window; lists batches never deposited or deposited short or over, gifts that may still be in transit, deposits with no gift in the CRM, and months where contribution revenue in the ledger differs from the CRM. Noncash gifts are left out of deposit matching.' },
  args: files, required: ['gifts', 'deposits'],
  sources: {
    gifts: sourceOf('CRM gifts', ['gifts'], GIFT_FIELDS, ['gift_id', 'donor_id', 'donor', 'gift_date', 'amount', 'fund', 'gift_type', 'method', 'batch'], GIFT_PROFILES),
    deposits: { label: 'Bank deposits', args: ['deposits'], fields: DEPOSIT_FIELDS },
    gl: sourceOf('General ledger detail', ['gl'], GL_FIELDS, ['entry_id', 'date', 'account', 'account_name', 'fund', 'debit', 'credit', 'amount', 'memo'], GL_PROFILES),
  },
  settings: { defaults: DEFAULTS, schema: { type: 'object', additionalProperties: false, properties: {
    days: { type: 'integer', minimum: 0, maximum: 60, description: 'Days between a gift date and its deposit that still count as a match (default 5)' },
    tolerance: { type: 'number', minimum: 0, maximum: 100, description: 'Difference ignored when comparing amounts (default 0.01)' },
    noncash_types: { type: 'array', items: { type: 'string' }, description: 'Gift types or payment methods that never reach the bank (stock, in-kind) and are left out of deposit matching' },
    revenue_accounts: { type: 'array', items: { type: 'string' }, description: 'Ledger account numbers, or their first digits, that hold contribution revenue (default ["4"])' },
    ignore_deposit_words: { type: 'array', items: { type: 'string' }, description: 'Words in a deposit description that mark it as not a gift deposit (interest, transfer)' },
  } } },
  run: ({ rows, settings }) => reconcile(rows, settings),
  key: { arg: 'item', field: 'item', label: 'batch, gift, deposit or month' },
  summary: (o) => `${o.totals.gifts} cash gift(s) for ${money(o.totals.crm_cash_total)} and ${o.totals.deposits} deposit(s) for ${money(o.totals.deposit_total)}: not deposited ${money(o.totals.not_deposited)}, deposits short or over ${money(o.totals.deposit_short_or_over)}, deposits with no gift ${money(o.totals.deposits_not_in_crm)}, in transit ${money(o.totals.in_transit)}, ledger gap ${money(o.totals.gl_gap)}.`,
  report: {
    title: 'Gift and deposit reconciliation', base: 'gift-deposits',
    row: (i) => ({ item: i.item ?? '', kind: i.kind ?? '', date: i.date ?? '', gifts: i.gifts ?? '', crm_amount: i.crm_amount ?? '', deposit: i.deposit ?? '', deposit_amount: i.deposit_amount ?? '', gl_amount: i.gl_amount ?? '' }),
    htmlColumns: ['item', 'date', 'crm_amount', 'deposit', 'deposit_amount', 'gl_amount'],
    sections: (o) => [{ title: 'By status', rows: rollup(o.items, 'status', (i) => i.status, { amount: (i) => i.crm_amount ?? i.deposit_amount ?? 0 }), columns: ['status', 'count', 'amount'] }],
  },
  refused: [REFUSE.ledger, REFUSE.crm, REFUSE.transfer],
  memory: null,
});
