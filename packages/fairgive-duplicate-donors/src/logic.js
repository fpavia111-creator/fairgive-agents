// Duplicate donor records. Records are linked by exact keys (e-mail without +tags, the last
// ten digits of the phone, the order-free name, the street address with common words
// shortened plus the postal code) and by similar names within one postal code, then grouped
// with union-find, so a file of any size is one pass and every group is listed once.
// A group linked only by its address is a household to look at, not a duplicate.
import { str, num, round2, normEmail, normPhone, normPostal, nameTokens, personSimilarity, finding, statusOf, cmp } from 'fairgive-core';

export const DEFAULTS = Object.freeze({ name_similarity: 0.92, shared_emails: [], max_ids_shown: 12 });
const LEVELS = { same_email: 'flag', same_phone: 'flag', same_name: 'review', similar_name: 'review', same_address: 'watch' };
const STREET = [[/\bstreet\b/g, 'st'], [/\bavenue\b/g, 'ave'], [/\broad\b/g, 'rd'], [/\blane\b/g, 'ln'], [/\bdrive\b/g, 'dr'], [/\bcourt\b/g, 'ct'], [/\bplace\b/g, 'pl'], [/\bboulevard\b/g, 'blvd'], [/\bapartment\b|\bapt\b|\bunit\b|#/g, ' ']];
export const addressKey = (a) => { let s = str(a).toLowerCase().replace(/[.,]/g, ' '); for (const [re, w] of STREET) s = s.replace(re, w); return s.replace(/\s+/g, ' ').trim(); };

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
  index('same_name', (r) => { const n = nameTokens(r.donor); return n && n.includes(' ') ? n : ''; });
  index('same_address', (r) => { const a = addressKey(r.address); return a ? `${a}|${normPostal(r.postal)}` : ''; });
  // Similar names: distinct name keys within one postal code.
  const byPostal = new Map();
  for (const r of recs) { const p = normPostal(r.postal); const n = nameTokens(r.donor); if (!p || !n) continue; if (!byPostal.has(p)) byPostal.set(p, new Map()); const m = byPostal.get(p); if (!m.has(n)) m.set(n, str(r.donor_id)); }
  const limit = Number(s.name_similarity ?? 0.92);
  for (const m of byPostal.values()) { const keys = [...m.keys()].sort(); if (keys.length > 200) continue; for (let i = 0; i < keys.length; i++) for (let j = i + 1; j < keys.length; j++) if (personSimilarity(keys[i], keys[j]) >= limit) { union(m.get(keys[i]), m.get(keys[j])); links.push([m.get(keys[i]), m.get(keys[j]), 'similar_name']); } }
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
    const f = rules.map((rule) => finding(rule, ({ same_email: `Records ${shown} share an e-mail address.`, same_phone: `Records ${shown} share a phone number.`, same_name: `Records ${shown} have the same name (${names.slice(0, 3).join(' / ')}).`, similar_name: `Records ${shown} have names that differ by a letter or two (${names.slice(0, 3).join(' / ')}) in the same postal code.`, same_address: `Records ${shown} share a street address.` })[rule]));
    items.push({ group: ids[0], records: shown, record_count: ids.length, names: names.slice(0, 5).join(' / '), rules: rules.join(' '), keep_suggestion: str(oldest.donor_id), gifts: g.n, gift_amount: g.amount, kind: rules.every((x) => x === 'same_address') ? 'household' : 'duplicate', status: statusOf(f, LEVELS), findings: f });
  }
  return { items, totals: { records: recs.length, groups: items.length, likely_duplicates: items.filter((i) => i.status === 'flag').length, to_review: items.filter((i) => i.status === 'review').length, households: items.filter((i) => i.kind === 'household').length, extra_records: items.filter((i) => i.kind === 'duplicate').reduce((t, i) => t + i.record_count - 1, 0) }, extra: {} };
}
