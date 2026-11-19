import { readFileSync } from 'node:fs';
import { giveAgent, FUND_FIELDS, sourceOf, REFUSE, money, dollars, letter } from 'fairgive-core';
import { endowmentDraw, DEFAULTS } from './logic.js';

const pkg = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'));
const files = {
  funds: { type: 'string', description: 'Endowment funds under --root: fund code, name, corpus (historic dollar value of the gifts)' },
  values: { type: 'string', description: 'Quarter-end market values under --root (from your investment statements): fund, date, market value' },
  draws: { type: 'string', description: 'Optional draws already booked under --root: fund, fiscal year, amount' },
};
const VAL = { fund: { aliases: ['Fund', 'Fund Code', 'Account', 'Pool'], required: true }, date: { aliases: ['Date', 'Quarter End', 'As Of', 'Valuation Date', 'Period End'], type: 'date' }, market_value: { aliases: ['Market Value', 'Value', 'Fair Value', 'Ending Value', 'Balance'], type: 'money' } };
const DR = { fund: { aliases: ['Fund', 'Fund Code'], required: true }, fiscal_year: { aliases: ['Fiscal Year', 'FY', 'Year'], type: 'number', translate: false }, amount: { aliases: ['Amount', 'Draw', 'Distribution', 'Appropriation'], type: 'money' } };
export const DEMO = { title: 'Fairgive Endowment Draw', files: { funds: 'funds.csv', values: 'values.csv', draws: 'draws.csv', settings: 'settings.json' }, explain: { arg: 'fund', value: 'ENDOW-B' }, draft: { from: 'Dana Controller (fictional)' } };

export const manifest = giveAgent({
  pkg, prefix: 'endowment',
  description: pkg.description.replace(/^[^:]+:\s*/, ''),
  check: { title: 'Endowment draw', description: 'Works out each endowment fund\'s draw as the spending rate times the average of its last quarter-end market values up to the value date. Lists funds below their corpus (and gives them no draw when the settings say so), funds with less history than the policy averages, booked draws that differ from the policy figure, and a spending rate over the prudence figure in the settings.' },
  args: files, required: ['funds', 'values'],
  sources: { funds: sourceOf('Endowment funds', ['funds'], { ...FUND_FIELDS, corpus: { aliases: ['Corpus', 'Historic Dollar Value', 'Original Gift Value', 'Gift Value'], type: 'money', translate: 'historic_value' } }, ['fund', 'fund_name', 'corpus']), values: { label: 'Quarter-end values', args: ['values'], fields: VAL }, draws: { label: 'Booked draws', args: ['draws'], fields: DR } },
  settings: { defaults: DEFAULTS, schema: { type: 'object', additionalProperties: false, properties: {
    spending_rate: { type: 'number', minimum: 0, maximum: 25, description: 'Percent of the average value drawn each year, from your spending policy (default 4)' },
    quarters: { type: 'integer', minimum: 1, maximum: 40, description: 'Quarter-end values averaged (default 12)' },
    value_date: { type: ['string', 'null'], description: 'Last quarter end to use (YYYY-MM-DD); default: the latest value in the file' },
    fiscal_year: { type: ['integer', 'null'], minimum: 2000, maximum: 2100, description: 'Fiscal year of the draw, to pick booked draws' },
    prudence_rate: { type: 'number', minimum: 0, maximum: 25, description: 'Rate above which spending is flagged for the board (default 7, the figure many state laws use; check yours)' },
    underwater_policy: { type: 'string', enum: ['spend', 'no_spend'], description: 'Whether your policy allows a draw from a fund below its corpus (default spend, listed for the board)' },
    organization: { type: 'string', description: 'Your organization name for the draw memo' },
    tolerance: { type: 'number', minimum: 0, maximum: 100, description: 'Difference ignored (default 0.01)' },
  } } },
  run: ({ rows, settings }) => endowmentDraw(rows, settings),
  key: { arg: 'fund', field: 'fund', label: 'fund' },
  summary: (o) => `${o.totals.funds} endowment fund(s) worth ${money(o.totals.market_value)} at ${o.extra.value_date || 'no date'}: policy draw ${money(o.totals.total_draw)} at ${o.totals.spending_rate}%; ${o.totals.underwater} fund(s) below corpus.`,
  report: {
    title: 'Endowment draw', base: 'endowment-draw',
    row: (i) => ({ fund: i.fund ?? '', fund_name: i.fund_name ?? '', corpus: i.corpus ?? '', latest_value: i.latest_value ?? '', quarters_used: i.quarters_used ?? '', average_value: i.average_value ?? '', policy_draw: i.policy_draw ?? '', booked_draw: i.booked_draw ?? '' }),
    htmlColumns: ['fund', 'corpus', 'latest_value', 'average_value', 'policy_draw', 'booked_draw'],
    sections: (o) => [{ title: 'Draw by fund', rows: o.items.filter((i) => i.fund !== 'Spending policy').map((i) => ({ fund: i.fund, policy_draw: i.policy_draw })), columns: ['fund', 'policy_draw'] }],
  },
  draft: {
    noun: 'draw_memo', verb: 'transfer', category: 'move_money', actor: 'your finance committee and treasurer', required: ['funds', 'values'],
    description: 'Write drafts/draw_memo-<fiscal year>.md: the draw for each fund with the average and rate behind it, for the finance committee to approve. Marked DRAFT; the agent never moves money between accounts.',
    args: { from: { type: 'string', description: 'Your name and role' } },
    build: (o, a) => {
      const rows = o.items.filter((i) => i.fund !== 'Spending policy');
      if (!rows.length) throw new Error('no endowment funds to draw from');
      return { id: String(o.extra.fiscal_year || o.extra.value_date || 'draw'), amount: o.totals.total_draw, text: letter({ title: `Endowment draw${o.extra.fiscal_year ? ` for fiscal ${o.extra.fiscal_year}` : ''}`, to: '[TO CONFIRM finance committee]', from: a.from, re: `${o.settings_used.organization || '[TO CONFIRM organization]'} spending policy`,
        intro: `Draw at ${o.totals.spending_rate}% of the ${o.settings_used.quarters}-quarter average market value to ${o.extra.value_date}.`,
        rows: rows.map((i) => ({ fund: i.fund, average: dollars(i.average_value ?? 0), draw: dollars(i.policy_draw), note: i.findings.map((f) => f.code).join(' ') })), columns: ['fund', 'average', 'draw', 'note'],
        closing: [`Total draw: ${dollars(o.totals.total_draw)}`, '', 'Approved by the finance committee on: [TO CONFIRM date and minute reference]'] }) };
    },
  },
  refused: [REFUSE.transfer, REFUSE.ledger],
  memory: null,
});
