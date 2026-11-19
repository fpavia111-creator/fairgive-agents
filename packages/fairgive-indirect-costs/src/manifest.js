import { readFileSync } from 'node:fs';
import { giveAgent, REFUSE, money } from 'fairgive-core';
import { indirectCosts, DEFAULTS } from './logic.js';

const pkg = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'));
const files = {
  grants: { type: 'string', description: 'Grants under --root: grant code, funder, award start, rate type (negotiated, de minimis, funder cap), rate %, base (MTDC or TDC), date the negotiated rate ends, funder cap %' },
  expenses: { type: 'string', description: 'Costs by grant from the ledger under --root: grant, date, category (salaries, equipment, subaward, indirect...), amount, subaward id' },
};
const GR = { grant: { aliases: ['Grant', 'Grant ID', 'Grant Code', 'Award', 'Project'], required: true, translate: 'grant_id' }, funder: { aliases: ['Funder', 'Agency', 'Grantor'] }, award_start: { aliases: ['Award Start', 'Start Date', 'Period Start'], type: 'date', translate: 'start_date' }, rate_type: { aliases: ['Rate Type', 'Indirect Type', 'Rate Agreement'] }, rate: { aliases: ['Rate', 'Indirect Rate', 'F&A Rate', 'Rate %'], type: 'number' }, base: { aliases: ['Base', 'Rate Base', 'Indirect Base'] }, rate_end: { aliases: ['Rate End', 'Rate Expires', 'NICRA End', 'Agreement End'], type: 'date', translate: 'end_date' }, cap: { aliases: ['Cap', 'Funder Cap', 'Indirect Cap %', 'Max Indirect %'], type: 'number' } };
const EX = { entry_id: { aliases: ['Entry ID', 'Journal', 'Num'] }, date: { aliases: ['Date', 'Posting Date'], type: 'date' }, grant: { aliases: ['Grant', 'Grant ID', 'Grant Code', 'Project', 'Award'], required: true, translate: 'grant_id' }, category: { aliases: ['Category', 'Cost Category', 'Object Class', 'Account Name', 'Budget Line'] }, amount: { aliases: ['Amount', 'Debit', 'Cost'], type: 'money' }, subaward_id: { aliases: ['Subaward ID', 'Subaward', 'Subrecipient', 'Subcontract'] }, memo: { aliases: ['Memo', 'Description'] } };
export const DEMO = { title: 'Fairgive Indirect Costs', files: { grants: 'grants.csv', expenses: 'expenses.csv', settings: 'settings.json' }, explain: { arg: 'grant', value: 'G-FED' } };

export const manifest = giveAgent({
  pkg, prefix: 'indirect',
  description: pkg.description.replace(/^[^:]+:\s*/, ''),
  check: { title: 'Indirect cost recovery', description: 'For each grant, rebuilds the indirect cost base: modified total direct costs (leaving out the excluded categories in the settings and each subaward above its first 50,000, or 25,000 for awards that started before 2024-10-01) or total direct costs when the grant says so. Applies the grant\'s rate, or the de minimis rate by award start (15% from 2024-10-01, 10% before), never above a funder cap, and compares with the indirect charged. Lists negotiated rates that ended before the costs.' },
  args: files, required: ['grants', 'expenses'],
  sources: { grants: { label: 'Grants and rates', args: ['grants'], fields: GR }, expenses: { label: 'Costs by grant', args: ['expenses'], fields: EX } },
  settings: { defaults: DEFAULTS, schema: { type: 'object', additionalProperties: false, properties: {
    excluded_categories: { type: 'array', items: { type: 'string' }, description: 'Cost categories left out of the modified total direct cost base' },
    indirect_categories: { type: 'array', items: { type: 'string' }, description: 'Categories that hold the indirect cost charged' },
    subaward_cap: { type: ['number', 'null'], minimum: 0, description: 'Part of each subaward counted in the base (default: 50000 for awards from 2024-10-01, 25000 before)' },
    de_minimis: { type: ['number', 'null'], minimum: 0, maximum: 100, description: 'De minimis rate (default: 15 for awards from 2024-10-01, 10 before)' },
    tolerance: { type: 'number', minimum: 0, maximum: 100, description: 'Difference ignored (default 0.01)' },
  } } },
  run: ({ rows, settings }) => indirectCosts(rows, settings),
  key: { arg: 'grant', field: 'grant', label: 'grant' },
  summary: (o) => `${o.totals.grants} grant(s): base ${money(o.totals.base)}, indirect allowed ${money(o.totals.allowed)}, charged ${money(o.totals.charged)}; overcharged ${money(o.totals.overcharged)}, not recovered ${money(o.totals.not_recovered)}.`,
  report: {
    title: 'Indirect cost recovery', base: 'indirect-costs',
    row: (i) => ({ grant: i.grant ?? '', base_type: i.base_type ?? '', rate: i.rate ?? '', direct: i.direct ?? '', excluded: i.excluded ?? '', base: i.base ?? '', allowed: i.allowed ?? '', charged: i.charged ?? '' }),
    htmlColumns: ['grant', 'base_type', 'rate', 'direct', 'excluded', 'base', 'allowed', 'charged'],
    sections: (o) => [{ title: 'By grant', rows: o.items.map((i) => ({ grant: i.grant, allowed: i.allowed, charged: i.charged })), columns: ['grant', 'allowed', 'charged'] }],
  },
  refused: [REFUSE.ledger, REFUSE.funder],
  memory: null,
});
