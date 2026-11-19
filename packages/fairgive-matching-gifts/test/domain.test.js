// Matching gifts: ratio, minimum, yearly maximum, deadlines, received amounts, pending.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { matching, DEFAULTS } from '../src/index.js';

const S = { ...DEFAULTS, as_of: '2026-11-18' };
const emp = { employer: 'Tech', ratio: 2, min_gift: 50, max_per_year: 1000, deadline_days: 90 };
const g = (gift_id, amount, gift_date, extra = {}) => ({ gift_id, donor_id: 'D1', donor: 'Pat Example', amount, gift_date, employer: 'Tech', ...extra });
const one = (r, id) => r.items.find((i) => i.gift_id === id);

test('the expected match is the gift times the ratio, and gifts under the minimum are left out', () => {
  const r = matching({ gifts: [g('A', 300, '2026-10-01'), g('B', 40, '2026-10-01')], employers: [emp] }, S);
  assert.equal(one(r, 'A').expected_match, 600); assert.equal(one(r, 'B'), undefined);
});

test('the yearly maximum per donor caps later gifts', () => {
  const r = matching({ gifts: [g('A', 400, '2026-02-01'), g('B', 400, '2026-03-01')], employers: [emp] }, S);
  assert.equal(one(r, 'A').expected_match, 800); assert.equal(one(r, 'B').expected_match, 200);
});

test('deadlines: passed is flagged, close is flagged, far is reviewed', () => {
  const r = matching({ gifts: [g('A', 100, '2026-07-01'), g('B', 100, '2026-08-30'), g('C', 100, '2026-10-01', { donor_id: 'D2' })], employers: [emp] }, S);
  assert.equal(one(r, 'A').findings[0].code, 'match_deadline_passed'); assert.equal(one(r, 'B').findings[0].code, 'match_deadline_soon'); assert.equal(one(r, 'C').findings[0].code, 'match_not_claimed');
});

test('a match paid for another amount needs review', () => {
  const r = matching({ gifts: [g('A', 100, '2026-10-01')], employers: [emp], claims: [{ gift_id: 'A', submitted_date: '2026-10-02', received_amount: 100 }] }, S);
  assert.equal(one(r, 'A').findings[0].code, 'match_received_differs'); assert.equal(one(r, 'A').findings[0].amount, 100);
});

test('a claim unpaid past the pending days is watched', () => {
  const r = matching({ gifts: [g('A', 100, '2026-06-01')], employers: [emp], claims: [{ gift_id: 'A', submitted_date: '2026-06-05' }] }, S);
  assert.equal(one(r, 'A').findings[0].code, 'claim_pending_long');
});

test('an employer not in the program list needs review', () => {
  const r = matching({ gifts: [g('A', 100, '2026-10-01', { employer: 'Unknown Co' })], employers: [emp] }, S);
  assert.equal(one(r, 'A').findings[0].code, 'employer_not_in_list');
});

test('gifts with no employer are not listed', () => {
  const r = matching({ gifts: [g('A', 100, '2026-10-01', { employer: '' })], employers: [emp] }, S);
  assert.equal(r.items.length, 0);
});
