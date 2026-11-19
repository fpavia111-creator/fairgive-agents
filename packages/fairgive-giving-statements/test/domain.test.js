// Giving statements: year, refunds, undated gifts, loose offering, addresses, funds.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { statements, DEFAULTS } from '../src/index.js';

const S = { ...DEFAULTS, year: 2026 };
const c = (gift_id, giver_id, date, amount, extra = {}) => ({ gift_id, giver_id, giver: `Giver ${giver_id}`, date, amount, fund: 'Tithe', ...extra });
const one = (r, id) => r.items.find((i) => i.giver_id === id);
const addr = (id) => ({ giver_id: id, address: '1 Main St' });

test('only gifts dated in the statement year are totalled, by fund', () => {
  const r = statements({ contributions: [c('1', 'A', '2025-12-28', 200), c('2', 'A', '2026-01-04', 100), c('3', 'A', '2026-12-27', 150, { fund: 'Building' })], givers: [addr('A')] }, S);
  assert.equal(one(r, 'A').total, 250); assert.equal(one(r, 'A').by_fund, 'Building 150; Tithe 100');
});

test('a refunded gift is left out and listed', () => {
  const r = statements({ contributions: [c('1', 'A', '2026-05-05', 250), c('2', 'A', '2026-06-06', 250, { status: 'Refunded' })], givers: [addr('A')] }, S);
  assert.equal(one(r, 'A').total, 250); assert.equal(one(r, 'A').findings[0].code, 'refund_excluded');
});

test('a giver with no address is flagged', () => {
  const r = statements({ contributions: [c('1', 'A', '2026-03-03', 500)], givers: [] }, S);
  assert.equal(one(r, 'A').findings[0].code, 'giver_missing_address');
});

test('loose offering with no giver is listed apart and not in the statement total', () => {
  const r = statements({ contributions: [c('1', '', '2026-03-08', 87.5), c('2', 'A', '2026-03-08', 10)], givers: [addr('A')] }, S);
  assert.equal(one(r, 'Unattributed').total, 87.5); assert.equal(r.totals.statement_total, 10);
});

test('a gift with no date needs review', () => {
  const r = statements({ contributions: [c('1', 'A', '', 60)], givers: [addr('A')] }, S);
  assert.equal(one(r, 'A').findings[0].code, 'gift_no_date');
});

test('the year defaults to the latest in the file', () => {
  const r = statements({ contributions: [c('1', 'A', '2025-03-01', 5), c('2', 'A', '2026-03-01', 7)], givers: [addr('A')] }, DEFAULTS);
  assert.equal(r.totals.year, 2026); assert.equal(one(r, 'A').total, 7);
});

test('givers with nothing in the year are not listed', () => {
  const r = statements({ contributions: [c('1', 'A', '2025-03-01', 5), c('2', 'B', '2026-03-01', 7)], givers: [addr('A'), addr('B')] }, S);
  assert.equal(one(r, 'A'), undefined);
});
