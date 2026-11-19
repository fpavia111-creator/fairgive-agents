// Single audit: fiscal year, threshold by year, ALN totals, pass-through ids, unknown grants.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { singleAudit, DEFAULTS } from '../src/index.js';

const g = (grant, aln, extra = {}) => ({ grant, federal: 'yes', aln, ...extra });
const x = (grant, date, amount) => ({ grant, date, amount });
const total = (r) => r.items.find((i) => i.item === 'Total federal spending');

test('the default threshold is 1,000,000 for years starting on or after 2024-10-01 and 750,000 before', () => {
  assert.equal(singleAudit({ grants: [], expenses: [] }, { ...DEFAULTS, fiscal_year: 2026 }).totals.threshold, 1000000);
  assert.equal(singleAudit({ grants: [], expenses: [] }, { ...DEFAULTS, fiscal_year: 2024 }).totals.threshold, 750000);
  assert.equal(singleAudit({ grants: [], expenses: [] }, { ...DEFAULTS, fiscal_year_start: 10, fiscal_year: 2025 }).totals.threshold, 1000000);
});

test('spending is totalled by listing number inside the fiscal year only', () => {
  const r = singleAudit({ grants: [g('A', '84.287'), g('B', '84.287')], expenses: [x('A', '2026-02-01', 10), x('B', '2026-03-01', 5), x('A', '2025-12-31', 99)] }, { ...DEFAULTS, fiscal_year: 2026 });
  assert.equal(r.items.find((i) => i.aln === '84.287').federal_spending, 15);
});

test('over the threshold is flagged, near it is watched', () => {
  const over = singleAudit({ grants: [g('A', '10.555')], expenses: [x('A', '2026-02-01', 1000000)] }, { ...DEFAULTS, fiscal_year: 2026 });
  assert.equal(total(over).findings[0].code, 'threshold_met');
  const near = singleAudit({ grants: [g('A', '10.555')], expenses: [x('A', '2026-02-01', 850000)] }, { ...DEFAULTS, fiscal_year: 2026 });
  assert.equal(total(near).findings[0].code, 'approaching_threshold');
});

test('non-federal grants are left out', () => {
  const r = singleAudit({ grants: [{ grant: 'F', federal: 'no' }], expenses: [x('F', '2026-02-01', 2000000)] }, { ...DEFAULTS, fiscal_year: 2026 });
  assert.equal(r.totals.federal_spending, 0);
});

test('a federal grant with no listing number and a pass-through with no id need review', () => {
  const r = singleAudit({ grants: [g('A', ''), g('B', '93.568', { pass_through: 'County' })], expenses: [x('A', '2026-02-01', 1), x('B', '2026-02-01', 1)] }, { ...DEFAULTS, fiscal_year: 2026 });
  assert.equal(r.items.find((i) => i.aln === '(no ALN)').findings[0].code, 'missing_aln');
  assert.equal(r.items.find((i) => i.aln === '93.568').findings[0].code, 'pass_through_missing_id');
});

test('spending coded to a grant not in the list needs review', () => {
  const r = singleAudit({ grants: [], expenses: [x('Z', '2026-02-01', 5)] }, { ...DEFAULTS, fiscal_year: 2026 });
  assert.equal(r.items.find((i) => i.item === 'Grant Z').findings[0].code, 'unknown_grant');
});

test('the fiscal year defaults to the latest year in the file', () => {
  const r = singleAudit({ grants: [g('A', '1.1')], expenses: [x('A', '2025-05-01', 1), x('A', '2026-05-01', 2)] }, DEFAULTS);
  assert.equal(r.extra.fiscal_year, 2026); assert.equal(r.totals.federal_spending, 2);
});
