// Grant reporting calendar. Each schedule row makes report periods inside the award:
// quarterly, semiannual or annual periods counted from the award start, a final report at
// the award end, or a single report on a given date. A report is due `due_days_after` the
// period end. Each report is matched to the submissions log by grant, report and period.
import { str, num, isoDate, addDays, addMonths, daysBetween, finding, statusOf, cmp, nameKey } from 'fairgive-core';

export const DEFAULTS = Object.freeze({ as_of: null, due_soon_days: 30, horizon_days: 120, final_due_days: 90 });
const LEVELS = { overdue: 'flag', no_schedule: 'review', bad_schedule: 'review', due_soon: 'watch', late_submission: 'watch' };
const STEP = { quarterly: 3, quarter: 3, semiannual: 6, 'semi-annual': 6, 'semi annual': 6, biannual: 6, annual: 12, annually: 12, yearly: 12, monthly: 1 };

export function reportCalendar({ grants = [], schedule = [], submissions = [] }, s = DEFAULTS) {
  const asOf = isoDate(s.as_of) || new Date().toISOString().slice(0, 10);
  const horizon = addDays(asOf, Number(s.horizon_days ?? 120));
  const G = new Map(); for (const g of grants) if (str(g.grant)) G.set(nameKey(g.grant), { grant: str(g.grant), name: str(g.grant_name), funder: str(g.funder), start: isoDate(g.award_start), end: isoDate(g.award_end), owner: str(g.owner) });
  const sent = new Map(); for (const x of submissions) { const k = `${nameKey(x.grant)}|${nameKey(x.report)}|${isoDate(x.period_end) || ''}`; sent.set(k, isoDate(x.submitted_date)); }
  const items = []; const scheduled = new Set();
  const add = (g, report, periodEnd, due) => {
    const k = `${nameKey(g.grant)}|${nameKey(report)}|${periodEnd || ''}`; const sub = sent.get(k) ?? null; const f = [];
    if (sub) { const late = due ? daysBetween(due, sub) : null; if (late !== null && late > 0) f.push(finding('late_submission', `${g.grant} ${report} for the period ending ${periodEnd} was sent on ${sub}, ${late} day(s) after it was due on ${due}.`)); }
    else if (due && due < asOf) f.push(finding('overdue', `${g.grant} ${report}${periodEnd ? ` for the period ending ${periodEnd}` : ''} was due on ${due} (${daysBetween(due, asOf)} day(s) ago) and is not in the submissions log.`));
    else if (due && daysBetween(asOf, due) <= Number(s.due_soon_days ?? 30)) f.push(finding('due_soon', `${g.grant} ${report}${periodEnd ? ` for the period ending ${periodEnd}` : ''} is due on ${due}, in ${daysBetween(asOf, due)} day(s).`));
    else if (!sub && due && due > horizon) return;
    items.push({ item: `${g.grant} ${report} ${periodEnd || due || ''}`.trim(), grant: g.grant, funder: g.funder, owner: g.owner, report, period_end: periodEnd, due, submitted: sub, state: sub ? 'sent' : due && due < asOf ? 'overdue' : 'open', status: statusOf(f, LEVELS), findings: f });
  };
  for (const r of schedule) {
    const g = G.get(nameKey(r.grant)); if (!g) continue; scheduled.add(nameKey(r.grant));
    const report = str(r.report) || 'Report'; const freq = str(r.frequency).toLowerCase(); const days = num(r.due_days_after);
    if (freq === 'final') { const due = g.end ? addDays(g.end, days ?? Number(s.final_due_days ?? 90)) : null; add(g, report, g.end, due); continue; }
    if (freq === 'once' || freq === 'one time' || freq === 'one-time') { add(g, report, isoDate(r.due_date), isoDate(r.due_date)); continue; }
    const step = STEP[freq];
    if (!step || !g.start || !g.end) { const f = [finding('bad_schedule', `${g.grant} ${report}: frequency "${str(r.frequency)}" or the award dates cannot make report periods.`)]; items.push({ item: `${g.grant} ${report}`, grant: g.grant, funder: g.funder, owner: g.owner, report, period_end: null, due: null, submitted: null, state: 'open', status: statusOf(f, LEVELS), findings: f }); continue; }
    for (let k = 1; k <= 240; k++) { const end = addDays(addMonths(g.start, k * step), -1); if (end > g.end) break; add(g, report, end, addDays(end, days ?? 30)); }
  }
  for (const g of [...G.values()].sort((a, b) => cmp(a.grant, b.grant))) if (!scheduled.has(nameKey(g.grant))) { const f = [finding('no_schedule', `${g.grant} (${g.funder || 'no funder'}) has no reporting schedule.`)]; items.push({ item: `${g.grant} no schedule`, grant: g.grant, funder: g.funder, owner: g.owner, report: '', period_end: null, due: null, submitted: null, state: 'open', status: statusOf(f, LEVELS), findings: f }); }
  return { items, totals: { grants: G.size, reports: items.filter((i) => i.report).length, overdue: items.filter((i) => i.findings.some((f) => f.code === 'overdue')).length, due_soon: items.filter((i) => i.findings.some((f) => f.code === 'due_soon')).length, sent_late: items.filter((i) => i.findings.some((f) => f.code === 'late_submission')).length, no_schedule: items.filter((i) => i.findings.some((f) => f.code === 'no_schedule')).length }, extra: { as_of: asOf } };
}
