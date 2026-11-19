// Fund balances: classes, negative restricted funds, corpus, wrong class, unknown funds, interfund.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { fundBalances, DEFAULTS } from '../src/index.js';

const S = { ...DEFAULTS, net_asset_accounts: { 3100: 'without', 3200: 'with', 3300: 'with' }, interfund_accounts: ['1900', '2900'] };
const fund = (f, restriction, corpus = '') => ({ fund: f, restriction, corpus });
const line = (fundCode, account, debit, credit) => ({ fund: fundCode, account, debit, credit });
const one = (r, f) => r.items.find((i) => i.fund === f);

test('a balance is credits minus debits on activity and net asset accounts, by class', () => {
  const r = fundBalances({ funds: [fund('G', 'Unrestricted'), fund('Y', 'Temporarily restricted')], gl: [line('G', '3100', '', 100), line('G', '5000', 30, ''), line('G', '1010', 70, ''), line('Y', '4010', '', 40)] }, S);
  assert.equal(one(r, 'G').balance, 70); assert.equal(r.totals.without_donor_restrictions, 70); assert.equal(r.totals.with_donor_restrictions, 40);
});

test('a restricted fund below zero is flagged; an unrestricted one is only watched', () => {
  const r = fundBalances({ funds: [fund('Y', 'Purpose restricted'), fund('G', 'Without donor restrictions')], gl: [line('Y', '5100', 50, ''), line('G', '5000', 10, '')] }, S);
  assert.equal(one(r, 'Y').findings[0].code, 'negative_restricted_balance'); assert.equal(one(r, 'Y').status, 'flag');
  assert.equal(one(r, 'G').status, 'watch');
});

test('an endowment under its corpus is flagged with the shortfall', () => {
  const r = fundBalances({ funds: [fund('E', 'Perpetual', 1000)], gl: [line('E', '3300', '', 1000), line('E', '4900', 120, '')] }, S);
  const f = one(r, 'E').findings[0]; assert.equal(f.code, 'perpetual_below_corpus'); assert.equal(f.amount, -120);
});

test('net assets booked to the account of the other class are flagged', () => {
  const r = fundBalances({ funds: [fund('C', 'Purpose restricted')], gl: [line('C', '3100', '', 500)] }, S);
  assert.equal(one(r, 'C').findings[0].code, 'wrong_net_asset_class'); assert.equal(one(r, 'C').findings[0].amount, 500);
});

test('ledger funds missing from the list and funds with no class need review', () => {
  const r = fundBalances({ funds: [fund('M', '')], gl: [line('M', '4010', '', 5), line('X', '4010', '', 9)] }, S);
  assert.equal(one(r, 'M').findings[0].code, 'no_restriction_code'); assert.equal(one(r, 'X').findings[0].code, 'unknown_fund');
});

test('due-to and due-from lines must net to zero across funds', () => {
  const bad = fundBalances({ funds: [], gl: [line('G', '1900', 40, ''), line('Y', '2900', '', 35)] }, S);
  assert.equal(one(bad, 'Interfund').findings[0].amount, 5);
  const good = fundBalances({ funds: [], gl: [line('G', '1900', 40, ''), line('Y', '2900', '', 40)] }, S);
  assert.equal(one(good, 'Interfund').status, 'ok');
});

test('board designated funds count as without donor restrictions and are shown on their own', () => {
  const r = fundBalances({ funds: [fund('B', 'Board designated')], gl: [line('B', '3100', '', 25)] }, S);
  assert.equal(r.totals.board_designated, 25); assert.equal(r.totals.without_donor_restrictions, 25);
});
