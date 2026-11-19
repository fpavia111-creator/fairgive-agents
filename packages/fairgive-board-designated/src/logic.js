// Board-designated funds against the board's resolutions. Designations (transfers into
// the fund) and spending need a resolution; a release the board voted should be booked;
// a board fund is unrestricted, so donor-restricted net asset accounts do not belong in
// it; and the board cannot designate more than the unrestricted net assets it has.
import { str, num, round2, isoDate, glAmount, finding, statusOf, cmp, nameKey } from 'fairgive-core';

export const DEFAULTS = Object.freeze({ transfer_accounts: [], expense_from: '5', net_asset_accounts: {}, unrestricted_net_assets: null, tolerance: 0.01 });
const LEVELS = { spending_without_resolution: 'flag', designation_without_resolution: 'flag', balance_below_zero: 'flag', designations_over_unrestricted: 'flag', reported_as_donor_restricted: 'review', undesignation_not_recorded: 'review' };

export function boardDesignated({ funds = [], resolutions = [], gl = [] }, s = DEFAULTS) {
  const tol = Number(s.tolerance ?? 0.01);
  const isT = (a) => (s.transfer_accounts || []).some((p) => str(p) && str(a).startsWith(str(p)));
  const withAccts = Object.entries(s.net_asset_accounts || {}).filter(([, c]) => c === 'with').map(([a]) => str(a));
  const isWith = (a) => withAccts.some((p) => str(a).startsWith(p));
  const isExp = (a) => str(a) >= str(s.expense_from || '5');
  const F = new Map(); for (const f of funds) if (str(f.fund)) F.set(nameKey(f.fund), { fund: str(f.fund), name: str(f.fund_name), target: num(f.designated_amount), bal: 0, inT: 0, outT: 0, spent: 0, withAmt: 0, res: { designate: 0, undesignate: 0, spend: 0 } });
  for (const r of resolutions) { const f = F.get(nameKey(r.fund)); if (!f) continue; const a = str(r.action).toLowerCase(); const k = /undesig|release|remove/.test(a) ? 'undesignate' : /spend|use|approve/.test(a) ? 'spend' : /desig|transfer|set/.test(a) ? 'designate' : null; if (k) f.res[k] = round2(f.res[k] + (num(r.amount) || 0)); }
  for (const l of gl) { const f = F.get(nameKey(l.fund)); if (!f) continue; const a = glAmount(l, num); if (str(l.account) < '3') continue;
    f.bal = round2(f.bal - a); if (isT(l.account)) { if (a < 0) f.inT = round2(f.inT - a); else f.outT = round2(f.outT + a); } else if (isExp(l.account)) f.spent = round2(f.spent + a); else if (isWith(l.account)) f.withAmt = round2(f.withAmt - a); }
  const items = []; let total = 0;
  for (const f of [...F.values()].sort((a, b) => cmp(a.fund, b.fund))) {
    const out = [];
    if (f.inT - f.res.designate > tol) out.push(finding('designation_without_resolution', `${f.fund}: ${f.inT} was moved into the fund; resolutions approve ${f.res.designate}.`, f.inT - f.res.designate));
    if (f.spent - f.res.spend > tol) out.push(finding('spending_without_resolution', `${f.fund}: ${f.spent} spent from the fund; resolutions approve ${f.res.spend} of spending.`, f.spent - f.res.spend));
    if (f.res.undesignate - f.outT > tol) out.push(finding('undesignation_not_recorded', `${f.fund}: the board released ${f.res.undesignate}; ${f.outT} has been moved out in the ledger.`, f.res.undesignate - f.outT));
    if (f.withAmt > tol) out.push(finding('reported_as_donor_restricted', `${f.fund}: ${f.withAmt} sits in a donor-restricted net asset account, but a board-designated fund is without donor restrictions.`, f.withAmt));
    if (f.bal < -tol) out.push(finding('balance_below_zero', `${f.fund} is ${f.bal}.`, f.bal));
    total = round2(total + f.bal);
    items.push({ fund: f.fund, fund_name: f.name, balance: f.bal, designated_in: f.inT, spent: f.spent, approved_designations: f.res.designate, approved_spending: f.res.spend, status: statusOf(out, LEVELS), findings: out });
  }
  const un = num(s.unrestricted_net_assets);
  if (un !== null) { const out = total - un > tol ? [finding('designations_over_unrestricted', `Board-designated balances total ${total}, more than the ${un} of unrestricted net assets in the settings.`, total - un)] : []; items.push({ fund: 'All designated funds', fund_name: '', balance: total, designated_in: null, spent: null, approved_designations: null, approved_spending: null, status: statusOf(out, LEVELS), findings: out }); }
  return { items, totals: { funds: F.size, designated_total: total, unrestricted_net_assets: un, spending_without_resolution: round2(items.reduce((t, i) => t + i.findings.filter((x) => x.code === 'spending_without_resolution').reduce((u, x) => u + x.amount, 0), 0)) }, extra: {} };
}
