import { readFileSync } from 'node:fs';
import { giveAgent, GIFT_FIELDS, GIFT_PROFILES, fit, REFUSE, money, rollup } from 'fairgive-core';
import { dafGrants, DEFAULTS } from './logic.js';

const pkg = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'));
const files = { gifts: { type: 'string', description: 'Gift export from your donor CRM under --root: gift id, hard-credit donor, date, amount, payment method or source, DAF sponsor, advisor (soft credit), pledge it was applied to, benefit value, whether the acknowledgement said it was deductible' } };
const F = {
  gift_id: GIFT_FIELDS.gift_id, donor_id: GIFT_FIELDS.donor_id, donor: { ...GIFT_FIELDS.donor, personal: true }, gift_date: GIFT_FIELDS.gift_date, amount: GIFT_FIELDS.amount, method: { ...GIFT_FIELDS.method, aliases: [...GIFT_FIELDS.method.aliases, 'Gift Source', 'Source Type', 'Giving Vehicle'] },
  daf_sponsor: { aliases: ['DAF Sponsor', 'Sponsor', 'Sponsoring Organization', 'Fund Sponsor', 'Grantor'] },
  advisor: { aliases: ['Advisor', 'DAF Advisor', 'Soft Credit', 'Soft Credit Name', 'Recommended By'], personal: true, translate: 'soft_credit' },
  pledge_id: { aliases: ['Pledge ID', 'Applied To Pledge', 'Pledge'] },
  benefit_value: { aliases: ['Benefit Value', 'Fair Market Value', 'FMV', 'Premium Value'], type: 'money', translate: 'fmv' },
  ack_says_deductible: { aliases: ['Ack Says Deductible', 'Receipted As Deductible', 'Tax Receipt Issued', 'Deductible Statement'] },
};
export const DEMO = { title: 'Fairgive DAF Grants', files: { gifts: 'gifts.csv', settings: 'settings.json' }, explain: { arg: 'gift_id', value: 'D-3' } };

export const manifest = giveAgent({
  pkg, prefix: 'daf',
  description: pkg.description.replace(/^[^:]+:\s*/, ''),
  check: { title: 'Donor-advised fund grants', description: 'Finds gifts from donor-advised funds (by method, sponsor or donor name) and lists the ones to look at: hard credit given to the advisor instead of the sponsor, grants that paid for event benefits, grants applied to a personal pledge, acknowledgements that told the advisor the grant is deductible, and DAF gifts with no sponsor recorded.' },
  args: files, required: ['gifts'],
  sources: { gifts: { label: 'CRM gifts', args: ['gifts'], fields: F, profiles: fit(GIFT_PROFILES, F) } },
  settings: { defaults: DEFAULTS, schema: { type: 'object', additionalProperties: false, properties: {
    daf_words: { type: 'array', items: { type: 'string' }, description: 'Words in the method, source or donor name that mark a gift as coming from a donor-advised fund' },
  } } },
  run: ({ rows, settings }) => dafGrants(rows, settings),
  key: { arg: 'gift_id', field: 'gift_id', label: 'gift' },
  summary: (o) => `${o.totals.daf_gifts} DAF gift(s) for ${money(o.totals.daf_amount)} from ${o.totals.sponsors} sponsor(s); ${o.totals.to_review} to look at.`,
  report: {
    title: 'Donor-advised fund grants', base: 'daf-grants',
    row: (i) => ({ gift_id: i.gift_id ?? '', donor: i.donor ?? '', sponsor: i.sponsor ?? '', advisor: i.advisor ?? '', gift_date: i.gift_date ?? '', amount: i.amount ?? '', pledge_id: i.pledge_id ?? '', benefit_value: i.benefit_value ?? '' }),
    htmlColumns: ['gift_id', 'sponsor', 'advisor', 'gift_date', 'amount'],
    sections: (o) => [{ title: 'By sponsor', rows: rollup(o.items, 'sponsor', (i) => i.sponsor || '(none)', { amount: (i) => i.amount }), columns: ['sponsor', 'count', 'amount'] }],
  },
  refused: [REFUSE.crm, REFUSE.email],
  memory: null,
});
