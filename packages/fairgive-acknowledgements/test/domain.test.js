// Acknowledgements: threshold, window, amount, statement, refunded gifts.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { acknowledgements, DEFAULTS } from '../src/index.js';

const S = { ...DEFAULTS, as_of: '2026-11-18' };
const g = (gift_id, amount, gift_date, status = 'Received') => ({ gift_id, donor_id: `D-${gift_id}`, donor: 'Pat Example', amount, gift_date, status });
const l = (gift_id, letter_date, amount, statement = 'yes') => ({ gift_id, letter_date, amount, statement });
const one = (r, id) => r.items.find((i) => i.gift_id === id);

test('a gift at the threshold with no letter after the policy days is missing', () => {
  const r = acknowledgements({ gifts: [g('A', 250, '2026-09-01')], letters: [] }, S);
  assert.equal(one(r, 'A').findings[0].code, 'ack_missing'); assert.equal(r.totals.missing_amount, 250);
});

test('a gift under the threshold with no letter is not listed', () => {
  const r = acknowledgements({ gifts: [g('A', 249.99, '2026-09-01')], letters: [] }, S);
  assert.equal(r.items.length, 0);
});

test('a recent gift with no letter is due soon, not missing', () => {
  const r = acknowledgements({ gifts: [g('A', 900, '2026-11-10')], letters: [] }, S);
  assert.equal(one(r, 'A').findings[0].code, 'ack_due_soon'); assert.equal(one(r, 'A').status, 'watch');
});

test('a late letter is watched and a wrong amount is flagged', () => {
  const r = acknowledgements({ gifts: [g('A', 300, '2026-09-01'), g('B', 300, '2026-10-01')], letters: [l('A', '2026-10-15', 300), l('B', '2026-10-02', 30)] }, S);
  assert.equal(one(r, 'A').findings[0].code, 'ack_late'); assert.equal(one(r, 'B').findings[0].code, 'ack_amount_differs'); assert.equal(one(r, 'B').findings[0].amount, 270);
});

test('a letter with no goods-or-services statement is flagged unless the settings say not to', () => {
  const gifts = [g('A', 500, '2026-10-01')]; const letters = [l('A', '2026-10-02', 500, 'no')];
  assert.equal(one(acknowledgements({ gifts, letters }, S), 'A').findings[0].code, 'ack_no_statement');
  assert.equal(one(acknowledgements({ gifts, letters }, { ...S, require_statement: false }), 'A').status, 'ok');
});

test('a refunded gift with a letter is flagged; one with no letter is not listed', () => {
  const r = acknowledgements({ gifts: [g('A', 400, '2026-10-01', 'Refunded'), g('B', 400, '2026-10-01', 'Refunded')], letters: [l('A', '2026-10-02', 400)] }, S);
  assert.equal(one(r, 'A').findings[0].code, 'ack_for_refunded_gift'); assert.equal(one(r, 'B'), undefined);
});

test('the latest letter for a gift is the one checked', () => {
  const r = acknowledgements({ gifts: [g('A', 300, '2026-10-01')], letters: [l('A', '2026-10-02', 30), l('A', '2026-10-09', 300)] }, S);
  assert.equal(one(r, 'A').status, 'ok');
});
