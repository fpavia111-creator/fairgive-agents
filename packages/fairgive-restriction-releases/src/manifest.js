import { readFileSync } from 'node:fs';
import { giveAgent, FUND_FIELDS, GL_FIELDS, GL_PROFILES, sourceOf, REFUSE, money, letter } from 'fairgive-core';
import { releases, DEFAULTS } from './logic.js';

const pkg = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'));
const files = {
  funds: { type: 'string', description: 'Fund list under --root: fund code, name, restriction (purpose or time) and the release date of time restrictions' },
  gl: { type: 'string', description: 'General ledger detail under --root with a fund on every line: net asset, contribution, expense and release lines' },
};
export const DEMO = { title: 'Fairgive Restriction Releases', files: { funds: 'funds.csv', gl: 'gl.csv', settings: 'settings.json' }, explain: { arg: 'fund', value: 'MUSIC' }, draft: { period: 'Quarter ended 2026-09-30' } };

export const manifest = giveAgent({
  pkg, prefix: 'releases',
  description: pkg.description.replace(/^[^:]+:\s*/, ''),
  check: { title: 'Releases from restriction', description: 'For each purpose-restricted fund, compares what was spent on its purpose with what was released (up to what the fund received); for each time-restricted fund, checks whether its release date has passed. Flags releases still to record, releases over the spending or over what the fund had, time restrictions that ended without a release and releases recorded before the date.' },
  args: files, required: ['funds', 'gl'],
  sources: {
    funds: sourceOf('Fund list', ['funds'], FUND_FIELDS, ['fund', 'fund_name', 'restriction', 'release_date']),
    gl: sourceOf('General ledger detail', ['gl'], GL_FIELDS, ['entry_id', 'date', 'account', 'account_name', 'fund', 'debit', 'credit', 'amount', 'memo'], GL_PROFILES),
  },
  settings: { defaults: DEFAULTS, schema: { type: 'object', additionalProperties: false, properties: {
    release_accounts: { type: 'array', items: { type: 'string' }, description: 'Account numbers (or first digits) used for net assets released from restriction (default ["39"])' },
    expense_from: { type: 'string', description: 'Expense accounts start at this number (default "5")' },
    as_of: { type: ['string', 'null'], description: 'Date the check is made at (YYYY-MM-DD); default: the latest date in the ledger' },
    tolerance: { type: 'number', minimum: 0, maximum: 100, description: 'Difference ignored (default 0.01)' },
  } } },
  run: ({ rows, settings }) => releases(rows, settings),
  key: { arg: 'fund', field: 'fund', label: 'fund' },
  summary: (o) => `${o.totals.restricted_funds} restricted fund(s) as of ${o.extra.as_of || 'no date'}: ${money(o.totals.to_release)} to release, ${money(o.totals.released_in_error)} released in error or too early.`,
  report: {
    title: 'Releases from restriction', base: 'restriction-releases',
    row: (i) => ({ fund: i.fund ?? '', fund_name: i.fund_name ?? '', restriction: i.restriction ?? '', release_date: i.release_date ?? '', inflow: i.inflow ?? '', spending: i.spending ?? '', released: i.released ?? '', to_release: i.to_release ?? '' }),
    htmlColumns: ['fund', 'restriction', 'inflow', 'spending', 'released', 'to_release'],
  },
  draft: {
    noun: 'release_entry', verb: 'post', category: 'go_live', actor: 'your accountant', required: ['funds', 'gl', 'period'],
    description: 'Write drafts/release_entry-<period>.md: the journal entry that releases the amounts due, one pair of lines per fund. Marked DRAFT; the accountant posts it, the agent never does.',
    args: { period: { type: 'string', description: 'Label for the entry, e.g. "Quarter ended 2026-09-30"' }, to: { type: 'string', description: 'Accountant or bookkeeper who posts it' }, from: { type: 'string', description: 'Your name and role' } },
    build: (o, a) => {
      const due = o.items.filter((i) => i.to_release > 0);
      if (!due.length) throw new Error('nothing to release: every restricted fund is in order or needs review first');
      return { id: a.period, to: a.to, amount: o.totals.to_release, text: letter({ title: `Release from restriction: ${a.period}`, to: a.to, from: a.from, re: 'Journal entry to review and post',
        intro: `Restrictions met by spending or by time, as of ${o.extra.as_of}. Debit the release account in each restricted fund and credit it in the operating fund.`,
        rows: due.map((i) => ({ fund: i.fund, debit: money(i.to_release), credit_fund: '[TO CONFIRM operating fund]', credit: money(i.to_release), reason: i.findings.map((f) => f.code).join(' ') })), columns: ['fund', 'debit', 'credit_fund', 'credit', 'reason'],
        closing: [`Total released: ${money(o.totals.to_release)}`, '', 'Release account and operating fund confirmed by: [TO CONFIRM]'] }) };
    },
  },
  refused: [REFUSE.ledger],
  memory: null,
});
