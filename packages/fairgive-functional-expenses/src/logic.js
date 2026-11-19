// Functional expenses: every expense line is given a function (program, management and
// general, fundraising) by its own function column, its department in the settings map,
// or the allocation rule for its account or department, and the result is the
// natural-by-function table behind the statement of functional expenses.
import { str, num, round2, glAmount, functionOf, finding, statusOf, cmp, nameKey } from 'fairgive-core';

export const DEFAULTS = Object.freeze({ expense_from: '5', department_functions: {}, fundraising_words: ['gala', 'appeal', 'donor', 'fundraising', 'campaign mailing', 'auction'], tolerance: 0.01 });
const LEVELS = { expense_without_function: 'flag', allocation_not_100: 'flag', fundraising_coded_program: 'review' };
const FN = ['program', 'management', 'fundraising'];

export function functional({ gl = [], rules = [] }, s = DEFAULTS) {
  const tol = Number(s.tolerance ?? 0.01);
  const deptMap = new Map(Object.entries(s.department_functions || {}).map(([k, v]) => [nameKey(k), functionOf(v)]));
  const R = new Map(); for (const r of rules) if (str(r.key)) R.set(nameKey(r.key), { key: str(r.key), pct: { program: num(r.program) || 0, management: num(r.management) || 0, fundraising: num(r.fundraising) || 0 }, basis: str(r.basis) });
  const words = (s.fundraising_words || []).map((w) => str(w).toLowerCase()).filter(Boolean);
  const acc = new Map(); const ruleUse = new Map();
  for (const l of gl) {
    if (!(str(l.account) >= str(s.expense_from || '5'))) continue;
    const a = glAmount(l, num); if (!a) continue;
    const k = str(l.account); const e = acc.get(k) || { account: k, account_name: str(l.account_name), program: 0, management: 0, fundraising: 0, unassigned: 0, f: [] }; acc.set(k, e);
    const fn = functionOf(l.function) || deptMap.get(nameKey(l.program)) || null;
    const rule = !fn ? (R.get(nameKey(l.account)) || R.get(nameKey(l.program))) : null;
    if (fn) {
      e[fn] = round2(e[fn] + a);
      if (fn === 'program') { const w = words.find((x) => new RegExp(`\\b${x.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i').test(str(l.memo))); if (w) e.f.push(finding('fundraising_coded_program', `${str(l.entry_id) || 'A line'} on ${k} ${e.account_name} (${a}, "${str(l.memo)}") is coded to a program but mentions "${w}"; it may be a fundraising cost.`, a)); }
    } else if (rule) {
      let used = 0; for (const x of FN) { const part = round2((a * rule.pct[x]) / 100); e[x] = round2(e[x] + part); used += part; }
      const left = round2(a - used); if (Math.abs(left) > tol) e.unassigned = round2(e.unassigned + left);
      const u = ruleUse.get(rule.key) || { amount: 0, accounts: new Set() }; u.amount = round2(u.amount + a); u.accounts.add(k); ruleUse.set(rule.key, u);
    } else { e.unassigned = round2(e.unassigned + a); e.f.push(finding('expense_without_function', `${str(l.entry_id) || 'A line'} on ${k} ${e.account_name} (${a}) has no function, no department in the settings map and no allocation rule.`, a)); }
  }
  for (const [key, u] of ruleUse) { const r = R.get(nameKey(key)); const total = round2(FN.reduce((t, x) => t + r.pct[x], 0)); if (Math.abs(total - 100) > tol) for (const k of u.accounts) acc.get(k).f.push(finding('allocation_not_100', `Rule ${r.key}${r.basis ? ` (${r.basis})` : ''} splits ${total}% across program, management and fundraising; ${round2((u.amount * (100 - total)) / 100)} is left unassigned.`, (u.amount * (100 - total)) / 100)); }
  const items = [...acc.values()].sort((a, b) => cmp(a.account, b.account)).map((e) => { const total = round2(e.program + e.management + e.fundraising + e.unassigned); return { account: e.account, account_name: e.account_name, program: e.program, management: e.management, fundraising: e.fundraising, unassigned: e.unassigned, total, status: statusOf(e.f, LEVELS), findings: e.f }; });
  const t = (k) => round2(items.reduce((a, i) => a + i[k], 0)); const total = t('total');
  return { items, totals: { total, program: t('program'), management: t('management'), fundraising: t('fundraising'), unassigned: t('unassigned'), program_pct: total ? round2((t('program') / total) * 100) : 0 }, extra: {} };
}
