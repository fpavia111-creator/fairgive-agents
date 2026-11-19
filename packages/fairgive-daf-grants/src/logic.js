// Gifts from donor-advised funds (DAFs). A DAF grant comes from the sponsoring
// organization: it is usually hard-credited to the sponsor and soft-credited to the
// advisor, it should not pay for benefits the advisor receives or settle the advisor's
// own pledge without checking the sponsor's rules, and the advisor took any deduction when
// giving to the fund. These are things for a person to check, not tax advice.
import { str, num, round2, isoDate, yes, finding, statusOf, cmp, nameKey } from 'fairgive-core';

export const DEFAULTS = Object.freeze({ daf_words: ['daf', 'donor advised', 'donor-advised', 'charitable gift fund', 'philanthropic trust', 'community foundation', 'giving account'] });
const LEVELS = { daf_paid_benefit: 'flag', daf_ack_says_deductible: 'flag', daf_hard_credit_to_advisor: 'review', daf_applied_to_pledge: 'review', daf_sponsor_unknown: 'review' };

export function dafGrants({ gifts = [] }, s = DEFAULTS) {
  const words = (s.daf_words || []).map((w) => nameKey(w)).filter(Boolean);
  const isDafText = (v) => { const k = ` ${nameKey(v)} `; return words.some((w) => k.includes(` ${w} `) || (w.includes(' ') && k.includes(w))); };
  const items = [];
  for (const g of gifts) {
    if (!str(g.gift_id)) continue;
    if (!(isDafText(g.method) || str(g.daf_sponsor) || isDafText(g.donor))) continue;
    const amount = num(g.amount) || 0; const sponsor = str(g.daf_sponsor) || (isDafText(g.donor) ? str(g.donor) : ''); const f = [];
    if (!sponsor) f.push(finding('daf_sponsor_unknown', `Gift ${str(g.gift_id)} (${amount}) is marked as a DAF gift but no sponsoring organization is recorded.`, amount));
    if (!isDafText(g.donor) && nameKey(g.donor) !== nameKey(sponsor)) f.push(finding('daf_hard_credit_to_advisor', `Gift ${str(g.gift_id)} is hard-credited to ${str(g.donor) || 'a person'} although it came from ${sponsor || 'a donor-advised fund'}; the sponsor usually gets the hard credit and the advisor a soft credit.`, amount));
    const benefit = num(g.benefit_value); if (benefit && benefit > 0) f.push(finding('daf_paid_benefit', `Gift ${str(g.gift_id)}: ${benefit} of the DAF grant paid for benefits the advisor received. Many sponsors do not allow that; check with ${sponsor || 'the sponsor'} and collect the benefit part from the advisor directly.`, benefit));
    if (str(g.pledge_id)) f.push(finding('daf_applied_to_pledge', `Gift ${str(g.gift_id)} was applied to pledge ${str(g.pledge_id)}. Check the sponsor's rules before a DAF grant settles a personal pledge.`, amount));
    if (yes(g.ack_says_deductible) === true) f.push(finding('daf_ack_says_deductible', `The acknowledgement for gift ${str(g.gift_id)} says it is tax-deductible to the advisor; the advisor took any deduction when giving to the fund. Thank the advisor without a tax statement.`, amount));
    items.push({ gift_id: str(g.gift_id), donor: str(g.donor), sponsor, advisor: str(g.advisor), gift_date: isoDate(g.gift_date), amount, pledge_id: str(g.pledge_id), benefit_value: benefit, status: statusOf(f, LEVELS), findings: f });
  }
  return { items, totals: { daf_gifts: items.length, daf_amount: round2(items.reduce((t, i) => t + i.amount, 0)), sponsors: new Set(items.map((i) => nameKey(i.sponsor)).filter(Boolean)).size, to_review: items.filter((i) => i.status !== 'ok').length }, extra: {} };
}
