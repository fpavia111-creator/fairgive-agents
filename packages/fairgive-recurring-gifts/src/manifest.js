import { readFileSync } from 'node:fs';
import { giveAgent, REFUSE, money, dollars, letter, rollup } from 'fairgive-core';
import { recurring, DEFAULTS } from './logic.js';

const pkg = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'));
const files = {
  plans: { type: 'string', description: 'Recurring gift plans under --root (from Stripe, PayPal, Givebutter, Classy or your CRM): plan id, donor, e-mail, amount, frequency, start date, status, cancel date, card expiry' },
  charges: { type: 'string', description: 'Charges or transactions under --root with the plan id: date, amount, status (succeeded or failed)' },
};
const PLAN_FIELDS = {
  plan_id: { aliases: ['Plan ID', 'Subscription ID', 'Recurring ID', 'Recurring Gift ID', 'Schedule ID', 'Recurring Donation ID'], required: true },
  donor_id: { aliases: ['Donor ID', 'Constituent ID', 'Customer ID', 'Account ID', 'Contact ID'] },
  donor: { aliases: ['Donor', 'Donor Name', 'Name', 'Customer Name', 'Full Name'], personal: true },
  email: { aliases: ['Email', 'Customer Email', 'Donor Email', 'Email Address'], personal: true },
  amount: { aliases: ['Amount', 'Recurring Amount', 'Plan Amount', 'Installment Amount'], type: 'money' },
  frequency: { aliases: ['Frequency', 'Interval', 'Installment Period', 'Billing Interval', 'Schedule'] },
  start_date: { aliases: ['Start Date', 'Created', 'Created (UTC)', 'Established Date', 'First Charge'], type: 'date' },
  status: { aliases: ['Status', 'Plan Status', 'Subscription Status', 'Recurring Status'] },
  cancel_date: { aliases: ['Cancel Date', 'Canceled At (UTC)', 'Cancelled Date', 'Closed Date', 'Ended At'], type: 'date', translate: 'end_date' },
  card_expiry: { aliases: ['Card Expiry', 'Card Expiration', 'Expiration', 'Exp Date', 'Card Exp'], translate: 'expires' },
  processor: { aliases: ['Processor', 'Platform', 'Gateway', 'Payment Processor'] },
};
const CHARGE_FIELDS = {
  txn_id: { aliases: ['Transaction ID', 'id', 'Charge ID', 'Payment ID'] },
  plan_id: { aliases: ['Plan ID', 'Subscription ID', 'Subscription', 'Recurring ID', 'Recurring Gift ID'], required: true },
  date: { aliases: ['Date', 'Created (UTC)', 'Created', 'Charge Date', 'Transaction Date'], type: 'date', required: true },
  amount: { aliases: ['Amount', 'Charge Amount', 'Gross'], type: 'money' },
  status: { aliases: ['Status', 'Payment Status', 'Charge Status', 'Outcome'] },
};
export const DEMO = { title: 'Fairgive Recurring Gifts', files: { plans: 'plans.csv', charges: 'charges.csv', settings: 'settings.json' }, explain: { arg: 'plan_id', value: 'P-3' }, draft: { plan_id: 'P-3', from: 'Dana Director (fictional)' } };

export const manifest = giveAgent({
  pkg, prefix: 'recurring',
  description: pkg.description.replace(/^[^:]+:\s*/, ''),
  check: { title: 'Recurring gifts', description: 'Checks each recurring plan against its charges: the last charges failed, the schedule expected a charge that was never attempted, the card expired or expires soon, a charge after the plan was cancelled, or a charge for another amount. Shows the monthly value of the active plans and the part at risk.' },
  args: files, required: ['plans', 'charges'],
  sources: { plans: { label: 'Recurring plans', args: ['plans'], fields: PLAN_FIELDS }, charges: { label: 'Charges', args: ['charges'], fields: CHARGE_FIELDS } },
  settings: { defaults: DEFAULTS, schema: { type: 'object', additionalProperties: false, properties: {
    as_of: { type: ['string', 'null'], description: 'Date the check is made at (YYYY-MM-DD); default: the latest charge date' },
    failures_in_a_row: { type: 'integer', minimum: 1, maximum: 12, description: 'Failed charges in a row that count as repeated failures (default 2)' },
    expiry_warning_days: { type: 'integer', minimum: 0, maximum: 365, description: 'Days before a card expires to warn (default 45)' },
    grace_days: { type: 'integer', minimum: 0, maximum: 60, description: 'Days after a charge was due before it counts as missed (default 7)' },
    organization: { type: 'string', description: 'Your organization name for the drafted notes' },
    tolerance: { type: 'number', minimum: 0, maximum: 100, description: 'Difference ignored between plan and charge amounts (default 0.01)' },
  } } },
  run: ({ rows, settings }) => recurring(rows, settings),
  key: { arg: 'plan_id', field: 'plan_id', label: 'plan' },
  summary: (o) => `${o.totals.plans} plan(s), ${o.totals.active} active, worth ${money(o.totals.monthly_value)} a month as of ${o.extra.as_of || 'no date'}: ${money(o.totals.at_risk_monthly)} a month at risk, ${o.totals.failing} failing, ${o.totals.missed} missed, ${o.totals.cards_to_update} card(s) to update.`,
  report: {
    title: 'Recurring gifts', base: 'recurring-gifts',
    row: (i) => ({ plan_id: i.plan_id ?? '', donor_id: i.donor_id ?? '', donor: i.donor ?? '', processor: i.processor ?? '', frequency: i.frequency ?? '', amount: i.amount ?? '', monthly_equivalent: i.monthly_equivalent ?? '', plan_status: i.plan_status ?? '', last_charge: i.last_charge ?? '', card_expiry: i.card_expiry ?? '' }),
    htmlColumns: ['plan_id', 'donor', 'processor', 'amount', 'frequency', 'last_charge', 'card_expiry'],
    sections: (o) => [{ title: 'By processor', rows: rollup(o.items, 'processor', (i) => i.processor || '(none)', { monthly_equivalent: (i) => i.monthly_equivalent }), columns: ['processor', 'count', 'monthly_equivalent'] }],
  },
  draft: {
    noun: 'card_note', verb: 'send', actor: 'a person on your team', required: ['plans', 'charges', 'plan_id'],
    description: 'Write drafts/card_note-<plan id>.md: a short note asking one donor to update the card for their recurring gift, with the amount and what happened. Marked DRAFT; a person sends it.',
    args: { plan_id: { type: 'string', description: 'Plan id as the check shows it' }, from: { type: 'string', description: 'Signer name and title' } },
    build: (o, a) => {
      const p = o.items.find((i) => i.plan_id === String(a.plan_id).trim());
      if (!p) throw new Error(`plan "${String(a.plan_id).slice(0, 40)}" not found; pass a plan_id from recurring_check`);
      const why = p.findings.filter((f) => /fail|card_|missed/.test(f.code));
      if (!why.length) throw new Error(`plan ${p.plan_id} has no failed charge, missed charge or card to update`);
      const org = o.settings_used.organization || '[TO CONFIRM organization name]';
      return { id: p.plan_id, to: p.email || undefined, amount: p.amount, text: letter({ title: 'Your recurring gift', to: p.email ? `${p.donor} <${p.email}>` : p.donor, from: a.from, re: `Please update your card for your ${p.frequency.toLowerCase()} gift to ${org}`,
        intro: `Dear ${p.donor},\n\nThank you for your ${p.frequency.toLowerCase()} gift of ${dollars(p.amount)} to ${org}. ${why.some((f) => /fail|missed/.test(f.code)) ? 'Your most recent gift did not go through.' : 'The card on file for your gift is about to expire.'} If you would like to keep giving, you can update your card here: [TO CONFIRM link to your giving page].`,
        closing: ['If you have decided to stop or change your gift, just reply and we will take care of it.', '', 'With gratitude,', '', a.from || '[TO CONFIRM signer]'] }) };
    },
  },
  refused: [REFUSE.email, REFUSE.refund, { name: 'card_charge', category: 'move_money', description: 'Never charges or retries a card, and never changes a plan with the processor.' }],
  memory: null,
});
