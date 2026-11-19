import { readFileSync } from 'node:fs';
import { giveAgent, GRANT_FIELDS, sourceOf, REFUSE, money, rollup } from 'fairgive-core';
import { grantBudgets, DEFAULTS } from './logic.js';

const pkg = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'));
const files = {
  grants: { type: 'string', description: 'Grant list under --root: grant code, name, funder, award amount, award start and end dates' },
  budget: { type: 'string', description: 'Grant budgets under --root: grant code, budget line (salaries, supplies, travel...), amount' },
  expenses: { type: 'string', description: 'Expense lines from the ledger under --root: date, grant code (or a shared cost pool code), budget line, amount, memo' },
  allocations: { type: 'string', description: 'Optional allocation table under --root: shared cost pool, grant, percentage' },
};
const BUDGET_FIELDS = { grant: { aliases: ['Grant', 'Grant ID', 'Grant Code', 'Award', 'Project'], required: true }, line: { aliases: ['Line', 'Budget Line', 'Category', 'Cost Category', 'Object Class', 'Budget Category'], translate: 'category' }, budget_amount: { aliases: ['Budget', 'Budget Amount', 'Amount', 'Approved Budget'], type: 'money' } };
const EXPENSE_FIELDS = { entry_id: { aliases: ['Entry ID', 'Num', 'Journal', 'Transaction ID', 'Reference'] }, date: { aliases: ['Date', 'Posting Date', 'Transaction Date'], type: 'date' }, account: { aliases: ['Account', 'GL Account', 'Account Number'] }, grant: { aliases: ['Grant', 'Grant ID', 'Grant Code', 'Project', 'Award', 'Job'] }, line: { aliases: ['Line', 'Budget Line', 'Category', 'Cost Category', 'Object Class', 'Account title', 'Account Name'], translate: 'category' }, amount: { aliases: ['Amount', 'Debit', 'Expense', 'Net Amount'], type: 'money' }, memo: { aliases: ['Memo', 'Description', 'Memo/Description', 'Narrative'] }, pool: { aliases: ['Pool', 'Cost Pool', 'Shared Cost Pool', 'Allocation Pool'] } };
const ALLOC_FIELDS = { pool: { aliases: ['Pool', 'Cost Pool', 'Shared Cost Pool'], required: true }, grant: { aliases: ['Grant', 'Grant ID', 'Grant Code', 'Project'] }, pct: { aliases: ['Pct', 'Percent', 'Percentage', 'Share', 'Allocation %'], type: 'number' } };
export const DEMO = { title: 'Fairgive Grant Budgets', files: { grants: 'grants.csv', budget: 'budget.csv', expenses: 'expenses.csv', allocations: 'allocations.csv', settings: 'settings.json' }, explain: { arg: 'item', value: 'G-FED / Salaries' } };

export const manifest = giveAgent({
  pkg, prefix: 'grant_budget',
  description: pkg.description.replace(/^[^:]+:\s*/, ''),
  check: { title: 'Grant budget against actual', description: 'Charges direct costs to their grant and splits pooled costs by the allocation table, then compares each grant line with its budget: over within the flexibility percentage is watched, beyond it flagged. Also lists costs dated outside the award period, costs whose memo names a word the settings call unallowable, lines with no budget, grants charged over the award, and pools split over or under 100%.' },
  args: files, required: ['budget', 'expenses'],
  sources: { grants: sourceOf('Grants', ['grants'], GRANT_FIELDS, ['grant', 'grant_name', 'funder', 'award_amount', 'award_start', 'award_end', 'federal']), budget: { label: 'Grant budgets', args: ['budget'], fields: BUDGET_FIELDS }, expenses: { label: 'Expense lines', args: ['expenses'], fields: EXPENSE_FIELDS }, allocations: { label: 'Allocation table', args: ['allocations'], fields: ALLOC_FIELDS } },
  settings: { defaults: DEFAULTS, schema: { type: 'object', additionalProperties: false, properties: {
    flexibility_pct: { type: 'number', minimum: 0, maximum: 100, description: 'Percent over a budget line that is only watched; above it the line is flagged (default 10; check your award terms)' },
    unallowable_words: { type: 'array', items: { type: 'string' }, description: 'Words in a memo or line that mark a cost your funders do not allow (alcohol, lobbying...)' },
    tolerance: { type: 'number', minimum: 0, maximum: 100, description: 'Difference ignored (default 0.01)' },
  } } },
  run: ({ rows, settings }) => grantBudgets(rows, settings),
  key: { arg: 'item', field: 'item', label: 'grant line or pool ("G-FED / Salaries", "Pool POOL-RENT")' },
  summary: (o) => `${o.totals.grants} grant(s): budget ${money(o.totals.budget_total)}, actual ${money(o.totals.actual_total)}; over budget ${money(o.totals.over_budget)}, outside the award period ${money(o.totals.outside_period)}, unallowable ${money(o.totals.unallowable)}, with no budget line ${money(o.totals.no_budget)}.`,
  report: {
    title: 'Grant budget against actual', base: 'grant-budgets',
    row: (i) => ({ item: i.item ?? '', grant: i.grant ?? '', line: i.line ?? '', budget: i.budget ?? '', actual: i.actual ?? '', from_pools: i.from_pools ?? '', remaining: i.remaining ?? '' }),
    htmlColumns: ['grant', 'line', 'budget', 'actual', 'from_pools', 'remaining'],
    sections: (o) => [{ title: 'By grant', rows: rollup(o.items.filter((i) => i.line !== 'allocation' && i.line !== 'total'), 'grant', (i) => i.grant, { budget: (i) => i.budget || 0, actual: (i) => i.actual }), columns: ['grant', 'count', 'budget', 'actual'] }],
  },
  refused: [REFUSE.ledger, REFUSE.funder],
  memory: null,
});
