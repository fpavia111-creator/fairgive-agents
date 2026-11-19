import { readFileSync } from 'node:fs';
import { giveAgent, GL_FIELDS, GL_PROFILES, sourceOf, REFUSE, money, rollup } from 'fairgive-core';
import { inKind, DEFAULTS } from './logic.js';

const pkg = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'));
const files = {
  inkind: { type: 'string', description: 'In-kind gift log under --root: gift id, donor, date, description, category (goods, services, facilities, vehicle, art...), value, valuation method, who valued it, appraisal (yes/no), specialized skill (for services), date and amount if sold' },
  gl: { type: 'string', description: 'Optional general ledger detail under --root, to compare in-kind revenue month by month' },
};
const IK = {
  gift_id: { aliases: ['Gift ID', 'In-Kind ID', 'Donation ID', 'Record ID'], required: true },
  donor: { aliases: ['Donor', 'Donor Name', 'Constituent Name', 'Name'], personal: true },
  gift_date: { aliases: ['Gift Date', 'Date', 'Date Received', 'Received Date'], type: 'date' },
  description: { aliases: ['Description', 'Item', 'Items', 'Gift Description'] },
  category: { aliases: ['Category', 'Type', 'Gift Type', 'In-Kind Type'] },
  value: { aliases: ['Value', 'Fair Value', 'Fair Market Value', 'Amount', 'Estimated Value', 'In-Kind Value'] , type: 'money' },
  valuation_method: { aliases: ['Valuation Method', 'Valuation', 'Basis of Value', 'Method'] },
  valued_by: { aliases: ['Valued By', 'Value Source', 'Source of Value'] },
  appraisal: { aliases: ['Appraisal', 'Appraised', 'Qualified Appraisal'] },
  specialized_skill: { aliases: ['Specialized Skill', 'Specialized Skills', 'Professional Service', 'Skilled'] },
  disposed_date: { aliases: ['Disposed Date', 'Sold Date', 'Date Sold', 'Disposition Date'], type: 'date' },
  disposed_amount: { aliases: ['Disposed Amount', 'Sale Amount', 'Sold For', 'Proceeds'], type: 'money' },
};
export const DEMO = { title: 'Fairgive In-Kind Gifts', files: { inkind: 'inkind.csv', gl: 'gl.csv', settings: 'settings.json' }, explain: { arg: 'item', value: 'K-4' } };

export const manifest = giveAgent({
  pkg, prefix: 'in_kind',
  description: pkg.description.replace(/^[^:]+:\s*/, ''),
  check: { title: 'In-kind gifts', description: 'Checks the in-kind gift log: gifts with no value or no valuation method, values taken only from the donor, property over the appraisal threshold in the settings with no appraisal noted, services that may not meet the recognition criteria (not a specialized skill), and property sold within the years in the settings. Compares recognized in-kind value with the in-kind revenue accounts month by month.' },
  args: files, required: ['inkind'],
  sources: { inkind: { label: 'In-kind gift log', args: ['inkind'], fields: IK }, gl: sourceOf('General ledger detail', ['gl'], GL_FIELDS, ['entry_id', 'date', 'account', 'account_name', 'debit', 'credit', 'amount', 'memo'], GL_PROFILES) },
  settings: { defaults: DEFAULTS, schema: { type: 'object', additionalProperties: false, properties: {
    appraisal_threshold: { type: 'number', minimum: 0, description: 'Property valued over this with no appraisal noted is listed (default 5000; your tax preparer can confirm the rule for each gift)' },
    disposal_years: { type: 'integer', minimum: 0, maximum: 10, description: 'Property sold within this many years of the gift is listed (default 3)' },
    inkind_accounts: { type: 'array', items: { type: 'string' }, description: 'Ledger account numbers (or first digits) for in-kind revenue' },
    tolerance: { type: 'number', minimum: 0, maximum: 100, description: 'Difference ignored (default 0.01)' },
  } } },
  run: ({ rows, settings }) => inKind(rows, settings),
  key: { arg: 'item', field: 'item', label: 'gift id or month ("Month 2026-07")' },
  summary: (o) => `${o.totals.gifts} in-kind gift(s) worth ${money(o.totals.total_value)}, ${money(o.totals.recognized_value)} recognized; ${o.totals.no_value} with no value, ${o.totals.over_appraisal_threshold} over the appraisal threshold without an appraisal; ledger gap ${money(o.totals.gl_gap)}.`,
  report: {
    title: 'In-kind gifts', base: 'in-kind-gifts',
    row: (i) => ({ item: i.item ?? '', kind: i.kind ?? '', donor: i.donor ?? '', gift_date: i.gift_date ?? '', description: i.description ?? '', category: i.category ?? '', value: i.value ?? '', recognized: i.recognized ?? '', gl_amount: i.gl_amount ?? '' }),
    htmlColumns: ['item', 'gift_date', 'description', 'category', 'value', 'recognized', 'gl_amount'],
    sections: (o) => [{ title: 'By category', rows: rollup(o.items.filter((i) => i.kind === 'gift'), 'category', (i) => i.category || '(none)', { value: (i) => i.value || 0, recognized: (i) => i.recognized }), columns: ['category', 'count', 'value', 'recognized'] }],
  },
  refused: [REFUSE.ledger, REFUSE.irs],
  memory: null,
});
