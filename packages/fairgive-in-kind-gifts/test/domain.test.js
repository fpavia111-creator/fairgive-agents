// In-kind gifts: values, methods, donor values, appraisals, services, disposals, ledger.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { inKind, DEFAULTS } from '../src/index.js';

const k = (gift_id, extra = {}) => ({ gift_id, gift_date: '2026-03-01', category: 'Goods', value: 100, valuation_method: 'Retail', valued_by: 'Organization', ...extra });
const codes = (r, id) => r.items.find((i) => i.item === id).findings.map((f) => f.code).sort();

test('a gift with no value is flagged and not recognized', () => {
  const r = inKind({ inkind: [k('A', { value: '' })] }, DEFAULTS);
  assert.deepEqual(codes(r, 'A'), ['no_value']); assert.equal(r.totals.recognized_value, 0);
});

test('a value from the donor only is watched and property over the threshold needs an appraisal', () => {
  const r = inKind({ inkind: [k('A', { value: 12000, valued_by: 'Donor' }), k('B', { value: 12000, appraisal: 'yes' })] }, DEFAULTS);
  assert.deepEqual(codes(r, 'A'), ['donor_value_only', 'over_appraisal_threshold']); assert.deepEqual(codes(r, 'B'), []);
});

test('facilities and services are not held to the property appraisal threshold', () => {
  const r = inKind({ inkind: [k('A', { category: 'Facilities', value: 9000 }), k('B', { category: 'Services', value: 9000, specialized_skill: 'yes' })] }, DEFAULTS);
  assert.deepEqual(codes(r, 'A'), []); assert.deepEqual(codes(r, 'B'), []);
});

test('services that are not a specialized skill need a recognition decision and are left out', () => {
  const r = inKind({ inkind: [k('A', { category: 'Services', value: 1500, specialized_skill: 'no' })] }, DEFAULTS);
  assert.deepEqual(codes(r, 'A'), ['services_recognition_check']); assert.equal(r.totals.recognized_value, 0); assert.equal(r.totals.total_value, 1500);
});

test('property sold within the disposal years is flagged', () => {
  const r = inKind({ inkind: [k('A', { gift_date: '2025-02-01', disposed_date: '2026-08-15', value: 9000, appraisal: 'yes' }), k('B', { gift_date: '2020-02-01', disposed_date: '2026-08-15' })] }, DEFAULTS);
  assert.deepEqual(codes(r, 'A'), ['disposed_within_3_years']); assert.deepEqual(codes(r, 'B'), []);
});

test('recognized value is compared with the in-kind accounts inside the ledger months', () => {
  const r = inKind({ inkind: [k('A', { gift_date: '2026-07-07', value: 6000 }), k('B', { gift_date: '2025-01-01', value: 50 })], gl: [{ date: '2026-07-31', account: '4500', credit: 600 }] }, { ...DEFAULTS, inkind_accounts: ['4500'] });
  const m = r.items.find((i) => i.item === 'Month 2026-07'); assert.equal(m.findings[0].amount, -5400); assert.equal(r.items.find((i) => i.item === 'Month 2025-01'), undefined);
});

test('a missing valuation method needs review', () => {
  const r = inKind({ inkind: [k('A', { valuation_method: '' })] }, DEFAULTS);
  assert.deepEqual(codes(r, 'A'), ['no_valuation_method']);
});
