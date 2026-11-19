// Volunteer hours: totals, value, checks, waivers, entries, skilled hours.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { volunteerHours, DEFAULTS } from '../src/index.js';

const S = { ...DEFAULTS, as_of: '2026-11-18', hourly_value: 30, roles_needing_check: ['youth mentor'] };
const h = (volunteer_id, date, hours, extra = {}) => ({ volunteer_id, volunteer: `Vol ${volunteer_id}`, date, hours, program: 'Pantry', role: 'Helper', ...extra });
const codes = (r, id) => r.items.find((i) => i.volunteer_id === id).findings.map((f) => f.code).sort();

test('hours are totalled per volunteer and valued at the setting', () => {
  const r = volunteerHours({ hours: [h('A', '2026-10-01', 4), h('A', '2026-10-02', 2)] }, S);
  assert.equal(r.items[0].hours, 6); assert.equal(r.totals.value, 180);
});

test('a role that needs a check: missing is flagged, expired is flagged, recent is ok', () => {
  const r = volunteerHours({ hours: [h('A', '2026-10-01', 1, { role: 'Youth mentor' }), h('B', '2026-10-01', 1, { role: 'Youth mentor' }), h('C', '2026-10-01', 1, { role: 'Youth mentor' })], volunteers: [{ volunteer_id: 'B', role: 'Youth mentor', background_check_date: '2022-01-01' }, { volunteer_id: 'C', role: 'Youth mentor', background_check_date: '2025-06-01' }] }, S);
  assert.deepEqual(codes(r, 'A'), ['background_check_missing']); assert.deepEqual(codes(r, 'B'), ['background_check_expired']); assert.deepEqual(codes(r, 'C'), []);
});

test('a long day, a future date and a missing program need review', () => {
  const r = volunteerHours({ hours: [h('A', '2026-10-01', 14), h('A', '2026-12-01', 2), h('A', '2026-10-02', 3, { program: '' })] }, S);
  assert.deepEqual(codes(r, 'A'), ['future_date', 'missing_program', 'shift_over_max']);
});

test('the same entry twice is watched once', () => {
  const r = volunteerHours({ hours: [h('A', '2026-10-05', 3), h('A', '2026-10-05', 3)] }, S);
  assert.deepEqual(codes(r, 'A'), ['duplicate_entry']);
});

test('skilled hours are listed for the in-kind log', () => {
  const r = volunteerHours({ hours: [h('A', '2026-10-10', 10, { skilled: 'yes' })] }, S);
  assert.deepEqual(codes(r, 'A'), ['skilled_service_candidate']); assert.equal(r.totals.skilled_hours, 10);
});

test('a missing waiver is watched', () => {
  const r = volunteerHours({ hours: [h('A', '2026-10-01', 1)], volunteers: [{ volunteer_id: 'A', waiver: 'no' }] }, S);
  assert.deepEqual(codes(r, 'A'), ['waiver_missing']);
});

test('no hourly value means no value is shown', () => {
  const r = volunteerHours({ hours: [h('A', '2026-10-01', 5)] }, { ...S, hourly_value: 0 });
  assert.equal(r.totals.value, 0);
});
