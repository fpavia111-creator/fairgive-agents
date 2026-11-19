// Grant drawdowns. For each grant: allowable costs inside the award period, draws received
// or requested, and what can still be drawn (costs up to the award, less draws). Draws are
// set against costs oldest first, so costs left uncovered longer than stale_days show how
// long the organization has carried them. Advance grants are checked for cash drawn ahead
// of spending.
import { str, num, round2, isoDate, inWindow, daysBetween, finding, statusOf, cmp, nameKey } from 'fairgive-core';

export const DEFAULTS = Object.freeze({ as_of: null, stale_days: 45, pending_days: 30, organization: '', tolerance: 0.01 });
const LEVELS = { overdrawn: 'flag', draw_over_award: 'flag', stale_unreimbursed: 'flag', excess_cash: 'review', pending_too_long: 'review', costs_outside_period: 'review', unknown_grant: 'review', draw_available: 'watch' };
const RECEIVED = /receiv|paid|deposit|settled|complete/i;

export function drawdowns({ grants = [], expenses = [], draws = [] }, s = DEFAULTS) {
  const tol = Number(s.tolerance ?? 0.01);
  const asOf = isoDate(s.as_of) || [...expenses, ...draws].map((x) => isoDate(x.date)).filter(Boolean).sort().pop() || null;
  const G = new Map(); for (const g of grants) if (str(g.grant)) G.set(nameKey(g.grant), { grant: str(g.grant), funder: str(g.funder), award: num(g.award_amount), start: isoDate(g.award_start), end: isoDate(g.award_end), advance: /advance/i.test(str(g.payment_basis)), costs: [], outside: 0, draws: [] });
  const unknown = new Map();
  for (const x of expenses) { const g = G.get(nameKey(x.grant)); const a = num(x.amount) || 0; if (!a) continue; if (!g) { if (str(x.grant)) unknown.set(nameKey(x.grant), { grant: str(x.grant), amount: round2((unknown.get(nameKey(x.grant))?.amount || 0) + a) }); continue; } const d = isoDate(x.date);
    if (d && (g.start || g.end) && !inWindow(d, g.start, g.end)) g.outside = round2(g.outside + a); else g.costs.push({ date: d, amount: a }); }
  for (const x of draws) { const g = G.get(nameKey(x.grant)); if (!g) continue; g.draws.push({ id: str(x.draw_id), date: isoDate(x.date), amount: num(x.amount) || 0, received: RECEIVED.test(str(x.status)) || !str(x.status) }); }
  const items = []; const T = { spent: 0, drawn: 0, available: 0, stale: 0, overdrawn: 0, excess: 0, pending: 0 };
  for (const g of [...G.values()].sort((a, b) => cmp(a.grant, b.grant))) {
    const f = []; const spent = round2(g.costs.reduce((t, c) => t + c.amount, 0)); const drawn = round2(g.draws.reduce((t, d) => t + d.amount, 0));
    const cap = g.award === null ? spent : Math.min(spent, g.award); const available = round2(cap - drawn);
    if (g.outside > tol) f.push(finding('costs_outside_period', `${g.grant}: ${g.outside} of costs are dated outside the award period ${g.start || '?'} to ${g.end || '?'} and were left out.`, g.outside));
    if (g.award !== null && drawn - g.award > tol) f.push(finding('draw_over_award', `${g.grant}: ${drawn} drawn against an award of ${g.award}.`, drawn - g.award));
    if (!g.advance && drawn - spent > tol) { f.push(finding('overdrawn', `${g.grant}: ${drawn} drawn but only ${spent} of allowable costs; ${round2(drawn - spent)} drawn ahead of costs on a reimbursement grant.`, drawn - spent)); T.overdrawn += drawn - spent; }
    if (g.advance && drawn - spent > tol) { f.push(finding('excess_cash', `${g.grant} (advance): ${round2(drawn - spent)} drawn and not yet spent. Check how long the funder lets you hold advance cash.`, drawn - spent)); T.excess += drawn - spent; }
    if (available > tol) {
      let cover = drawn; let stale = 0;
      for (const c of g.costs.slice().sort((a, b) => cmp(a.date || '', b.date || '') || a.amount - b.amount)) { const covered = Math.min(cover, c.amount); cover -= covered; const left = c.amount - covered; if (left > tol && c.date && asOf && daysBetween(c.date, asOf) > Number(s.stale_days ?? 45)) stale += left; }
      stale = round2(Math.min(stale, available));
      if (stale > tol) { f.push(finding('stale_unreimbursed', `${g.grant}: ${stale} of costs older than ${s.stale_days} days have not been drawn.`, stale)); T.stale += stale; }
      f.push(finding('draw_available', `${g.grant}: ${available} can be drawn (costs ${spent}${g.award !== null && spent > g.award ? `, capped at the award ${g.award}` : ''}, drawn ${drawn}).`, available)); T.available += available;
    }
    for (const d of g.draws.filter((x) => !x.received).sort((a, b) => cmp(a.date || '', b.date || ''))) { const age = d.date && asOf ? daysBetween(d.date, asOf) : null; if (age !== null && age > Number(s.pending_days ?? 30)) { f.push(finding('pending_too_long', `${g.grant}: draw ${d.id || d.date} for ${d.amount} was requested ${age} days ago and is not marked received.`, d.amount)); T.pending += d.amount; } }
    T.spent += spent; T.drawn += drawn;
    items.push({ grant: g.grant, funder: g.funder, basis: g.advance ? 'advance' : 'reimbursement', award: g.award, spent, drawn, available: available > 0 ? available : 0, status: statusOf(f, LEVELS), findings: f });
  }
  for (const u of [...unknown.values()].sort((a, b) => cmp(a.grant, b.grant))) { const f = [finding('unknown_grant', `${u.amount} of costs are coded to ${u.grant}, which is not in the grant list.`, u.amount)]; items.push({ grant: u.grant, funder: '', basis: '', award: null, spent: u.amount, drawn: 0, available: 0, status: statusOf(f, LEVELS), findings: f }); }
  return { items, totals: { grants: G.size, spent: round2(T.spent), drawn: round2(T.drawn), available_to_draw: round2(T.available), stale: round2(T.stale), overdrawn: round2(T.overdrawn), excess_cash: round2(T.excess), pending: round2(T.pending) }, extra: { as_of: asOf } };
}
