// Gift coding: purpose words, designations, inactive and unknown funds, appeals.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { giftCoding, DEFAULTS } from '../src/index.js';

const funds = [{ fund: 'GEN', fund_name: 'General operating', restriction: 'Unrestricted', active: 'yes' }, { fund: 'SCHOL', fund_name: 'Scholarships', restriction: 'Purpose restricted', active: 'yes', keywords: 'scholarship;scholarships' }, { fund: 'OLD', restriction: 'Unrestricted', active: 'no' }];
const g = (gift_id, fund, memo = '', extra = {}) => ({ gift_id, amount: 100, fund, memo, ...extra });
const codes = (r, id) => r.items.find((i) => i.gift_id === id).findings.map((f) => f.code).sort();

test('a note naming a restricted purpose on another fund is flagged with the fund it names', () => {
  const r = giftCoding({ gifts: [g('A', 'GEN', 'For the scholarship fund')], funds }, DEFAULTS);
  assert.deepEqual(codes(r, 'A'), ['memo_names_restricted_purpose']); assert.equal(r.items[0].suggested_fund, 'SCHOL');
});

test('a note naming the fund it is coded to is ok, and words match whole words only', () => {
  const r = giftCoding({ gifts: [g('A', 'SCHOL', 'Scholarships 2026'), g('B', 'GEN', 'Scholarshipping news')], funds }, DEFAULTS);
  assert.deepEqual(codes(r, 'A'), []); assert.deepEqual(codes(r, 'B'), []);
});

test('a designation for a purpose no fund matches needs review', () => {
  const r = giftCoding({ gifts: [g('A', 'GEN', 'Designated for the music program only')], funds }, DEFAULTS);
  assert.deepEqual(codes(r, 'A'), ['memo_says_restricted']);
});

test('inactive and unknown funds need review', () => {
  const r = giftCoding({ gifts: [g('A', 'OLD'), g('B', 'MISC')], funds }, DEFAULTS);
  assert.deepEqual(codes(r, 'A'), ['fund_inactive']); assert.deepEqual(codes(r, 'B'), ['unknown_fund']);
});

test('a gift coded away from its appeal default is watched', () => {
  const r = giftCoding({ gifts: [g('A', 'GEN', '', { appeal: 'CAP' })], funds, appeals: [{ appeal: 'CAP', default_fund: 'SCHOL' }] }, DEFAULTS);
  assert.deepEqual(codes(r, 'A'), ['appeal_fund_mismatch']);
});

test('a fund given by its name is read as the fund', () => {
  const r = giftCoding({ gifts: [g('A', 'General operating')], funds }, DEFAULTS);
  assert.deepEqual(codes(r, 'A'), []); assert.equal(r.items[0].fund, 'GEN');
});

test('a note naming the coded fund wins over the appeal default', () => {
  const r = giftCoding({ gifts: [g('A', 'SCHOL', 'Scholarship gift', { appeal: 'FALL' })], funds, appeals: [{ appeal: 'FALL', default_fund: 'GEN' }] }, DEFAULTS);
  assert.deepEqual(codes(r, 'A'), []);
});

test('the designation words are settings', () => {
  const r = giftCoding({ gifts: [g('A', 'GEN', 'Earmarked for choir')], funds }, { restriction_words: ['earmarked for'] });
  assert.deepEqual(codes(r, 'A'), ['memo_says_restricted']);
});
