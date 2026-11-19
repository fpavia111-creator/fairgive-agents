import { readFileSync } from 'node:fs';
import { giveAgent, REFUSE, money, dollars, letter, rollup } from 'fairgive-core';
import { pledges, DEFAULTS } from './logic.js';

const pkg = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'));
const files = {
  pledges: { type: 'string', description: 'Pledge export under --root: pledge id, donor, e-mail, pledge date, total, number of installments, frequency, first due date, status, conditional (yes/no)' },
  payments: { type: 'string', description: 'Pledge payments under --root: pledge id, date, amount' },
  writeoffs: { type: 'string', description: 'Optional write-off log under --root: pledge id, date, amount, approved by' },
};
const PLEDGE = {
  pledge_id: { aliases: ['Pledge ID', 'Opportunity ID', 'Pledge Number', 'Commitment ID'], required: true },
  donor_id: { aliases: ['Donor ID', 'Constituent ID', 'Account ID', 'Contact ID'] },
  donor: { aliases: ['Donor', 'Donor Name', 'Constituent Name', 'Account Name', 'Name'], personal: true },
  email: { aliases: ['Email', 'Email Address', 'Donor Email'], personal: true },
  pledge_date: { aliases: ['Pledge Date', 'Date', 'Close Date', 'Commitment Date'], type: 'date', translate: 'date' },
  total: { aliases: ['Total', 'Pledge Amount', 'Amount', 'Commitment Amount'], type: 'money', translate: 'amount' },
  installments: { aliases: ['Installments', 'Number of Installments', 'Number of Payments', 'Payments'], type: 'number', translate: 'installment' },
  frequency: { aliases: ['Frequency', 'Installment Period', 'Schedule'] },
  first_due: { aliases: ['First Due', 'First Installment Date', 'First Payment Date', 'Due Date', 'Start Date'], type: 'date', translate: 'due_date' },
  status: { aliases: ['Status', 'Stage', 'Pledge Status'] },
  conditional: { aliases: ['Conditional', 'Is Conditional', 'Condition'] },
};
const PAY = { pledge_id: { aliases: ['Pledge ID', 'Opportunity ID', 'Pledge Number'], required: true }, date: { aliases: ['Date', 'Payment Date', 'Received Date'], type: 'date' }, amount: { aliases: ['Amount', 'Payment Amount', 'Paid Amount'], type: 'money' } };
const WO = { pledge_id: { aliases: ['Pledge ID', 'Opportunity ID'], required: true }, date: { aliases: ['Date', 'Write-off Date'], type: 'date' }, amount: { aliases: ['Amount', 'Write-off Amount', 'Written Off'], type: 'money' }, approved_by: { aliases: ['Approved By', 'Approver', 'Authorized By'], personal: true, translate: 'preapproved_by' } };
export const DEMO = { title: 'Fairgive Pledges', files: { pledges: 'pledges.csv', payments: 'payments.csv', writeoffs: 'writeoffs.csv', settings: 'settings.json' }, explain: { arg: 'pledge_id', value: 'PL-2' }, draft: { pledge_id: 'PL-2', from: 'Dana Director (fictional)' } };

export const manifest = giveAgent({
  pkg, prefix: 'pledges',
  description: pkg.description.replace(/^[^:]+:\s*/, ''),
  check: { title: 'Pledges receivable', description: 'Splits each pledge into its installments, works out what was due by the as-of date, and ages what is past due from the oldest unpaid installment. Flags pledges over 90 days past due, overpaid pledges and write-offs with no approver or over the balance; lists pledges paid and still open, conditional pledges kept open and multi-year pledges with no discount rate. Shows the present value when a discount rate is set.' },
  args: files, required: ['pledges'],
  sources: { pledges: { label: 'Pledges', args: ['pledges'], fields: PLEDGE }, payments: { label: 'Pledge payments', args: ['payments'], fields: PAY }, writeoffs: { label: 'Write-offs', args: ['writeoffs'], fields: WO } },
  settings: { defaults: DEFAULTS, schema: { type: 'object', additionalProperties: false, properties: {
    as_of: { type: ['string', 'null'], description: 'Date the check is made at (YYYY-MM-DD); default: today' },
    buckets: { type: 'array', items: { type: 'integer', minimum: 1, maximum: 3650 }, description: 'Aging bucket limits in days (default [30, 60, 90])' },
    discount_rate: { type: 'number', minimum: 0, maximum: 50, description: 'Annual percent to discount installments to present value (default 0: none; your auditor sets the rate)' },
    organization: { type: 'string', description: 'Your organization name for the drafted reminder' },
    tolerance: { type: 'number', minimum: 0, maximum: 100, description: 'Difference ignored (default 0.01)' },
  } } },
  run: ({ rows, settings }) => pledges(rows, settings),
  key: { arg: 'pledge_id', field: 'pledge_id', label: 'pledge' },
  summary: (o) => `${o.totals.pledges} pledge(s) as of ${o.extra.as_of}: receivable ${money(o.totals.receivable)} (past due ${money(o.totals.past_due)}), conditional ${money(o.totals.conditional)}, written off ${money(o.totals.written_off)}${o.totals.present_value !== null ? `, present value ${money(o.totals.present_value)}` : ''}.`,
  report: {
    title: 'Pledges receivable', base: 'pledges',
    row: (i) => ({ pledge_id: i.pledge_id ?? '', donor_id: i.donor_id ?? '', donor: i.donor ?? '', total: i.total ?? '', paid: i.paid ?? '', written_off: i.written_off ?? '', balance: i.balance ?? '', past_due: i.past_due ?? '', aging: i.aging ?? '', present_value: i.present_value ?? '' }),
    htmlColumns: ['pledge_id', 'donor', 'total', 'paid', 'balance', 'past_due', 'aging'],
    sections: (o) => [{ title: 'Aging', rows: rollup(o.items, 'aging', (i) => i.aging, { past_due: (i) => i.past_due, balance: (i) => i.balance }), columns: ['aging', 'count', 'past_due', 'balance'] }],
  },
  draft: {
    noun: 'reminder', verb: 'send', actor: 'a person on your team', required: ['pledges', 'pledge_id'],
    description: 'Write drafts/reminder-<pledge id>.md: a friendly pledge reminder to one donor with the amount past due and the balance. Marked DRAFT; a person sends it.',
    args: { pledge_id: { type: 'string', description: 'Pledge id as the check shows it' }, from: { type: 'string', description: 'Signer name and title' } },
    build: (o, a) => {
      const p = o.items.find((i) => i.pledge_id === String(a.pledge_id).trim());
      if (!p) throw new Error(`pledge "${String(a.pledge_id).slice(0, 40)}" not found; pass a pledge_id from pledges_check`);
      if (!(p.past_due > 0)) throw new Error(`pledge ${p.pledge_id} has nothing past due`);
      const org = o.settings_used.organization || '[TO CONFIRM organization name]';
      return { id: p.pledge_id, to: p.email || undefined, amount: p.past_due, text: letter({ title: 'Your pledge', to: p.email ? `${p.donor} <${p.email}>` : p.donor, from: a.from, re: `Your pledge to ${org}`,
        intro: `Dear ${p.donor},\n\nThank you for your pledge of ${dollars(p.total)} to ${org}. Our records show ${dollars(p.paid)} received so far, and ${dollars(p.past_due)} that was due by ${o.extra.as_of}.`,
        closing: [`If you have already sent it, thank you, and please ignore this note. If you would like to change your schedule, just reply. Remaining balance: ${dollars(p.balance)}.`, '', 'How to give: [TO CONFIRM giving page or mailing address]', '', 'With gratitude,', '', a.from || '[TO CONFIRM signer]'] }) };
    },
  },
  refused: [REFUSE.email, REFUSE.ledger, REFUSE.crm],
  memory: null,
});
