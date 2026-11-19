import { readFileSync } from 'node:fs';
import { giveAgent, GIFT_FIELDS, GIFT_PROFILES, sourceOf, REFUSE, money, rollup } from 'fairgive-core';
import { lapsed, DEFAULTS } from './logic.js';

const pkg = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'));
const files = { gifts: { type: 'string', description: 'Gift export from your donor CRM under --root covering at least the look-back years: donor id, donor, gift date, amount' } };
export const DEMO = { title: 'Fairgive Lapsed Donors', files: { gifts: 'gifts.csv', settings: 'settings.json' }, explain: { arg: 'donor_id', value: 'C-2' } };

export const manifest = giveAgent({
  pkg, prefix: 'lapsed',
  description: pkg.description.replace(/^[^:]+:\s*/, ''),
  check: { title: 'Lapsed donors', description: 'Totals each donor\'s giving by fiscal year and lists donors who gave last year and not yet this year (LYBUNT), donors who gave in an earlier year of the look-back and not since (SYBUNT), donors giving well below last year so far, and new donors. Shows retention: last year\'s donors who gave again this year.' },
  args: files, required: ['gifts'],
  sources: { gifts: sourceOf('CRM gifts', ['gifts'], GIFT_FIELDS, ['gift_id', 'donor_id', 'donor', 'gift_date', 'amount'], GIFT_PROFILES) },
  settings: { defaults: DEFAULTS, schema: { type: 'object', additionalProperties: false, properties: {
    fiscal_year_start: { type: 'integer', minimum: 1, maximum: 12, description: 'First month of your fiscal year (1 = January, 7 = July; default 1)' },
    as_of: { type: ['string', 'null'], description: 'Date the check is made at (YYYY-MM-DD); default: the latest gift date' },
    lookback_years: { type: 'integer', minimum: 1, maximum: 20, description: 'Fiscal years before this one that count for SYBUNT (default 4)' },
    downgrade_pct: { type: 'number', minimum: 0, maximum: 100, description: 'Percent below last year that counts as a downgrade so far (default 25)' },
  } } },
  run: ({ rows, settings }) => lapsed(rows, settings),
  key: { arg: 'donor_id', field: 'donor_id', label: 'donor' },
  summary: (o) => `FY${o.extra.fiscal_year} as of ${o.extra.as_of || 'no date'}: ${o.totals.lybunt} LYBUNT donor(s) (${money(o.totals.lybunt_amount)} last year), ${o.totals.sybunt} SYBUNT (${money(o.totals.sybunt_amount)}), ${o.totals.new_donors} new. Retention ${o.totals.retention_pct}% (${o.totals.retained} of ${o.totals.last_year_donors}).`,
  report: {
    title: 'Lapsed donors', base: 'lapsed-donors',
    row: (i) => ({ donor_id: i.donor_id ?? '', donor: i.donor ?? '', segment: i.segment ?? '', this_year: i.this_year ?? '', last_year: i.last_year ?? '', last_gift: i.last_gift ?? '' }),
    htmlColumns: ['donor_id', 'donor', 'segment', 'last_year', 'this_year', 'last_gift'],
    sections: (o) => [{ title: 'By segment', rows: rollup(o.items, 'segment', (i) => i.segment, { last_year: (i) => i.last_year, this_year: (i) => i.this_year }), columns: ['segment', 'count', 'last_year', 'this_year'] }, { title: 'Retention', rows: [{ measure: 'Retention %', value: o.totals.retention_pct }, { measure: 'last_year_donors', value: o.totals.last_year_donors }, { measure: 'retained', value: o.totals.retained }], columns: ['measure', 'value'] }],
  },
  refused: [REFUSE.email, REFUSE.crm],
  memory: null,
});
