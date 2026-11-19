// Lapsed donors: fiscal years, LYBUNT, SYBUNT, look-back, downgrades, retention.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { lapsed, DEFAULTS } from '../src/index.js';

const S = { ...DEFAULTS, fiscal_year_start: 7, as_of: '2026-11-18' };
const g = (donor_id, gift_date, amount) => ({ donor_id, donor: `Donor ${donor_id}`, gift_date, amount });
const seg = (r, id) => (r.items.find((i) => i.donor_id === id) || {}).segment;

test('a July fiscal year puts 2026-08-01 in FY2027 and 2026-06-30 in FY2026', () => {
  const r = lapsed({ gifts: [g('A', '2026-06-30', 10), g('B', '2026-08-01', 10)] }, S);
  assert.equal(r.extra.fiscal_year, 2027); assert.equal(seg(r, 'A'), 'lybunt'); assert.equal(seg(r, 'B'), 'new');
});

test('a donor from two years ago is SYBUNT and one from outside the look-back is not listed', () => {
  const r = lapsed({ gifts: [g('A', '2024-01-10', 300), g('B', '2020-12-12', 40)] }, S);
  assert.equal(seg(r, 'A'), 'sybunt'); assert.equal(seg(r, 'B'), undefined);
});

test('retention counts last year\'s donors who gave again this year', () => {
  const r = lapsed({ gifts: [g('A', '2026-01-01', 5), g('A', '2026-09-01', 5), g('B', '2026-01-01', 5)] }, S);
  assert.equal(r.totals.retained, 1); assert.equal(r.totals.last_year_donors, 2); assert.equal(r.totals.retention_pct, 50);
});

test('giving well below last year so far is a downgrade to watch', () => {
  const r = lapsed({ gifts: [g('A', '2026-02-02', 1000), g('A', '2026-10-10', 200)] }, S);
  assert.equal(seg(r, 'A'), 'downgraded'); assert.equal(r.items[0].findings[0].amount, -800);
});

test('gifts after as_of are ignored', () => {
  const r = lapsed({ gifts: [g('A', '2026-01-01', 50), g('A', '2026-12-01', 50)] }, S);
  assert.equal(seg(r, 'A'), 'lybunt');
});

test('a donor with no id is grouped by name', () => {
  const r = lapsed({ gifts: [{ donor_id: '', donor: 'Pat Example', gift_date: '2026-01-01', amount: 5 }] }, S);
  assert.equal(r.items[0].donor_id, 'Pat Example'); assert.equal(r.items[0].segment, 'lybunt');
});

test('a calendar fiscal year is the default', () => {
  const r = lapsed({ gifts: [g('A', '2025-06-01', 10), g('B', '2026-03-01', 10)] }, { ...DEFAULTS, as_of: '2026-11-18' });
  assert.equal(r.extra.fiscal_year, 2026); assert.equal(seg(r, 'A'), 'lybunt'); assert.equal(seg(r, 'B'), 'new');
});
