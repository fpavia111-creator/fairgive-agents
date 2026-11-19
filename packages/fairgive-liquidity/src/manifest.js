import { readFileSync } from 'node:fs';
import { giveAgent, REFUSE, money, rollup } from 'fairgive-core';
import { liquidity, DEFAULTS } from './logic.js';

const pkg = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'));
const files = { balances: { type: 'string', description: 'Asset balances under --root (balance sheet or trial balance export with your own columns added): account, account name, category (cash, investments, pledges receivable...), balance, restriction, available within one year (yes/no)' } };
const B = { account: { aliases: ['Account', 'Account Number', 'Account No', 'GL Account'], required: true }, account_name: { aliases: ['Account Name', 'Account Title', 'Description'] }, category: { aliases: ['Category', 'Asset Category', 'Type', 'Account Type'] }, balance: { aliases: ['Balance', 'Ending Balance', 'Amount', 'Debit'], type: 'money' }, restriction: { aliases: ['Restriction', 'Net Asset Class', 'Fund Type'] }, available_within_year: { aliases: ['Available Within Year', 'Available Within One Year', 'Current', 'Due Within Year'] } };
export const DEMO = { title: 'Fairgive Liquidity', files: { balances: 'balances.csv', settings: 'settings.json' }, explain: { arg: 'account', value: '1030' } };

export const manifest = giveAgent({
  pkg, prefix: 'liquidity',
  description: pkg.description.replace(/^[^:]+:\s*/, ''),
  check: { title: 'Liquidity and availability', description: 'Works out the financial assets available for general spending within one year: cash, investments and receivables, less donor-restricted amounts (time restrictions ending within the year count), less board designations unless the settings include them, less receivables due after a year. Shows the months of expenses they cover and lists restricted amounts marked available, board designations left out, long-term receivables and accounts with no category.' },
  args: files, required: ['balances'],
  sources: { balances: { label: 'Asset balances', args: ['balances'], fields: B } },
  settings: { defaults: DEFAULTS, schema: { type: 'object', additionalProperties: false, properties: {
    annual_expenses: { type: ['number', 'null'], minimum: 0, description: 'Yearly operating expenses, to show months covered' },
    min_months: { type: 'number', minimum: 0, maximum: 60, description: 'Months of expenses below which liquidity is watched (default 3)' },
    include_board_designated: { type: 'boolean', description: 'Count board-designated amounts as available (default false)' },
    financial_categories: { type: 'array', items: { type: 'string' }, description: 'Categories that are financial assets' },
  } } },
  run: ({ rows, settings }) => liquidity(rows, settings),
  key: { arg: 'account', field: 'account', label: 'account' },
  summary: (o) => `Financial assets ${money(o.totals.financial_assets)}; available for general spending within one year ${money(o.totals.available)}${o.totals.months_covered !== null ? `, ${o.totals.months_covered} months of expenses` : ''}.`,
  report: {
    title: 'Liquidity and availability', base: 'liquidity',
    row: (i) => ({ account: i.account ?? '', account_name: i.account_name ?? '', category: i.category ?? '', restriction: i.restriction ?? '', balance: i.balance ?? '', available: i.available ?? '' }),
    htmlColumns: ['account', 'account_name', 'category', 'restriction', 'balance', 'available'],
    sections: (o) => [{ title: 'Available within one year', rows: rollup(o.items.filter((i) => i.financial_asset && i.account !== 'Total available'), 'category', (i) => i.category, { balance: (i) => i.balance, available: (i) => i.available }), columns: ['category', 'count', 'balance', 'available'] }],
  },
  refused: [REFUSE.transfer, REFUSE.ledger],
  memory: null,
});
