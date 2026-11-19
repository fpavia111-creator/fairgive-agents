// Financial assets available for general spending within one year: cash, investments and
// receivables, less amounts with donor restrictions (time restrictions ending within the
// year count as available), less board designations unless the settings include them, less
// receivables due after a year. Months covered = available / (yearly expenses / 12). The
// result is data for the liquidity note; the categories and choices are settings.
import { str, num, round2, yes, restrictionOf, finding, statusOf, cmp, nameKey } from 'fairgive-core';

export const DEFAULTS = Object.freeze({ annual_expenses: null, min_months: 3, include_board_designated: false, financial_categories: ['cash', 'investments', 'receivable', 'pledges receivable', 'grants receivable', 'accounts receivable'] });
const LEVELS = { restricted_marked_available: 'flag', no_category: 'review', low_liquidity: 'watch', board_designated_excluded: 'watch', receivable_beyond_year: 'watch' };

export function liquidity({ balances = [] }, s = DEFAULTS) {
  const cats = (s.financial_categories || []).map(nameKey);
  const isFin = (c) => cats.some((x) => nameKey(c) === x || nameKey(c).includes(x));
  const items = []; const T = { financial: 0, available: 0 };
  for (const b of [...balances].filter((x) => str(x.account)).sort((a, b) => cmp(str(a.account), str(b.account)))) {
    const amt = num(b.balance) || 0; const f = []; let available = 0; let financial = false; const r = restrictionOf(b.restriction); const within = yes(b.available_within_year);
    if (!str(b.category)) f.push(finding('no_category', `Account ${str(b.account)} ${str(b.account_name)} (${amt}) has no category, so it is not counted.`, amt));
    else if (isFin(b.category)) {
      financial = true; T.financial += amt;
      if (r.cls === 'with' && r.sub !== 'time') { if (within === true) f.push(finding('restricted_marked_available', `Account ${str(b.account)} ${str(b.account_name)} (${amt}) is donor-restricted for a purpose but marked available within a year; it is left out until the restriction is met.`, amt)); }
      else if (r.sub === 'board' && !s.include_board_designated) f.push(finding('board_designated_excluded', `Account ${str(b.account)} ${str(b.account_name)} (${amt}) is board designated and left out; the board can undo a designation, so say so in the note.`, amt));
      else if (within === false) { if (/receivable/i.test(str(b.category))) f.push(finding('receivable_beyond_year', `Account ${str(b.account)} ${str(b.account_name)} (${amt}) is due after one year and left out.`, amt)); }
      else available = amt;
    }
    T.available += available;
    items.push({ account: str(b.account), account_name: str(b.account_name), category: str(b.category), restriction: str(b.restriction), balance: amt, financial_asset: financial, available, status: statusOf(f, LEVELS), findings: f });
  }
  const exp = num(s.annual_expenses); const months = exp ? round2(T.available / (exp / 12)) : null;
  if (months !== null) { const f = months < Number(s.min_months ?? 3) ? [finding('low_liquidity', `Available financial assets cover ${months} months of expenses, under the ${s.min_months} months in the settings.`, T.available)] : []; items.push({ account: 'Total available', account_name: '', category: '', restriction: '', balance: round2(T.financial), financial_asset: true, available: round2(T.available), status: statusOf(f, LEVELS), findings: f }); }
  return { items, totals: { accounts: balances.filter((x) => str(x.account)).length, financial_assets: round2(T.financial), available: round2(T.available), months_covered: months }, extra: {} };
}
