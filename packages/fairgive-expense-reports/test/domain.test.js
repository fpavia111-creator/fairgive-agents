// Expense reports: receipts, per diem, mileage, unallowable on grants, duplicates, late.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { expenseReports, DEFAULTS } from '../src/index.js';

const S = { ...DEFAULTS, per_diem: { Meals: 60 }, mileage_rate: 0.7, grant_codes: ['G-'] };
const l = (report_id, category, amount, extra = {}) => ({ report_id, employee: 'Pat Example', date: '2026-09-10', category, amount, merchant: 'Shop', receipt: 'yes', submitted_date: '2026-09-20', ...extra });
const codes = (r, id) => r.items.find((i) => i.report_id === id).findings.map((f) => f.code).sort();

test('an amount over the receipt limit with no receipt is flagged; mileage needs none', () => {
  const r = expenseReports({ lines: [l('A', 'Supplies', 90, { receipt: 'no' }), l('B', 'Mileage', 70, { receipt: 'no', miles: 100 })] }, S);
  assert.deepEqual(codes(r, 'A'), ['receipt_missing']); assert.deepEqual(codes(r, 'B'), []);
});

test('meals for one person on one day are added before the per diem', () => {
  const r = expenseReports({ lines: [l('A', 'Meals', 45), l('A', 'Meals', 30, { merchant: 'Diner' })] }, S);
  assert.deepEqual(codes(r, 'A'), ['meals_over_per_diem']); assert.equal(r.items[0].findings[0].amount, 15);
});

test('mileage over the rate is flagged with the difference', () => {
  const r = expenseReports({ lines: [l('A', 'Mileage', 120, { miles: 100 })] }, S);
  assert.equal(r.items[0].findings[0].amount, 50);
});

test('an unallowable word only counts on a grant-coded line', () => {
  const r = expenseReports({ lines: [l('A', 'Meals', 40, { grant: 'G-FED', memo: 'Dinner with wine' }), l('B', 'Meals', 40, { memo: 'Dinner with wine', date: '2026-09-12' })] }, S);
  assert.deepEqual(codes(r, 'A'), ['unallowable_on_grant']); assert.deepEqual(codes(r, 'B'), []);
});

test('the same purchase on two reports is a duplicate on the later report', () => {
  const r = expenseReports({ lines: [l('A', 'Supplies', 50, { submitted_date: '2026-09-22' }), l('B', 'Supplies', 50, { submitted_date: '2026-10-01' })] }, S);
  assert.deepEqual(codes(r, 'A'), []); assert.deepEqual(codes(r, 'B'), ['duplicate_claim']);
});

test('a report sent long after the expense is watched', () => {
  const r = expenseReports({ lines: [l('A', 'Supplies', 10, { date: '2026-08-01', submitted_date: '2026-10-15' })] }, S);
  assert.deepEqual(codes(r, 'A'), ['late_submission']);
});

test('no mileage rate in the settings means no mileage check', () => {
  const r = expenseReports({ lines: [l('A', 'Mileage', 500, { miles: 1 })] }, { ...S, mileage_rate: null });
  assert.deepEqual(codes(r, 'A'), []);
});
