import { readFileSync } from 'node:fs';
import { giveAgent, GIFT_FIELDS, sourceOf, REFUSE, rollup } from 'fairgive-core';
import { form990, DEFAULTS } from './logic.js';

const pkg = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'));
const files = {
  gifts: { type: 'string', description: 'Gift export under --root: gift id, donor id, donor, address, date, amount, gift type (cash or noncash), description of noncash gifts' },
  officers: { type: 'string', description: 'Optional officers, directors and key employees under --root: name, title, average hours per week, compensation' },
  grants_paid: { type: 'string', description: 'Optional grants your organization paid under --root: grantee, EIN, address, amount, purpose' },
};
const GIFTS = { ...GIFT_FIELDS, address: { aliases: ['Address', 'Street', 'Address Line 1', 'Mailing Address', 'Preferred Address'], personal: true }, description: { aliases: ['Description', 'Noncash Description', 'Item Description', 'Property Description'] } };
const OFF = { name: { aliases: ['Name', 'Officer', 'Full Name'], required: true, personal: true }, title: { aliases: ['Title', 'Position', 'Role'] }, hours_per_week: { aliases: ['Hours Per Week', 'Average Hours', 'Hours'], type: 'number', translate: 'hours' }, compensation: { aliases: ['Compensation', 'Reportable Compensation', 'Salary', 'Pay'], type: 'money' } };
const GP = { grantee: { aliases: ['Grantee', 'Organization', 'Recipient', 'Name'], required: true }, ein: { aliases: ['EIN', 'Grantee EIN', 'Tax ID'] , translate: 'tax_id' }, address: { aliases: ['Address', 'Street', 'Mailing Address'] }, amount: { aliases: ['Amount', 'Grant Amount', 'Paid'], type: 'money' }, purpose: { aliases: ['Purpose', 'Description', 'Use'] } };
export const DEMO = { title: 'Fairgive Form 990 Data', files: { gifts: 'gifts.csv', officers: 'officers.csv', grants_paid: 'grants_paid.csv', settings: 'settings.json' }, explain: { arg: 'item', value: 'Schedule B C-2' } };

export const manifest = giveAgent({
  pkg, prefix: 'form990',
  description: pkg.description.replace(/^[^:]+:\s*/, ''),
  check: { title: 'Form 990 schedule data readiness', description: 'Checks that the data behind common Form 990 schedules is complete for the tax year: contributors at or over the Schedule B threshold with an address and a description of noncash gifts, noncash totals over the Schedule M threshold, officers with average hours and compensation, and grants over the Schedule I threshold with the grantee\'s EIN and address. It prepares data for your preparer; it files nothing and decides no schedule.' },
  args: files, required: ['gifts'],
  sources: { gifts: sourceOf('Gifts', ['gifts'], GIFTS, ['gift_id', 'donor_id', 'donor', 'address', 'gift_date', 'amount', 'gift_type', 'description']), officers: { label: 'Officers and key employees', args: ['officers'], fields: OFF }, grants_paid: { label: 'Grants paid', args: ['grants_paid'], fields: GP } },
  settings: { defaults: DEFAULTS, schema: { type: 'object', additionalProperties: false, properties: {
    tax_year: { type: ['integer', 'null'], minimum: 2000, maximum: 2100, description: 'Tax year, named by the year it ends in (default: the latest year in the gifts)' },
    fiscal_year_start: { type: 'integer', minimum: 1, maximum: 12, description: 'First month of your tax year (default 1)' },
    schedule_b_threshold: { type: 'number', minimum: 0, description: 'Contributor total at or over this needs Schedule B data (default 5000; your preparer confirms which rule applies to you)' },
    schedule_m_threshold: { type: 'number', minimum: 0, description: 'Noncash total over this is shown for Schedule M (default 25000)' },
    schedule_i_threshold: { type: 'number', minimum: 0, description: 'Grants over this need Schedule I data (default 5000)' },
  } } },
  run: ({ rows, settings }) => form990(rows, settings),
  key: { arg: 'item', field: 'item', label: 'line ("Schedule B C-2", "Part VII Treasurer", "Schedule I Example Arts Studio")' },
  summary: (o) => `Tax year ${o.totals.tax_year || '?'}: ${o.totals.schedule_b_contributors} Schedule B contributor(s), noncash ${o.totals.noncash_total}, ${o.totals.officers} officer(s), ${o.totals.schedule_i_grants} Schedule I grant(s); ${o.totals.gaps} line(s) with data to complete.`,
  report: {
    title: 'Form 990 schedule data readiness', base: 'form-990-data',
    row: (i) => ({ item: i.item ?? '', schedule: i.schedule ?? '', name: i.name ?? '', detail: i.detail ?? '', amount: i.amount ?? '' }),
    htmlColumns: ['item', 'schedule', 'name', 'detail', 'amount'],
    sections: (o) => [{ title: 'By schedule', rows: rollup(o.items, 'schedule', (i) => i.schedule), columns: ['schedule', 'count'] }],
  },
  refused: [REFUSE.irs],
  memory: null,
});
