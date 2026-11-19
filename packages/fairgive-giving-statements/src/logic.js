// Year-end giving statements. Each giver's contributions dated in the statement year are
// totalled by fund for the statement; refunded gifts are left out and listed, gifts with
// no date and loose offering with no giver are listed apart, and a giver with no address
// cannot be mailed a statement.
import { str, num, round2, isoDate, finding, statusOf, cmp, nameKey } from 'fairgive-core';

export const DEFAULTS = Object.freeze({ year: null, organization: '', intangible_religious_benefits: true });
const LEVELS = { giver_missing_address: 'flag', refund_excluded: 'review', gift_no_date: 'review', unattributed: 'watch' };
const REFUND = /refund|revers|void|returned|nsf|charge ?back/i;

export function statements({ contributions = [], givers = [] }, s = DEFAULTS) {
  const year = Number(s.year) || Math.max(...contributions.map((c) => Number((isoDate(c.date) || '').slice(0, 4)) || 0), 0) || null;
  const A = new Map(); for (const g of givers) if (str(g.giver_id)) A.set(nameKey(g.giver_id), { giver: str(g.giver), address: str(g.address) });
  const G = new Map(); let loose = 0, looseN = 0;
  for (const c of contributions) {
    const id = str(c.giver_id); const d = isoDate(c.date); const a = num(c.amount) || 0;
    if (!id) { if (d && Number(d.slice(0, 4)) === year) { loose = round2(loose + a); looseN++; } continue; }
    const e = G.get(nameKey(id)) || { giver_id: id, giver: str(c.giver), total: 0, gifts: [], refunds: [], undated: [], byFund: new Map() }; G.set(nameKey(id), e);
    if (!d) { e.undated.push({ id: str(c.gift_id), amount: a }); continue; }
    if (Number(d.slice(0, 4)) !== year) continue;
    if (REFUND.test(str(c.status))) { e.refunds.push({ id: str(c.gift_id), amount: a, date: d }); continue; }
    e.total = round2(e.total + a); e.gifts.push({ id: str(c.gift_id), date: d, amount: a, fund: str(c.fund) || 'General', method: str(c.method) });
    e.byFund.set(str(c.fund) || 'General', round2((e.byFund.get(str(c.fund) || 'General') || 0) + a));
  }
  const items = [];
  for (const e of [...G.values()].sort((a, b) => cmp(a.giver_id, b.giver_id))) {
    const ad = A.get(nameKey(e.giver_id)); const address = ad ? ad.address : ''; const f = [];
    if (!e.gifts.length && !e.undated.length && !e.refunds.length) continue;
    if (!address) f.push(finding('giver_missing_address', `Giver ${e.giver_id} gave ${e.total} in ${year} and has no mailing address for the statement.`, e.total));
    for (const r of e.refunds) f.push(finding('refund_excluded', `Gift ${r.id} (${r.amount}, ${r.date}) was refunded and is left out of the statement.`, r.amount));
    for (const u of e.undated) f.push(finding('gift_no_date', `Gift ${u.id} (${u.amount}) has no date, so it is not on any year's statement.`, u.amount));
    items.push({ giver_id: e.giver_id, giver: e.giver || (ad && ad.giver) || '', address, gifts: e.gifts.length, total: e.total, by_fund: [...e.byFund.entries()].sort().map(([k, v]) => `${k} ${v}`).join('; '), lines: e.gifts.sort((a, b) => cmp(a.date, b.date) || cmp(a.id, b.id)), status: statusOf(f, LEVELS), findings: f });
  }
  if (looseN) { const f = [finding('unattributed', `${looseN} contribution(s) totalling ${loose} in ${year} have no giver (loose offering) and are not on any statement.`, loose)]; items.push({ giver_id: 'Unattributed', giver: '', address: '', gifts: looseN, total: loose, by_fund: '', lines: [], status: statusOf(f, LEVELS), findings: f }); }
  const named = items.filter((i) => i.giver_id !== 'Unattributed');
  return { items, totals: { year, givers: named.length, statement_total: round2(named.reduce((t, i) => t + i.total, 0)), unattributed: round2(loose), refunds_excluded: round2(items.reduce((t, i) => t + i.findings.filter((x) => x.code === 'refund_excluded').reduce((u, x) => u + x.amount, 0), 0)), missing_address: items.filter((i) => i.findings.some((x) => x.code === 'giver_missing_address')).length }, extra: {} };
}
