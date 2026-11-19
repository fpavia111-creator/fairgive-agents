import { readFileSync } from 'node:fs';
import { giveAgent, GRANT_FIELDS, sourceOf, REFUSE, money } from 'fairgive-core';
import { singleAudit, DEFAULTS } from './logic.js';

const pkg = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'));
const files = {
  grants: { type: 'string', description: 'Grant list under --root: grant code, funder, federal (yes/no), assistance listing number, pass-through entity and its award id' },
  expenses: { type: 'string', description: 'Spending by grant under --root (ledger lines with the grant or project code): date, grant, amount' },
};
const EXP = { entry_id: { aliases: ['Entry ID', 'Journal', 'Num', 'Transaction ID'] }, date: { aliases: ['Date', 'Posting Date', 'Transaction Date'], type: 'date' }, grant: { aliases: ['Grant', 'Grant ID', 'Grant Code', 'Project', 'Award', 'Job'], required: true, translate: 'grant_id' }, amount: { aliases: ['Amount', 'Debit', 'Expense', 'Net Amount'], type: 'money' } };
export const DEMO = { title: 'Fairgive Single Audit', files: { grants: 'grants.csv', expenses: 'expenses.csv', settings: 'settings.json' }, explain: { arg: 'item', value: 'ALN 93.568' } };

export const manifest = giveAgent({
  pkg, prefix: 'single_audit',
  description: pkg.description.replace(/^[^:]+:\s*/, ''),
  check: { title: 'Federal awards and the single audit threshold', description: 'Totals spending on federal grants in the fiscal year by assistance listing number (the lines of a schedule of expenditures of federal awards) and compares the total with the single audit threshold in the settings (by default 1,000,000 for fiscal years beginning on or after 2024-10-01, 750,000 before). Lists federal grants with no listing number, pass-through awards with no award id and spending coded to grants not in the list.' },
  args: files, required: ['grants', 'expenses'],
  sources: { grants: sourceOf('Grants', ['grants'], { ...GRANT_FIELDS, pass_through_id: { aliases: ['Pass-Through ID', 'Pass Through Award ID', 'Subaward Number', 'Pass-through Identifying Number'] } }, ['grant', 'grant_name', 'funder', 'federal', 'aln', 'pass_through', 'pass_through_id']), expenses: { label: 'Spending by grant', args: ['expenses'], fields: EXP } },
  settings: { defaults: DEFAULTS, schema: { type: 'object', additionalProperties: false, properties: {
    fiscal_year_start: { type: 'integer', minimum: 1, maximum: 12, description: 'First month of your fiscal year (default 1)' },
    fiscal_year: { type: ['integer', 'null'], minimum: 2000, maximum: 2100, description: 'Fiscal year to total, named by the year it ends in (default: the latest year in the file)' },
    threshold: { type: ['number', 'null'], minimum: 0, description: 'Threshold to compare with (default: 1,000,000 for fiscal years beginning on or after 2024-10-01, else 750,000; confirm with your auditor)' },
    approaching_pct: { type: 'number', minimum: 0, maximum: 100, description: 'Percent of the threshold at which to warn (default 80)' },
  } } },
  run: ({ rows, settings }) => singleAudit(rows, settings),
  key: { arg: 'item', field: 'item', label: 'line ("ALN 84.287" or "Total federal spending")' },
  summary: (o) => `FY${o.extra.fiscal_year || '?'}: federal award spending ${money(o.totals.federal_spending)} across ${o.totals.alns} listing number(s), ${o.totals.threshold_pct}% of the ${money(o.totals.threshold)} threshold in the settings.`,
  report: {
    title: 'Federal awards and the single audit threshold', base: 'single-audit',
    row: (i) => ({ item: i.item ?? '', aln: i.aln ?? '', grants: i.grants ?? '', federal_spending: i.federal_spending ?? '', share_pct: i.share_pct ?? '' }),
    htmlColumns: ['item', 'grants', 'federal_spending', 'share_pct'],
    sections: (o) => [{ title: 'By assistance listing', rows: o.items.filter((i) => i.aln).map((i) => ({ aln: i.aln, grants: i.grants, federal_spending: i.federal_spending })), columns: ['aln', 'grants', 'federal_spending'] }],
  },
  refused: [REFUSE.irs, REFUSE.funder],
  memory: null,
});
