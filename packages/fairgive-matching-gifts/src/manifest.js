import { readFileSync } from 'node:fs';
import { giveAgent, GIFT_FIELDS, GIFT_PROFILES, sourceOf, REFUSE, money, dollars, letter, rollup } from 'fairgive-core';
import { matching, DEFAULTS } from './logic.js';

const pkg = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'));
const files = {
  gifts: { type: 'string', description: 'Gift export from your donor CRM under --root with the donor\'s employer: gift id, donor, e-mail, date, amount, employer' },
  employers: { type: 'string', description: 'Matching gift programs under --root: employer, ratio (1 for 1:1), minimum gift, yearly maximum per donor, days after the gift a claim is accepted' },
  claims: { type: 'string', description: 'Optional match claims under --root: gift id, date submitted, status, amount received, date received' },
};
const GIFTS = { ...GIFT_FIELDS, employer: { aliases: ['Employer', 'Company', 'Organization', 'Employer Name', 'Matching Company'] } };
const EMP = { employer: { aliases: ['Employer', 'Company', 'Matching Company'], required: true }, ratio: { aliases: ['Ratio', 'Match Ratio', 'Multiplier'], type: 'number' }, min_gift: { aliases: ['Min Gift', 'Minimum Gift', 'Minimum'], type: 'money' }, max_per_year: { aliases: ['Max Per Year', 'Annual Maximum', 'Maximum', 'Max'], type: 'money' }, deadline_days: { aliases: ['Deadline Days', 'Days To Submit', 'Submission Window Days'], type: 'number', translate: 'days' } };
const CLAIM = { gift_id: { aliases: ['Gift ID', 'Donation ID', 'Opportunity ID'], required: true }, submitted_date: { aliases: ['Submitted Date', 'Submitted', 'Claim Date', 'Date Submitted'], type: 'date', translate: 'date' }, status: { aliases: ['Status', 'Claim Status'] }, received_amount: { aliases: ['Received Amount', 'Amount Received', 'Match Amount', 'Paid Amount'], type: 'money', translate: 'amount' }, received_date: { aliases: ['Received Date', 'Paid Date', 'Date Received'], type: 'date', translate: 'date' } };
export const DEMO = { title: 'Fairgive Matching Gifts', files: { gifts: 'gifts.csv', employers: 'employers.csv', claims: 'claims.csv', settings: 'settings.json' }, explain: { arg: 'gift_id', value: 'M-3' }, draft: { gift_id: 'M-3', from: 'Dana Director (fictional)' } };

export const manifest = giveAgent({
  pkg, prefix: 'matching',
  description: pkg.description.replace(/^[^:]+:\s*/, ''),
  check: { title: 'Matching gift claims', description: 'For each gift from a donor whose employer matches gifts: the expected match (gift times the ratio, within the minimum gift and the yearly maximum per donor), the claim deadline and the claim recorded. Flags matches whose deadline passed or is close; lists matches not claimed, matches paid for another amount, claims waiting too long and employers not in your program list.' },
  args: files, required: ['gifts', 'employers'],
  sources: { gifts: sourceOf('CRM gifts', ['gifts'], GIFTS, ['gift_id', 'donor_id', 'donor', 'email', 'gift_date', 'amount', 'employer'], GIFT_PROFILES), employers: { label: 'Matching programs', args: ['employers'], fields: EMP }, claims: { label: 'Match claims', args: ['claims'], fields: CLAIM } },
  settings: { defaults: DEFAULTS, schema: { type: 'object', additionalProperties: false, properties: {
    as_of: { type: ['string', 'null'], description: 'Date the check is made at (YYYY-MM-DD); default: today' },
    soon_days: { type: 'integer', minimum: 0, maximum: 365, description: 'A claim deadline within this many days is flagged (default 30)' },
    pending_days: { type: 'integer', minimum: 0, maximum: 730, description: 'A claim not paid after this many days is watched (default 90)' },
    organization: { type: 'string', description: 'Your organization name for the drafted reminder' },
    tolerance: { type: 'number', minimum: 0, maximum: 100, description: 'Difference ignored (default 0.01)' },
  } } },
  run: ({ rows, settings }) => matching(rows, settings),
  key: { arg: 'gift_id', field: 'gift_id', label: 'gift' },
  summary: (o) => `${o.totals.eligible_gifts} matchable gift(s) as of ${o.extra.as_of}: expected match ${money(o.totals.expected_match)}, not yet claimed ${money(o.totals.unclaimed)}, received ${money(o.totals.received)}, missed (deadline passed) ${money(o.totals.missed)}.`,
  report: {
    title: 'Matching gift claims', base: 'matching-gifts',
    row: (i) => ({ gift_id: i.gift_id ?? '', donor: i.donor ?? '', employer: i.employer ?? '', gift_date: i.gift_date ?? '', amount: i.amount ?? '', expected_match: i.expected_match ?? '', deadline: i.deadline ?? '', claimed: i.claimed ?? '', received: i.received ?? '' }),
    htmlColumns: ['gift_id', 'donor', 'employer', 'amount', 'expected_match', 'deadline', 'received'],
    sections: (o) => [{ title: 'By employer', rows: rollup(o.items, 'employer', (i) => i.employer, { expected_match: (i) => i.expected_match || 0, received: (i) => i.received || 0 }), columns: ['employer', 'count', 'expected_match', 'received'] }],
  },
  draft: {
    noun: 'match_reminder', verb: 'send', actor: 'a person on your team', required: ['gifts', 'employers', 'gift_id'],
    description: 'Write drafts/match_reminder-<gift id>.md: a note asking one donor to submit their employer\'s matching gift request, with the amount and deadline. Marked DRAFT; a person sends it. The agent never submits a claim.',
    args: { gift_id: { type: 'string', description: 'Gift id as the check shows it' }, from: { type: 'string', description: 'Signer name and title' } },
    build: (o, a) => {
      const g = o.items.find((i) => i.gift_id === String(a.gift_id).trim());
      if (!g) throw new Error(`gift "${String(a.gift_id).slice(0, 40)}" not found; pass a gift_id from matching_check`);
      if (!g.findings.some((f) => /match_not_claimed|match_deadline_soon/.test(f.code))) throw new Error(`gift ${g.gift_id} has no open match to ask for`);
      const org = o.settings_used.organization || '[TO CONFIRM organization name]';
      return { id: g.gift_id, to: g.email || undefined, amount: g.expected_match, text: letter({ title: 'Double your gift', to: g.email ? `${g.donor} <${g.donor && g.email}>` : g.donor, from: a.from, re: `${g.employer} matching gift for your gift to ${org}`,
        intro: `Dear ${g.donor},\n\nThank you for your gift of ${dollars(g.amount)} on ${g.gift_date}. ${g.employer} may match it with ${dollars(g.expected_match)}. The request has to be made by ${g.deadline || '[TO CONFIRM deadline]'} through your employer's matching gift site: [TO CONFIRM link].`,
        closing: ['Thank you for considering it.', '', a.from || '[TO CONFIRM signer]'] }) };
    },
  },
  refused: [REFUSE.email, { name: 'match_portal_submit', category: 'binding_send', description: 'Never logs in to an employer matching portal or submits a claim.' }],
  memory: null,
});
