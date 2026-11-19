// Vendor 1099 readiness for one tax year. Payments by card or a payment app are left out
// (the processor reports them). Vendors paid at or over the threshold are reportable
// unless they are corporations (attorneys are reported anyway). Reportable vendors need a
// W-9, a well-formed taxpayer id and an address. Files nothing; the threshold and the
// rules are settings your preparer confirms.
import { str, num, round2, isoDate, yes, finding, statusOf, cmp, nameKey } from 'fairgive-core';

export const DEFAULTS = Object.freeze({ tax_year: null, threshold: 2000, exclude_methods: ['credit card', 'card', 'paypal', 'venmo'] });
const LEVELS = { needs_1099_no_w9: 'flag', tin_missing: 'flag', tin_malformed: 'flag', address_missing: 'review', unknown_vendor: 'review', attorney_reportable: 'watch', corporation_exempt: 'watch' };

export function vendor1099({ vendors = [], payments = [] }, s = DEFAULTS) {
  const year = Number(s.tax_year) || Math.max(...payments.map((p) => Number((isoDate(p.date) || '').slice(0, 4)) || 0), 0) || null;
  const V = new Map(); for (const v of vendors) if (str(v.vendor_id)) V.set(nameKey(v.vendor_id), v);
  const excl = (m) => (s.exclude_methods || []).some((x) => nameKey(x) && nameKey(m) === nameKey(x));
  const by = new Map();
  for (const p of payments) { const d = isoDate(p.date); if (!d || Number(d.slice(0, 4)) !== year) continue; const k = nameKey(p.vendor_id); if (!k) continue; const e = by.get(k) || { id: str(p.vendor_id), paid: 0, excluded: 0 }; const a = num(p.amount) || 0; if (excl(p.method)) e.excluded = round2(e.excluded + a); else e.paid = round2(e.paid + a); by.set(k, e); }
  const items = []; const T = { reportable: 0, amount: 0, no_w9: 0, tin: 0 };
  for (const [k, e] of [...by.entries()].sort((a, b) => cmp(a[1].id, b[1].id))) {
    const v = V.get(k); const f = [];
    if (!v) { f.push(finding('unknown_vendor', `Vendor ${e.id} was paid ${e.paid} and is not in the vendor list.`, e.paid)); items.push({ vendor_id: e.id, vendor: '', entity_type: '', tin: '', paid: e.paid, card_excluded: e.excluded, reportable: null, status: statusOf(f, LEVELS), findings: f }); continue; }
    const corp = /corp|inc\b|incorporated|\bpc\b|professional corporation|s corp|c corp/i.test(str(v.entity_type)); const attorney = yes(v.attorney) === true;
    let reportable = e.paid >= Number(s.threshold ?? 2000) && (!corp || attorney);
    if (e.paid >= Number(s.threshold ?? 2000) && corp && !attorney) f.push(finding('corporation_exempt', `Vendor ${e.id} (${str(v.entity_type)}) was paid ${e.paid}; corporations are usually not reported. Confirm the W-9 says so.`));
    if (reportable && corp && attorney) f.push(finding('attorney_reportable', `Vendor ${e.id} is a corporation paid ${e.paid} for legal services; attorney fees are usually reported even for corporations.`, e.paid));
    if (reportable) {
      if (yes(v.w9_on_file) !== true) f.push(finding('needs_1099_no_w9', `Vendor ${e.id} was paid ${e.paid} and there is no W-9 on file. Ask for one before the filing season.`, e.paid));
      const tin = str(v.tin).replace(/\D/g, '');
      if (!str(v.tin)) f.push(finding('tin_missing', `Vendor ${e.id} has no taxpayer id.`, e.paid));
      else if (tin.length !== 9) f.push(finding('tin_malformed', `Vendor ${e.id} has a taxpayer id with ${tin.length} digits; it should have 9.`, e.paid));
      if (!str(v.address)) f.push(finding('address_missing', `Vendor ${e.id} has no address for the form.`, e.paid));
      T.reportable++; T.amount += e.paid; if (f.some((x) => x.code === 'needs_1099_no_w9')) T.no_w9++; if (f.some((x) => /^tin_/.test(x.code))) T.tin++;
    }
    items.push({ vendor_id: e.id, vendor: str(v.vendor), entity_type: str(v.entity_type), tin: str(v.tin), paid: e.paid, card_excluded: e.excluded, reportable, status: statusOf(f, LEVELS), findings: f });
  }
  return { items, totals: { tax_year: year, vendors_paid: items.length, reportable: T.reportable, reportable_amount: round2(T.amount), missing_w9: T.no_w9, tin_problems: T.tin }, extra: {} };
}
