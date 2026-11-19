// Catalogue of export files from donor CRMs, giving platforms, payment processors
// and nonprofit accounting systems that the Fairgive agents recognise.
//
// Each entry says how to recognise the file (column names that must be there).
// An agent turns an entry into a profile by adding its own column map:
//
//   exportProfile('paypal_activity', { gift_id: 'Transaction ID', amount: 'Gross' })
//
// basis:
//   'documented'  the column names were checked against the vendor's own
//                 documentation (source and date given);
//   'recalled'    the layout was written from knowledge of the export and was
//                 not checked against documentation or a live account.
// Neither kind was tested against a live account. When a header differs, the
// file still maps by each column's "also called" list, `inspect` shows what was
// matched, and fairgive-sources.json names the columns by hand.

const e = (id, system, label, signature, extra = {}) => Object.freeze({ id, system, label, signature, basis: 'recalled', ...extra });

export const EXPORTS = Object.freeze(Object.fromEntries([
  // Donor CRMs: gifts
  e('re_nxt_gifts', "Blackbaud Raiser's Edge NXT", 'Gift list or query export (CSV)', ['Gift ID', 'Constituent ID', ['Gift Amount', 'Amount']]),
  e('npsp_opportunities', 'Salesforce Nonprofit Success Pack', 'Opportunities (donations) report export', ['Opportunity ID', ['Account Name', 'Account: Account Name'], 'Close Date']),
  e('bloomerang_transactions', 'Bloomerang', 'Transactions export', ['Transaction Number', 'Account Number', 'Amount']),
  e('donorperfect_gifts', 'DonorPerfect', 'Gift export (field names)', ['gift_id', 'donor_id', 'gl_code']),
  e('lgl_gifts', 'Little Green Light', 'Gifts export', ['LGL Gift ID', 'LGL Constituent ID', 'Gift Amount']),
  e('neon_donations', 'Neon CRM', 'Donation report export', ['Donation ID', 'Account ID', 'Donation Amount']),
  e('givebutter_transactions', 'Givebutter', 'Transactions export', ['Transaction ID', 'Campaign Code', ['Amount', 'Donated']]),
  e('classy_transactions', 'GoFundMe Pro (Classy)', 'Transactions export', ['Transaction ID', 'Campaign Name', ['Gross Transaction Amount', 'Gross Amount']]),
  // Donor CRMs: people
  e('re_nxt_constituents', "Blackbaud Raiser's Edge NXT", 'Constituent list export (CSV)', ['Constituent ID', 'Last Name', ['Preferred Address Line 1', 'Address']]),
  e('npsp_contacts', 'Salesforce Nonprofit Success Pack', 'Contacts report export', ['Contact ID', 'Account Name', 'Mailing Street']),
  e('bloomerang_constituents', 'Bloomerang', 'Constituents export', ['Account Number', 'First Name', 'Primary Email']),
  // Payment processors
  e('paypal_activity', 'PayPal', 'Activity download (CSV)', ['Transaction ID', 'Gross', 'Fee', 'Net']),
  e('stripe_balance', 'Stripe', 'Balance history export', ['id', 'Type', 'Amount', 'Fee', 'Net']),
  e('stripe_payments', 'Stripe', 'Payments export', ['id', 'Created (UTC)', 'Amount', 'Amount Refunded']),
  // Accounting
  e('qbo_general_ledger', 'QuickBooks Online', 'General Ledger report (CSV or Excel)', ['Transaction Type', 'Num', 'Split', 'Amount'], { dropTotals: true }),
  e('aplos_transactions', 'Aplos', 'Transactions export', ['Fund', 'Account', 'Tag', 'Amount']),
  e('intacct_gl_detail', 'Sage Intacct', 'General ledger detail report export', ['Journal', 'Account no.', 'Debit', 'Credit']),
  e('financial_edge_gl', 'Blackbaud Financial Edge NXT', 'Journal entry or account activity export', ['Journal', 'Account number', 'Transaction amount']),
  e('qbo_vendor_1099', 'QuickBooks Online', 'Vendor contact list export', ['Vendor', 'Tax ID', 'Track payments for 1099']),
].map((x) => [x.id, x])));

/** A profile for an agent: a catalogue entry plus the agent's column map. */
export function exportProfile(key, map, extra = {}) {
  const base = EXPORTS[key];
  if (!base) throw new Error(`unknown export "${key}"`);
  return { ...base, map, ...extra };
}

export const EXPORTS_BASIS_NOTE = 'Where a layout says "checked", its column names were compared with the vendor\'s documentation on that date. The other layouts were written from knowledge of the export and were not checked. None was tested against a live account.';

/**
 * Row hook for grouped reports (QuickBooks style): a row with only its first
 * cell filled names the group for the rows under it; "Total for ..." rows end it.
 * The group name is written to `field` on each detail row.
 */
export function carryGroup(field, { groupColumn = '', isDetail } = {}) {
  return (rows) => {
    const out = []; let group = '';
    for (const r of rows) {
      const label = String(r[groupColumn] ?? '').trim();
      const detail = isDetail ? isDetail(r) : Object.entries(r).some(([k, v]) => k !== groupColumn && k !== field && String(v ?? '').trim() !== '');
      if (label && /^(grand\s+)?total\b/i.test(label)) continue;
      if (label && !detail) { group = label; continue; }
      if (!detail) continue;
      const { [groupColumn]: _drop, ...rest } = r;
      out.push({ ...rest, [field]: String(r[field] ?? '').trim() || label || group });
    }
    return out;
  };
}

/** Row hook: keep the first row for each value of `field` (Shopify repeats an order once per line item). */
export function firstRowPer(field) {
  return (rows) => { const seen = new Set(); return rows.filter((r) => { const k = String(r[field] ?? ''); if (!k || seen.has(k)) return false; seen.add(k); return true; }); };
}

/** "First Last" from two columns, for exports that split the name. */
export const fullName = (first, last) => ({ from: [first, last], compute: (_r, get) => [get(first), get(last)].map((v) => String(v ?? '').trim()).filter(Boolean).join(' ') });
