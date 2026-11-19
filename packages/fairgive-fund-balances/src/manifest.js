import { readFileSync } from 'node:fs';
import { giveAgent, FUND_FIELDS, GL_FIELDS, GL_PROFILES, sourceOf, REFUSE, money, rollup } from 'fairgive-core';
import { fundBalances, DEFAULTS } from './logic.js';

const pkg = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'));
const files = {
  funds: { type: 'string', description: 'Fund list under --root: fund code, name, restriction (without donor restrictions, board designated, purpose, time or perpetual) and, for endowments, the corpus' },
  gl: { type: 'string', description: 'General ledger detail under --root with a fund on every line (QuickBooks Online, Aplos, Sage Intacct or Financial Edge NXT)' },
};
export const DEMO = { title: 'Fairgive Fund Balances', files: { funds: 'funds.csv', gl: 'gl.csv', settings: 'settings.json' }, explain: { arg: 'fund', value: 'YOUTH' } };

export const manifest = giveAgent({
  pkg, prefix: 'funds',
  description: pkg.description.replace(/^[^:]+:\s*/, ''),
  check: { title: 'Fund balances by restriction class', description: 'Works out the balance of each fund from its activity and net asset lines and totals them by class (without donor restrictions, board designated, with donor restrictions, perpetual). Flags restricted funds below zero, endowments below their corpus, net asset lines in the account of the other class, ledger funds missing from the fund list, funds with no restriction code and due-to/due-from lines that do not net to zero.' },
  args: files, required: ['funds', 'gl'],
  sources: {
    funds: sourceOf('Fund list', ['funds'], { ...FUND_FIELDS, corpus: { aliases: ['Corpus', 'Historic Dollar Value', 'Original Gift', 'Original Gift Value', 'Gift Value'], type: 'money', translate: 'historic_value' } }, ['fund', 'fund_name', 'restriction', 'corpus']),
    gl: sourceOf('General ledger detail', ['gl'], GL_FIELDS, ['entry_id', 'date', 'account', 'account_name', 'fund', 'debit', 'credit', 'amount', 'memo'], GL_PROFILES),
  },
  settings: { defaults: DEFAULTS, schema: { type: 'object', additionalProperties: false, properties: {
    net_asset_accounts: { type: 'object', additionalProperties: { type: 'string', enum: ['with', 'without'] }, description: 'Net asset account numbers (or first digits) and their class, e.g. {"3100": "without", "3200": "with"}' },
    interfund_accounts: { type: 'array', items: { type: 'string' }, description: 'Due-to and due-from account numbers (or first digits) that should net to zero across funds' },
    activity_from: { type: 'string', description: 'Accounts that start at or after this number are net asset, revenue and expense accounts (default "3")' },
    tolerance: { type: 'number', minimum: 0, maximum: 100, description: 'Difference ignored (default 0.01)' },
  } } },
  run: ({ rows, settings }) => fundBalances(rows, settings),
  key: { arg: 'fund', field: 'fund', label: 'fund' },
  summary: (o) => `${o.totals.funds} fund(s): without donor restrictions ${money(o.totals.without_donor_restrictions)} (board designated ${money(o.totals.board_designated)}), with donor restrictions ${money(o.totals.with_donor_restrictions)} (perpetual ${money(o.totals.perpetual)}). Restricted funds below zero ${money(o.totals.negative_restricted)}, net assets in the wrong class ${money(o.totals.wrong_class)}, interfund gap ${money(o.totals.interfund_gap)}.`,
  report: {
    title: 'Fund balances by restriction', base: 'fund-balances',
    row: (i) => ({ fund: i.fund ?? '', fund_name: i.fund_name ?? '', class: i.class ?? '', kind: i.kind ?? '', balance: i.balance ?? '', corpus: i.corpus ?? '' }),
    htmlColumns: ['fund', 'fund_name', 'class', 'kind', 'balance'],
    sections: (o) => [{ title: 'By restriction class', rows: rollup(o.items.filter((i) => i.kind !== 'interfund'), 'class', (i) => i.class, { balance: (i) => i.balance }), columns: ['class', 'count', 'balance'] }],
  },
  refused: [REFUSE.ledger, REFUSE.transfer],
  memory: null,
});
