import { readFileSync } from 'node:fs';
import { giveAgent, GIFT_FIELDS, GIFT_PROFILES, FUND_FIELDS, sourceOf, REFUSE, money, rollup } from 'fairgive-core';
import { giftCoding, DEFAULTS } from './logic.js';

const pkg = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'));
const files = {
  gifts: { type: 'string', description: 'Gift export from your donor CRM under --root: gift id, donor, date, amount, fund, appeal, gift note or memo' },
  funds: { type: 'string', description: 'Fund list under --root: fund code, name, restriction, active (yes/no), the words that name its purpose (separated by ;)' },
  appeals: { type: 'string', description: 'Optional appeals under --root: appeal code, default fund' },
};
const AP = { appeal: { aliases: ['Appeal', 'Appeal ID', 'Appeal Code', 'Campaign'], required: true }, default_fund: { aliases: ['Default Fund', 'Fund', 'Designation'], translate: 'fund' } };
export const DEMO = { title: 'Fairgive Gift Coding', files: { gifts: 'gifts.csv', funds: 'funds.csv', appeals: 'appeals.csv', settings: 'settings.json' }, explain: { arg: 'gift_id', value: 'CG-2' } };

export const manifest = giveAgent({
  pkg, prefix: 'coding',
  description: pkg.description.replace(/^[^:]+:\s*/, ''),
  check: { title: 'Gift coding', description: 'Reads each gift\'s note against the words that name each restricted fund\'s purpose and flags gifts coded to another fund. Lists notes that designate a gift for a purpose no fund matches, gifts coded to inactive or unknown funds, and gifts whose appeal has a different default fund, with the fund the gift probably belongs to.' },
  args: files, required: ['gifts', 'funds'],
  sources: { gifts: sourceOf('CRM gifts', ['gifts'], GIFT_FIELDS, ['gift_id', 'donor', 'gift_date', 'amount', 'fund', 'appeal', 'memo'], GIFT_PROFILES), funds: sourceOf('Fund list', ['funds'], FUND_FIELDS, ['fund', 'fund_name', 'restriction', 'active', 'keywords']), appeals: { label: 'Appeals', args: ['appeals'], fields: AP } },
  settings: { defaults: DEFAULTS, schema: { type: 'object', additionalProperties: false, properties: {
    restriction_words: { type: 'array', items: { type: 'string' }, description: 'Words in a note that say the donor designated the gift ("designated for", "only for")' },
  } } },
  run: ({ rows, settings }) => giftCoding(rows, settings),
  key: { arg: 'gift_id', field: 'gift_id', label: 'gift' },
  summary: (o) => `${o.totals.gifts} gift(s) for ${money(o.totals.amount)}: ${o.totals.likely_miscoded} likely coded to the wrong fund (${money(o.totals.likely_miscoded_amount)}), ${o.totals.to_review} to review.`,
  report: {
    title: 'Gift coding', base: 'gift-coding',
    row: (i) => ({ gift_id: i.gift_id ?? '', donor: i.donor ?? '', gift_date: i.gift_date ?? '', amount: i.amount ?? '', fund: i.fund ?? '', appeal: i.appeal ?? '', memo: i.memo ?? '', suggested_fund: i.suggested_fund ?? '' }),
    htmlColumns: ['gift_id', 'amount', 'fund', 'appeal', 'memo', 'suggested_fund'],
    sections: (o) => [{ title: 'By fund', rows: rollup(o.items, 'fund', (i) => i.fund || '(none)', { amount: (i) => i.amount }), columns: ['fund', 'count', 'amount'] }],
  },
  refused: [REFUSE.crm],
  memory: { kind: 'fund_alias', description: 'Another name a gift export uses for one of your funds, e.g. {"name": "General Operating", "means": "GEN"}.', effect: 'reads gifts coded with that name as coded to the fund it means', fields: { gifts: ['fund'] } },
});
