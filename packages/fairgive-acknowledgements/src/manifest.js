import { readFileSync } from 'node:fs';
import { giveAgent, GIFT_FIELDS, GIFT_PROFILES, sourceOf, REFUSE, money, dollars, letter } from 'fairgive-core';
import { acknowledgements, DEFAULTS } from './logic.js';

const pkg = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'));
const files = {
  gifts: { type: 'string', description: 'Gift export from your donor CRM under --root: gift id, donor, e-mail, date, amount, status (refunded gifts are recognised)' },
  letters: { type: 'string', description: 'Acknowledgement letter log under --root: gift id, letter date, amount stated, and whether it has the goods-or-services statement' },
};
const LETTER_FIELDS = {
  gift_id: { aliases: ['Gift ID', 'Donation ID', 'Opportunity ID', 'Transaction ID', 'Gift Number'], required: true },
  letter_date: { aliases: ['Letter Date', 'Acknowledgement Date', 'Acknowledged Date', 'Thank You Date', 'Sent Date', 'Receipt Date', 'Date Sent'], type: 'date', translate: 'ack_date' },
  amount: { aliases: ['Amount', 'Amount Stated', 'Letter Amount', 'Receipt Amount', 'Acknowledged Amount'], type: 'money' },
  statement: { aliases: ['Statement', 'Goods or Services Statement', 'Includes Statement', 'GS Statement', 'Quid Pro Quo Statement'] },
};
export const DEMO = { title: 'Fairgive Acknowledgements', files: { gifts: 'gifts.csv', letters: 'letters.csv', settings: 'settings.json' }, explain: { arg: 'gift_id', value: 'G-4' }, draft: { donor_id: 'C-2', from: 'Dana Director, Example Community Fund (fictional)' } };

export const manifest = giveAgent({
  pkg, prefix: 'acks',
  description: pkg.description.replace(/^[^:]+:\s*/, ''),
  check: { title: 'Donor acknowledgements', description: 'Checks every gift at or over the threshold in your settings against the letter log: no letter after the policy days, letters sent late, letters for another amount, letters with no goods-or-services statement and letters standing for refunded gifts. Gifts still inside the sending window are shown as due soon.' },
  args: files, required: ['gifts'],
  sources: {
    gifts: sourceOf('CRM gifts', ['gifts'], GIFT_FIELDS, ['gift_id', 'donor_id', 'donor', 'email', 'gift_date', 'amount', 'fund', 'status'], GIFT_PROFILES),
    letters: { label: 'Acknowledgement letter log', args: ['letters'], fields: LETTER_FIELDS },
  },
  settings: { defaults: DEFAULTS, schema: { type: 'object', additionalProperties: false, properties: {
    threshold: { type: 'number', minimum: 0, description: 'Gifts at or over this amount need a letter (default 250, the US written-acknowledgement figure; set your own policy)' },
    days_to_send: { type: 'integer', minimum: 0, maximum: 400, description: 'Days your policy allows between a gift and its letter (default 30)' },
    as_of: { type: ['string', 'null'], description: 'Date the check is made at (YYYY-MM-DD); default: the latest gift date' },
    require_statement: { type: 'boolean', description: 'Whether a letter must say whether goods or services were given (default true)' },
    organization: { type: 'string', description: 'Your organization name for the drafted letters' },
    tolerance: { type: 'number', minimum: 0, maximum: 100, description: 'Difference ignored between gift and letter amounts (default 0.01)' },
  } } },
  run: ({ rows, settings }) => acknowledgements(rows, settings),
  key: { arg: 'gift_id', field: 'gift_id', label: 'gift' },
  summary: (o) => `${o.totals.gifts_checked} gift(s) checked as of ${o.extra.as_of || 'no date'} (threshold ${o.extra.threshold}): ${o.totals.missing_letters} with no letter (${money(o.totals.missing_amount)}), ${o.totals.letters_to_fix} letter(s) to correct.`,
  report: {
    title: 'Donor acknowledgements', base: 'acknowledgements',
    row: (i) => ({ gift_id: i.gift_id ?? '', donor_id: i.donor_id ?? '', donor: i.donor ?? '', gift_date: i.gift_date ?? '', amount: i.amount ?? '', letter_date: i.letter_date ?? '', letter_amount: i.letter_amount ?? '' }),
    htmlColumns: ['gift_id', 'donor', 'gift_date', 'amount', 'letter_date', 'letter_amount'],
  },
  draft: {
    noun: 'letter', verb: 'send', actor: 'a person on your team', required: ['gifts', 'donor_id'],
    description: 'Write drafts/letter-<donor id>.md: a thank-you and acknowledgement letter for every gift of one donor that has no letter or needs a corrected one, with the amounts and dates. Marked DRAFT; a person sends it.',
    args: { donor_id: { type: 'string', description: 'Donor or constituent id as the check shows it' }, from: { type: 'string', description: 'Signer name and title' } },
    build: (o, a, ctx) => {
      const mine = o.items.filter((i) => i.donor_id === String(a.donor_id).trim() && i.findings.some((f) => f.code !== 'ack_late'));
      if (!mine.length) throw new Error(`no gift from donor "${String(a.donor_id).slice(0, 40)}" needs a letter; pass a donor_id from acks_check`);
      const d = mine[0]; const org = o.settings_used.organization || '[TO CONFIRM organization name]';
      return { id: d.donor_id, to: d.email || undefined, amount: mine.reduce((t, i) => t + i.amount, 0), text: letter({ title: `Thank you for your gift${mine.length > 1 ? 's' : ''}`, to: d.email ? `${d.donor} <${d.email}>` : d.donor, from: a.from, re: `Acknowledgement from ${org}`,
        intro: `Dear ${d.donor},\n\nThank you for your generous support of ${org}. This letter acknowledges the following contribution${mine.length > 1 ? 's' : ''}:`,
        rows: mine.map((i) => ({ date: i.gift_date, amount: dollars(i.amount), gift: i.gift_id, note: i.findings.some((f) => f.code === 'ack_for_refunded_gift') ? 'Refunded: this replaces the earlier letter' : '' })), columns: ['date', 'amount', 'gift', 'note'],
        closing: ['No goods or services were provided in exchange for these contributions. [TO CONFIRM: change this sentence if the donor received any benefit]', '', 'With gratitude,', '', a.from || '[TO CONFIRM signer]'] }) };
    },
  },
  refused: [REFUSE.email, REFUSE.crm],
  memory: null,
});
