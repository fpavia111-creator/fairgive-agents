// Column vocabularies shared by the Fairgive agents, so a gift export from a donor CRM,
// a bank deposit list, a payment-processor download or a general-ledger detail report
// reads the same way in every agent. Each field lists the header names it is also
// called. The names were written from knowledge of common donor CRM, giving-platform,
// processor and nonprofit accounting exports; none was checked against a live account.
// An organization can name columns by hand in fairgive-sources.json.
//
// personal: true marks a field that holds a person's name, contact details or taxpayer
// id. The agents mask those values in every result returned to the AI model; the report
// and draft files written on your machine keep the real values.
import { exportProfile, fullName, carryGroup } from './exports.js';

const t = (aliases, extra = {}) => ({ aliases, ...extra });
/** A copy of some fields of a set, optionally changing them: pick(GIFT_FIELDS, ['gift_id', 'amount'], { amount: { required: true } }). */
export function pick(set, names, changes = {}) {
  const out = {};
  for (const n of names) { if (!set[n]) throw new Error(`pick: no field "${n}"`); out[n] = { ...set[n], ...(changes[n] || {}) }; }
  return out;
}

/** Export profiles limited to the fields an agent declares (a profile may only map declared fields). */
export function fit(profiles, fields) {
  return Object.freeze((profiles || []).map((p) => Object.freeze({ ...p, map: Object.fromEntries(Object.entries(p.map || {}).filter(([f]) => Object.hasOwn(fields, f))), ...(p.provides ? { provides: p.provides.filter((f) => Object.hasOwn(fields, f)) } : {}) })));
}
/** A source block for a manifest: pick fields from a set and fit its profiles to them. */
export function sourceOf(label, args, set, names, profiles = [], changes = {}) {
  const fields = pick(set, names, changes);
  return { label, args, fields, ...(profiles.length ? { profiles: fit(profiles, fields) } : {}) };
}

// ------------------------------------------------------------------ gifts ----

export const GIFT_FIELDS = Object.freeze({
  gift_id: t(['Gift ID', 'Donation ID', 'Opportunity ID', 'Transaction ID', 'Gift Number', 'Gift No', 'Transaction Number', 'LGL Gift ID', 'Gift System ID', 'Payment ID', 'Receipt Number'], { required: true }),
  donor_id: t(['Constituent ID', 'Donor ID', 'Account ID', 'Contact ID', 'Account Number', 'LGL Constituent ID', 'Supporter ID', 'Donor Number', 'Constituent Number']),
  donor: t(['Donor Name', 'Donor', 'Constituent Name', 'Account Name', 'Name', 'Full Name', 'Contact Name', 'Constituent', 'Supporter Name', 'Giver'], { personal: true }),
  email: t(['Email', 'Email Address', 'Donor Email', 'Primary Email', 'Contact Email', 'E-mail'], { personal: true }),
  gift_date: t(['Gift Date', 'Donation Date', 'Close Date', 'Date', 'Transaction Date', 'Received Date', 'Date Received', 'Payment Date'], { type: 'date' }),
  amount: t(['Amount', 'Gift Amount', 'Donation Amount', 'Total Amount', 'Gross Amount', 'Payment Amount', 'Received Amount', 'Donated'], { type: 'money' }),
  fund: t(['Fund', 'Fund Code', 'Fund ID', 'Fund Name', 'Designation', 'General Accounting Unit', 'GAU', 'GL Code', 'Allocation']),
  campaign: t(['Campaign', 'Campaign ID', 'Campaign Name', 'Primary Campaign Source', 'Campaign Code', 'Campaign Title']),
  appeal: t(['Appeal', 'Appeal ID', 'Appeal Code', 'Solicitation', 'Solicit Code', 'Source Code']),
  gift_type: t(['Gift Type', 'Type', 'Donation Type', 'Record Type', 'Gift Subtype', 'Opportunity Record Type']),
  method: t(['Payment Method', 'Method', 'Pay Method', 'Payment Type', 'Tender', 'Gift Payment Type']),
  batch: t(['Batch', 'Batch Number', 'Batch ID', 'Gift Batch', 'Deposit Batch', 'Batch No', 'Gift Batch Number']),
  deposit_id: t(['Deposit', 'Deposit ID', 'Deposit Number', 'Bank Deposit', 'Payout ID', 'Settlement ID']),
  reference: t(['Check Number', 'Check No', 'Reference', 'Ref', 'Charge ID', 'Transaction Reference']),
  memo: t(['Notes', 'Memo', 'Gift Notes', 'Description', 'Comments', 'Gift Comment', 'Donor Note', 'Purpose']),
  status: t(['Status', 'Stage', 'Payment Status', 'Gift Status']),
});

const reMap = { gift_id: 'Gift ID', donor_id: 'Constituent ID', donor: ['Constituent Name', 'Name'], gift_date: ['Gift Date', 'Date'], amount: ['Gift Amount', 'Amount'], fund: ['Fund', 'Fund Description'], campaign: ['Campaign', 'Campaign Description'], appeal: ['Appeal', 'Appeal Description'], gift_type: 'Gift Type', method: ['Payment Method', 'Gift Payment Type'], batch: ['Gift Batch Number', 'Batch Number'], reference: ['Check Number', 'Reference'] };
export const GIFT_PROFILES = Object.freeze([
  exportProfile('re_nxt_gifts', reMap),
  exportProfile('npsp_opportunities', { gift_id: 'Opportunity ID', donor_id: ['Account ID', 'Account: Account ID'], donor: ['Account Name', 'Account: Account Name'], gift_date: 'Close Date', amount: 'Amount', fund: ['General Accounting Unit', 'GAU Allocation'], campaign: ['Primary Campaign Source', 'Campaign'], gift_type: ['Opportunity Record Type', 'Record Type'], status: 'Stage', method: 'Payment Method' }),
  exportProfile('bloomerang_transactions', { gift_id: 'Transaction Number', donor_id: 'Account Number', donor: ['Name', 'Account Name'], gift_date: 'Date', amount: 'Amount', fund: 'Fund', campaign: 'Campaign', appeal: 'Appeal', method: 'Method' }),
  exportProfile('donorperfect_gifts', { gift_id: 'gift_id', donor_id: 'donor_id', donor: { ...fullName('first_name', 'last_name') }, gift_date: 'gift_date', amount: 'amount', fund: 'gl_code', campaign: 'campaign', appeal: 'solicit_code', gift_type: 'gift_type', reference: 'reference', memo: 'gift_narrative' }),
  exportProfile('lgl_gifts', { gift_id: 'LGL Gift ID', donor_id: 'LGL Constituent ID', donor: ['Constituent Name', 'Name'], gift_date: 'Gift Date', amount: 'Gift Amount', fund: 'Fund', campaign: 'Campaign', appeal: 'Appeal', gift_type: 'Gift Type', method: 'Payment Type' }),
  exportProfile('neon_donations', { gift_id: 'Donation ID', donor_id: 'Account ID', donor: ['Full Name (F)', 'Account Name', 'Name'], gift_date: 'Donation Date', amount: 'Donation Amount', fund: 'Fund', campaign: 'Campaign Name', appeal: 'Purpose', method: 'Payment Method' }),
  exportProfile('givebutter_transactions', { gift_id: 'Transaction ID', donor: { ...fullName('First Name', 'Last Name') }, email: 'Email', gift_date: 'Date', amount: ['Amount', 'Donated'], campaign: ['Campaign Code', 'Campaign Title'], method: 'Method', status: 'Status', deposit_id: 'Payout ID' }),
  exportProfile('classy_transactions', { gift_id: 'Transaction ID', donor: { ...fullName('Billing First Name', 'Billing Last Name') }, email: 'Billing Email', gift_date: 'Transaction Date', amount: ['Gross Transaction Amount', 'Gross Amount'], campaign: 'Campaign Name', status: 'Status' }),
]);

// --------------------------------------------------------------- deposits ----

export const DEPOSIT_FIELDS = Object.freeze({
  deposit_id: t(['Deposit ID', 'Deposit Number', 'Deposit', 'FITID', 'Bank Reference', 'Transaction ID', 'Payout ID', 'Reference']),
  date: t(['Date', 'Deposit Date', 'Posting Date', 'Posted Date', 'Transaction Date', 'Value Date', 'Arrival Date', 'Paid Date'], { type: 'date', required: true }),
  amount: t(['Amount', 'Deposit Amount', 'Credit', 'Credits', 'Net Amount', 'Net', 'Total'], { type: 'money', required: true }),
  description: t(['Description', 'Memo', 'Details', 'Transaction Description', 'Narrative', 'Payee']),
  batch: t(['Batch', 'Batch Number', 'Batch ID', 'Deposit Batch', 'Gift Batch Number']),
  source: t(['Source', 'Processor', 'Bank Account', 'Account', 'Channel']),
});

// ---------------------------------------------------- processor payments ----

export const PROCESSOR_FIELDS = Object.freeze({
  txn_id: t(['Transaction ID', 'id', 'Charge ID', 'Payment ID', 'Reference ID'], { required: true }),
  processor: t(['Processor', 'Platform', 'Gateway', 'Payment Processor', 'Source']),
  date: t(['Date', 'Created (UTC)', 'Created', 'Transaction Date', 'Charge Date'], { type: 'date' }),
  type: t(['Type', 'Transaction Type', 'Event']),
  gross: t(['Gross', 'Gross Amount', 'Amount', 'Charge Amount', 'Gross Transaction Amount'], { type: 'money' }),
  fee: t(['Fee', 'Fees', 'Processing Fee', 'Fee Amount', 'Platform Fee'], { type: 'money' }),
  net: t(['Net', 'Net Amount', 'Net Deposit'], { type: 'money' }),
  payout_id: t(['Payout ID', 'Transfer', 'Settlement ID', 'Payout', 'Deposit ID']),
  payout_date: t(['Payout Date', 'Available On (UTC)', 'Available On', 'Settlement Date', 'Transfer Date'], { type: 'date' }),
  donor: t(['Name', 'Donor Name', 'Customer Name', 'Payer Name', 'Billing Name'], { personal: true }),
  email: t(['From Email Address', 'Customer Email', 'Email', 'Payer Email', 'Billing Email'], { personal: true }),
  status: t(['Status', 'Payment Status']),
  refunded: t(['Amount Refunded', 'Refunded', 'Refund Amount'], { type: 'money' }),
  covered_fee: t(['Fee Covered', 'Donor Covered Fee', 'Covered Fee', 'Processing Fee Covered'], { type: 'money' }),
  gift_id: t(['Gift ID', 'Donation ID', 'Invoice ID', 'Order ID', 'Metadata Gift ID']),
});
export const PROCESSOR_PROFILES = Object.freeze([
  exportProfile('paypal_activity', { txn_id: 'Transaction ID', date: 'Date', type: 'Type', gross: 'Gross', fee: { from: 'Fee', transform: (v) => String(v ?? '').replace(/^-/, '') }, net: 'Net', donor: 'Name', email: 'From Email Address', status: 'Status', processor: { value: 'PayPal' } }),
  exportProfile('stripe_balance', { txn_id: ['Source', 'id'], date: ['Created (UTC)', 'Created'], type: 'Type', gross: 'Amount', fee: 'Fee', net: 'Net', payout_id: 'Transfer', payout_date: ['Available On (UTC)', 'Available On'], processor: { value: 'Stripe' } }),
  exportProfile('stripe_payments', { txn_id: 'id', date: 'Created (UTC)', gross: 'Amount', fee: 'Fee', refunded: 'Amount Refunded', email: 'Customer Email', status: 'Status', processor: { value: 'Stripe' } }),
]);

// ---------------------------------------------------------- general ledger ----

const signed = (v) => String(v ?? '').trim();
export const GL_FIELDS = Object.freeze({
  entry_id: t(['Entry ID', 'Journal ID', 'JE Number', 'Num', 'Journal Entry', 'Transaction ID', 'Txn ID', 'Record No', 'Document Number', 'Journal']),
  date: t(['Date', 'Transaction Date', 'Posting Date', 'Post Date', 'Entry Date', 'GL Date'], { type: 'date' }),
  account: t(['Account', 'Account Number', 'GL Account', 'Account No', 'Account no.', 'Account Code', 'Acct', 'Account ID'], { required: true }),
  account_name: t(['Account Name', 'Account Title', 'Account Description']),
  fund: t(['Fund', 'Fund Code', 'Fund ID', 'Fund Name', 'Restriction', 'Net Asset Class', 'Fund Number']),
  program: t(['Program', 'Program Code', 'Class', 'Department', 'Program Name', 'Cost Center', 'Tag']),
  grant: t(['Grant', 'Grant ID', 'Grant Code', 'Project', 'Project ID', 'Award', 'Award Number', 'Job']),
  debit: t(['Debit', 'Debit Amount', 'Dr'], { type: 'money' }),
  credit: t(['Credit', 'Credit Amount', 'Cr'], { type: 'money' }),
  amount: t(['Amount', 'Net Amount', 'Transaction Amount', 'Signed Amount'], { type: 'money' }),
  memo: t(['Memo', 'Description', 'Memo/Description', 'Line Description', 'Transaction Description', 'Narrative']),
  vendor: t(['Vendor', 'Payee', 'Vendor Name', 'Name']),
});
export const GL_PROFILES = Object.freeze([
  exportProfile('qbo_general_ledger', { entry_id: 'Num', date: 'Date', amount: { from: 'Amount', transform: signed }, memo: 'Memo/Description', vendor: 'Name', program: 'Class' }, { provides: ['account'], rows: (rows) => carryGroup('account')(rows).filter((r) => String(r.date || '').trim()), note: 'QuickBooks Online: the account is read from the group heading above each block of rows.' }),
  exportProfile('aplos_transactions', { entry_id: ['Transaction ID', 'ID'], date: 'Date', account: 'Account', fund: 'Fund', program: 'Tag', amount: 'Amount', memo: ['Memo', 'Description'], vendor: ['Contact', 'Name'] }),
  exportProfile('intacct_gl_detail', { entry_id: ['Journal', 'Record no.'], date: ['Date', 'Posted date'], account: 'Account no.', account_name: 'Account title', fund: ['Fund', 'Restriction'], program: ['Department', 'Class'], grant: ['Project', 'Project ID'], debit: 'Debit', credit: 'Credit', memo: ['Memo', 'Description'] }),
  exportProfile('financial_edge_gl', { entry_id: ['Journal', 'Batch number'], date: ['Post date', 'Date'], account: 'Account number', account_name: 'Account description', fund: 'Fund', program: ['Department', 'Program'], grant: ['Project', 'Grant'], amount: 'Transaction amount', memo: ['Journal reference', 'Description'] }),
]);
/** Signed amount of a ledger row: debit minus credit when either is given, else the amount column. */
export function glAmount(r, num) {
  const d = num(r.debit), c = num(r.credit);
  if (d !== null || c !== null) return (d || 0) - (c || 0);
  return num(r.amount) || 0;
}

// --------------------------------------------------------------- funds ----

export const FUND_FIELDS = Object.freeze({
  fund: t(['Fund', 'Fund Code', 'Fund ID', 'Fund Number', 'GAU', 'Designation'], { required: true }),
  fund_name: t(['Fund Name', 'Fund Description', 'Name', 'Description']),
  restriction: t(['Restriction', 'Restriction Type', 'Net Asset Class', 'Fund Type', 'Class', 'Donor Restriction']),
  purpose: t(['Purpose', 'Restricted Purpose', 'Use', 'Restriction Purpose']),
  release_date: t(['Release Date', 'Time Restriction Ends', 'Available From', 'Restricted Until'], { type: 'date' }),
  active: t(['Active', 'Status', 'Is Active']),
  keywords: t(['Keywords', 'Match Words', 'Terms']),
});

// --------------------------------------------------------------- grants ----

export const GRANT_FIELDS = Object.freeze({
  grant: t(['Grant', 'Grant ID', 'Grant Code', 'Award', 'Award Number', 'Project', 'Project ID'], { required: true }),
  grant_name: t(['Grant Name', 'Award Name', 'Project Name', 'Title', 'Program Name']),
  funder: t(['Funder', 'Grantor', 'Funding Agency', 'Agency', 'Foundation', 'Awarding Agency']),
  award_amount: t(['Award Amount', 'Grant Amount', 'Amount Awarded', 'Total Award', 'Award Total', 'Amount'], { type: 'money' }),
  award_start: t(['Start Date', 'Period Start', 'Award Start', 'Project Start', 'Begin Date'], { type: 'date' }),
  award_end: t(['End Date', 'Period End', 'Award End', 'Project End', 'Expiration Date'], { type: 'date' }),
  federal: t(['Federal', 'Federal Award', 'Is Federal', 'Federal Funds']),
  aln: t(['ALN', 'Assistance Listing', 'Assistance Listing Number', 'CFDA', 'CFDA Number'], { translate: false }),
  pass_through: t(['Pass-Through Entity', 'Pass Through Entity', 'Pass-through', 'Subrecipient Of']),
  owner: t(['Owner', 'Grant Manager', 'Program Officer', 'Contact', 'Responsible']),
});

// ----------------------------------------------------------- constituents ----

export const CONSTITUENT_FIELDS = Object.freeze({
  donor_id: t(['Constituent ID', 'Donor ID', 'Account ID', 'Contact ID', 'Account Number', 'LGL Constituent ID', 'Supporter ID'], { required: true }),
  donor: t(['Name', 'Donor Name', 'Full Name', 'Constituent Name', 'Account Name', 'Contact Name'], { personal: true }),
  email: t(['Email', 'Email Address', 'Primary Email', 'Personal Email'], { personal: true }),
  phone: t(['Phone', 'Phone Number', 'Primary Phone', 'Home Phone', 'Mobile Phone'], { personal: true }),
  address: t(['Address', 'Street', 'Address Line 1', 'Preferred Address Line 1', 'Mailing Street', 'Street Address'], { personal: true }),
  postal: t(['Postal Code', 'ZIP', 'Zip Code', 'Zip', 'Mailing Zip/Postal Code', 'Preferred ZIP']),
  created: t(['Created Date', 'Date Added', 'Created', 'Date Created'], { type: 'date' }),
});
export const CONSTITUENT_PROFILES = Object.freeze([
  exportProfile('re_nxt_constituents', { donor_id: 'Constituent ID', donor: fullName('First Name', 'Last Name'), email: ['Email Address', 'Email'], phone: ['Phone Number', 'Phone'], address: ['Preferred Address Line 1', 'Address'], postal: ['Preferred ZIP', 'ZIP'] }),
  exportProfile('npsp_contacts', { donor_id: 'Contact ID', donor: fullName('First Name', 'Last Name'), email: 'Email', phone: 'Phone', address: 'Mailing Street', postal: 'Mailing Zip/Postal Code', created: 'Created Date' }),
  exportProfile('bloomerang_constituents', { donor_id: 'Account Number', donor: fullName('First Name', 'Last Name'), email: 'Primary Email', phone: 'Primary Phone', address: 'Primary Street', postal: 'Primary ZIP Code' }),
]);
