// Grant budget against actual, with shared costs split across grants.
// Direct expenses carry a grant code. Pooled expenses (a pool code, no grant) are split by
// the allocation table; a pool whose shares do not add up to 100% is listed on its own.
// Each grant line is compared with its budget (over within the flexibility percentage is
// watched, beyond it flagged); costs dated outside the award period, words the settings
// name as unallowable, lines with no budget and spending over the award are listed.
import { str, num, round2, isoDate, inWindow, finding, statusOf, cmp, nameKey } from 'fairgive-core';

export const DEFAULTS = Object.freeze({ flexibility_pct: 10, unallowable_words: ['alcohol', 'wine', 'beer', 'liquor', 'lobbying', 'entertainment', 'penalties', 'fines', 'bad debt'], tolerance: 0.01 });
const LEVELS = { line_over_budget: 'flag', outside_period: 'flag', unallowable_cost: 'flag', over_award: 'flag', allocation_over_100: 'flag', no_budget_line: 'review', unknown_grant: 'review', unknown_pool: 'review', line_over_small: 'watch', allocation_under_100: 'watch' };

export function grantBudgets({ grants = [], budget = [], expenses = [], allocations = [] }, s = DEFAULTS) {
  const tol = Number(s.tolerance ?? 0.01);
  const G = new Map(); for (const g of grants) if (str(g.grant)) G.set(nameKey(g.grant), { grant: str(g.grant), start: isoDate(g.award_start), end: isoDate(g.award_end), award: num(g.award_amount) });
  // One share per pool and grant: a table that lists the same grant twice for a pool adds the
  // percentages (and the pool total then shows over 100%), instead of splitting each cost twice.
  const pools = new Map(); for (const a of allocations) { const k = nameKey(a.pool); if (!k) continue; if (!pools.has(k)) pools.set(k, { pool: str(a.pool), byGrant: new Map() }); const m = pools.get(k).byGrant; const g = nameKey(a.grant); const e = m.get(g) || { grant: str(a.grant), pct: 0 }; e.pct = round2(e.pct + (num(a.pct) || 0)); m.set(g, e); }
  for (const p of pools.values()) p.shares = [...p.byGrant.values()].sort((x, y) => cmp(x.grant, y.grant));
  const words = (s.unallowable_words || []).map((w) => str(w).toLowerCase()).filter(Boolean);
  const wordRes = words.map((w) => [w, new RegExp(`\\b${w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i')]);
  const bad = (text) => (wordRes.find(([, re]) => re.test(text)) || [])[0];
  const lines = new Map();
  const lineOf = (grant, line) => { const k = `${nameKey(grant)}|${nameKey(line)}`; if (!lines.has(k)) lines.set(k, { grant: str(grant), line: str(line) || '(no line)', budget: null, actual: 0, outside: 0, unallowable: [], from_pools: 0 }); return lines.get(k); };
  for (const b of budget) if (str(b.grant)) { const e = lineOf(b.grant, b.line); e.budget = round2((e.budget || 0) + (num(b.budget_amount) || 0)); }
  const charge = (grant, x, amount, viaPool) => {
    const e = lineOf(grant, x.line); e.actual = round2(e.actual + amount); if (viaPool) e.from_pools = round2(e.from_pools + amount);
    const g = G.get(nameKey(grant)); const d = isoDate(x.date);
    if (g && d && (g.start || g.end) && !inWindow(d, g.start, g.end)) e.outside = round2(e.outside + amount);
    const w = bad(`${str(x.memo)} ${str(x.line)}`); if (w) e.unallowable.push({ entry: str(x.entry_id), word: w, amount: round2(amount) });
  };
  const unknownPool = new Map();
  for (const x of expenses) {
    const amount = num(x.amount) || 0; if (!amount) continue;
    if (str(x.grant)) charge(x.grant, x, amount, false);
    else if (str(x.pool)) { const p = pools.get(nameKey(x.pool)); if (!p) { unknownPool.set(nameKey(x.pool), { pool: str(x.pool), amount: round2((unknownPool.get(nameKey(x.pool))?.amount || 0) + amount) }); continue; } for (const sh of p.shares) charge(sh.grant, x, round2((amount * sh.pct) / 100), true); p.total = round2((p.total || 0) + amount); }
  }
  const items = []; const flex = Number(s.flexibility_pct ?? 10);
  for (const e of [...lines.values()].sort((a, b) => cmp(a.grant, b.grant) || cmp(a.line, b.line))) {
    const f = []; const g = G.get(nameKey(e.grant));
    if (!g) f.push(finding('unknown_grant', `${e.grant} is not in the grant list, so its period and award are unknown.`, e.actual));
    if (e.budget === null && e.actual) f.push(finding('no_budget_line', `${e.grant} / ${e.line}: ${e.actual} spent and no budget line.`, e.actual));
    else if (e.budget !== null && e.actual - e.budget > tol) { const over = round2(e.actual - e.budget); const p = e.budget ? round2((over / e.budget) * 100) : 100;
      f.push(finding(p > flex ? 'line_over_budget' : 'line_over_small', `${e.grant} / ${e.line}: actual ${e.actual} against budget ${e.budget}, over by ${over} (${p}%; flexibility ${flex}%).`, over)); }
    if (e.outside > tol) f.push(finding('outside_period', `${e.grant} / ${e.line}: ${e.outside} is dated outside the award period ${g ? `${g.start || '?'} to ${g.end || '?'}` : ''}.`, e.outside));
    for (const u of e.unallowable.sort((a, b) => cmp(a.entry, b.entry))) f.push(finding('unallowable_cost', `${e.grant} / ${e.line}: entry ${u.entry} (${u.amount}) mentions "${u.word}", which the settings list as unallowable.`, u.amount));
    items.push({ item: `${e.grant} / ${e.line}`, grant: e.grant, line: e.line, budget: e.budget, actual: e.actual, from_pools: e.from_pools, remaining: e.budget === null ? null : round2(e.budget - e.actual), status: statusOf(f, LEVELS), findings: f });
  }
  const spentBy = new Map(); for (const e of lines.values()) spentBy.set(nameKey(e.grant), round2((spentBy.get(nameKey(e.grant)) || 0) + e.actual));
  for (const g of [...G.values()].sort((a, b) => cmp(a.grant, b.grant))) {
    const spent = spentBy.get(nameKey(g.grant)) || 0;
    if (g.award !== null && spent - g.award > tol) { const f = [finding('over_award', `${g.grant}: ${spent} charged against an award of ${g.award}.`, spent - g.award)]; items.push({ item: `${g.grant} / total`, grant: g.grant, line: 'total', budget: g.award, actual: spent, from_pools: null, remaining: round2(g.award - spent), status: statusOf(f, LEVELS), findings: f }); }
  }
  for (const p of [...pools.values()].sort((a, b) => cmp(a.pool, b.pool))) {
    const total = round2(p.shares.reduce((t, x) => t + x.pct, 0)); const f = [];
    if (total - 100 > tol) f.push(finding('allocation_over_100', `Pool ${p.pool} is split ${total}% across grants: ${round2(((total - 100) / 100) * (p.total || 0))} more than the cost was charged.`, ((total - 100) / 100) * (p.total || 0)));
    else if (100 - total > tol) f.push(finding('allocation_under_100', `Pool ${p.pool} is split ${total}% across grants; ${round2(((100 - total) / 100) * (p.total || 0))} stays unallocated.`, ((100 - total) / 100) * (p.total || 0)));
    items.push({ item: `Pool ${p.pool}`, grant: p.shares.map((x) => `${x.grant} ${x.pct}%`).join(', '), line: 'allocation', budget: null, actual: p.total || 0, from_pools: null, remaining: null, status: statusOf(f, LEVELS), findings: f });
  }
  for (const u of [...unknownPool.values()].sort((a, b) => cmp(a.pool, b.pool))) { const f = [finding('unknown_pool', `Pool ${u.pool} has ${u.amount} of cost and no allocation table.`, u.amount)]; items.push({ item: `Pool ${u.pool}`, grant: '', line: 'allocation', budget: null, actual: u.amount, from_pools: null, remaining: null, status: statusOf(f, LEVELS), findings: f }); }
  const sumCodes = (codes) => round2(items.reduce((t, i) => t + i.findings.filter((x) => codes.includes(x.code)).reduce((u, x) => u + Math.abs(x.amount || 0), 0), 0));
  return { items, totals: { grants: G.size, budget_total: round2([...lines.values()].reduce((t, e) => t + (e.budget || 0), 0)), actual_total: round2([...lines.values()].reduce((t, e) => t + e.actual, 0)), over_budget: sumCodes(['line_over_budget', 'line_over_small']), outside_period: sumCodes(['outside_period']), unallowable: sumCodes(['unallowable_cost']), no_budget: sumCodes(['no_budget_line']) }, extra: {} };
}
