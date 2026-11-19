// Form 990 data: Schedule B, M and I thresholds, officers, tax year.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { form990, DEFAULTS } from '../src/index.js';

const S = { ...DEFAULTS, tax_year: 2026 };
const g = (gift_id, donor_id, amount, extra = {}) => ({ gift_id, donor_id, donor: `Donor ${donor_id}`, address: '1 Main St', gift_date: '2026-03-01', amount, gift_type: 'Cash', ...extra });
const it = (r, name) => r.items.find((i) => i.item === name);

test('a contributor is on Schedule B when the year total reaches the threshold', () => {
  const r = form990({ gifts: [g('1', 'A', 3000), g('2', 'A', 2000), g('3', 'B', 4999)] }, S);
  assert.equal(it(r, 'Schedule B A').amount, 5000); assert.equal(it(r, 'Schedule B B'), undefined);
});

test('a Schedule B contributor with no address is flagged; a noncash gift with no description needs review', () => {
  const r = form990({ gifts: [g('1', 'A', 9000, { address: '' }), g('2', 'B', 8000, { gift_type: 'Stock' })] }, S);
  assert.equal(it(r, 'Schedule B A').findings[0].code, 'scheduleb_missing_address'); assert.equal(it(r, 'Schedule B B').findings[0].code, 'scheduleb_noncash_no_description');
});

test('noncash gifts over the Schedule M threshold are watched', () => {
  const r = form990({ gifts: [g('1', 'A', 20000, { gift_type: 'Noncash', description: 'Art' }), g('2', 'B', 6000, { gift_type: 'Stock', description: 'Shares' })] }, S);
  assert.equal(it(r, 'Schedule M noncash total').findings[0].code, 'schedule_m_likely');
});

test('gifts outside the tax year are left out', () => {
  const r = form990({ gifts: [g('1', 'A', 9000, { gift_date: '2025-12-31' })] }, S);
  assert.equal(r.items.length, 0);
});

test('officers need hours and compensation, and zero compensation is an answer', () => {
  const r = form990({ gifts: [], officers: [{ name: 'X', title: 'Chair', hours_per_week: '', compensation: 0 }, { name: 'Y', title: 'Treasurer', hours_per_week: 2, compensation: '' }] }, S);
  assert.equal(it(r, 'Part VII Chair').findings[0].code, 'officer_missing_hours'); assert.equal(it(r, 'Part VII Treasurer').findings[0].code, 'officer_missing_comp');
});

test('grants over the Schedule I threshold need an EIN; smaller grants are left out', () => {
  const r = form990({ gifts: [], grants_paid: [{ grantee: 'A Org', amount: 6000, address: 'x' }, { grantee: 'B Org', amount: 3000 }] }, S);
  assert.equal(it(r, 'Schedule I A Org').findings[0].code, 'schedulei_missing_ein'); assert.equal(it(r, 'Schedule I B Org'), undefined);
});

test('a July tax year counts August in the next year', () => {
  const r = form990({ gifts: [g('1', 'A', 9000, { gift_date: '2026-08-01' })] }, { ...DEFAULTS, tax_year: 2027, fiscal_year_start: 7 });
  assert.ok(it(r, 'Schedule B A'));
});
