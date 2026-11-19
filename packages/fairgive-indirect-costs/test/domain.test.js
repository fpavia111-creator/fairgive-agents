// Indirect costs: MTDC exclusions, subaward cap by date, de minimis by date, caps, TDC.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { indirectCosts, DEFAULTS } from '../src/index.js';

const x = (grant, category, amount, extra = {}) => ({ grant, category, amount, date: '2026-06-30', ...extra });
const one = (r, g) => r.items.find((i) => i.grant === g);

test('equipment and participant support are left out of the MTDC base', () => {
  const r = indirectCosts({ grants: [{ grant: 'A', rate: 20, base: 'MTDC', award_start: '2025-01-01' }], expenses: [x('A', 'Salaries', 100), x('A', 'Equipment', 50), x('A', 'Participant support', 30), x('A', 'Indirect', 20)] }, DEFAULTS);
  assert.equal(one(r, 'A').base, 100); assert.equal(one(r, 'A').allowed, 20); assert.equal(one(r, 'A').status, 'ok');
});

test('each subaward counts up to the cap for its award date', () => {
  const recent = indirectCosts({ grants: [{ grant: 'A', rate: 10, award_start: '2025-01-01' }], expenses: [x('A', 'Subaward', 80000, { subaward_id: 'S1' })] }, DEFAULTS);
  assert.equal(one(recent, 'A').base, 50000);
  const older = indirectCosts({ grants: [{ grant: 'A', rate: 10, award_start: '2023-01-01' }], expenses: [x('A', 'Subaward', 80000, { subaward_id: 'S1' })] }, DEFAULTS);
  assert.equal(one(older, 'A').base, 25000);
});

test('the de minimis rate follows the award start date', () => {
  const a = indirectCosts({ grants: [{ grant: 'A', rate_type: 'De minimis', award_start: '2025-01-01' }], expenses: [x('A', 'Salaries', 1000)] }, DEFAULTS);
  const b = indirectCosts({ grants: [{ grant: 'A', rate_type: 'De minimis', award_start: '2024-01-01' }], expenses: [x('A', 'Salaries', 1000)] }, DEFAULTS);
  assert.equal(one(a, 'A').rate, 15); assert.equal(one(b, 'A').rate, 10);
});

test('charged over the allowed amount is flagged; under it is watched', () => {
  const r = indirectCosts({ grants: [{ grant: 'A', rate: 10 }, { grant: 'B', rate: 10 }], expenses: [x('A', 'Salaries', 1000), x('A', 'Indirect', 120), x('B', 'Salaries', 1000), x('B', 'Indirect', 50)] }, DEFAULTS);
  assert.equal(one(r, 'A').findings[0].code, 'indirect_overcharged'); assert.equal(one(r, 'B').findings[0].code, 'indirect_undercharged');
});

test('a funder cap limits the rate and a TDC base keeps every direct cost', () => {
  const r = indirectCosts({ grants: [{ grant: 'A', rate: 15, cap: 10, base: 'TDC' }], expenses: [x('A', 'Salaries', 300), x('A', 'Rent', 100), x('A', 'Indirect', 40)] }, DEFAULTS);
  assert.equal(one(r, 'A').rate, 10); assert.equal(one(r, 'A').base, 400); assert.equal(one(r, 'A').status, 'ok');
});

test('costs after the negotiated rate ended need review', () => {
  const r = indirectCosts({ grants: [{ grant: 'A', rate: 10, rate_end: '2026-06-30' }], expenses: [x('A', 'Salaries', 100, { date: '2026-09-30' }), x('A', 'Indirect', 10)] }, DEFAULTS);
  assert.equal(one(r, 'A').findings[0].code, 'rate_expired');
});

test('a grant with no rate and costs for a grant not in the list need review', () => {
  const r = indirectCosts({ grants: [{ grant: 'A' }], expenses: [x('A', 'Salaries', 100), x('Z', 'Salaries', 5)] }, DEFAULTS);
  assert.equal(one(r, 'A').findings[0].code, 'no_rate'); assert.equal(one(r, 'Z').findings[0].code, 'unknown_grant');
});
