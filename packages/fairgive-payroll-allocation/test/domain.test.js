// Payroll allocation: effort split, charge differences, over 100, unallocated, certification.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { payrollAllocation, DEFAULTS } from '../src/index.js';

const S = { ...DEFAULTS, certify_codes: ['G-'] };
const pay = (id, gross) => ({ employee_id: id, period: 'Q3', gross });
const eff = (id, code, pct, hours = '') => ({ employee_id: id, period: 'Q3', code, pct, hours });
const ch = (id, code, amount) => ({ employee_id: id, period: 'Q3', code, amount });
const codes = (r) => r.items[0].findings.map((f) => f.code).sort();

test('charges that follow effort are ok', () => {
  const r = payrollAllocation({ payroll: [pay('A', 100)], effort: [eff('A', 'X', 50), eff('A', 'Y', 50)], charges: [ch('A', 'X', 50), ch('A', 'Y', 50)] }, S);
  assert.deepEqual(codes(r), []);
});

test('hours are turned into percent and a charge off by more than the tolerance is flagged', () => {
  const r = payrollAllocation({ payroll: [pay('A', 120)], effort: [eff('A', 'X', '', 30), eff('A', 'Y', '', 90)], charges: [ch('A', 'X', 60), ch('A', 'Y', 60)] }, S);
  assert.deepEqual(codes(r), ['charge_differs_from_effort', 'charge_differs_from_effort']);
});

test('effort over 100% is flagged', () => {
  const r = payrollAllocation({ effort: [eff('A', 'X', 60), eff('A', 'Y', 50)], charges: [ch('A', 'X', 60), ch('A', 'Y', 50)] }, S);
  assert.ok(codes(r).includes('effort_over_100'));
});

test('pay not charged anywhere needs review', () => {
  const r = payrollAllocation({ payroll: [pay('A', 90)], effort: [eff('A', 'X', 100)], charges: [ch('A', 'X', 70)] }, S);
  assert.deepEqual(codes(r), ['payroll_not_allocated']); assert.equal(r.totals.unallocated, 20);
});

test('a charge to a code with no effort is flagged', () => {
  const r = payrollAllocation({ effort: [eff('A', 'X', 100)], charges: [ch('A', 'X', 60), ch('A', 'G-1', 20)] }, S);
  assert.ok(codes(r).includes('charged_without_effort'));
});

test('grant charges need a certification', () => {
  const r = payrollAllocation({ effort: [eff('A', 'G-1', 100)], charges: [ch('A', 'G-1', 100)], certifications: [] }, S);
  assert.deepEqual(codes(r), ['certification_missing']);
  const ok = payrollAllocation({ effort: [eff('A', 'G-1', 100)], charges: [ch('A', 'G-1', 100)], certifications: [{ employee_id: 'A', period: 'Q3', certified_date: '2026-10-01' }] }, S);
  assert.deepEqual(ok.items[0].findings, []);
});

test('charges with no effort report need review', () => {
  const r = payrollAllocation({ effort: [], charges: [ch('A', 'X', 10)] }, S);
  assert.deepEqual(codes(r), ['no_effort_report']);
});
