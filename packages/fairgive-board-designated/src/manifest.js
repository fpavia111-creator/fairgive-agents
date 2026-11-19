import { readFileSync } from 'node:fs';
import { giveAgent, FUND_FIELDS, GL_FIELDS, GL_PROFILES, sourceOf, REFUSE, money } from 'fairgive-core';
import { boardDesignated, DEFAULTS } from './logic.js';

const pkg = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'));
const files = {
  funds: { type: 'string', description: 'Board-designated funds under --root: fund code, name, designated amount' },
  resolutions: { type: 'string', description: 'Board resolutions log under --root: resolution id, date, fund, action (designate, spend, undesignate), amount' },
  gl: { type: 'string', description: 'Ledger lines with a fund on every line under --root: transfers into and out of the funds, spending, net asset lines' },
};
const RES = { resolution_id: { aliases: ['Resolution ID', 'Resolution', 'Motion', 'Minute Ref'], required: true }, date: { aliases: ['Date', 'Meeting Date', 'Approved On'], type: 'date' }, fund: { aliases: ['Fund', 'Fund Code', 'Designated Fund'] }, action: { aliases: ['Action', 'Type', 'Decision'] }, amount: { aliases: ['Amount', 'Approved Amount'], type: 'money' } };
export const DEMO = { title: 'Fairgive Board Designated', files: { funds: 'funds.csv', resolutions: 'resolutions.csv', gl: 'gl.csv', settings: 'settings.json' }, explain: { arg: 'fund', value: 'RES-NEW' } };

export const manifest = giveAgent({
  pkg, prefix: 'designated',
  description: pkg.description.replace(/^[^:]+:\s*/, ''),
  check: { title: 'Board-designated funds', description: 'Compares each board-designated fund in the ledger with the board resolutions log: money moved in or spent beyond what resolutions approve, releases voted and not booked, donor-restricted net asset lines inside a board fund, balances below zero, and designations that add up to more than the unrestricted net assets in the settings.' },
  args: files, required: ['funds', 'resolutions', 'gl'],
  sources: { funds: sourceOf('Board-designated funds', ['funds'], { ...FUND_FIELDS, designated_amount: { aliases: ['Designated Amount', 'Target', 'Amount'], type: 'money' } }, ['fund', 'fund_name', 'designated_amount']), resolutions: { label: 'Board resolutions', args: ['resolutions'], fields: RES }, gl: sourceOf('Ledger lines', ['gl'], GL_FIELDS, ['entry_id', 'date', 'account', 'account_name', 'fund', 'debit', 'credit', 'amount', 'memo'], GL_PROFILES) },
  settings: { defaults: DEFAULTS, schema: { type: 'object', additionalProperties: false, properties: {
    transfer_accounts: { type: 'array', items: { type: 'string' }, description: 'Accounts (or first digits) used to move money into and out of board-designated funds' },
    expense_from: { type: 'string', description: 'Expense accounts start at this number (default "5")' },
    net_asset_accounts: { type: 'object', additionalProperties: { type: 'string', enum: ['with', 'without'] }, description: 'Net asset accounts and their class, to spot donor-restricted lines in a board fund' },
    unrestricted_net_assets: { type: ['number', 'null'], description: 'Unrestricted net assets from your balance sheet, to compare with the total designated' },
    tolerance: { type: 'number', minimum: 0, maximum: 100, description: 'Difference ignored (default 0.01)' },
  } } },
  run: ({ rows, settings }) => boardDesignated(rows, settings),
  key: { arg: 'fund', field: 'fund', label: 'fund' },
  summary: (o) => `${o.totals.funds} board-designated fund(s) totalling ${money(o.totals.designated_total)}${o.totals.unrestricted_net_assets !== null ? ` against ${money(o.totals.unrestricted_net_assets)} unrestricted` : ''}; spending without a resolution ${money(o.totals.spending_without_resolution)}.`,
  report: {
    title: 'Board-designated funds', base: 'board-designated',
    row: (i) => ({ fund: i.fund ?? '', fund_name: i.fund_name ?? '', balance: i.balance ?? '', designated_in: i.designated_in ?? '', approved_designations: i.approved_designations ?? '', spent: i.spent ?? '', approved_spending: i.approved_spending ?? '' }),
    htmlColumns: ['fund', 'fund_name', 'balance', 'designated_in', 'approved_designations', 'spent', 'approved_spending'],
  },
  refused: [REFUSE.ledger, REFUSE.transfer],
  memory: null,
});
