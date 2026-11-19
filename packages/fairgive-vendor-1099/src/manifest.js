import { readFileSync } from 'node:fs';
import { giveAgent, REFUSE, money } from 'fairgive-core';
import { vendor1099, DEFAULTS } from './logic.js';

const pkg = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'));
const files = {
  vendors: { type: 'string', description: 'Vendor list under --root (QuickBooks Online vendor contact list or your AP system): vendor id, name, entity type, taxpayer id, W-9 on file, address, attorney (yes/no)' },
  payments: { type: 'string', description: 'Vendor payments under --root: vendor id, date, amount, payment method, category' },
};
const VF = { vendor_id: { aliases: ['Vendor ID', 'Vendor Number', 'Supplier ID', 'Vendor'], required: true }, vendor: { aliases: ['Vendor Name', 'Name', 'Company', 'Display Name', 'Payee'], personal: true }, entity_type: { aliases: ['Entity Type', 'Tax Classification', 'Business Type', 'Classification'] }, tin: { aliases: ['TIN', 'Tax ID', 'EIN', 'SSN', 'Taxpayer ID'], personal: true }, w9_on_file: { aliases: ['W9 On File', 'W-9 On File', 'W-9', 'W9', 'Track payments for 1099'] }, address: { aliases: ['Address', 'Billing Address', 'Street', 'Address Line 1'], personal: true }, attorney: { aliases: ['Attorney', 'Legal Services', 'Is Attorney'] } };
const PF = { payment_id: { aliases: ['Payment ID', 'Check Number', 'Num', 'Reference'] }, vendor_id: { aliases: ['Vendor ID', 'Vendor Number', 'Supplier ID', 'Vendor'], required: true }, date: { aliases: ['Date', 'Payment Date', 'Paid Date'], type: 'date' }, amount: { aliases: ['Amount', 'Payment Amount', 'Paid'], type: 'money' }, method: { aliases: ['Method', 'Payment Method', 'Type'] }, category: { aliases: ['Category', 'Account', 'Expense Account'] } };
export const DEMO = { title: 'Fairgive Vendor 1099', files: { vendors: 'vendors.csv', payments: 'payments.csv', settings: 'settings.json' }, explain: { arg: 'vendor_id', value: 'V-2' } };

export const manifest = giveAgent({
  pkg, prefix: 'vendor_1099',
  description: pkg.description.replace(/^[^:]+:\s*/, ''),
  check: { title: '1099 readiness', description: 'Totals each vendor\'s payments in the tax year, leaving out payments by card or a payment app, and marks vendors paid at or over the threshold in the settings as reportable unless they are corporations (attorneys are kept). Flags reportable vendors with no W-9, no taxpayer id or a malformed one; lists missing addresses, corporations left out and payments to vendors not in the list. Taxpayer ids are masked.' },
  args: files, required: ['vendors', 'payments'],
  sources: { vendors: { label: 'Vendors', args: ['vendors'], fields: VF }, payments: { label: 'Vendor payments', args: ['payments'], fields: PF } },
  settings: { defaults: DEFAULTS, schema: { type: 'object', additionalProperties: false, properties: {
    tax_year: { type: ['integer', 'null'], minimum: 2000, maximum: 2100, description: 'Tax year (default: the latest year in the payments)' },
    threshold: { type: 'number', minimum: 0, description: 'Payments at or over this make a vendor reportable (default 2000 for payments in 2026; 600 for earlier years; your preparer confirms)' },
    exclude_methods: { type: 'array', items: { type: 'string' }, description: 'Payment methods left out because the processor reports them (card, PayPal...)' },
  } } },
  run: ({ rows, settings }) => vendor1099(rows, settings),
  key: { arg: 'vendor_id', field: 'vendor_id', label: 'vendor' },
  summary: (o) => `Tax year ${o.totals.tax_year || '?'}: ${o.totals.vendors_paid} vendor(s) paid, ${o.totals.reportable} reportable for ${money(o.totals.reportable_amount)}; ${o.totals.missing_w9} with no W-9, ${o.totals.tin_problems} with a taxpayer id problem.`,
  report: {
    title: '1099 readiness', base: 'vendor-1099',
    row: (i) => ({ vendor_id: i.vendor_id ?? '', vendor: i.vendor ?? '', entity_type: i.entity_type ?? '', tin: i.tin ?? '', paid: i.paid ?? '', card_excluded: i.card_excluded ?? '', reportable: i.reportable === null ? '' : i.reportable ? 'yes' : 'no' }),
    htmlColumns: ['vendor_id', 'vendor', 'entity_type', 'paid', 'card_excluded', 'reportable'],
  },
  refused: [REFUSE.irs, REFUSE.pay],
  memory: null,
});
