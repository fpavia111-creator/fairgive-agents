import { readFileSync } from 'node:fs';
import { giveAgent, REFUSE, money, rollup } from 'fairgive-core';
import { expenseReports, DEFAULTS } from './logic.js';

const pkg = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'));
const files = { lines: { type: 'string', description: 'Expense report lines under --root (Expensify, Ramp, Concur-style or spreadsheet export): report id, employee, date, category, amount, merchant, receipt (yes/no), grant code, memo, date submitted, miles for mileage' } };
const L = { report_id: { aliases: ['Report ID', 'Report', 'Expense Report', 'Report Number'], required: true }, employee: { aliases: ['Employee', 'Submitter', 'Employee Name', 'Name'], personal: true }, date: { aliases: ['Date', 'Expense Date', 'Transaction Date'], type: 'date' }, category: { aliases: ['Category', 'Expense Type', 'Type'] }, amount: { aliases: ['Amount', 'Expense Amount', 'Total'], type: 'money' }, merchant: { aliases: ['Merchant', 'Vendor', 'Payee'] }, receipt: { aliases: ['Receipt', 'Receipt Attached', 'Has Receipt'] }, grant: { aliases: ['Grant', 'Grant Code', 'Project', 'Award'], translate: 'grant_id' }, memo: { aliases: ['Memo', 'Description', 'Purpose', 'Comment'] }, submitted_date: { aliases: ['Submitted Date', 'Submitted', 'Submitted On', 'Report Date'], type: 'date', translate: 'submitted_on' }, miles: { aliases: ['Miles', 'Distance', 'Mileage'], type: 'number', translate: false } };
export const DEMO = { title: 'Fairgive Expense Reports', files: { lines: 'lines.csv', settings: 'settings.json' }, explain: { arg: 'report_id', value: 'R-2' } };

export const manifest = giveAgent({
  pkg, prefix: 'expenses',
  description: pkg.description.replace(/^[^:]+:\s*/, ''),
  check: { title: 'Expense report checks', description: 'Checks each expense report line against the policy in the settings: amounts over the receipt limit with no receipt, meals over the per diem per person per day, mileage over the rate, unallowable words on grant-coded lines, the same purchase claimed twice, and reports sent long after the expense.' },
  args: files, required: ['lines'],
  sources: { lines: { label: 'Expense report lines', args: ['lines'], fields: L } },
  settings: { defaults: DEFAULTS, schema: { type: 'object', additionalProperties: false, properties: {
    receipt_over: { type: 'number', minimum: 0, description: 'Lines over this amount need a receipt (default 75)' },
    per_diem: { type: 'object', additionalProperties: { type: 'number', minimum: 0 }, description: 'Daily limit per category, e.g. {"Meals": 60}' },
    mileage_rate: { type: ['number', 'null'], minimum: 0, maximum: 10, description: 'Rate per mile in your policy (no default; enter the rate you reimburse)' },
    unallowable_words: { type: 'array', items: { type: 'string' }, description: 'Words that mark a cost your grants do not allow' },
    grant_codes: { type: 'array', items: { type: 'string' }, description: 'Grant codes or their start (e.g. "G-") the unallowable check applies to; empty means any line with a grant code' },
    late_days: { type: 'integer', minimum: 0, maximum: 365, description: 'Days after the first expense a report may be sent (default 60)' },
    tolerance: { type: 'number', minimum: 0, maximum: 100, description: 'Difference ignored (default 0.01)' },
  } } },
  run: ({ rows, settings }) => expenseReports(rows, settings),
  key: { arg: 'report_id', field: 'report_id', label: 'report' },
  summary: (o) => `${o.totals.reports} report(s) for ${money(o.totals.amount)}: ${money(o.totals.flagged_amount)} on flagged lines, ${o.totals.duplicates} duplicate claim(s).`,
  report: {
    title: 'Expense report checks', base: 'expense-reports',
    row: (i) => ({ report_id: i.report_id ?? '', employee: i.employee ?? '', lines: i.lines ?? '', amount: i.amount ?? '', submitted: i.submitted ?? '' }),
    htmlColumns: ['report_id', 'employee', 'lines', 'amount', 'submitted'],
    sections: (o) => [{ title: 'By employee', rows: rollup(o.items, 'employee', (i) => i.employee || '(none)', { amount: (i) => i.amount }), columns: ['employee', 'count', 'amount'] }],
  },
  refused: [REFUSE.pay, { name: 'expense_approve', category: 'move_money', description: 'Never approves or reimburses an expense report; a manager does that in your expense system.' }],
  memory: null,
});
