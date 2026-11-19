// In-kind gift log checks. Each gift needs a value and a way it was valued; values taken
// only from the donor, property over the appraisal threshold with no appraisal noted,
// contributed services that may not meet the recognition criteria (specialized skills),
// and property sold soon after the gift are listed for a person to look at. Recognized
// in-kind value is compared month by month with the in-kind revenue accounts.
import { str, num, round2, isoDate, monthOf, addMonths, yes, glAmount, finding, statusOf, cmp, nameKey } from 'fairgive-core';

export const DEFAULTS = Object.freeze({ appraisal_threshold: 5000, disposal_years: 3, inkind_accounts: [], tolerance: 0.01 });
const LEVELS = { no_value: 'flag', disposed_within_3_years: 'flag', no_valuation_method: 'review', over_appraisal_threshold: 'review', services_recognition_check: 'review', gl_differs: 'review', donor_value_only: 'watch' };
const SERVICE = /servic|labor|labour|volunteer|pro bono|professional/i;
const PROPERTY = /good|vehicle|car|van|art|property|equipment|item|stock|securit|real estate|land/i;

export function inKind({ inkind = [], gl = [] }, s = DEFAULTS) {
  const tol = Number(s.tolerance ?? 0.01); const items = []; const logMonth = new Map(); let total = 0, recognized = 0;
  for (const g of inkind) {
    if (!str(g.gift_id)) continue;
    const v = num(g.value); const cat = str(g.category); const f = []; const d = isoDate(g.gift_date); let counts = true;
    if (v === null || v <= 0) { f.push(finding('no_value', `In-kind gift ${str(g.gift_id)} (${str(g.description) || cat || 'no description'}) has no value.`)); counts = false; }
    else {
      if (!str(g.valuation_method)) f.push(finding('no_valuation_method', `In-kind gift ${str(g.gift_id)} is valued at ${v} with no valuation method recorded.`, v));
      if (/donor/i.test(str(g.valued_by))) f.push(finding('donor_value_only', `In-kind gift ${str(g.gift_id)}: the ${v} value comes from the donor only; record your own basis for it.`, v));
      if (PROPERTY.test(cat) && !SERVICE.test(cat) && v > Number(s.appraisal_threshold ?? 5000) && yes(g.appraisal) !== true) f.push(finding('over_appraisal_threshold', `In-kind gift ${str(g.gift_id)} (${cat}) is valued at ${v}, over the ${s.appraisal_threshold} appraisal threshold in the settings, and no appraisal is noted. The donor may need one for their own filing; your tax preparer can confirm.`, v));
      if (SERVICE.test(cat) && yes(g.specialized_skill) !== true) { f.push(finding('services_recognition_check', `In-kind gift ${str(g.gift_id)} is services (${str(g.description)}) not marked as a specialized skill; check whether it meets the recognition criteria before booking it. Left out of the recognized total.`, v)); counts = false; }
    }
    const disposed = isoDate(g.disposed_date);
    if (disposed && d && v !== null && disposed < addMonths(d, 12 * Number(s.disposal_years ?? 3))) f.push(finding('disposed_within_3_years', `In-kind gift ${str(g.gift_id)} (${v}) was sold or disposed of on ${disposed}${num(g.disposed_amount) !== null ? ` for ${num(g.disposed_amount)}` : ''}, within ${s.disposal_years} years of the gift on ${d}. Your tax preparer can confirm whether a report to the IRS is due.`, v));
    if (v) total += v;
    if (counts && v) { recognized += v; const m = monthOf(d); if (m) logMonth.set(m, round2((logMonth.get(m) || 0) + v)); }
    items.push({ item: str(g.gift_id), kind: 'gift', donor: str(g.donor), gift_date: d, description: str(g.description), category: cat, value: v, recognized: counts && v ? v : 0, gl_amount: null, status: statusOf(f, LEVELS), findings: f });
  }
  let gap = 0;
  if (gl.length && (s.inkind_accounts || []).length) {
    const isIk = (a) => (s.inkind_accounts || []).some((p) => str(p) && str(a).startsWith(str(p)));
    const glMonth = new Map(); for (const r of gl) if (isIk(r.account)) { const m = monthOf(r.date); if (m) glMonth.set(m, round2((glMonth.get(m) || 0) - glAmount(r, num))); }
    const months = [...glMonth.keys()].sort(); const lo = months[0], hi = months.at(-1);
    for (const m of [...new Set([...glMonth.keys(), ...logMonth.keys()])].filter((x) => x >= lo && x <= hi).sort()) {
      const a = logMonth.get(m) || 0, b = glMonth.get(m) || 0; const f = [];
      if (Math.abs(a - b) > tol) { f.push(finding('gl_differs', `${m}: the in-kind log has ${a} of recognized gifts, the ledger has ${b} of in-kind revenue (difference ${round2(b - a)}).`, b - a)); gap += Math.abs(b - a); }
      items.push({ item: `Month ${m}`, kind: 'month', donor: '', gift_date: m, description: '', category: '', value: a, recognized: a, gl_amount: b, status: statusOf(f, LEVELS), findings: f });
    }
  }
  return { items, totals: { gifts: items.filter((i) => i.kind === 'gift').length, total_value: round2(total), recognized_value: round2(recognized), no_value: items.filter((i) => i.findings.some((f) => f.code === 'no_value')).length, over_appraisal_threshold: items.filter((i) => i.findings.some((f) => f.code === 'over_appraisal_threshold')).length, gl_gap: round2(gap) }, extra: {} };
}
