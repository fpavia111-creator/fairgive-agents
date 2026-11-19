// Processor fees: rates, net-booked gifts, missing gifts, refunds, payouts.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { processorFees, DEFAULTS } from '../src/index.js';

const S = { ...DEFAULTS, rates: { Stripe: { pct: 2.2, fixed: 0.3 } } };
const t = (txn_id, gross, fee, extra = {}) => ({ txn_id, processor: 'Stripe', gross, fee, net: gross - fee, gift_id: `G-${txn_id}`, date: '2026-10-01', ...extra });
const codes = (r, id) => r.items.find((i) => i.item === id).findings.map((f) => f.code).sort();

test('a fee over the rate is flagged with the difference', () => {
  const r = processorFees({ transactions: [t('A', 200, 7)], gifts: [{ gift_id: 'G-A', amount: 200 }] }, S);
  assert.deepEqual(codes(r, 'A'), ['fee_over_rate']); assert.equal(r.totals.fees_over_rate, 2.3);
});

test('a processor with no rate in the settings is not rate-checked', () => {
  const r = processorFees({ transactions: [t('A', 200, 50, { processor: 'Other' })], gifts: [{ gift_id: 'G-A', amount: 200 }] }, S);
  assert.deepEqual(codes(r, 'A'), []);
});

test('a gift booked at the net is flagged; another amount needs review', () => {
  const r = processorFees({ transactions: [t('A', 50, 1.4), t('B', 30, 0.96)], gifts: [{ gift_id: 'G-A', amount: 48.6 }, { gift_id: 'G-B', amount: 25 }] }, S);
  assert.deepEqual(codes(r, 'A'), ['gift_booked_net']); assert.deepEqual(codes(r, 'B'), ['gift_amount_differs']);
});

test('a charge with no gift in the CRM needs review', () => {
  const r = processorFees({ transactions: [t('A', 50, 1.4, { gift_id: '' })], gifts: [] }, S);
  assert.deepEqual(codes(r, 'A'), ['not_in_crm']);
});

test('a refunded charge whose fee was kept is watched', () => {
  const r = processorFees({ transactions: [t('A', 75, 1.95, { refunded: 75 })], gifts: [{ gift_id: 'G-A', amount: 75 }] }, S);
  assert.deepEqual(codes(r, 'A'), ['fee_on_refund']);
});

test('a payout is matched to a deposit by id in the description or by amount within the days', () => {
  const tx = [t('A', 100, 2.5, { payout_id: 'PO-1', payout_date: '2026-10-10' }), t('B', 100, 2.5, { payout_id: 'PO-2', payout_date: '2026-10-10' })];
  const r = processorFees({ transactions: tx, gifts: [{ gift_id: 'G-A', amount: 100 }, { gift_id: 'G-B', amount: 100 }], deposits: [{ date: '2026-10-11', amount: 97.5, description: 'STRIPE PO-1' }, { date: '2026-10-12', amount: 97.5, description: 'transfer' }] }, S);
  assert.equal(r.items.find((i) => i.item === 'Payout PO-1').status, 'ok'); assert.equal(r.items.find((i) => i.item === 'Payout PO-2').status, 'ok');
});

test('a payout with no deposit needs review', () => {
  const r = processorFees({ transactions: [t('A', 100, 2.5, { payout_id: 'PO-9', payout_date: '2026-10-10' })], gifts: [{ gift_id: 'G-A', amount: 100 }], deposits: [] }, S);
  assert.equal(r.totals.payouts_missing, 97.5);
});
