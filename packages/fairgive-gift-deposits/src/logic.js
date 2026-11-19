// Gifts in the CRM against bank deposits against the general ledger.
// 1. Cash gifts are grouped by gift batch (a gift with no batch stands alone). A batch is
//    matched to the deposit that names the same batch, then any batch or gift left is
//    matched to a deposit of the same amount within `days` of the gift date.
// 2. A deposit nothing matched is a deposit with no gift in the CRM.
// 3. Contribution revenue in the ledger (credits to the revenue accounts) is compared with
//    the CRM total month by month, noncash gifts included.
import { str, num, round2, isoDate, daysBetween, addDays, monthOf, pairByAmountDate, glAmount, finding, statusOf, cmp, nameKey } from 'fairgive-core';

export const DEFAULTS = Object.freeze({ days: 5, tolerance: 0.01, noncash_types: ['Stock', 'Securities', 'In-Kind', 'Gift in kind', 'Noncash', 'Property'], revenue_accounts: ['4'], ignore_deposit_words: [] });
const LEVELS = { not_deposited: 'flag', batch_total_mismatch: 'flag', deposit_not_in_crm: 'review', gl_differs: 'review', in_transit: 'watch', no_gift_date: 'review' };

export function reconcile({ gifts = [], deposits = [], gl = [] }, s = DEFAULTS) {
  const tol = Number(s.tolerance ?? 0.01);
  const noncash = new Set((s.noncash_types || []).map(nameKey));
  const isNoncash = (g) => noncash.has(nameKey(g.gift_type)) || noncash.has(nameKey(g.method));
  const cash = gifts.filter((g) => str(g.gift_id) && !isNoncash(g));
  const ignored = (d) => (s.ignore_deposit_words || []).some((w) => str(w) && nameKey(d.description).includes(nameKey(w)));
  const deps = deposits.filter((d) => num(d.amount) !== null && !ignored(d)).map((d, i) => ({ ...d, id: str(d.deposit_id) || `${isoDate(d.date) || 'no date'} ${num(d.amount)}#${i}`, amount: num(d.amount) }));
  const lastDeposit = deps.map((d) => isoDate(d.date)).filter(Boolean).sort().pop() || null;

  // Groups: one per batch, one per unbatched gift.
  const groups = new Map();
  for (const g of cash) {
    const k = str(g.batch) ? `Batch ${str(g.batch)}` : `Gift ${str(g.gift_id)}`;
    const e = groups.get(k) || { item: k, batch: str(g.batch) || null, gifts: [], total: 0, date: null, donor: null };
    e.gifts.push(str(g.gift_id)); e.total = round2(e.total + (num(g.amount) || 0));
    const d = isoDate(g.gift_date); if (d && (!e.date || d > e.date)) e.date = d;
    if (!e.batch) e.donor = str(g.donor) || null;
    groups.set(k, e);
  }
  for (const e of groups.values()) e.gifts.sort(cmp);
  const used = new Set(); const items = [];
  const byBatch = new Map(); for (const d of deps) if (str(d.batch)) { const k = nameKey(d.batch); if (!byBatch.has(k)) byBatch.set(k, []); byBatch.get(k).push(d); }
  const open = [];
  for (const e of [...groups.values()].sort((a, b) => cmp(a.item, b.item))) {
    const cand = e.batch ? (byBatch.get(nameKey(e.batch)) || []).filter((d) => !used.has(d)) : [];
    if (cand.length) { const d = cand.sort((a, b) => cmp(a.id, b.id))[0]; used.add(d); e.deposit = d; } else open.push(e);
  }
  const rest = deps.filter((d) => !used.has(d) && !str(d.batch));
  const p = pairByAmountDate(open, rest, { amount: (x) => x.total ?? x.amount, date: (x) => x.date, id: (x) => x.item || x.id, days: Number(s.days ?? 5), tol });
  for (const [e, d] of p.pairs) { used.add(d); e.deposit = d; }
  // Several unbatched gifts deposited together: a deposit equal to the sum of every
  // unmatched unbatched gift dated in the window before it.
  const loose = p.left.filter((e) => !e.batch && e.date).sort((a, b) => cmp(a.date, b.date) || cmp(a.item, b.item));
  const firstOnOrAfter = (d) => { let lo = 0, hi = loose.length; while (lo < hi) { const mid = (lo + hi) >> 1; if (loose[mid].date < d) lo = mid + 1; else hi = mid; } return lo; };
  for (const d of p.right.filter((x) => !used.has(x) && isoDate(x.date)).sort((a, b) => cmp(isoDate(a.date), isoDate(b.date)) || cmp(a.id, b.id))) {
    // Only the gifts dated inside the window are looked at (binary search on the sorted dates), so a
    // file of 10,000 gifts and deposits is not compared pair by pair.
    const end = isoDate(d.date); const start = addDays(end, -Number(s.days ?? 5)); const win = [];
    for (let i = firstOnOrAfter(start); i < loose.length && loose[i].date <= end; i++) if (!loose[i].deposit) win.push(loose[i]);
    if (win.length > 1 && Math.abs(round2(win.reduce((t, e) => t + e.total, 0)) - d.amount) <= tol) { used.add(d); for (const e of win) { e.deposit = d; e.shared = true; } }
  }
  for (const e of groups.values()) {
    const f = [];
    const d = e.deposit;
    if (d) {
      if (!e.shared && Math.abs(d.amount - e.total) > tol) f.push(finding('batch_total_mismatch', `${e.item}: gifts total ${e.total}, deposit ${d.id} on ${isoDate(d.date) || 'no date'} is ${d.amount} (difference ${round2(d.amount - e.total)}).`, d.amount - e.total));
    } else if (!e.date) f.push(finding('no_gift_date', `${e.item} has no gift date, so it cannot be matched to a deposit by date.`, e.total));
    else if (lastDeposit && daysBetween(e.date, lastDeposit) !== null && daysBetween(e.date, lastDeposit) < Number(s.days ?? 5)) f.push(finding('in_transit', `${e.item} (${e.total}, ${e.date}) is newer than the deposit window before the last deposit in the file (${lastDeposit}); it may still be on its way.`, e.total));
    else f.push(finding('not_deposited', `${e.item} (${e.total}, gifts ${e.gifts.join(', ')}, latest ${e.date}) matches no deposit by batch or by amount within ${s.days} days.`, e.total));
    items.push({ item: e.item, kind: 'gifts', date: e.date, gifts: e.gifts.join(' '), ...(e.donor ? { donor: e.donor } : {}), crm_amount: e.total, deposit: d ? d.id : null, deposit_amount: d ? d.amount : null, ...(e.shared ? { deposit_shared: true } : {}), status: statusOf(f, LEVELS), findings: f });
  }
  for (const d of deps.filter((x) => !used.has(x))) {
    const f = [finding('deposit_not_in_crm', `Deposit ${d.id} on ${isoDate(d.date) || 'no date'} for ${d.amount} (${str(d.description) || 'no description'}) matches no gift or batch in the CRM.`, d.amount)];
    items.push({ item: `Deposit ${d.id}`, kind: 'deposit', date: isoDate(d.date), gifts: '', crm_amount: null, deposit: d.id, deposit_amount: d.amount, status: statusOf(f, LEVELS), findings: f });
  }
  // Ledger by month.
  let glGap = 0;
  if (gl.length) {
    const revenue = (a) => (s.revenue_accounts || []).some((p2) => str(a).startsWith(str(p2)));
    const glM = new Map(); const crmM = new Map();
    for (const r of gl) { if (!revenue(r.account)) continue; const m = monthOf(r.date) || 'no date'; glM.set(m, round2((glM.get(m) || 0) - glAmount(r, num))); }
    for (const g of gifts) { if (!str(g.gift_id)) continue; const m = monthOf(g.gift_date) || 'no date'; crmM.set(m, round2((crmM.get(m) || 0) + (num(g.amount) || 0))); }
    for (const m of [...new Set([...glM.keys(), ...crmM.keys()])].sort()) {
      const a = crmM.get(m) || 0, b = glM.get(m) || 0; const f = [];
      if (Math.abs(a - b) > tol) { f.push(finding('gl_differs', `${m}: the CRM has ${round2(a)} of gifts, the ledger has ${round2(b)} of contribution revenue (difference ${round2(b - a)}).`, b - a)); glGap = round2(glGap + Math.abs(b - a)); }
      items.push({ item: `Month ${m}`, kind: 'month', date: m, gifts: '', crm_amount: round2(a), gl_amount: round2(b), deposit: null, deposit_amount: null, status: statusOf(f, LEVELS), findings: f });
    }
  }
  const amt = (code) => round2(items.reduce((t, i) => t + i.findings.filter((x) => x.code === code).reduce((u, x) => u + Math.abs(x.amount || 0), 0), 0));
  return {
    items,
    totals: { gifts: cash.length, crm_cash_total: round2(cash.reduce((t, g) => t + (num(g.amount) || 0), 0)), noncash_gifts: gifts.filter((g) => str(g.gift_id) && isNoncash(g)).length, deposits: deps.length, deposit_total: round2(deps.reduce((t, d) => t + d.amount, 0)), not_deposited: amt('not_deposited'), deposit_short_or_over: amt('batch_total_mismatch'), deposits_not_in_crm: amt('deposit_not_in_crm'), in_transit: amt('in_transit'), gl_gap: glGap },
    extra: { last_deposit: lastDeposit },
  };
}
