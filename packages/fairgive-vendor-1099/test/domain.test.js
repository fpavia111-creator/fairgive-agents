// Vendor 1099: threshold, card payments, corporations, attorneys, W-9 and taxpayer ids.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { vendor1099, DEFAULTS } from '../src/index.js';

const S = { ...DEFAULTS, tax_year: 2026 };
const v = (vendor_id, extra = {}) => ({ vendor_id, vendor: `Vendor ${vendor_id}`, entity_type: 'Individual', tin: '123-45-6789', w9_on_file: 'yes', address: '1 Main St', ...extra });
const p = (vendor_id, amount, method = 'Check', date = '2026-05-01') => ({ vendor_id, amount, method, date });
const one = (r, id) => r.items.find((i) => i.vendor_id === id);

test('a vendor paid at the threshold is reportable; under it is not', () => {
  const r = vendor1099({ vendors: [v('A'), v('B')], payments: [p('A', 2000), p('B', 1999.99)] }, S);
  assert.equal(one(r, 'A').reportable, true); assert.equal(one(r, 'B').reportable, false);
});

test('card payments are left out of the total', () => {
  const r = vendor1099({ vendors: [v('A')], payments: [p('A', 1800), p('A', 900, 'Credit card')] }, S);
  assert.equal(one(r, 'A').paid, 1800); assert.equal(one(r, 'A').card_excluded, 900); assert.equal(one(r, 'A').reportable, false);
});

test('a reportable vendor with no W-9 and no taxpayer id is flagged', () => {
  const r = vendor1099({ vendors: [v('A', { w9_on_file: 'no', tin: '' })], payments: [p('A', 2500)] }, S);
  assert.deepEqual(one(r, 'A').findings.map((f) => f.code).sort(), ['needs_1099_no_w9', 'tin_missing']);
});

test('a taxpayer id without nine digits is flagged', () => {
  const r = vendor1099({ vendors: [v('A', { tin: '12-34567' })], payments: [p('A', 2500)] }, S);
  assert.equal(one(r, 'A').findings[0].code, 'tin_malformed');
});

test('corporations are left out, attorneys are kept', () => {
  const r = vendor1099({ vendors: [v('A', { entity_type: 'Corporation' }), v('B', { entity_type: 'Corporation', attorney: 'yes' })], payments: [p('A', 9000), p('B', 5000)] }, S);
  assert.equal(one(r, 'A').reportable, false); assert.equal(one(r, 'A').findings[0].code, 'corporation_exempt');
  assert.equal(one(r, 'B').reportable, true); assert.equal(one(r, 'B').findings[0].code, 'attorney_reportable');
});

test('payments in other years are left out and an older threshold can be set', () => {
  const r = vendor1099({ vendors: [v('A')], payments: [p('A', 700, 'Check', '2025-06-01'), p('A', 700)] }, S);
  assert.equal(one(r, 'A').paid, 700);
  const old = vendor1099({ vendors: [v('A')], payments: [p('A', 700, 'Check', '2025-06-01')] }, { ...DEFAULTS, tax_year: 2025, threshold: 600 });
  assert.equal(one(old, 'A').reportable, true);
});

test('a payment to a vendor not in the list needs review', () => {
  const r = vendor1099({ vendors: [], payments: [p('Z', 100)] }, S);
  assert.equal(one(r, 'Z').findings[0].code, 'unknown_vendor');
});

test('with no threshold set, the threshold follows the tax year: 600 through 2025, 2000 in 2026 (final pass)', async () => {
  const { vendor1099, thresholdFor } = await import('../src/logic.js');
  const vendors = [{ vendor_id: 'V1', vendor: 'Pat Kim Consulting', entity_type: 'Individual', tin: '345-67-8901', w9_on_file: 'yes', address: '7 Lake Road' }];
  const paid = (year) => [{ payment_id: 'P1', vendor_id: 'V1', date: `${year}-05-01`, amount: 1000, method: 'Check' }];
  assert.equal(thresholdFor(2025), 600); assert.equal(thresholdFor(2026), 2000); assert.equal(thresholdFor(2025, { threshold: 700 }), 700);
  assert.equal(vendor1099({ vendors, payments: paid(2025) }, { tax_year: 2025 }).items[0].reportable, true);
  assert.equal(vendor1099({ vendors, payments: paid(2026) }, { tax_year: 2026 }).items[0].reportable, false);
});
