// Endowment draw: average and rate, history, underwater funds, booked draws, prudence.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { endowmentDraw, DEFAULTS } from '../src/index.js';

const S = { ...DEFAULTS, spending_rate: 5, quarters: 4, value_date: '2026-06-30' };
const vals = (fund, list) => list.map(([date, v]) => ({ fund, date, market_value: v }));
const Q = ['2025-09-30', '2025-12-31', '2026-03-31', '2026-06-30'];
const one = (r, f) => r.items.find((i) => i.fund === f);

test('the draw is the rate times the average of the last quarters', () => {
  const r = endowmentDraw({ funds: [{ fund: 'A', corpus: 100 }], values: vals('A', Q.map((d, i) => [d, 1000 + i * 100])) }, S);
  assert.equal(one(r, 'A').average_value, 1150); assert.equal(one(r, 'A').policy_draw, 57.5);
});

test('values after the value date are not used', () => {
  const r = endowmentDraw({ funds: [{ fund: 'A' }], values: vals('A', [...Q.map((d) => [d, 1000]), ['2026-09-30', 1]]) }, S);
  assert.equal(one(r, 'A').average_value, 1000);
});

test('fewer quarters than the policy averages need review', () => {
  const r = endowmentDraw({ funds: [{ fund: 'A' }], values: vals('A', [['2026-06-30', 1000]]) }, S);
  assert.equal(one(r, 'A').findings[0].code, 'insufficient_history'); assert.equal(one(r, 'A').policy_draw, 50);
});

test('an underwater fund is watched, or gets no draw when the policy says no_spend', () => {
  const funds = [{ fund: 'A', corpus: 2000 }]; const values = vals('A', Q.map((d) => [d, 1500]));
  assert.equal(one(endowmentDraw({ funds, values }, S), 'A').findings[0].code, 'underwater');
  const ns = endowmentDraw({ funds, values }, { ...S, underwater_policy: 'no_spend' });
  assert.equal(one(ns, 'A').policy_draw, 0); assert.equal(one(ns, 'A').findings[0].code, 'underwater_no_draw');
});

test('a booked draw that differs from the policy is flagged', () => {
  const r = endowmentDraw({ funds: [{ fund: 'A' }], values: vals('A', Q.map((d) => [d, 1000])), draws: [{ fund: 'A', amount: 60 }] }, S);
  assert.equal(one(r, 'A').findings[0].code, 'draw_differs'); assert.equal(one(r, 'A').findings[0].amount, 10);
});

test('a rate over the prudence figure is flagged', () => {
  const r = endowmentDraw({ funds: [{ fund: 'A' }], values: vals('A', Q.map((d) => [d, 1000])) }, { ...S, spending_rate: 8 });
  assert.equal(one(r, 'Spending policy').findings[0].code, 'rate_over_prudence');
});

test('a fund with no values needs review', () => {
  const r = endowmentDraw({ funds: [{ fund: 'A' }], values: [] }, S);
  assert.equal(one(r, 'A').findings[0].code, 'no_values'); assert.equal(one(r, 'A').policy_draw, 0);
});
