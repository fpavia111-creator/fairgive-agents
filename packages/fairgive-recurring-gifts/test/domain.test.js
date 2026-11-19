// Recurring gifts: failures, missed charges, card expiry, cancellations, amounts.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { recurring, expiryDate, DEFAULTS } from '../src/index.js';

const S = { ...DEFAULTS, as_of: '2026-11-18' };
const plan = (plan_id, extra = {}) => ({ plan_id, donor: 'Pat Example', amount: 20, frequency: 'Monthly', start_date: '2026-01-01', status: 'Active', card_expiry: '12/2030', ...extra });
const ch = (plan_id, date, status = 'Succeeded', amount = 20) => ({ plan_id, date, status, amount });
const codes = (r, id) => r.items.find((i) => i.plan_id === id).findings.map((f) => f.code).sort();

test('card expiry reads 11/2026, 11/26 and 2026-11 as the last day of November', () => {
  assert.equal(expiryDate('11/2026'), '2026-11-30'); assert.equal(expiryDate('11/26'), '2026-11-30'); assert.equal(expiryDate('2026-11'), '2026-11-30');
});

test('two failed charges in a row are repeated failures; one is a failed last charge', () => {
  const r = recurring({ plans: [plan('A'), plan('B')], charges: [ch('A', '2026-10-01', 'Failed'), ch('A', '2026-11-01', 'Failed'), ch('B', '2026-10-01'), ch('B', '2026-11-01', 'Declined')] }, S);
  assert.deepEqual(codes(r, 'A'), ['repeated_failures']); assert.deepEqual(codes(r, 'B'), ['failed_last_charge']);
});

test('a monthly plan with no charge for months is a missed charge; one inside the grace days is not', () => {
  const r = recurring({ plans: [plan('A'), plan('B')], charges: [ch('A', '2026-08-15'), ch('B', '2026-10-15')] }, S);
  assert.deepEqual(codes(r, 'A'), ['missed_charge']); assert.deepEqual(codes(r, 'B'), []);
});

test('an expired card needs review and one expiring soon is watched', () => {
  const r = recurring({ plans: [plan('A', { card_expiry: '08/2026' }), plan('B', { card_expiry: '12/2026' })], charges: [ch('A', '2026-11-01'), ch('B', '2026-11-01')] }, S);
  assert.deepEqual(codes(r, 'A'), ['card_expired']); assert.deepEqual(codes(r, 'B'), ['card_expiring']);
});

test('a charge after the cancel date is flagged and a cancelled plan is not missed', () => {
  const r = recurring({ plans: [plan('A', { status: 'Cancelled', cancel_date: '2026-09-30' })], charges: [ch('A', '2026-09-01'), ch('A', '2026-10-20')] }, S);
  assert.deepEqual(codes(r, 'A'), ['charge_after_cancel']); assert.equal(r.totals.active, 0);
});

test('a charge for another amount is watched with the difference', () => {
  const r = recurring({ plans: [plan('A', { frequency: 'Quarterly', amount: 150 })], charges: [ch('A', '2026-11-01', 'Succeeded', 175)] }, S);
  const f = r.items[0].findings.find((x) => x.code === 'amount_changed'); assert.equal(f.amount, 25);
});

test('monthly value counts quarterly and annual plans as a monthly equivalent', () => {
  const r = recurring({ plans: [plan('A', { amount: 30 }), plan('Q', { frequency: 'Quarterly', amount: 150 }), plan('Y', { frequency: 'Annual', amount: 120 })], charges: [ch('A', '2026-11-10', 'Succeeded', 30), ch('Q', '2026-11-01', 'Succeeded', 150), ch('Y', '2026-06-01', 'Succeeded', 120)] }, S);
  assert.equal(r.totals.monthly_value, 90);
});
