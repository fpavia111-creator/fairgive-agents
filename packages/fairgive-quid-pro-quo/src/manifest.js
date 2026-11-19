import { readFileSync } from 'node:fs';
import { giveAgent, GIFT_FIELDS, GIFT_PROFILES, fit, REFUSE, money } from 'fairgive-core';
import { quidProQuo, DEFAULTS } from './logic.js';

const pkg = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'));
const files = { payments: { type: 'string', description: 'Payments where the donor may have received something under --root (event tickets, auction purchases, premiums): gift id, donor, date, amount, benefit, benefit value, the deductible amount the receipt states, disclosure given (yes/no)' } };
const FIELDS = {
  gift_id: GIFT_FIELDS.gift_id, donor: GIFT_FIELDS.donor, gift_date: GIFT_FIELDS.gift_date, amount: GIFT_FIELDS.amount,
  benefit: { aliases: ['Benefit', 'Benefit Description', 'Premium', 'Goods or Services', 'Item Received'] },
  benefit_value: { aliases: ['Benefit Value', 'Fair Market Value', 'FMV', 'Premium Value', 'Goods and Services Value', 'Non-Deductible Amount'], type: 'money', translate: 'fmv' },
  receipt_deductible: { aliases: ['Receipt Deductible', 'Deductible Amount', 'Tax Deductible Amount', 'Receipt Amount', 'Receiptable Amount'], type: 'money', translate: 'deductible' },
  disclosure: { aliases: ['Disclosure', 'Disclosure Given', 'QPQ Disclosure', 'Quid Pro Quo Statement'] },
};
export const DEMO = { title: 'Fairgive Quid Pro Quo', files: { payments: 'payments.csv', settings: 'settings.json' }, explain: { arg: 'gift_id', value: 'Q-2' } };

export const manifest = giveAgent({
  pkg, prefix: 'qpq',
  description: pkg.description.replace(/^[^:]+:\s*/, ''),
  check: { title: 'Quid pro quo disclosures', description: 'For each payment where the donor received goods or services: works out the deductible part (payment less the value received), skips benefits inside the insubstantial-benefit limits in the settings, and lists payments over the threshold with no disclosure, receipts that state the wrong deductible amount, benefits with no value and benefits worth as much as the payment.' },
  args: files, required: ['payments'],
  sources: { payments: { label: 'Payments with benefits', args: ['payments'], fields: FIELDS, profiles: fit(GIFT_PROFILES, FIELDS) } },
  settings: { defaults: DEFAULTS, schema: { type: 'object', additionalProperties: false, properties: {
    qpq_threshold: { type: 'number', minimum: 0, description: 'Payments over this need a written disclosure when a benefit was received (default 75)' },
    low_cost_article: { type: 'number', minimum: 0, description: 'Value of a low-cost article that counts as insubstantial (default 13.60, the 2025 IRS figure; update yearly)' },
    low_cost_min_payment: { type: 'number', minimum: 0, description: 'Smallest payment for the low-cost article rule (default 68, the 2025 IRS figure; update yearly)' },
    insubstantial_pct: { type: 'number', minimum: 0, maximum: 100, description: 'Benefit up to this percent of the payment is insubstantial (default 2)' },
    insubstantial_cap: { type: 'number', minimum: 0, description: 'and no more than this amount (default 136, the 2025 IRS figure; update yearly)' },
    tolerance: { type: 'number', minimum: 0, maximum: 100, description: 'Difference ignored (default 0.01)' },
  } } },
  run: ({ rows, settings }) => quidProQuo(rows, settings),
  key: { arg: 'gift_id', field: 'gift_id', label: 'payment' },
  summary: (o) => `${o.totals.payments} payment(s), ${o.totals.with_benefit} with a benefit: ${o.totals.disclosures_missing} with no disclosure, ${o.totals.receipts_to_correct} receipt(s) to correct (deductible overstated by ${money(o.totals.overstated)}).`,
  report: {
    title: 'Quid pro quo disclosures', base: 'quid-pro-quo',
    row: (i) => ({ gift_id: i.gift_id ?? '', donor: i.donor ?? '', gift_date: i.gift_date ?? '', amount: i.amount ?? '', benefit: i.benefit ?? '', benefit_value: i.benefit_value ?? '', deductible: i.deductible ?? '', receipt_deductible: i.receipt_deductible ?? '' }),
    htmlColumns: ['gift_id', 'donor', 'amount', 'benefit', 'benefit_value', 'deductible', 'receipt_deductible'],
  },
  refused: [REFUSE.email, REFUSE.irs],
  memory: null,
});
