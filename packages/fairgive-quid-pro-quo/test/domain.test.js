// Quid pro quo: threshold, insubstantial limits, deductible amounts, missing values.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { quidProQuo, insubstantial, DEFAULTS } from '../src/index.js';

const p = (gift_id, amount, benefit_value, extra = {}) => ({ gift_id, amount, benefit: 'Dinner', benefit_value, ...extra });
const codes = (r, id) => r.items.find((i) => i.gift_id === id).findings.map((f) => f.code).sort();

test('a payment over the threshold with a benefit and no disclosure is flagged', () => {
  const r = quidProQuo({ payments: [p('A', 150, 60)] }, DEFAULTS);
  assert.deepEqual(codes(r, 'A'), ['disclosure_missing']); assert.equal(r.items[0].deductible, 90);
});

test('a payment at or under the threshold needs no disclosure', () => {
  const r = quidProQuo({ payments: [p('A', 75, 30)] }, DEFAULTS);
  assert.deepEqual(codes(r, 'A'), []);
});

test('a receipt that states the whole payment as deductible is flagged with the overstatement', () => {
  const r = quidProQuo({ payments: [p('A', 150, 60, { receipt_deductible: 150, disclosure: 'yes' })] }, DEFAULTS);
  assert.deepEqual(codes(r, 'A'), ['deductible_wrong']); assert.equal(r.totals.overstated, 60);
});

test('the insubstantial limits: low-cost article, 2% and the cap', () => {
  assert.equal(insubstantial(100, 8, DEFAULTS), true); assert.equal(insubstantial(60, 8, DEFAULTS), false);
  assert.equal(insubstantial(5000, 100, DEFAULTS), true); assert.equal(insubstantial(10000, 150, DEFAULTS), false);
});

test('an insubstantial benefit is only watched', () => {
  const r = quidProQuo({ payments: [p('A', 100, 8, { benefit: 'Tote bag' })] }, DEFAULTS);
  assert.deepEqual(codes(r, 'A'), ['insubstantial_benefit']); assert.equal(r.items[0].deductible, 100);
});

test('a benefit with no value and a benefit worth the whole payment need review', () => {
  const r = quidProQuo({ payments: [p('A', 500, ''), p('B', 200, 250, { disclosure: 'yes', receipt_deductible: 0 })] }, DEFAULTS);
  assert.deepEqual(codes(r, 'A'), ['fmv_missing']); assert.deepEqual(codes(r, 'B'), ['benefit_over_payment']);
});

test('a payment with no benefit is fully deductible and ok', () => {
  const r = quidProQuo({ payments: [{ gift_id: 'A', amount: 1000, receipt_deductible: 1000 }] }, DEFAULTS);
  assert.deepEqual(codes(r, 'A'), []); assert.equal(r.items[0].deductible, 1000);
});
