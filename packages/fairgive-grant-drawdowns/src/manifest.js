import { readFileSync } from 'node:fs';
import { giveAgent, GRANT_FIELDS, sourceOf, REFUSE, money, dollars, letter } from 'fairgive-core';
import { drawdowns, DEFAULTS } from './logic.js';

const pkg = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'));
const files = {
  grants: { type: 'string', description: 'Grant list under --root: grant code, funder, award amount, award start and end, payment basis (reimbursement or advance)' },
  expenses: { type: 'string', description: 'Allowable costs by grant under --root (ledger lines with the grant or project code): date, grant, amount' },
  draws: { type: 'string', description: 'Draws under --root: draw id, grant, date, amount, status (requested or received)' },
};
const EXP = { entry_id: { aliases: ['Entry ID', 'Journal', 'Num', 'Transaction ID'] }, date: { aliases: ['Date', 'Posting Date', 'Transaction Date'], type: 'date' }, grant: { aliases: ['Grant', 'Grant ID', 'Grant Code', 'Project', 'Award', 'Job'], required: true, translate: 'grant_id' }, amount: { aliases: ['Amount', 'Debit', 'Expense', 'Net Amount'], type: 'money' }, memo: { aliases: ['Memo', 'Description', 'Narrative'] } };
const DRAW = { draw_id: { aliases: ['Draw ID', 'Request ID', 'Drawdown ID', 'Payment Request', 'Reference'] }, grant: { aliases: ['Grant', 'Grant ID', 'Grant Code', 'Award', 'Project'], required: true, translate: 'grant_id' }, date: { aliases: ['Date', 'Request Date', 'Draw Date', 'Received Date'], type: 'date' }, amount: { aliases: ['Amount', 'Draw Amount', 'Requested Amount'], type: 'money', translate: 'drawn' }, status: { aliases: ['Status', 'Draw Status', 'Payment Status'] } };
export const DEMO = { title: 'Fairgive Grant Drawdowns', files: { grants: 'grants.csv', expenses: 'expenses.csv', draws: 'draws.csv', settings: 'settings.json' }, explain: { arg: 'grant', value: 'G-FED' }, draft: { grant: 'G-FED', from: 'Dana Controller (fictional)' } };

export const manifest = giveAgent({
  pkg, prefix: 'drawdowns',
  description: pkg.description.replace(/^[^:]+:\s*/, ''),
  check: { title: 'Grant drawdowns', description: 'For each grant, sets the draws against allowable costs inside the award period, oldest first, and shows what can still be drawn (costs up to the award, less draws). Flags costs carried longer than the stale days, reimbursement grants drawn ahead of costs, grants drawn over the award; lists advance cash not yet spent, draws requested long ago and not received, and costs dated outside the award period.' },
  args: files, required: ['grants', 'expenses', 'draws'],
  sources: { grants: sourceOf('Grants', ['grants'], { ...GRANT_FIELDS, payment_basis: { aliases: ['Payment Basis', 'Basis', 'Payment Method', 'Funding Type'] } }, ['grant', 'grant_name', 'funder', 'award_amount', 'award_start', 'award_end', 'payment_basis']), expenses: { label: 'Allowable costs', args: ['expenses'], fields: EXP }, draws: { label: 'Draws', args: ['draws'], fields: DRAW } },
  settings: { defaults: DEFAULTS, schema: { type: 'object', additionalProperties: false, properties: {
    as_of: { type: ['string', 'null'], description: 'Date the check is made at (YYYY-MM-DD); default: the latest date in the files' },
    stale_days: { type: 'integer', minimum: 0, maximum: 365, description: 'Costs older than this and not yet drawn are flagged (default 45)' },
    pending_days: { type: 'integer', minimum: 0, maximum: 365, description: 'A requested draw not received after this many days needs review (default 30)' },
    organization: { type: 'string', description: 'Your organization name for the drafted request' },
    tolerance: { type: 'number', minimum: 0, maximum: 100, description: 'Difference ignored (default 0.01)' },
  } } },
  run: ({ rows, settings }) => drawdowns(rows, settings),
  key: { arg: 'grant', field: 'grant', label: 'grant' },
  summary: (o) => `${o.totals.grants} grant(s) as of ${o.extra.as_of || 'no date'}: costs ${money(o.totals.spent)}, drawn ${money(o.totals.drawn)}, can draw ${money(o.totals.available_to_draw)} (${money(o.totals.stale)} older than the stale days); overdrawn ${money(o.totals.overdrawn)}, advance cash unspent ${money(o.totals.excess_cash)}, draws pending ${money(o.totals.pending)}.`,
  report: {
    title: 'Grant drawdowns', base: 'grant-drawdowns',
    row: (i) => ({ grant: i.grant ?? '', funder: i.funder ?? '', basis: i.basis ?? '', award: i.award ?? '', spent: i.spent ?? '', drawn: i.drawn ?? '', available: i.available ?? '' }),
    htmlColumns: ['grant', 'funder', 'basis', 'award', 'spent', 'drawn', 'available'],
  },
  draft: {
    noun: 'draw_request', verb: 'submit', actor: 'your grants or finance lead', required: ['grants', 'expenses', 'draws', 'grant'],
    description: 'Write drafts/draw_request-<grant>.md: the amount to draw on one grant with the costs it covers, for a person to enter in the funder\'s portal. Marked DRAFT; the agent never submits it.',
    args: { grant: { type: 'string', description: 'Grant code as the check shows it' }, from: { type: 'string', description: 'Your name and role' } },
    build: (o, a) => {
      const g = o.items.find((i) => i.grant === String(a.grant).trim());
      if (!g) throw new Error(`grant "${String(a.grant).slice(0, 40)}" not found; pass a grant from drawdowns_check`);
      if (!(g.available > 0)) throw new Error(`nothing to draw on ${g.grant}: costs ${g.spent}, drawn ${g.drawn}`);
      return { id: g.grant, amount: g.available, text: letter({ title: `Draw request: ${g.grant}`, to: `${g.funder || 'Funder'} payment portal [TO CONFIRM portal and account]`, from: a.from, re: `Reimbursement of allowable costs, ${o.settings_used.organization || '[TO CONFIRM organization]'}`,
        intro: `Request ${dollars(g.available)} on ${g.grant} for allowable costs incurred and not yet drawn, as of ${o.extra.as_of}.`,
        rows: [{ award: dollars(g.award ?? 0), costs_to_date: dollars(g.spent), drawn_to_date: dollars(g.drawn), this_request: dollars(g.available) }], columns: ['award', 'costs_to_date', 'drawn_to_date', 'this_request'],
        closing: ['Supporting ledger detail attached: [ATTACH cost detail for the period]', 'Signed by the authorized official: [TO CONFIRM name and title]'] }) };
    },
  },
  refused: [REFUSE.funder, REFUSE.transfer],
  memory: null,
});
