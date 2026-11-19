// Grant reports: periods from schedules, final and one-time reports, matching, horizon.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { reportCalendar, DEFAULTS } from '../src/index.js';

const S = { ...DEFAULTS, as_of: '2026-11-18' };
const grant = (g, start, end) => ({ grant: g, award_start: start, award_end: end, funder: 'Example Funder' });
const sch = (g, report, frequency, due_days_after = 30, due_date = '') => ({ grant: g, report, frequency, due_days_after, due_date });
const find = (r, re) => r.items.find((i) => re.test(i.item));

test('quarterly periods are counted from the award start and due after the period end', () => {
  const r = reportCalendar({ grants: [grant('A', '2026-07-01', '2027-06-30')], schedule: [sch('A', 'Financial', 'Quarterly')] }, S);
  assert.equal(find(r, /2026-09-30/).due, '2026-10-30'); assert.equal(find(r, /2026-09-30/).findings[0].code, 'overdue');
  assert.equal(find(r, /2026-12-31/).status, 'ok'); assert.equal(find(r, /2027-03-31/), undefined);
});

test('a final report is due after the award end, using the setting when the schedule gives no days', () => {
  const r = reportCalendar({ grants: [grant('A', '2025-07-01', '2026-06-30')], schedule: [{ grant: 'A', report: 'Final', frequency: 'Final' }] }, S);
  assert.equal(r.items[0].due, '2026-09-28'); assert.equal(r.items[0].findings[0].code, 'overdue');
});

test('a sent report is ok, a late one is watched', () => {
  const r = reportCalendar({ grants: [grant('A', '2026-01-01', '2026-12-31')], schedule: [sch('A', 'Interim', 'Semiannual')], submissions: [{ grant: 'A', report: 'Interim', period_end: '2026-06-30', submitted_date: '2026-08-15' }] }, S);
  assert.equal(find(r, /2026-06-30/).findings[0].code, 'late_submission');
});

test('a one-time report inside the soon window is due soon', () => {
  const r = reportCalendar({ grants: [grant('A', '2026-01-01', '2027-12-31')], schedule: [sch('A', 'Inventory', 'Once', '', '2026-12-01')] }, S);
  assert.equal(r.items[0].findings[0].code, 'due_soon');
});

test('a grant with no schedule needs review', () => {
  const r = reportCalendar({ grants: [grant('A', '2026-01-01', '2027-12-31')], schedule: [] }, S);
  assert.equal(r.items[0].findings[0].code, 'no_schedule');
});

test('an unknown frequency is a schedule to fix', () => {
  const r = reportCalendar({ grants: [grant('A', '2026-01-01', '2027-12-31')], schedule: [sch('A', 'Update', 'Whenever')] }, S);
  assert.equal(r.items[0].findings[0].code, 'bad_schedule');
});

test('reports beyond the horizon are left off', () => {
  const r = reportCalendar({ grants: [grant('A', '2026-01-01', '2028-12-31')], schedule: [sch('A', 'Annual', 'Annual')] }, { ...S, horizon_days: 30 });
  assert.equal(r.items.length, 0);
});
