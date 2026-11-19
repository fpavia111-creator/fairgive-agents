// Pledges: installments, past due and aging, overpaid, open, write-offs, conditional, PV.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { pledges, DEFAULTS } from '../src/index.js';

const S = { ...DEFAULTS, as_of: '2026-11-18' };
const pl = (pledge_id, extra = {}) => ({ pledge_id, total: 1200, installments: 12, frequency: 'Monthly', first_due: '2026-01-15', pledge_date: '2026-01-01', status: 'Open', ...extra });
const pay = (pledge_id, amount, date = '2026-02-01') => ({ pledge_id, amount, date });
const codes = (r, id) => r.items.find((i) => i.pledge_id === id).findings.map((f) => f.code).sort();

test('installments due by as_of less payments are past due, aged from the oldest unpaid one', () => {
  const r = pledges({ pledges: [pl('A')], payments: [pay('A', 1000)] }, S);
  const i = r.items[0]; assert.equal(i.past_due, 100); assert.equal(i.aging, '1-30'); assert.deepEqual(codes(r, 'A'), ['overdue_installment']);
});

test('over 90 days past due is flagged', () => {
  const r = pledges({ pledges: [pl('A', { total: 5000, installments: 1, frequency: 'Once', first_due: '2026-06-30' })] }, S);
  assert.deepEqual(codes(r, 'A'), ['overdue_90']); assert.equal(r.items[0].aging, '90+');
});

test('overpaid and paid-but-open pledges are listed', () => {
  const r = pledges({ pledges: [pl('A', { total: 100, installments: 1, frequency: 'Once', status: 'Closed' }), pl('B', { total: 100, installments: 1, frequency: 'Once' })], payments: [pay('A', 110), pay('B', 100)] }, S);
  assert.deepEqual(codes(r, 'A'), ['overpaid']); assert.deepEqual(codes(r, 'B'), ['paid_still_open']);
});

test('a write-off with no approver is flagged and stops the past-due count', () => {
  const r = pledges({ pledges: [pl('A', { total: 2000, installments: 1, frequency: 'Once', first_due: '2026-03-31', status: 'Written off' })], writeoffs: [{ pledge_id: 'A', amount: 2000, date: '2026-10-01', approved_by: '' }] }, S);
  assert.deepEqual(codes(r, 'A'), ['writeoff_no_approval']); assert.equal(r.items[0].past_due, 0); assert.equal(r.totals.written_off, 2000);
});

test('a conditional pledge is kept apart from the receivable', () => {
  const r = pledges({ pledges: [pl('A', { total: 10000, installments: 1, frequency: 'Once', first_due: '2026-12-31', conditional: 'yes' })] }, S);
  assert.deepEqual(codes(r, 'A'), ['conditional_booked']); assert.equal(r.totals.conditional, 10000); assert.equal(r.totals.receivable, 0);
});

test('a multi-year pledge with no discount rate is watched; with a rate its present value is below its balance', () => {
  const p = pl('A', { total: 3000, installments: 3, frequency: 'Annual', first_due: '2026-01-01', pledge_date: '2025-12-01' });
  assert.deepEqual(codes(pledges({ pledges: [p], payments: [pay('A', 1000)] }, S), 'A'), ['multi_year_not_discounted']);
  const r = pledges({ pledges: [p], payments: [pay('A', 1000)] }, { ...S, discount_rate: 4 });
  assert.ok(r.items[0].present_value < 2000 && r.items[0].present_value > 1800); assert.deepEqual(codes(r, 'A'), []);
});

test('a written-off pledge has no present value left', () => {
  const r = pledges({ pledges: [pl('A', { total: 2000, installments: 1, frequency: 'Once', first_due: '2027-03-31' })], writeoffs: [{ pledge_id: 'A', amount: 2000, approved_by: 'Board' }] }, { ...S, discount_rate: 5 });
  assert.equal(r.items[0].present_value, 0);
});

test('a pledge not yet due is current', () => {
  const r = pledges({ pledges: [pl('A', { total: 500, installments: 1, frequency: 'Once', first_due: '2026-12-01' })] }, S);
  assert.equal(r.items[0].aging, 'current'); assert.equal(r.items[0].status, 'ok');
});
