import { readFileSync } from 'node:fs';
import { giveAgent, GL_FIELDS, GL_PROFILES, sourceOf, REFUSE, money } from 'fairgive-core';
import { functional, DEFAULTS } from './logic.js';

const pkg = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'));
const files = {
  gl: { type: 'string', description: 'Expense lines from the general ledger under --root: account, account name, department or program, function if the system has one, amount, memo' },
  rules: { type: 'string', description: 'Optional allocation rules for shared costs under --root: account number or department, program %, management %, fundraising %, basis' },
};
const GL = { ...GL_FIELDS, function: { aliases: ['Function', 'Functional Class', 'Functional Expense', 'Expense Function'] } };
const RULE = { key: { aliases: ['Key', 'Account', 'Department', 'Cost Pool', 'Pool'], required: true }, program: { aliases: ['Program', 'Program %', 'Program Pct'], type: 'number' }, management: { aliases: ['Management', 'Management %', 'M&G %', 'G&A %'], type: 'number' }, fundraising: { aliases: ['Fundraising', 'Fundraising %'], type: 'number' }, basis: { aliases: ['Basis', 'Allocation Basis', 'Method'] } };
export const DEMO = { title: 'Fairgive Functional Expenses', files: { gl: 'gl.csv', rules: 'rules.csv', settings: 'settings.json' }, explain: { arg: 'account', value: '6100' } };

export const manifest = giveAgent({
  pkg, prefix: 'functional',
  description: pkg.description.replace(/^[^:]+:\s*/, ''),
  check: { title: 'Functional expenses', description: 'Gives every expense line a function (program, management and general, fundraising) from its own function column, its department in the settings map, or the allocation rule for its account or department, and totals the natural-by-function table. Flags lines with no function and rules that do not add to 100%; lists program lines whose memo names fundraising words.' },
  args: files, required: ['gl'],
  sources: { gl: sourceOf('Expense lines', ['gl'], GL, ['entry_id', 'date', 'account', 'account_name', 'program', 'function', 'debit', 'credit', 'amount', 'memo'], GL_PROFILES), rules: { label: 'Allocation rules', args: ['rules'], fields: RULE } },
  settings: { defaults: DEFAULTS, schema: { type: 'object', additionalProperties: false, properties: {
    expense_from: { type: 'string', description: 'Expense accounts start at this number (default "5")' },
    department_functions: { type: 'object', additionalProperties: { type: 'string' }, description: 'Department or program code and its function, e.g. {"Youth": "program", "Admin": "management", "Development": "fundraising"}' },
    fundraising_words: { type: 'array', items: { type: 'string' }, description: 'Words in a memo that suggest a fundraising cost' },
    tolerance: { type: 'number', minimum: 0, maximum: 100, description: 'Difference ignored (default 0.01)' },
  } } },
  run: ({ rows, settings }) => functional(rows, settings),
  key: { arg: 'account', field: 'account', label: 'expense account' },
  summary: (o) => `${money(o.totals.total)} of expenses: program ${money(o.totals.program)} (${o.totals.program_pct}%), management and general ${money(o.totals.management)}, fundraising ${money(o.totals.fundraising)}, no function yet ${money(o.totals.unassigned)}.`,
  report: {
    title: 'Functional expenses', base: 'functional-expenses',
    row: (i) => ({ account: i.account ?? '', account_name: i.account_name ?? '', program: i.program ?? '', management: i.management ?? '', fundraising: i.fundraising ?? '', unassigned: i.unassigned ?? '', total: i.total ?? '' }),
    htmlColumns: ['account', 'account_name', 'program', 'management', 'fundraising', 'unassigned', 'total'],
    sections: (o) => [{ title: 'By function', rows: [{ function: 'program', amount: o.totals.program }, { function: 'management', amount: o.totals.management }, { function: 'fundraising', amount: o.totals.fundraising }, { function: 'unassigned', amount: o.totals.unassigned }], columns: ['function', 'amount'] }],
  },
  refused: [REFUSE.ledger, REFUSE.irs],
  memory: null,
});
