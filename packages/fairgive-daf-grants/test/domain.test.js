// DAF grants: detection, hard credit, benefits, pledges, acknowledgements, sponsors.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { dafGrants, DEFAULTS } from '../src/index.js';

const g = (gift_id, extra = {}) => ({ gift_id, donor: 'Example Charitable Gift Fund', amount: 100, method: 'DAF grant', daf_sponsor: 'Example Charitable Gift Fund', advisor: 'Pat Example', ...extra });
const codes = (r, id) => r.items.find((i) => i.gift_id === id).findings.map((f) => f.code).sort();

test('a DAF grant credited to the sponsor is ok', () => {
  const r = dafGrants({ gifts: [g('A')] }, DEFAULTS);
  assert.deepEqual(codes(r, 'A'), []);
});

test('a DAF grant hard-credited to the advisor needs review', () => {
  const r = dafGrants({ gifts: [g('A', { donor: 'Pat Example' })] }, DEFAULTS);
  assert.deepEqual(codes(r, 'A'), ['daf_hard_credit_to_advisor']);
});

test('a DAF grant that paid for benefits is flagged with the benefit amount', () => {
  const r = dafGrants({ gifts: [g('A', { benefit_value: 240 })] }, DEFAULTS);
  assert.deepEqual(codes(r, 'A'), ['daf_paid_benefit']); assert.equal(r.items[0].findings[0].amount, 240);
});

test('a DAF grant applied to a pledge and one acknowledged as deductible are listed', () => {
  const r = dafGrants({ gifts: [g('A', { pledge_id: 'PL-1' }), g('B', { ack_says_deductible: 'yes' })] }, DEFAULTS);
  assert.deepEqual(codes(r, 'A'), ['daf_applied_to_pledge']); assert.deepEqual(codes(r, 'B'), ['daf_ack_says_deductible']);
});

test('a gift marked DAF with no sponsor needs review', () => {
  const r = dafGrants({ gifts: [g('A', { donor: 'Pat Example', daf_sponsor: '', method: 'DAF' })] }, DEFAULTS);
  assert.deepEqual(codes(r, 'A'), ['daf_hard_credit_to_advisor', 'daf_sponsor_unknown']);
});

test('ordinary gifts are not listed, and a sponsor name alone marks a DAF gift', () => {
  const r = dafGrants({ gifts: [{ gift_id: 'X', donor: 'Pat Example', method: 'Check', amount: 5 }, { gift_id: 'Y', donor: 'Example Community Foundation', method: 'Check', amount: 5 }] }, DEFAULTS);
  assert.deepEqual(r.items.map((i) => i.gift_id), ['Y']);
});

test('the words that mark a DAF are settings', () => {
  const r = dafGrants({ gifts: [{ gift_id: 'Y', donor: 'Example Giving Vault', method: 'Grant', amount: 5 }] }, { daf_words: ['giving vault'] });
  assert.equal(r.items.length, 1);
});
