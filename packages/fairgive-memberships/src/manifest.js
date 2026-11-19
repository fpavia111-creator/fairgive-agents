import { readFileSync } from 'node:fs';
import { giveAgent, REFUSE, money, dollars, letter, rollup } from 'fairgive-core';
import { memberships, DEFAULTS } from './logic.js';

const pkg = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'));
const files = {
  members: { type: 'string', description: 'Member export under --root (Neon, Wild Apricot-style or CRM export): member id, name, e-mail, level, start date, end date, auto-renew' },
  payments: { type: 'string', description: 'Dues payments under --root: member id, date, amount' },
  levels: { type: 'string', description: 'Membership levels under --root: level, dues, term in months' },
};
const M = { member_id: { aliases: ['Member ID', 'Membership ID', 'Account ID', 'Constituent ID'], required: true }, member: { aliases: ['Member', 'Name', 'Member Name', 'Full Name'], personal: true }, email: { aliases: ['Email', 'Email Address'], personal: true }, level: { aliases: ['Level', 'Membership Level', 'Membership Type', 'Tier'], translate: 'membership_level' }, start_date: { aliases: ['Start Date', 'Member Since', 'Joined'], type: 'date' }, expires: { aliases: ['Expires', 'End Date', 'Expiration Date', 'Renewal Date', 'Valid Until'], type: 'date' }, auto_renew: { aliases: ['Auto Renew', 'Auto-Renew', 'Recurring'] } };
const PAY = { member_id: { aliases: ['Member ID', 'Membership ID', 'Account ID'], required: true }, date: { aliases: ['Date', 'Payment Date', 'Paid On'], type: 'date' }, amount: { aliases: ['Amount', 'Dues', 'Payment Amount'], type: 'money' } };
const LV = { level: { aliases: ['Level', 'Membership Level', 'Membership Type'], required: true, translate: 'membership_level' }, dues: { aliases: ['Dues', 'Fee', 'Price', 'Amount'], type: 'money' }, term_months: { aliases: ['Term Months', 'Term', 'Months'], type: 'number' } };
export const DEMO = { title: 'Fairgive Memberships', files: { members: 'members.csv', payments: 'payments.csv', levels: 'levels.csv', settings: 'settings.json' }, explain: { arg: 'member_id', value: 'MB-5' }, draft: { member_id: 'MB-2', from: 'Dana Director (fictional)' } };

export const manifest = giveAgent({
  pkg, prefix: 'members',
  description: pkg.description.replace(/^[^:]+:\s*/, ''),
  check: { title: 'Memberships and renewals', description: 'Checks each membership against its level and payments: memberships ending within the expiring days, ended past the grace days with no renewal, dues paid that do not match the level, renewal payments that did not move the end date, active memberships with no payment for the current term and levels not in the level list.' },
  args: files, required: ['members', 'levels'],
  sources: { members: { label: 'Members', args: ['members'], fields: M }, payments: { label: 'Dues payments', args: ['payments'], fields: PAY }, levels: { label: 'Membership levels', args: ['levels'], fields: LV } },
  settings: { defaults: DEFAULTS, schema: { type: 'object', additionalProperties: false, properties: {
    as_of: { type: ['string', 'null'], description: 'Date the check is made at (YYYY-MM-DD); default: today' },
    expiring_days: { type: 'integer', minimum: 0, maximum: 365, description: 'Memberships ending within this many days are shown (default 30)' },
    grace_days: { type: 'integer', minimum: 0, maximum: 365, description: 'Days after the end date before a membership counts as lapsed (default 30)' },
    organization: { type: 'string', description: 'Your organization name for the renewal notice' },
    tolerance: { type: 'number', minimum: 0, maximum: 100, description: 'Difference ignored (default 0.01)' },
  } } },
  run: ({ rows, settings }) => memberships(rows, settings),
  key: { arg: 'member_id', field: 'member_id', label: 'member' },
  summary: (o) => `${o.totals.members} member(s) as of ${o.extra.as_of}: ${o.totals.active} active (${money(o.totals.expected_dues)} of yearly dues), ${o.totals.expiring_soon} expiring soon, ${o.totals.lapsed} lapsed; ${money(o.totals.dues_received_12m)} received in the last 12 months.`,
  report: {
    title: 'Memberships and renewals', base: 'memberships',
    row: (i) => ({ member_id: i.member_id ?? '', member: i.member ?? '', level: i.level ?? '', expires: i.expires ?? '', last_payment: i.last_payment ?? '', dues: i.dues ?? '' }),
    htmlColumns: ['member_id', 'member', 'level', 'expires', 'last_payment', 'dues'],
    sections: (o) => [{ title: 'By level', rows: rollup(o.items, 'level', (i) => i.level || '(none)'), columns: ['level', 'count'] }],
  },
  draft: {
    noun: 'renewal_notice', verb: 'send', actor: 'a person on your team', required: ['members', 'levels', 'member_id'],
    description: 'Write drafts/renewal_notice-<member id>.md: a renewal notice to one member with the level, dues and end date. Marked DRAFT; a person sends it. The agent never charges dues.',
    args: { member_id: { type: 'string', description: 'Member id as the check shows it' }, from: { type: 'string', description: 'Signer name and title' } },
    build: (o, a) => {
      const m = o.items.find((i) => i.member_id === String(a.member_id).trim());
      if (!m) throw new Error(`member "${String(a.member_id).slice(0, 40)}" not found; pass a member_id from members_check`);
      if (!m.findings.some((f) => f.code === 'expiring_soon' || f.code === 'lapsed')) throw new Error(`member ${m.member_id} is not expiring or lapsed`);
      const org = o.settings_used.organization || '[TO CONFIRM organization name]';
      return { id: m.member_id, to: m.email || undefined, amount: m.dues ?? undefined, text: letter({ title: 'Time to renew your membership', to: m.email ? `${m.member} <${m.email}>` : m.member, from: a.from, re: `${m.level} membership, ${org}`,
        intro: `Dear ${m.member},\n\nYour ${m.level} membership ${m.expires < o.extra.as_of ? 'ended' : 'ends'} on ${m.expires}. To renew for another year, the dues are ${m.dues !== null ? dollars(m.dues) : '[TO CONFIRM dues]'}: [TO CONFIRM renewal link or address].`,
        closing: ['Thank you for being part of our community.', '', a.from || '[TO CONFIRM signer]'] }) };
    },
  },
  refused: [REFUSE.email, REFUSE.crm, { name: 'dues_charge', category: 'move_money', description: 'Never charges a card or bank account for dues.' }],
  memory: null,
});
