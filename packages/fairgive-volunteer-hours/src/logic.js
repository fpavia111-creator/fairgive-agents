// Volunteer hours by program, valued at the hourly rate in the settings. Entries over the
// daily maximum, dated after as_of, entered twice or with no program are listed;
// volunteers in roles that need a background check are checked for one inside the years
// in the settings, and for a waiver; skilled hours are listed as possible contributed
// services for the in-kind log (a person decides whether they meet the criteria).
import { str, num, round2, isoDate, addMonths, yes, finding, statusOf, cmp, nameKey, rollup } from 'fairgive-core';

export const DEFAULTS = Object.freeze({ as_of: null, hourly_value: 0, max_hours_per_day: 12, background_check_years: 3, roles_needing_check: [] });
const LEVELS = { background_check_missing: 'flag', background_check_expired: 'flag', shift_over_max: 'review', future_date: 'review', missing_program: 'review', duplicate_entry: 'watch', waiver_missing: 'watch', skilled_service_candidate: 'watch' };

export function volunteerHours({ hours = [], volunteers = [] }, s = DEFAULTS) {
  const asOf = isoDate(s.as_of) || new Date().toISOString().slice(0, 10);
  const V = new Map(); for (const v of volunteers) if (str(v.volunteer_id) || str(v.volunteer)) V.set(nameKey(v.volunteer_id) || nameKey(v.volunteer), v);
  const needs = (role) => (s.roles_needing_check || []).some((r) => nameKey(r) && nameKey(role).includes(nameKey(r)));
  const people = new Map(); const seen = new Map(); const programs = [];
  for (const h of hours) {
    const id = str(h.volunteer_id) || str(h.volunteer); if (!id) continue;
    const p = people.get(id) || { volunteer_id: id, volunteer: str(h.volunteer), role: str(h.role), hours: 0, skilled: 0, f: [] }; people.set(id, p);
    const hrs = num(h.hours) || 0; const d = isoDate(h.date); p.hours = round2(p.hours + hrs); if (!p.role) p.role = str(h.role);
    const dupKey = `${nameKey(id)}|${d}|${hrs}|${nameKey(h.program)}`; seen.set(dupKey, (seen.get(dupKey) || 0) + 1);
    if (seen.get(dupKey) === 2) p.f.push(finding('duplicate_entry', `${hrs} hours on ${d} for ${str(h.program) || 'no program'} are entered more than once.`, hrs));
    if (hrs > Number(s.max_hours_per_day ?? 12)) p.f.push(finding('shift_over_max', `${hrs} hours on ${d}, more than the ${s.max_hours_per_day} hour daily maximum in the settings.`, hrs));
    if (d && d > asOf) p.f.push(finding('future_date', `${hrs} hours are dated ${d}, after ${asOf}.`, hrs));
    if (!str(h.program)) p.f.push(finding('missing_program', `${hrs} hours on ${d || 'no date'} have no program.`, hrs));
    if (yes(h.skilled) === true) p.skilled = round2(p.skilled + hrs);
    programs.push({ program: str(h.program) || '(none)', hours: hrs });
  }
  const items = [];
  for (const p of [...people.values()].sort((a, b) => cmp(a.volunteer_id, b.volunteer_id))) {
    const v = V.get(nameKey(p.volunteer_id)) || V.get(nameKey(p.volunteer)); const role = str(v && v.role) || p.role;
    if (needs(role)) { const c = v ? isoDate(v.background_check_date) : null;
      if (!c) p.f.push(finding('background_check_missing', `${role}: no background check on file.`));
      else if (addMonths(c, 12 * Number(s.background_check_years ?? 3)) < asOf) p.f.push(finding('background_check_expired', `${role}: the background check of ${c} is older than ${s.background_check_years} years.`)); }
    if (v && yes(v.waiver) === false) p.f.push(finding('waiver_missing', `No signed waiver on file.`));
    if (p.skilled) p.f.push(finding('skilled_service_candidate', `${p.skilled} skilled hours (${role}); they may count as contributed services in the in-kind log if they meet the criteria.`, p.skilled));
    items.push({ volunteer_id: p.volunteer_id, volunteer: p.volunteer, role, hours: p.hours, value: round2(p.hours * Number(s.hourly_value || 0)), skilled_hours: p.skilled, status: statusOf(p.f, LEVELS), findings: p.f });
  }
  const total = round2(items.reduce((t, i) => t + i.hours, 0));
  return { items, totals: { volunteers: items.length, hours: total, value: round2(total * Number(s.hourly_value || 0)), skilled_hours: round2(items.reduce((t, i) => t + i.skilled_hours, 0)), checks_to_fix: items.filter((i) => i.findings.some((f) => /background/.test(f.code))).length }, extra: { as_of: asOf, by_program: rollup(programs, 'program', (x) => x.program, { hours: (x) => x.hours }) } };
}
