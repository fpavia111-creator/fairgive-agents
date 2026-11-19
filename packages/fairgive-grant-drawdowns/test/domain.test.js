// Grant drawdowns: available, stale costs, overdraws, advances, pending draws, periods.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { drawdowns, DEFAULTS } from '../src/index.js';

const S = { ...DEFAULTS, as_of: '2026-11-18' };
const grant = (g, award = 1000, basis = 'Reimbursement') => ({ grant: g, award_amount: award, award_start: '2026-01-01', award_end: '2026-12-31', payment_basis: basis });
const cost = (g, date, amount) => ({ grant: g, date, amount });
const draw = (g, date, amount, status = 'Received', draw_id = 'D') => ({ grant: g, date, amount, status, draw_id });
const codes = (r, g) => r.items.find((i) => i.grant === g).findings.map((f) => f.code).sort();

test('costs not yet drawn can be drawn, capped at the award', () => {
  const r = drawdowns({ grants: [grant('A', 100)], expenses: [cost('A', '2026-11-01', 150)], draws: [draw('A', '2026-11-05', 40)] }, S);
  assert.equal(r.items[0].available, 60); assert.deepEqual(codes(r, 'A'), ['draw_available']);
});

test('draws cover the oldest costs first; what is left past the stale days is flagged', () => {
  const r = drawdowns({ grants: [grant('A')], expenses: [cost('A', '2026-08-01', 100), cost('A', '2026-09-01', 100), cost('A', '2026-11-01', 100)], draws: [draw('A', '2026-08-20', 100)] }, S);
  const st = r.items[0].findings.find((f) => f.code === 'stale_unreimbursed'); assert.equal(st.amount, 100);
});

test('a reimbursement grant drawn ahead of its costs is overdrawn; an advance is excess cash', () => {
  const r = drawdowns({ grants: [grant('A'), grant('B', 1000, 'Advance')], expenses: [cost('A', '2026-05-01', 50), cost('B', '2026-05-01', 50)], draws: [draw('A', '2026-05-02', 80), draw('B', '2026-04-01', 80)] }, S);
  assert.deepEqual(codes(r, 'A'), ['overdrawn']); assert.deepEqual(codes(r, 'B'), ['excess_cash']);
});

test('draws over the award are flagged', () => {
  const r = drawdowns({ grants: [grant('A', 100)], expenses: [cost('A', '2026-05-01', 120)], draws: [draw('A', '2026-05-02', 110)] }, S);
  assert.ok(codes(r, 'A').includes('draw_over_award'));
});

test('a requested draw not received after the pending days needs review', () => {
  const r = drawdowns({ grants: [grant('A')], expenses: [cost('A', '2026-09-01', 100)], draws: [draw('A', '2026-10-05', 100, 'Requested')] }, S);
  assert.deepEqual(codes(r, 'A'), ['pending_too_long']);
});

test('costs outside the award period are left out and listed', () => {
  const r = drawdowns({ grants: [grant('A')], expenses: [cost('A', '2025-12-15', 100), cost('A', '2026-11-10', 50)], draws: [] }, S);
  assert.equal(r.items[0].spent, 50); assert.ok(codes(r, 'A').includes('costs_outside_period'));
});

test('costs coded to a grant missing from the list need review', () => {
  const r = drawdowns({ grants: [], expenses: [cost('Z', '2026-05-01', 10)], draws: [] }, S);
  assert.deepEqual(codes(r, 'Z'), ['unknown_grant']);
});
