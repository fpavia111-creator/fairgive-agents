// Gift coding against donor intent. A gift's note that names the words of a restricted
// fund should be coded to that fund; a note that says the gift is designated, with no fund
// matching, needs a person; gifts to inactive or unknown funds, and gifts whose appeal has
// another default fund, are listed. Nothing is changed in the CRM.
import { str, num, round2, isoDate, restrictionOf, yes, finding, statusOf, cmp, nameKey } from 'fairgive-core';

export const DEFAULTS = Object.freeze({ restriction_words: ['designated for', 'restricted to', 'only for', 'in support of the'] });
const LEVELS = { memo_names_restricted_purpose: 'flag', fund_inactive: 'review', unknown_fund: 'review', memo_says_restricted: 'review', appeal_fund_mismatch: 'watch' };

export function giftCoding({ gifts = [], funds = [], appeals = [] }, s = DEFAULTS) {
  const F = new Map(); for (const f of funds) if (str(f.fund)) F.set(nameKey(f.fund), { fund: str(f.fund), name: str(f.fund_name), r: restrictionOf(f.restriction), active: yes(f.active) !== false, words: str(f.keywords).split(/[;|,]/).map((w) => nameKey(w)).filter(Boolean) });
  const byName = new Map(); for (const f of F.values()) if (f.name) byName.set(nameKey(f.name), f);
  const A = new Map(); for (const a of appeals) if (str(a.appeal)) A.set(nameKey(a.appeal), str(a.default_fund));
  const restricted = [...F.values()].filter((f) => f.r.cls === 'with' && f.words.length);
  const rwords = (s.restriction_words || []).map((w) => nameKey(w)).filter(Boolean);
  const items = [];
  for (const g of gifts) {
    if (!str(g.gift_id)) continue;
    const f = []; const code = F.get(nameKey(g.fund)) || byName.get(nameKey(g.fund)); const memo = ` ${nameKey(g.memo)} `; const amount = num(g.amount) || 0;
    if (!code) f.push(finding('unknown_fund', `Gift ${str(g.gift_id)} is coded to "${str(g.fund)}", which is not in the fund list.`, amount));
    else if (!code.active) f.push(finding('fund_inactive', `Gift ${str(g.gift_id)} is coded to ${code.fund}, which is marked inactive.`, amount));
    const named = restricted.filter((r) => r.words.some((w) => memo.includes(` ${w} `) || (w.includes(' ') && memo.includes(w))));
    const hit = named.find((r) => !code || r.fund !== code.fund);
    if (hit && !(code && named.some((r) => r.fund === code.fund))) f.push(finding('memo_names_restricted_purpose', `Gift ${str(g.gift_id)} (${amount}) says "${str(g.memo)}", which names ${hit.fund} (${hit.name}), but it is coded to ${code ? code.fund : str(g.fund)}.`, amount));
    else if (!named.length && rwords.some((w) => memo.includes(w)) && (!code || code.r.cls !== 'with')) f.push(finding('memo_says_restricted', `Gift ${str(g.gift_id)} (${amount}) says "${str(g.memo)}" but is coded to ${code ? code.fund : str(g.fund)}, which is not restricted, and no fund matches the purpose.`, amount));
    const def = A.get(nameKey(g.appeal));
    // A note that names the fund the gift is coded to is the donor's intent; the appeal default does not override it.
    if (def && code && nameKey(def) !== nameKey(code.fund) && !named.some((r) => r.fund === code.fund)) f.push(finding('appeal_fund_mismatch', `Gift ${str(g.gift_id)} came from appeal ${str(g.appeal)}, whose default fund is ${def}, and is coded to ${code.fund}.`, amount));
    items.push({ gift_id: str(g.gift_id), donor: str(g.donor), gift_date: isoDate(g.gift_date), amount, fund: code ? code.fund : str(g.fund), appeal: str(g.appeal), memo: str(g.memo), suggested_fund: hit ? hit.fund : def && code && nameKey(def) !== nameKey(code.fund) ? def : '', status: statusOf(f, LEVELS), findings: f });
  }
  return { items, totals: { gifts: items.length, amount: round2(items.reduce((t, i) => t + i.amount, 0)), likely_miscoded: items.filter((i) => i.status === 'flag').length, likely_miscoded_amount: round2(items.filter((i) => i.status === 'flag').reduce((t, i) => t + i.amount, 0)), to_review: items.filter((i) => i.status === 'review').length }, extra: {} };
}
