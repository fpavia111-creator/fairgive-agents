// Fund balances by restriction class. A fund's balance is the credit balance of its
// activity and net asset accounts (accounts from `activity_from` up, so revenue, expense
// and net asset lines, not cash or receivables). Each fund's class comes from the fund
// list; the net asset account map says which class each net asset account belongs to.
import { str, num, round2, glAmount, restrictionOf, finding, statusOf, cmp, nameKey } from 'fairgive-core';

export const DEFAULTS = Object.freeze({ net_asset_accounts: {}, interfund_accounts: [], activity_from: '3', tolerance: 0.01 });
const LEVELS = { negative_restricted_balance: 'flag', perpetual_below_corpus: 'flag', wrong_net_asset_class: 'flag', interfund_not_zero: 'flag', unknown_fund: 'review', no_restriction_code: 'review', negative_unrestricted_balance: 'watch' };
const CLASS = { without: 'without donor restrictions', with: 'with donor restrictions' };

export function fundBalances({ funds = [], gl = [] }, s = DEFAULTS) {
  const tol = Number(s.tolerance ?? 0.01);
  const list = new Map();
  for (const f of funds) if (str(f.fund)) list.set(nameKey(f.fund), { fund: str(f.fund), name: str(f.fund_name), r: restrictionOf(f.restriction), raw: str(f.restriction), corpus: num(f.corpus) });
  const naMap = Object.entries(s.net_asset_accounts || {}).map(([a, c]) => [str(a), c === 'with' ? 'with' : 'without']);
  const naClass = (acct) => { const hit = naMap.filter(([a]) => str(acct).startsWith(a)).sort((x, y) => y[0].length - x[0].length)[0]; return hit ? hit[1] : null; };
  const inter = (acct) => (s.interfund_accounts || []).some((a) => str(a) && str(acct).startsWith(str(a)));
  const activity = (acct) => str(acct) >= str(s.activity_from ?? '3');
  const bal = new Map(); const wrong = new Map(); const unknown = new Map(); let interfund = 0;
  for (const r of gl) {
    const a = glAmount(r, num); const k = nameKey(r.fund) || '(no fund)';
    if (inter(r.account)) { interfund = round2(interfund + a); continue; }
    if (!activity(r.account)) continue;
    bal.set(k, round2((bal.get(k) || 0) - a));
    const f = list.get(k);
    if (!f) { const u = unknown.get(k) || { fund: str(r.fund) || '(no fund)', amount: 0, lines: 0 }; u.amount = round2(u.amount - a); u.lines++; unknown.set(k, u); continue; }
    const c = naClass(r.account);
    if (c && f.r.cls && c !== f.r.cls) { const w = wrong.get(k) || []; w.push({ account: str(r.account), amount: round2(-a) }); wrong.set(k, w); }
  }
  const items = []; const totals = { without: 0, with: 0, board_designated: 0, perpetual: 0 };
  for (const [k, f] of [...list.entries()].sort((x, y) => cmp(x[0], y[0]))) {
    const b = bal.get(k) || 0; const out = [];
    if (!f.r.cls) out.push(finding('no_restriction_code', `Fund ${f.fund} has ${f.raw ? `restriction "${f.raw}", which is not a known class` : 'no restriction code'}; its balance ${b} is not counted in either class.`, b));
    if (f.r.cls === 'with' && b < -tol) out.push(finding('negative_restricted_balance', `Fund ${f.fund} (${CLASS.with}) is ${b}: more was spent than the restricted gifts it holds.`, b));
    if (f.r.cls === 'without' && f.r.sub !== 'board' && b < -tol) out.push(finding('negative_unrestricted_balance', `Fund ${f.fund} is ${b}.`, b));
    if (f.r.sub === 'perpetual' && f.corpus !== null && b < f.corpus - tol) out.push(finding('perpetual_below_corpus', `Fund ${f.fund} is ${b}, under its corpus (original gift value) of ${f.corpus} by ${round2(f.corpus - b)}.`, b - f.corpus));
    const ws = (wrong.get(k) || []).sort((x, y) => cmp(x.account, y.account) || x.amount - y.amount);
    for (const w of ws) out.push(finding('wrong_net_asset_class', `Fund ${f.fund} is ${f.raw || 'restricted'} but ${w.amount} sits in net asset account ${w.account}, which the settings map to the other class.`, w.amount));
    if (f.r.cls === 'without') { totals.without += b; if (f.r.sub === 'board') totals.board_designated += b; }
    if (f.r.cls === 'with') { totals.with += b; if (f.r.sub === 'perpetual') totals.perpetual += b; }
    items.push({ fund: f.fund, fund_name: f.name, class: f.r.cls ? CLASS[f.r.cls] : 'unknown', kind: f.r.sub || '', balance: b, corpus: f.corpus, status: statusOf(out, LEVELS), findings: out });
  }
  for (const u of [...unknown.values()].sort((x, y) => cmp(x.fund, y.fund))) {
    const out = [finding('unknown_fund', `${u.lines} ledger line(s) use fund ${u.fund}, which is not in the fund list (balance ${u.amount}).`, u.amount)];
    items.push({ fund: u.fund, fund_name: '', class: 'unknown', kind: '', balance: u.amount, corpus: null, status: statusOf(out, LEVELS), findings: out });
  }
  if ((s.interfund_accounts || []).length) {
    const out = Math.abs(interfund) > tol ? [finding('interfund_not_zero', `Due-to and due-from lines across all funds add up to ${interfund}, not zero.`, interfund)] : [];
    items.push({ fund: 'Interfund', fund_name: 'Due to and due from other funds', class: '', kind: 'interfund', balance: interfund, corpus: null, status: statusOf(out, LEVELS), findings: out });
  }
  const sumCode = (c) => round2(items.reduce((t, i) => t + i.findings.filter((x) => x.code === c).reduce((u, x) => u + Math.abs(x.amount || 0), 0), 0));
  return { items, totals: { funds: list.size, without_donor_restrictions: round2(totals.without), board_designated: round2(totals.board_designated), with_donor_restrictions: round2(totals.with), perpetual: round2(totals.perpetual), negative_restricted: sumCode('negative_restricted_balance'), wrong_class: sumCode('wrong_net_asset_class'), interfund_gap: round2(Math.abs(interfund)) }, extra: {} };
}
