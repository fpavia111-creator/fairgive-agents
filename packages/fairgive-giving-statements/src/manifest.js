import { readFileSync } from 'node:fs';
import { giveAgent, REFUSE, money, dollars, letter } from 'fairgive-core';
import { statements, DEFAULTS } from './logic.js';

const pkg = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'));
const files = {
  contributions: { type: 'string', description: 'Giving records under --root (church management or donor CRM export): gift id, giver id, giver, date, amount, fund, method, envelope number, status (refunded gifts are recognised)' },
  givers: { type: 'string', description: 'Optional giver list under --root with mailing addresses: giver id, name, address' },
};
const C = { gift_id: { aliases: ['Gift ID', 'Contribution ID', 'Transaction ID', 'Batch Item'], required: true }, giver_id: { aliases: ['Giver ID', 'Donor ID', 'Member ID', 'Person ID', 'Household ID'], translate: 'donor_id' }, giver: { aliases: ['Giver', 'Donor', 'Name', 'Household', 'Giver Name'], personal: true, translate: 'donor' }, date: { aliases: ['Date', 'Gift Date', 'Contribution Date', 'Received Date'], type: 'date' }, amount: { aliases: ['Amount', 'Gift Amount', 'Contribution Amount'], type: 'money' }, fund: { aliases: ['Fund', 'Fund Name', 'Designation', 'Category'] }, method: { aliases: ['Method', 'Payment Method', 'Type'] }, envelope: { aliases: ['Envelope', 'Envelope Number', 'Env #'] }, status: { aliases: ['Status', 'Gift Status'] } };
const GV = { giver_id: { aliases: ['Giver ID', 'Donor ID', 'Member ID', 'Household ID'], required: true, translate: 'donor_id' }, giver: { aliases: ['Giver', 'Name', 'Household'], personal: true, translate: 'donor' }, address: { aliases: ['Address', 'Mailing Address', 'Street'], personal: true } };
export const DEMO = { title: 'Fairgive Giving Statements', files: { contributions: 'contributions.csv', givers: 'givers.csv', settings: 'settings.json' }, explain: { arg: 'giver_id', value: 'GV-3' }, draft: { giver_id: 'GV-1', from: 'Dana Treasurer (fictional)' } };

export const manifest = giveAgent({
  pkg, prefix: 'statements',
  description: pkg.description.replace(/^[^:]+:\s*/, ''),
  check: { title: 'Giving statements', description: 'Totals each giver\'s contributions in the statement year by fund for the year-end statement. Leaves refunded gifts out and lists them, lists gifts with no date and loose offering with no giver, and flags givers with no mailing address.' },
  args: files, required: ['contributions'],
  sources: { contributions: { label: 'Contributions', args: ['contributions'], fields: C }, givers: { label: 'Givers', args: ['givers'], fields: GV } },
  settings: { defaults: DEFAULTS, schema: { type: 'object', additionalProperties: false, properties: {
    year: { type: ['integer', 'null'], minimum: 2000, maximum: 2100, description: 'Statement year (default: the latest year in the file)' },
    organization: { type: 'string', description: 'Your church or organization name for the statements' },
    intangible_religious_benefits: { type: 'boolean', description: 'Word the goods-and-services sentence for a church (intangible religious benefits) when true (default true)' },
  } } },
  run: ({ rows, settings }) => statements(rows, settings),
  key: { arg: 'giver_id', field: 'giver_id', label: 'giver' },
  summary: (o) => `${o.totals.givers} giver(s) in ${o.totals.year || '?'}: statements total ${money(o.totals.statement_total)}; ${o.totals.missing_address} with no address, refunds left out ${money(o.totals.refunds_excluded)}, loose offering not on statements ${money(o.totals.unattributed)}.`,
  report: {
    title: 'Giving statements', base: 'giving-statements',
    row: (i) => ({ giver_id: i.giver_id ?? '', giver: i.giver ?? '', address: i.address ?? '', gifts: i.gifts ?? '', total: i.total ?? '', by_fund: i.by_fund ?? '' }),
    htmlColumns: ['giver_id', 'giver', 'gifts', 'total', 'by_fund'],
    sections: (o) => [{ title: 'By giver', rows: o.items.map((i) => ({ giver_id: i.giver_id, gifts: i.gifts, total: i.total })), columns: ['giver_id', 'gifts', 'total'] }],
  },
  draft: {
    noun: 'statement', verb: 'send', actor: 'your treasurer or finance person', required: ['contributions', 'giver_id'],
    description: 'Write drafts/statement-<giver id>.md: the year-end contribution statement for one giver, every gift with its date, fund and amount, and the goods-and-services sentence. Marked DRAFT; a person checks and sends it.',
    args: { giver_id: { type: 'string', description: 'Giver id as the check shows it' }, from: { type: 'string', description: 'Signer name and title' } },
    build: (o, a) => {
      const g = o.items.find((i) => i.giver_id === String(a.giver_id).trim());
      if (!g || g.giver_id === 'Unattributed') throw new Error(`giver "${String(a.giver_id).slice(0, 40)}" not found; pass a giver_id from statements_check`);
      if (!g.lines.length) throw new Error(`giver ${g.giver_id} has no dated gifts in ${o.totals.year}`);
      const org = o.settings_used.organization || '[TO CONFIRM organization name]';
      const gs = o.settings_used.intangible_religious_benefits !== false ? 'No goods or services were provided in exchange for these contributions other than intangible religious benefits.' : 'No goods or services were provided in exchange for these contributions.';
      return { id: g.giver_id, to: g.address ? `${g.giver}, ${g.address}` : undefined, amount: g.total, text: letter({ title: `${o.totals.year} contribution statement`, to: g.address ? `${g.giver}, ${g.address}` : g.giver, from: a.from, re: org,
        intro: `Dear ${g.giver},\n\nThank you for your faithful giving to ${org} in ${o.totals.year}. Your contributions:`,
        rows: g.lines.map((x) => ({ date: x.date, fund: x.fund, amount: dollars(x.amount) })), columns: ['date', 'fund', 'amount'],
        closing: [`Total: ${dollars(g.total)}`, '', `${gs} [TO CONFIRM wording with your treasurer]`, '', a.from || '[TO CONFIRM signer]'] }) };
    },
  },
  refused: [REFUSE.email, REFUSE.crm],
  memory: null,
});
