import { readFileSync } from 'node:fs';
import { giveAgent, REFUSE, money } from 'fairgive-core';
import { payrollAllocation, DEFAULTS } from './logic.js';

const pkg = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'));
const files = {
  payroll: { type: 'string', description: 'Payroll register under --root (ADP, Paychex, Gusto-style export): employee id, name, period, gross pay' },
  effort: { type: 'string', description: 'Timesheets or effort reports under --root: employee id, period, program or grant code, percent or hours' },
  charges: { type: 'string', description: 'Salary charges from the ledger under --root: employee id, period, program or grant code, amount' },
  certifications: { type: 'string', description: 'Optional effort certifications under --root: employee id, period, date signed' },
};
const PAY = { employee_id: { aliases: ['Employee ID', 'Emp ID', 'Employee Number', 'File Number'], required: true, translate: 'person_id' }, employee: { aliases: ['Employee', 'Employee Name', 'Name'], personal: true }, period: { aliases: ['Period', 'Pay Period', 'Quarter', 'Month'] }, gross: { aliases: ['Gross', 'Gross Pay', 'Gross Wages', 'Total Pay'], type: 'money' } };
const EFF = { employee_id: { aliases: ['Employee ID', 'Emp ID', 'Employee Number'], required: true, translate: 'person_id' }, period: { aliases: ['Period', 'Pay Period', 'Quarter', 'Month'] }, code: { aliases: ['Code', 'Program', 'Grant', 'Project', 'Cost Center'], translate: 'program' }, pct: { aliases: ['Pct', 'Percent', 'Effort %', 'Effort Percent'], type: 'number', translate: 'allocation_pct' }, hours: { aliases: ['Hours', 'Hours Worked'], type: 'number' } };
const CH = { employee_id: { aliases: ['Employee ID', 'Emp ID', 'Employee Number'], required: true, translate: 'person_id' }, period: { aliases: ['Period', 'Pay Period', 'Quarter', 'Month'] }, code: { aliases: ['Code', 'Program', 'Grant', 'Project', 'Cost Center', 'Class'], translate: 'program' }, amount: { aliases: ['Amount', 'Charged', 'Salary Charged', 'Debit'], type: 'money' } };
const CERT = { employee_id: { aliases: ['Employee ID', 'Emp ID'], required: true, translate: 'person_id' }, period: { aliases: ['Period', 'Quarter', 'Certification Period'] }, certified_date: { aliases: ['Certification Date', 'Signed Date', 'Signature Date', 'Date Signed'], type: 'date', translate: 'date' } };
export const DEMO = { title: 'Fairgive Payroll Allocation', files: { payroll: 'payroll.csv', effort: 'effort.csv', charges: 'charges.csv', certifications: 'certifications.csv', settings: 'settings.json' }, explain: { arg: 'item', value: 'E-2 2026-Q3' } };

export const manifest = giveAgent({
  pkg, prefix: 'payroll_alloc',
  description: pkg.description.replace(/^[^:]+:\s*/, ''),
  check: { title: 'Payroll allocation against effort', description: 'For each employee and period, compares the salary charged to each program and grant with the effort reported (percent, or hours turned into percent). Flags charges that differ from effort by more than the tolerance, effort over 100% and charges to codes with no effort; lists pay not charged anywhere and grant charges with no effort certification.' },
  args: files, required: ['effort', 'charges'],
  sources: { payroll: { label: 'Payroll register', args: ['payroll'], fields: PAY }, effort: { label: 'Effort reports', args: ['effort'], fields: EFF }, charges: { label: 'Salary charges', args: ['charges'], fields: CH }, certifications: { label: 'Effort certifications', args: ['certifications'], fields: CERT } },
  settings: { defaults: DEFAULTS, schema: { type: 'object', additionalProperties: false, properties: {
    tolerance_pct: { type: 'number', minimum: 0, maximum: 100, description: 'Percentage points a charge may differ from effort before it is flagged (default 5)' },
    certify_codes: { type: 'array', items: { type: 'string' }, description: 'Codes (or their start) of grants that need effort certification, e.g. ["G-"]' },
    tolerance: { type: 'number', minimum: 0, maximum: 100, description: 'Amount difference ignored (default 0.01)' },
  } } },
  run: ({ rows, settings }) => payrollAllocation(rows, settings),
  key: { arg: 'item', field: 'item', label: 'employee and period ("E-2 2026-Q3")' },
  summary: (o) => `${o.totals.employee_periods} employee period(s): payroll ${money(o.totals.payroll)}, charged ${money(o.totals.charged)}, not charged ${money(o.totals.unallocated)}; ${money(o.totals.charged_against_effort)} charged beyond the effort reported, ${money(o.totals.grant_charges_uncertified)} of grant charges with no certification.`,
  report: {
    title: 'Payroll allocation against effort', base: 'payroll-allocation',
    row: (i) => ({ item: i.item ?? '', employee_id: i.employee_id ?? '', employee: i.employee ?? '', period: i.period ?? '', gross: i.gross ?? '', charged: i.charged ?? '', effort_pct: i.effort_pct ?? '', grant_charges: i.grant_charges ?? '' }),
    htmlColumns: ['employee_id', 'employee', 'period', 'gross', 'charged', 'effort_pct', 'grant_charges'],
    sections: (o) => [{ title: 'By employee', rows: o.items.map((i) => ({ employee_id: i.employee_id, charged: i.charged, effort_pct: i.effort_pct })), columns: ['employee_id', 'charged', 'effort_pct'] }],
  },
  refused: [REFUSE.payroll, REFUSE.ledger],
  memory: null,
});
