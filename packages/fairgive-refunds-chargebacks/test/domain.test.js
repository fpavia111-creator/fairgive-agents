// Refunds and chargebacks: CRM reversal, partial refunds, over-refunds, letters, disputes.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { refunds, DEFAULTS } from '../src/index.js';

const S = { ...DEFAULTS, as_of: '2026-11-18' };
const ev = (txn_id, amount, gift_id, extra = {}) => ({ txn_id, type: 'Refund', amount, gift_id, date: '2026-10-10', status: 'Succeeded', ...extra });
const gift = (gift_id, amount, extra = {}) => ({ gift_id, amount, status: 'Received', ...extra });
const codes = (r, id) => r.items.find((i) => i.txn_id === id).findings.map((f) => f.code).sort();

test('a full refund on a gift still marked received is flagged; one marked refunded is ok', () => {
  const r = refunds({ events: [ev('A', 100, 'G1'), ev('B', 75, 'G2')], gifts: [gift('G1', 100), gift('G2', 75, { status: 'Refunded' })] }, S);
  assert.deepEqual(codes(r, 'A'), ['refund_not_reversed_in_crm']); assert.deepEqual(codes(r, 'B'), []);
});

test('a refunded gift that was thanked needs a corrected letter', () => {
  const r = refunds({ events: [ev('A', 100, 'G1')], gifts: [gift('G1', 100, { status: 'Refunded', ack_date: '2026-10-05' })] }, S);
  assert.deepEqual(codes(r, 'A'), ['ack_sent_for_refunded']);
});

test('a refund larger than the gift is flagged; a partial refund needs the gift reduced', () => {
  const r = refunds({ events: [ev('A', 60, 'G1'), ev('B', 20, 'G2')], gifts: [gift('G1', 50), gift('G2', 100)] }, S);
  assert.deepEqual(codes(r, 'A'), ['refund_over_gift']); assert.deepEqual(codes(r, 'B'), ['partial_refund_not_adjusted']);
});

test('a refund with no gift needs review', () => {
  const r = refunds({ events: [ev('A', 40, '')], gifts: [] }, S);
  assert.deepEqual(codes(r, 'A'), ['refund_no_gift']);
});

test('dispute evidence due soon or overdue is flagged; a closed dispute is not', () => {
  const r = refunds({ events: [ev('A', 250, 'G1', { type: 'Dispute', status: 'Needs response', evidence_due: '2026-11-22' }), ev('B', 10, 'G1', { type: 'Dispute', status: 'Open', evidence_due: '2026-11-10' }), ev('C', 30, 'G1', { type: 'Dispute', status: 'Won', evidence_due: '2026-09-10' })], gifts: [gift('G1', 250)] }, S);
  assert.deepEqual(codes(r, 'A'), ['dispute_evidence_due']); assert.deepEqual(codes(r, 'B'), ['dispute_evidence_overdue']); assert.deepEqual(codes(r, 'C'), []);
  assert.equal(r.totals.disputed_open, 260);
});

test('a dispute far from its deadline is not flagged', () => {
  const r = refunds({ events: [ev('A', 250, 'G1', { type: 'Chargeback', status: 'Open', evidence_due: '2026-12-30' })], gifts: [gift('G1', 250)] }, S);
  assert.deepEqual(codes(r, 'A'), []);
});

test('refund amounts written as negatives are read as positive', () => {
  const r = refunds({ events: [ev('A', -100, 'G1')], gifts: [gift('G1', 100, { status: 'Refunded' })] }, S);
  assert.equal(r.totals.refunded, 100); assert.deepEqual(codes(r, 'A'), []);
});
