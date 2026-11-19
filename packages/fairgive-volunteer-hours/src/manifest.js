import { readFileSync } from 'node:fs';
import { giveAgent, REFUSE } from 'fairgive-core';
import { volunteerHours, DEFAULTS } from './logic.js';

const pkg = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'));
const files = {
  hours: { type: 'string', description: 'Volunteer hours log under --root (from your volunteer system or a sign-in sheet): entry id, volunteer id, name, date, hours, program, role, skilled (yes/no)' },
  volunteers: { type: 'string', description: 'Optional volunteer list under --root: volunteer id, name, role, background check date, waiver (yes/no)' },
};
const H = { entry_id: { aliases: ['Entry ID', 'Shift ID', 'Record ID'] }, volunteer_id: { aliases: ['Volunteer ID', 'Constituent ID', 'Contact ID'] }, volunteer: { aliases: ['Volunteer', 'Volunteer Name', 'Name', 'Full Name'], personal: true }, date: { aliases: ['Date', 'Shift Date', 'Service Date'], type: 'date', required: true }, hours: { aliases: ['Hours', 'Hours Served', 'Duration'], type: 'number' }, program: { aliases: ['Program', 'Program Name', 'Opportunity', 'Project'] }, role: { aliases: ['Role', 'Position', 'Job'] }, skilled: { aliases: ['Skilled', 'Specialized Skill', 'Professional Service', 'Pro Bono'] } };
const V = { volunteer_id: { aliases: ['Volunteer ID', 'Constituent ID', 'Contact ID'] }, volunteer: { aliases: ['Volunteer', 'Name', 'Full Name'], personal: true }, role: { aliases: ['Role', 'Position'] }, background_check_date: { aliases: ['Background Check Date', 'Background Check', 'Screening Date', 'Cleared On'], type: 'date', translate: 'date' }, waiver: { aliases: ['Waiver', 'Waiver Signed', 'Release Signed'] } };
export const DEMO = { title: 'Fairgive Volunteer Hours', files: { hours: 'hours.csv', volunteers: 'volunteers.csv', settings: 'settings.json' }, explain: { arg: 'volunteer_id', value: 'V-4' } };

export const manifest = giveAgent({
  pkg, prefix: 'volunteers',
  description: pkg.description.replace(/^[^:]+:\s*/, ''),
  check: { title: 'Volunteer hours', description: 'Totals volunteer hours by volunteer and program and values them at the hourly rate in the settings. Lists entries over the daily maximum, dated after the as-of date, entered twice or with no program; volunteers in roles that need a background check with none or an old one, missing waivers, and skilled hours that may count as contributed services.' },
  args: files, required: ['hours'],
  sources: { hours: { label: 'Volunteer hours', args: ['hours'], fields: H }, volunteers: { label: 'Volunteers', args: ['volunteers'], fields: V } },
  settings: { defaults: DEFAULTS, schema: { type: 'object', additionalProperties: false, properties: {
    as_of: { type: ['string', 'null'], description: 'Date the check is made at (YYYY-MM-DD); default: today' },
    hourly_value: { type: 'number', minimum: 0, maximum: 1000, description: 'Value of a volunteer hour you use for reports (default 0: not valued; enter the published figure your organization uses)' },
    max_hours_per_day: { type: 'number', minimum: 1, maximum: 24, description: 'Hours in one entry above this are listed (default 12)' },
    background_check_years: { type: 'number', minimum: 0, maximum: 20, description: 'A background check older than this is expired (default 3)' },
    roles_needing_check: { type: 'array', items: { type: 'string' }, description: 'Roles that need a background check (youth mentor, driver...)' },
  } } },
  run: ({ rows, settings }) => volunteerHours(rows, settings),
  key: { arg: 'volunteer_id', field: 'volunteer_id', label: 'volunteer' },
  summary: (o) => `${o.totals.volunteers} volunteer(s), ${o.totals.hours} hour(s) as of ${o.extra.as_of}${o.totals.value ? ` valued at ${o.totals.value}` : ''}; ${o.totals.checks_to_fix} background check(s) to fix, ${o.totals.skilled_hours} skilled hour(s) to look at.`,
  report: {
    title: 'Volunteer hours', base: 'volunteer-hours',
    row: (i) => ({ volunteer_id: i.volunteer_id ?? '', volunteer: i.volunteer ?? '', role: i.role ?? '', hours: i.hours ?? '', value: i.value ?? '', skilled_hours: i.skilled_hours ?? '' }),
    htmlColumns: ['volunteer_id', 'volunteer', 'role', 'hours', 'value', 'skilled_hours'],
    sections: (o) => [{ title: 'By program', rows: o.extra.by_program, columns: ['program', 'count', 'hours'] }],
  },
  refused: [REFUSE.delete, REFUSE.email],
  memory: null,
});
