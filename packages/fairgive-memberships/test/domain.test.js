// Memberships: expiring, lapsed, wrong dues, renewals not extended, unpaid active members.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { memberships, DEFAULTS } from '../src/index.js';

const S = { ...DEFAULTS, as_of: '2026-11-18' };
const levels = [{ level: 'Family', dues: 100, term_months: 12 }];
const m = (member_id, expires, extra = {}) => ({ member_id, member: 'Pat Example', level: 'Family', expires, ...extra });
const pay = (member_id, date, amount = 100) => ({ member_id, date, amount });
const codes = (r, id) => r.items.find((i) => i.member_id === id).findings.map((f) => f.code).sort();

test('a membership ending within the expiring days is watched', () => {
  const r = memberships({ members: [m('A', '2026-12-05')], payments: [pay('A', '2025-12-05')], levels }, S);
  assert.deepEqual(codes(r, 'A'), ['expiring_soon']);
});

test('ended past the grace days with no renewal is lapsed; inside the grace days it is not', () => {
  const r = memberships({ members: [m('A', '2026-09-01'), m('B', '2026-11-01')], payments: [pay('A', '2025-09-01'), pay('B', '2025-11-01')], levels }, S);
  assert.deepEqual(codes(r, 'A'), ['lapsed']); assert.deepEqual(codes(r, 'B'), []);
});

test('dues paid for another amount are flagged', () => {
  const r = memberships({ members: [m('A', '2027-05-01')], payments: [pay('A', '2026-05-01', 80)], levels }, S);
  assert.deepEqual(codes(r, 'A'), ['paid_wrong_amount']); assert.equal(r.items[0].findings[0].amount, 20);
});

test('a renewal payment that did not move the end date is flagged', () => {
  const r = memberships({ members: [m('A', '2026-10-15')], payments: [pay('A', '2025-10-15'), pay('A', '2026-10-10')], levels }, S);
  assert.deepEqual(codes(r, 'A'), ['paid_not_extended']);
});

test('an active membership with no payment for its term needs review', () => {
  const r = memberships({ members: [m('A', '2027-06-30')], payments: [], levels }, S);
  assert.deepEqual(codes(r, 'A'), ['active_without_payment']);
});

test('a level not in the level list needs review', () => {
  const r = memberships({ members: [m('A', '2027-06-30', { level: 'Gold' })], payments: [pay('A', '2026-06-30')], levels }, S);
  assert.ok(codes(r, 'A').includes('unknown_level'));
});

test('expected dues count active members only', () => {
  const r = memberships({ members: [m('A', '2027-06-30'), m('B', '2026-01-01')], payments: [pay('A', '2026-06-30')], levels }, S);
  assert.equal(r.totals.expected_dues, 100); assert.equal(r.totals.active, 1);
});
