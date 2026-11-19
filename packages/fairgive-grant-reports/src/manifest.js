import { readFileSync } from 'node:fs';
import { relative } from 'node:path';
import { giveAgent, GRANT_FIELDS, sourceOf, REFUSE, letter, toIcs, rollup } from 'fairgive-core';
import { reportCalendar, DEFAULTS } from './logic.js';

const pkg = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'));
const OUT = 'fairgive-out/grant_reports';
const files = {
  grants: { type: 'string', description: 'Grant list under --root: grant code, name, funder, award start and end, owner' },
  schedule: { type: 'string', description: 'Reporting schedule under --root: grant, report name, frequency (quarterly, semiannual, annual, final or once), days after the period end it is due, or the due date for a one-time report' },
  submissions: { type: 'string', description: 'Optional log of reports sent under --root: grant, report, period end, date sent' },
};
const SCHEDULE_FIELDS = { grant: { aliases: ['Grant', 'Grant ID', 'Grant Code', 'Award'], required: true }, report: { aliases: ['Report', 'Report Name', 'Report Type', 'Deliverable'] }, frequency: { aliases: ['Frequency', 'Schedule', 'Interval'] }, due_days_after: { aliases: ['Due Days After', 'Days After Period End', 'Due In Days', 'Days Due'], type: 'number', translate: 'days' }, due_date: { aliases: ['Due Date', 'Due', 'Deadline'], type: 'date' } };
const SUBMISSION_FIELDS = { grant: { aliases: ['Grant', 'Grant ID', 'Grant Code', 'Award'], required: true }, report: { aliases: ['Report', 'Report Name', 'Report Type', 'Deliverable'] }, period_end: { aliases: ['Period End', 'Period Ending', 'Reporting Period End', 'Period'], type: 'date', translate: 'end_date' }, submitted_date: { aliases: ['Submitted Date', 'Date Sent', 'Submitted', 'Sent On', 'Submission Date'], type: 'date', translate: 'date' } };
const GRANTS = { ...GRANT_FIELDS, owner: { ...GRANT_FIELDS.owner, personal: true } };
export const DEMO = { title: 'Fairgive Grant Reports', files: { grants: 'grants.csv', schedule: 'schedule.csv', submissions: 'submissions.csv', settings: 'settings.json' }, explain: { arg: 'item', value: 'G-FOUND Final report 2026-06-30' }, draft: { grant: 'G-FED' } };
const SETTINGS = { type: 'object', additionalProperties: false, properties: {
  as_of: { type: ['string', 'null'], description: 'Date the check is made at (YYYY-MM-DD); default: today' },
  due_soon_days: { type: 'integer', minimum: 0, maximum: 365, description: 'Reports due within this many days are shown as due soon (default 30)' },
  horizon_days: { type: 'integer', minimum: 0, maximum: 1000, description: 'Reports due further out than this are left off the list (default 120)' },
  final_due_days: { type: 'integer', minimum: 0, maximum: 365, description: 'Days after the award end a final report is due when the schedule gives no number (default 90; check each award)' },
} };
const args = { ...files, settings: { type: 'string', description: 'Optional settings JSON under --root' } };

const calendarTool = {
  name: 'grant_reports_write_calendar', kind: 'report', title: 'Write the reporting calendar file',
  description: `Write grant-reports.ics (one all-day event per report not yet sent, with reminders 14 and 3 days before) into out_dir (default ${OUT}), to import into Outlook, Google or Apple calendars.`,
  inputSchema: { type: 'object', additionalProperties: false, required: ['grants', 'schedule'], properties: { ...args, out_dir: { type: 'string', description: `Output folder under --root (default ${OUT})` } } },
  handler: async (a, ctx) => {
    const settings = { ...DEFAULTS, ...(a.settings ? ctx.readJson(a.settings, 'settings') : {}) };
    const o = reportCalendar({ grants: ctx.records(a.grants, 'grants'), schedule: ctx.records(a.schedule, 'schedule'), submissions: a.submissions ? ctx.records(a.submissions, 'submissions') : [] }, settings);
    const events = o.items.filter((i) => i.due && !i.submitted).sort((x, y) => (x.due < y.due ? -1 : x.due > y.due ? 1 : x.item < y.item ? -1 : 1)).map((i) => ({ date: i.due, summary: `${i.grant} ${i.report} due`, description: `${i.report} for ${i.grant} (${i.funder || 'funder'})${i.period_end ? `, period ending ${i.period_end}` : ''}.`, reminders: [14, 3] }));
    const dir = ctx.outDir(a.out_dir || OUT); const f = ctx.writeFile(dir, 'grant-reports.ics', toIcs(events, { calName: 'Grant reports' }));
    return { summary: `Calendar written with ${events.length} report deadline(s).`, events: events.length, files: [relative(ctx.root, f).split('\\').join('/')] };
  },
};

export const manifest = giveAgent({
  pkg, prefix: 'grant_reports',
  description: pkg.description.replace(/^[^:]+:\s*/, ''),
  check: { title: 'Grant reporting deadlines', description: 'Builds every report period from each grant\'s schedule (quarterly, semiannual or annual from the award start, a final report after the award end, or a one-time date), matches it to the reports sent, and lists reports overdue, due within the soon window, sent late, and grants with no schedule. Reports due beyond the horizon are left off.' },
  args: files, required: ['grants', 'schedule'],
  sources: { grants: sourceOf('Grants', ['grants'], GRANTS, ['grant', 'grant_name', 'funder', 'award_start', 'award_end', 'owner']), schedule: { label: 'Reporting schedule', args: ['schedule'], fields: SCHEDULE_FIELDS }, submissions: { label: 'Reports sent', args: ['submissions'], fields: SUBMISSION_FIELDS } },
  settings: { defaults: DEFAULTS, schema: SETTINGS },
  run: ({ rows, settings }) => reportCalendar(rows, settings),
  key: { arg: 'item', field: 'item', label: 'report (grant, report name and period end)' },
  summary: (o) => `${o.totals.reports} report(s) for ${o.totals.grants} grant(s) as of ${o.extra.as_of}: ${o.totals.overdue} overdue, ${o.totals.due_soon} due soon, ${o.totals.sent_late} sent late, ${o.totals.no_schedule} grant(s) with no schedule.`,
  report: {
    title: 'Grant reporting deadlines', base: 'grant-reports',
    row: (i) => ({ grant: i.grant ?? '', funder: i.funder ?? '', owner: i.owner ?? '', report: i.report ?? '', period_end: i.period_end ?? '', due: i.due ?? '', submitted: i.submitted ?? '', state: i.state ?? '' }),
    htmlColumns: ['grant', 'report', 'period_end', 'due', 'submitted', 'owner'],
    sections: (o) => [{ title: 'By grant', rows: rollup(o.items, 'grant', (i) => i.grant), columns: ['grant', 'count'] }],
  },
  draft: {
    noun: 'reminder', verb: 'send', actor: 'a person on your team', required: ['grants', 'schedule', 'grant'],
    description: 'Write drafts/reminder-<grant>.md: a reminder to the grant owner listing that grant\'s overdue and due-soon reports with their dates. Marked DRAFT; a person sends it.',
    args: { grant: { type: 'string', description: 'Grant code as the check shows it' }, from: { type: 'string', description: 'Your name and role' } },
    build: (o, a) => {
      const mine = o.items.filter((i) => i.grant === String(a.grant).trim() && i.findings.some((f) => f.code === 'overdue' || f.code === 'due_soon'));
      if (!mine.length) throw new Error(`no overdue or due-soon report for grant "${String(a.grant).slice(0, 40)}"`);
      return { id: mine[0].grant, to: mine[0].owner || undefined, text: letter({ title: `Grant reports to send: ${mine[0].grant}`, to: mine[0].owner, from: a.from, re: `${mine[0].funder || 'Funder'} reporting`,
        intro: 'These reports are overdue or due soon:', rows: mine.map((i) => ({ report: i.report, period_end: i.period_end || '', due: i.due, state: i.findings.map((f) => f.code).join(' ') })), columns: ['report', 'period_end', 'due', 'state'],
        closing: ['Please send them through the funder\'s own portal or address and log the date sent. [TO CONFIRM funder contact]'] }) };
    },
  },
  extraTools: [calendarTool], extraRules: [{ tool: 'grant_reports_write_calendar', decision: 'allow' }],
  refused: [REFUSE.funder, REFUSE.email],
  memory: null,
});
