// Duplicate donor records. Records are linked by exact keys (e-mail without +tags, the last
// ten digits of the phone, the order-free name, the street address with common words
// shortened plus the postal code) and by similar names within one postal code, then grouped
// with union-find, so a file of any size is one pass and every group is listed once.
// A group linked only by its address is a household to look at, not a duplicate.
//
// Names (changed in the final pass after the IRS register of Vermont's 6,626 exempt
// organizations): legal-form words (Inc, LLC, Corp) are left out; two names are "similar" only
// when every word matches but one, that one is a near-typo and any numbers are equal ("Juniper
// Vance" and "Juniper Vane", not "Brattleboro Outing Club" and "Brattleboro Tennis Club" or
// "Lodge 37" and "Lodge 73"); the same name in two different postal codes is listed apart, as
// a lower-level finding, because it is as often two donors (or two chapters) as one who moved.
import { str, num, round2, normEmail, normPhone, normPostal, nameTokens, jaroWinkler, finding, statusOf, cmp } from 'fairgive-core';

export const DEFAULTS = Object.freeze({ name_similarity: 0.92, shared_emails: [], max_ids_shown: 12 });
const LEVELS = { same_email: 'flag', same_phone: 'flag', same_name: 'review', similar_name: 'review', same_address: 'watch', same_name_other_postal: 'watch' };
const STREET = [[/\bp\s*o\s*box\b|\bpost office box\b/g, 'po box'], [/\bstreet\b/g, 'st'], [/\bavenue\b/g, 'ave'], [/\broad\b/g, 'rd'], [/\blane\b/g, 'ln'], [/\bdrive\b/g, 'dr'], [/\bcourt\b/g, 'ct'], [/\bplace\b/g, 'pl'], [/\bboulevard\b/g, 'blvd'], [/\bsuite\b/g, 'ste'], [/\bhighway\b/g, 'hwy'], [/\bapartment\b|\bapt\b|\bunit\b|#/g, ' ']];
export const addressKey = (a) => { let s = str(a).toLowerCase().replace(/[.,]/g, ' '); for (const [re, w] of STREET) s = s.replace(re, w); return s.replace(/\s+/g, ' ').trim(); };
const LEGAL = new Set(['inc', 'incorporated', 'llc', 'ltd', 'limited', 'corp', 'corporation', 'co', 'company', 'pc', 'pllc', 'lp', 'llp', 'plc']);
/** Order-free name words for matching, without titles, suffixes and legal-form words. */
export const nameWords = (name) => nameTokens(name).split(' ').filter((t) => t && !LEGAL.has(t));
/** Two word lists that match but for one near-typo word with no digits in it. */
export function similarNames(a, b, limit = 0.92) {
  if (a.length !== b.length || a.length < 2) return false;
  const rest = [...b]; const left = [];
  for (const w of a) { const i = rest.indexOf(w); if (i >= 0) rest.splice(i, 1); else left.push(w); }
  if (left.length !== 1 || rest.length !== 1) return false;
  const [x, y] = [left[0], rest[0]];
  if (/\d/.test(x) || /\d/.test(y) || Math.min(x.length, y.length) < 3) return false;
  return jaroWinkler(x, y) >= limit;
}

export function duplicates({ constituents = [], gifts = [] }, s = DEFAULTS) {
  const recs = constituents.filter((c) => str(c.donor_id));
  const parent = new Map(recs.map((r) => [str(r.donor_id), str(r.donor_id)]));
  const find = (x) => { let p = x; while (parent.get(p) !== p) p = parent.get(p); let q = x; while (parent.get(q) !== p) { const n = parent.get(q); parent.set(q, p); q = n; } return p; };
  const union = (a, b) => { const x = find(a), y = find(b); if (x !== y) { if (x < y) parent.set(y, x); else parent.set(x, y); } };
  const links = []; // [a, b, rule]
  const shared = new Set((s.shared_emails || []).map(normEmail));
  const index = (rule, keyOf) => { const m = new Map(); for (const r of recs) { const k = keyOf(r); if (!k) continue; const id = str(r.donor_id); if (m.has(k)) { const first = m.get(k); union(first, id); links.push([first, id, rule]); } else m.set(k, id); } };
  index('same_email', (r) => { const e = normEmail(r.email); return e && !shared.has(e) ? e : ''; });
  index('same_phone', (r) => normPhone(r.phone));
  const link = (a, b, rule) => { union(a, b); links.push([a, b, rule]); };
  // Same name: one group per name and postal code; a record with no postal code joins the first;
  // the same name in another postal code is linked as same_name_other_postal.
  const byName = new Map();
  for (const r of recs) { const n = nameWords(r.donor).join(' '); if (!n.includes(' ')) continue; if (!byName.has(n)) byName.set(n, []); byName.get(n).push(r); }
  for (const list of byName.values()) {
    if (list.length < 2) continue;
    const byP = new Map(); const noP = [];
    for (const r of list) { const p = normPostal(r.postal); if (!p) noP.push(str(r.donor_id)); else { if (!byP.has(p)) byP.set(p, []); byP.get(p).push(str(r.donor_id)); } }
    const firsts = [...byP.values()].map((ids) => { for (const id of ids.slice(1)) link(ids[0], id, 'same_name'); return ids[0]; });
    const anchor = firsts[0] || noP[0];
    for (const id of noP) if (id !== anchor) link(anchor, id, 'same_name');
    for (const id of firsts.slice(1)) link(firsts[0], id, 'same_name_other_postal');
  }
  index('same_address', (r) => { const a = addressKey(r.address); return a ? `${a}|${normPostal(r.postal)}` : ''; });
  // Similar names within one postal code: names that share all words but one are found through
  // a key with that word left out, so no postal code is too big to check.
  const limit = Number(s.name_similarity ?? 0.92);
  const byPostal = new Map();
  for (const r of recs) { const p = normPostal(r.postal); const w = nameWords(r.donor).filter((x) => x.length > 1); if (!p || w.length < 2) continue; if (!byPostal.has(p)) byPostal.set(p, new Map()); const m = byPostal.get(p); const k = w.join(' '); if (!m.has(k)) m.set(k, { id: str(r.donor_id), w }); }
  for (const m of byPostal.values()) {
    const near = new Map();
    for (const e of m.values()) for (let i = 0; i < e.w.length; i++) { const k = `${e.w.length}|${e.w.filter((_, j) => j !== i).join(' ')}`; if (!near.has(k)) near.set(k, []); near.get(k).push(e); }
    const seen = new Set();
    for (const list of near.values()) for (let i = 0; i < list.length; i++) for (let j = i + 1; j < list.length; j++) {
      const [a, b] = [list[i], list[j]]; const pk = a.id < b.id ? `${a.id}|${b.id}` : `${b.id}|${a.id}`;
      if (seen.has(pk)) continue; seen.add(pk);
      if (similarNames(a.w, b.w, limit)) link(a.id, b.id, 'similar_name');
    }
  }
  const giftsBy = new Map(); for (const g of gifts) { const k = str(g.donor_id); if (!k) continue; const e = giftsBy.get(k) || { n: 0, amount: 0 }; e.n++; e.amount = round2(e.amount + (num(g.amount) || 0)); giftsBy.set(k, e); }
  const groups = new Map(); for (const r of recs) { const root = find(str(r.donor_id)); if (!groups.has(root)) groups.set(root, []); groups.get(root).push(r); }
  const rulesOf = new Map(); for (const [a, , rule] of links) { const root = find(a); if (!rulesOf.has(root)) rulesOf.set(root, new Set()); rulesOf.get(root).add(rule); }
  const items = []; const max = Number(s.max_ids_shown ?? 12);
  for (const [root, list] of groups) {
    if (list.length < 2) continue;
    const ids = list.map((r) => str(r.donor_id)).sort(cmp); const rules = [...(rulesOf.get(root) || [])].sort();
    const names = [...new Set(list.map((r) => str(r.donor)).filter(Boolean))].sort(cmp);
    const shown = ids.slice(0, max).join(' + ') + (ids.length > max ? ` + ${ids.length - max} more` : '');
    const g = ids.reduce((t, id) => { const e = giftsBy.get(id); return e ? { n: t.n + e.n, amount: round2(t.amount + e.amount) } : t; }, { n: 0, amount: 0 });
    const oldest = list.slice().sort((a, b) => cmp(str(a.created) || '9999', str(b.created) || '9999') || cmp(str(a.donor_id), str(b.donor_id)))[0];
    const f = rules.map((rule) => finding(rule, ({ same_email: `Records ${shown} share an e-mail address.`, same_phone: `Records ${shown} share a phone number.`, same_name: `Records ${shown} have the same name (${names.slice(0, 3).join(' / ')}).`, similar_name: `Records ${shown} have names that differ by a letter or two in one word (${names.slice(0, 3).join(' / ')}) in the same postal code.`, same_name_other_postal: `Records ${shown} have the same name (${names.slice(0, 3).join(' / ')}) in different postal codes: one donor who moved, or two donors (or two chapters) with one name.`, same_address: `Records ${shown} share a street address.` })[rule]));
    items.push({ group: ids[0], records: shown, record_count: ids.length, names: names.slice(0, 5).join(' / '), rules: rules.join(' '), keep_suggestion: str(oldest.donor_id), gifts: g.n, gift_amount: g.amount, kind: rules.every((x) => x === 'same_address') ? 'household' : 'duplicate', status: statusOf(f, LEVELS), findings: f });
  }
  return { items, totals: { records: recs.length, groups: items.length, likely_duplicates: items.filter((i) => i.status === 'flag').length, to_review: items.filter((i) => i.status === 'review').length, households: items.filter((i) => i.kind === 'household').length, extra_records: items.filter((i) => i.kind === 'duplicate').reduce((t, i) => t + i.record_count - 1, 0) }, extra: {} };
}
