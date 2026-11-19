// Functional expenses: function column, department map, allocation rules, gaps, words.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { functional, DEFAULTS } from '../src/index.js';

const S = { ...DEFAULTS, department_functions: { Youth: 'program', Admin: 'management', Development: 'fundraising' } };
const l = (account, debit, extra = {}) => ({ account, account_name: `Acct ${account}`, debit, ...extra });
const acct = (r, a) => r.items.find((i) => i.account === a);

test('departments in the settings map give each line its function', () => {
  const r = functional({ gl: [l('5000', 40, { program: 'Youth' }), l('5000', 25, { program: 'Admin' }), l('5000', 15, { program: 'Development' })] }, S);
  assert.deepEqual([acct(r, '5000').program, acct(r, '5000').management, acct(r, '5000').fundraising], [40, 25, 15]);
});

test('a function column wins over the department', () => {
  const r = functional({ gl: [l('7200', 10, { program: 'Youth', function: 'Fundraising' })] }, S);
  assert.equal(acct(r, '7200').fundraising, 10);
});

test('a shared cost is split by the rule for its account', () => {
  const r = functional({ gl: [l('6000', 100, { program: 'Shared' })], rules: [{ key: '6000', program: 70, management: 20, fundraising: 10 }] }, S);
  assert.deepEqual([acct(r, '6000').program, acct(r, '6000').management, acct(r, '6000').fundraising], [70, 20, 10]);
});

test('a rule that does not add to 100 leaves the rest unassigned and is flagged', () => {
  const r = functional({ gl: [l('6100', 100, { program: 'Shared' })], rules: [{ key: '6100', program: 60, management: 20, fundraising: 10 }] }, S);
  assert.equal(acct(r, '6100').unassigned, 10); assert.equal(acct(r, '6100').findings[0].code, 'allocation_not_100');
});

test('a line with no function, department or rule is flagged', () => {
  const r = functional({ gl: [l('7100', 20)] }, S);
  assert.equal(acct(r, '7100').findings[0].code, 'expense_without_function'); assert.equal(r.totals.unassigned, 20);
});

test('a program line whose memo names fundraising words needs review', () => {
  const r = functional({ gl: [l('7000', 30, { program: 'Youth', memo: 'Gala invitations' }), l('7000', 5, { program: 'Youth', memo: 'Galaxy science kits' })] }, S);
  assert.equal(acct(r, '7000').findings.length, 1); assert.equal(acct(r, '7000').findings[0].code, 'fundraising_coded_program');
});

test('accounts before expense_from and credits are handled', () => {
  const r = functional({ gl: [l('1010', 999, { program: 'Youth' }), l('5000', 50, { program: 'Youth' }), { account: '5000', credit: 10, program: 'Youth' }] }, S);
  assert.equal(r.totals.total, 40); assert.equal(r.totals.program_pct, 100);
});
