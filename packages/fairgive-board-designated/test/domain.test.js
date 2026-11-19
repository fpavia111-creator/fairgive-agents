// Board-designated funds: resolutions for designations, spending and releases.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { boardDesignated, DEFAULTS } from '../src/index.js';

const S = { ...DEFAULTS, transfer_accounts: ['3150'], net_asset_accounts: { 3200: 'with' } };
const fund = [{ fund: 'F' }];
const l = (account, debit, credit) => ({ fund: 'F', account, debit, credit });
const res = (action, amount) => ({ resolution_id: 'R', fund: 'F', action, amount });
const codes = (r) => r.items.find((i) => i.fund === 'F').findings.map((f) => f.code).sort();

test('a designation with its resolution is ok', () => {
  const r = boardDesignated({ funds: fund, resolutions: [res('Designate', 100)], gl: [l('3150', '', 100)] }, S);
  assert.deepEqual(codes(r), []); assert.equal(r.items[0].balance, 100);
});

test('money moved in beyond the resolutions is flagged', () => {
  const r = boardDesignated({ funds: fund, resolutions: [], gl: [l('3150', '', 100)] }, S);
  assert.deepEqual(codes(r), ['designation_without_resolution']);
});

test('spending beyond what the board approved is flagged with the difference', () => {
  const r = boardDesignated({ funds: fund, resolutions: [res('Designate', 100), res('Spend', 30)], gl: [l('3150', '', 100), l('5500', 45, '')] }, S);
  assert.deepEqual(codes(r), ['spending_without_resolution']); assert.equal(r.items[0].findings[0].amount, 15);
});

test('a release the board voted and the ledger did not book needs review', () => {
  const r = boardDesignated({ funds: fund, resolutions: [res('Designate', 100), res('Undesignate', 40)], gl: [l('3150', '', 100)] }, S);
  assert.deepEqual(codes(r), ['undesignation_not_recorded']);
  const done = boardDesignated({ funds: fund, resolutions: [res('Designate', 100), res('Undesignate', 40)], gl: [l('3150', '', 100), l('3150', 40, '')] }, S);
  assert.deepEqual(codes(done), []);
});

test('donor-restricted lines in a board fund need review', () => {
  const r = boardDesignated({ funds: fund, resolutions: [], gl: [l('3200', '', 50)] }, S);
  assert.deepEqual(codes(r), ['reported_as_donor_restricted']);
});

test('a fund below zero is flagged', () => {
  const r = boardDesignated({ funds: fund, resolutions: [res('Designate', 10), res('Spend', 20)], gl: [l('3150', '', 10), l('5500', 20, '')] }, S);
  assert.deepEqual(codes(r), ['balance_below_zero']);
});

test('designations over the unrestricted net assets are flagged', () => {
  const r = boardDesignated({ funds: fund, resolutions: [res('Designate', 100)], gl: [l('3150', '', 100)] }, { ...S, unrestricted_net_assets: 80 });
  assert.equal(r.items.find((i) => i.fund === 'All designated funds').findings[0].code, 'designations_over_unrestricted');
});
