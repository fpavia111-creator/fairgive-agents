// Releases: purpose met by spending, capped at inflow; time met by date; errors.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { releases, DEFAULTS } from '../src/index.js';

const S = { ...DEFAULTS, release_accounts: ['3900'], as_of: '2026-09-30' };
const fund = (f, restriction, release_date = '') => ({ fund: f, restriction, release_date });
const line = (f, account, debit, credit, date = '2026-09-30') => ({ fund: f, account, debit, credit, date });
const one = (r, f) => r.items.find((i) => i.fund === f);

test('spending on a purpose that was not released is due, capped at what the fund received', () => {
  const r = releases({ funds: [fund('Y', 'Purpose restricted')], gl: [line('Y', '4010', '', 1000), line('Y', '5100', 1500, '')] }, S);
  assert.equal(one(r, 'Y').findings[0].code, 'release_due'); assert.equal(one(r, 'Y').to_release, 1000);
});

test('releases over spending and over the balance are both flagged', () => {
  const r = releases({ funds: [fund('M', 'Purpose restricted')], gl: [line('M', '4010', '', 1500), line('M', '5200', 1000, ''), line('M', '3900', 2500, '')] }, S);
  assert.deepEqual(one(r, 'M').findings.map((f) => f.code).sort(), ['release_over_balance', 'release_over_spending']);
});

test('a fully released purpose fund is ok and unrestricted funds are skipped', () => {
  const r = releases({ funds: [fund('C', 'Purpose restricted'), fund('G', 'Unrestricted')], gl: [line('C', '3200', '', 50), line('C', '5300', 40, ''), line('C', '3900', 40, '')] }, S);
  assert.equal(one(r, 'C').status, 'ok'); assert.equal(one(r, 'G'), undefined);
});

test('a time restriction past its date with money left is due in full', () => {
  const r = releases({ funds: [fund('T', 'Time restricted', '2026-09-01')], gl: [line('T', '3200', '', 800)] }, S);
  assert.equal(one(r, 'T').findings[0].code, 'time_restriction_ended'); assert.equal(one(r, 'T').to_release, 800);
});

test('a release before the time restriction ends is flagged', () => {
  const r = releases({ funds: [fund('T', 'Time restricted', '2027-07-01')], gl: [line('T', '3200', '', 800), line('T', '3900', 200, '', '2026-09-15')] }, S);
  assert.equal(one(r, 'T').findings[0].code, 'release_before_time'); assert.equal(one(r, 'T').findings[0].amount, 200);
});

test('a time-restricted fund with no release date needs review', () => {
  const r = releases({ funds: [fund('T', 'Time restricted')], gl: [line('T', '3200', '', 10)] }, S);
  assert.equal(one(r, 'T').status, 'review');
});

test('as_of defaults to the latest ledger date', () => {
  const r = releases({ funds: [fund('T', 'Time restricted', '2026-10-01')], gl: [line('T', '3200', '', 10, '2026-10-05')] }, { ...S, as_of: null });
  assert.equal(r.extra.as_of, '2026-10-05'); assert.equal(one(r, 'T').findings[0].code, 'time_restriction_ended');
});
