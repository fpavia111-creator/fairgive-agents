// Grant budgets: line overages, flexibility, pools, periods, unallowable words, awards.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { grantBudgets, DEFAULTS } from '../src/index.js';

const grants = [{ grant: 'A', award_amount: 100, award_start: '2026-01-01', award_end: '2026-12-31' }];
const x = (grant, line, amount, extra = {}) => ({ grant, line, amount, date: '2026-05-01', ...extra });
const it = (r, name) => r.items.find((i) => i.item === name);

test('over a line within the flexibility is watched, beyond it flagged', () => {
  const r = grantBudgets({ grants, budget: [{ grant: 'A', line: 'Travel', budget_amount: 20 }, { grant: 'A', line: 'Supplies', budget_amount: 50 }], expenses: [x('A', 'Travel', 21), x('A', 'Supplies', 60)] }, DEFAULTS);
  assert.equal(it(r, 'A / Travel').findings[0].code, 'line_over_small'); assert.equal(it(r, 'A / Supplies').findings[0].code, 'line_over_budget');
});

test('a pooled cost is split by the allocation table', () => {
  const r = grantBudgets({ grants, budget: [{ grant: 'A', line: 'Salaries', budget_amount: 50 }, { grant: 'B', line: 'Salaries', budget_amount: 50 }], expenses: [x('', 'Salaries', 100, { pool: 'P' })], allocations: [{ pool: 'P', grant: 'A', pct: 40 }, { pool: 'P', grant: 'B', pct: 60 }] }, DEFAULTS);
  assert.equal(it(r, 'A / Salaries').actual, 40); assert.equal(it(r, 'B / Salaries').actual, 60); assert.equal(it(r, 'Pool P').status, 'ok');
});

test('a pool split over 100% is flagged and under 100% is watched', () => {
  const over = grantBudgets({ expenses: [x('', 'Rent', 100, { pool: 'P' })], allocations: [{ pool: 'P', grant: 'A', pct: 60 }, { pool: 'P', grant: 'B', pct: 50 }] }, DEFAULTS);
  assert.equal(it(over, 'Pool P').findings[0].code, 'allocation_over_100'); assert.equal(it(over, 'Pool P').findings[0].amount, 10);
  const under = grantBudgets({ expenses: [x('', 'Rent', 100, { pool: 'P' })], allocations: [{ pool: 'P', grant: 'A', pct: 90 }] }, DEFAULTS);
  assert.equal(it(under, 'Pool P').findings[0].code, 'allocation_under_100');
});

test('a cost dated before the award period is flagged', () => {
  const r = grantBudgets({ grants: [{ grant: 'A', award_start: '2026-07-01', award_end: '2027-06-30' }], budget: [{ grant: 'A', line: 'Salaries', budget_amount: 500 }], expenses: [x('A', 'Salaries', 50, { date: '2026-06-30' })] }, DEFAULTS);
  assert.equal(it(r, 'A / Salaries').findings[0].code, 'outside_period');
});

test('a memo with an unallowable word is flagged, whole words only', () => {
  const r = grantBudgets({ grants, budget: [{ grant: 'A', line: 'Supplies', budget_amount: 500 }], expenses: [x('A', 'Supplies', 30, { memo: 'Wine for reception', entry_id: 'E1' }), x('A', 'Supplies', 10, { memo: 'Swine flu kits', entry_id: 'E2' })] }, DEFAULTS);
  const f = it(r, 'A / Supplies').findings; assert.equal(f.length, 1); assert.equal(f[0].code, 'unallowable_cost'); assert.equal(f[0].amount, 30);
});

test('a grant missing from the grant list needs review', () => {
  const r = grantBudgets({ budget: [{ grant: 'Z', line: 'Supplies', budget_amount: 50 }], expenses: [x('Z', 'Supplies', 10)] }, DEFAULTS);
  assert.equal(it(r, 'Z / Supplies').findings[0].code, 'unknown_grant'); assert.equal(it(r, 'Z / Supplies').status, 'review');
});

test('spending on a line with no budget needs review and a grant charged over its award is flagged', () => {
  const r = grantBudgets({ grants, budget: [], expenses: [x('A', 'Occupancy', 120)] }, DEFAULTS);
  assert.equal(it(r, 'A / Occupancy').findings[0].code, 'no_budget_line'); assert.equal(it(r, 'A / total').findings[0].code, 'over_award');
});
