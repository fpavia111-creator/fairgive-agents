import { readFileSync } from 'node:fs';
import { giveAgent, CONSTITUENT_FIELDS, CONSTITUENT_PROFILES, GIFT_FIELDS, sourceOf, REFUSE, money, rollup } from 'fairgive-core';
import { duplicates, DEFAULTS } from './logic.js';

const pkg = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'));
const files = {
  constituents: { type: 'string', description: 'Constituent or contact export under --root (Raiser\'s Edge NXT, Salesforce NPSP, Bloomerang or any CRM): id, name, e-mail, phone, street address, postal code, created date' },
  gifts: { type: 'string', description: 'Optional gift export under --root, to show how many gifts sit on each record' },
};
export const DEMO = { title: 'Fairgive Duplicate Donors', files: { constituents: 'constituents.csv', gifts: 'gifts.csv', settings: 'settings.json' }, explain: { arg: 'group', value: 'C-3' } };

export const manifest = giveAgent({
  pkg, prefix: 'dupes',
  description: pkg.description.replace(/^[^:]+:\s*/, ''),
  check: { title: 'Duplicate donor records', description: 'Groups constituent records that share an e-mail (without +tags), a phone number, the same name in any order (legal-form words such as Inc left out), a street address, or a name a letter or two apart in one word in the same postal code (numbers must match). The same name in two postal codes is listed at a lower level. Shared office e-mails in the settings are ignored. Groups linked only by address are households to look at. Each group shows its records, the rules that linked them, the gifts on them and the oldest record as the one to keep.' },
  args: files, required: ['constituents'],
  sources: {
    constituents: sourceOf('Constituents', ['constituents'], CONSTITUENT_FIELDS, ['donor_id', 'donor', 'email', 'phone', 'address', 'postal', 'created'], CONSTITUENT_PROFILES),
    gifts: sourceOf('Gifts', ['gifts'], GIFT_FIELDS, ['gift_id', 'donor_id', 'gift_date', 'amount']),
  },
  settings: { defaults: DEFAULTS, schema: { type: 'object', additionalProperties: false, properties: {
    name_similarity: { type: 'number', minimum: 0.5, maximum: 1, description: 'Two names in one postal code are grouped when every word matches but one, and that word is at least this close (Jaro-Winkler, 0 to 1; default 0.92); words with numbers must match exactly' },
    shared_emails: { type: 'array', items: { type: 'string' }, description: 'E-mail addresses several people use (office@, info@) that should not link records' },
    max_ids_shown: { type: 'integer', minimum: 2, maximum: 100, description: 'Record ids shown per group before "and n more" (default 12)' },
  } } },
  run: ({ rows, settings }) => duplicates(rows, settings),
  key: { arg: 'group', field: 'group', label: 'group (its first record id)' },
  summary: (o) => `${o.totals.records} record(s): ${o.totals.groups} group(s), ${o.totals.likely_duplicates} likely duplicate(s), ${o.totals.to_review} to review, ${o.totals.households} household(s); ${o.totals.extra_records} extra record(s) if every duplicate group were merged.`,
  report: {
    title: 'Duplicate donor records', base: 'duplicate-donors',
    row: (i) => ({ group: i.group ?? '', records: i.records ?? '', names: i.names ?? '', rules: i.rules ?? '', kind: i.kind ?? '', keep_suggestion: i.keep_suggestion ?? '', gifts: i.gifts ?? '', gift_amount: i.gift_amount ?? '' }),
    htmlColumns: ['group', 'records', 'names', 'rules', 'keep_suggestion', 'gifts'],
    sections: (o) => [{ title: 'By rule', rows: rollup(o.items.flatMap((i) => i.findings.map((f) => ({ rule: f.code }))), 'rule', (x) => x.rule), columns: ['rule', 'count'] }],
  },
  refused: [REFUSE.crm, REFUSE.delete],
  memory: null,
});
