// Gifts against deposits and the ledger: batches, single gifts, shared deposits, months.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { reconcile, DEFAULTS } from '../src/index.js';

const g = (gift_id, amount, gift_date, batch = '', extra = {}) => ({ gift_id, amount, gift_date, batch, gift_type: 'Cash', ...extra });
const d = (deposit_id, amount, date, batch = '', description = '') => ({ deposit_id, amount, date, batch, description });
const item = (r, name) => r.items.find((i) => i.item === name);

test('a batch is matched to the deposit that names it, and a short deposit is flagged with the difference', () => {
  const r = reconcile({ gifts: [g('A', 100, '2026-10-01', 'B1'), g('B', 50, '2026-10-01', 'B1')], deposits: [d('D1', 140, '2026-10-02', 'B1')] }, DEFAULTS);
  const f = item(r, 'Batch B1').findings[0];
  assert.equal(f.code, 'batch_total_mismatch'); assert.equal(f.amount, -10);
});

test('an unbatched gift is matched by amount within the day window, and not outside it', () => {
  const near = reconcile({ gifts: [g('A', 300, '2026-10-20')], deposits: [d('D1', 300, '2026-10-24')] }, DEFAULTS);
  assert.equal(item(near, 'Gift A').status, 'ok');
  const far = reconcile({ gifts: [g('A', 300, '2026-10-01')], deposits: [d('D1', 300, '2026-10-24')] }, DEFAULTS);
  assert.equal(item(far, 'Gift A').findings[0].code, 'not_deposited'); assert.equal(item(far, 'Deposit D1').findings[0].code, 'deposit_not_in_crm');
});

test('several unbatched gifts deposited together are matched to the one deposit', () => {
  const r = reconcile({ gifts: [g('A', 100, '2026-10-05'), g('B', 250, '2026-10-05'), g('C', 50, '2026-10-06')], deposits: [d('D1', 400, '2026-10-07')] }, DEFAULTS);
  assert.deepEqual(r.items.filter((i) => i.kind === 'gifts').map((i) => i.status), ['ok', 'ok', 'ok']);
  assert.ok(r.items.every((i) => i.kind !== 'deposit'));
});

test('a gift newer than the deposit window before the last deposit is in transit, not missing', () => {
  const r = reconcile({ gifts: [g('A', 125, '2026-10-29')], deposits: [d('D1', 80, '2026-10-30')] }, DEFAULTS);
  assert.equal(item(r, 'Gift A').findings[0].code, 'in_transit');
});

test('noncash gifts are left out of deposit matching but counted in the ledger comparison', () => {
  const r = reconcile({ gifts: [g('S', 5000, '2026-10-15', '', { gift_type: 'Stock' })], deposits: [], gl: [{ date: '2026-10-15', account: '4020', credit: 5000 }] }, DEFAULTS);
  assert.equal(r.totals.noncash_gifts, 1); assert.equal(r.totals.gifts, 0); assert.equal(item(r, 'Month 2026-10').status, 'ok');
});

test('the ledger is compared month by month with credits as revenue and other accounts left out', () => {
  const r = reconcile({ gifts: [g('A', 100, '2026-10-01', 'B1')], deposits: [d('D1', 100, '2026-10-02', 'B1')], gl: [{ date: '2026-10-02', account: '4010', credit: 80 }, { date: '2026-10-02', account: '1010', debit: 100 }] }, DEFAULTS);
  const f = item(r, 'Month 2026-10').findings[0];
  assert.equal(f.code, 'gl_differs'); assert.equal(f.amount, -20); assert.equal(r.totals.gl_gap, 20);
});

test('deposit descriptions named in the settings are ignored', () => {
  const r = reconcile({ gifts: [], deposits: [d('D9', 12.5, '2026-10-30', '', 'Interest credit')] }, { ...DEFAULTS, ignore_deposit_words: ['interest'] });
  assert.equal(r.items.length, 0); assert.equal(r.totals.deposits, 0);
});
