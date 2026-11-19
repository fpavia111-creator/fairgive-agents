// Liquidity: financial assets, restrictions, board designations, receivables, months.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { liquidity, DEFAULTS } from '../src/index.js';

const b = (account, category, balance, restriction = 'Without donor restrictions', available_within_year = 'yes') => ({ account, account_name: `Acct ${account}`, category, balance, restriction, available_within_year });
const one = (r, a) => r.items.find((i) => i.account === a);

test('unrestricted cash and investments are available; property is not a financial asset', () => {
  const r = liquidity({ balances: [b('1', 'Cash', 100), b('2', 'Investments', 50), b('3', 'Property', 500, 'Without donor restrictions', 'no')] }, DEFAULTS);
  assert.equal(r.totals.available, 150); assert.equal(r.totals.financial_assets, 150); assert.equal(one(r, '3').financial_asset, false);
});

test('purpose-restricted cash is left out, and flagged when marked available', () => {
  const r = liquidity({ balances: [b('1', 'Cash', 30, 'With donor restrictions - purpose', 'no'), b('2', 'Cash', 15, 'With donor restrictions - purpose', 'yes')] }, DEFAULTS);
  assert.equal(r.totals.available, 0); assert.deepEqual(one(r, '1').findings, []); assert.equal(one(r, '2').findings[0].code, 'restricted_marked_available');
});

test('time-restricted receivables due within the year count as available', () => {
  const r = liquidity({ balances: [b('1', 'Grants receivable', 25, 'With donor restrictions - time', 'yes')] }, DEFAULTS);
  assert.equal(r.totals.available, 25);
});

test('board designations are left out unless the settings include them', () => {
  const bal = [b('1', 'Investments', 80, 'Board designated')];
  assert.equal(liquidity({ balances: bal }, DEFAULTS).totals.available, 0);
  assert.equal(liquidity({ balances: bal }, { ...DEFAULTS, include_board_designated: true }).totals.available, 80);
});

test('receivables due after a year are left out and watched', () => {
  const r = liquidity({ balances: [b('1', 'Pledges receivable', 40, 'Without donor restrictions', 'no')] }, DEFAULTS);
  assert.equal(one(r, '1').findings[0].code, 'receivable_beyond_year'); assert.equal(r.totals.available, 0);
});

test('months covered come from yearly expenses, and low liquidity is watched', () => {
  const r = liquidity({ balances: [b('1', 'Cash', 100000)] }, { ...DEFAULTS, annual_expenses: 1200000 });
  assert.equal(r.totals.months_covered, 1); assert.equal(one(r, 'Total available').findings[0].code, 'low_liquidity');
});

test('an account with no category needs review', () => {
  const r = liquidity({ balances: [b('1', '', 5)] }, DEFAULTS);
  assert.equal(one(r, '1').findings[0].code, 'no_category');
});
