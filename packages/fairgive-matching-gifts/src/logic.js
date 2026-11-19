// Matching gifts. For each gift from a donor whose employer has a matching program: the
// match expected (gift x ratio, within the program's minimum gift and yearly maximum per
// donor), the claim deadline (days after the gift), and the claim sent or received.
import { str, num, round2, isoDate, addDays, daysBetween, finding, statusOf, cmp, nameKey } from 'fairgive-core';

export const DEFAULTS = Object.freeze({ as_of: null, soon_days: 30, pending_days: 90, organization: '', tolerance: 0.01 });
const LEVELS = { match_deadline_passed: 'flag', match_deadline_soon: 'flag', match_not_claimed: 'review', match_received_differs: 'review', employer_not_in_list: 'review', claim_pending_long: 'watch' };

export function matching({ gifts = [], employers = [], claims = [] }, s = DEFAULTS) {
  const tol = Number(s.tolerance ?? 0.01);
  const asOf = isoDate(s.as_of) || new Date().toISOString().slice(0, 10);
  const E = new Map(); for (const e of employers) if (str(e.employer)) E.set(nameKey(e.employer), { name: str(e.employer), ratio: num(e.ratio) ?? 1, min: num(e.min_gift) ?? 0, max: num(e.max_per_year), days: num(e.deadline_days) });
  const C = new Map(); for (const c of claims) if (str(c.gift_id)) C.set(nameKey(c.gift_id), c);
  const usedByDonorYear = new Map(); const items = []; const T = { expected: 0, unclaimed: 0, received: 0, lost: 0 };
  const sorted = gifts.filter((g) => str(g.gift_id) && str(g.employer)).sort((a, b) => cmp(isoDate(a.gift_date) || '', isoDate(b.gift_date) || '') || cmp(str(a.gift_id), str(b.gift_id)));
  for (const g of sorted) {
    const amount = num(g.amount) || 0; const e = E.get(nameKey(g.employer)); const d = isoDate(g.gift_date); const f = [];
    if (!e) { f.push(finding('employer_not_in_list', `Gift ${str(g.gift_id)} (${amount}) is from a donor who works at ${str(g.employer)}, which is not in your matching program list. Check whether it matches gifts.`)); items.push({ gift_id: str(g.gift_id), donor_id: str(g.donor_id), donor: str(g.donor), email: str(g.email), employer: str(g.employer), gift_date: d, amount, expected_match: null, deadline: null, claimed: null, received: null, status: statusOf(f, LEVELS), findings: f }); continue; }
    if (amount < e.min) continue;
    const yk = `${nameKey(g.donor_id) || nameKey(g.donor)}|${nameKey(e.name)}|${(d || '').slice(0, 4)}`; const used = usedByDonorYear.get(yk) || 0;
    let expected = round2(amount * e.ratio); if (e.max !== null) expected = round2(Math.max(0, Math.min(expected, e.max - used))); usedByDonorYear.set(yk, round2(used + expected));
    const deadline = d && e.days !== null ? addDays(d, e.days) : null; const c = C.get(nameKey(g.gift_id)); const received = c ? num(c.received_amount) : null;
    if (!c || !str(c.submitted_date)) {
      if (deadline && deadline < asOf) { f.push(finding('match_deadline_passed', `Gift ${str(g.gift_id)}: the ${e.name} match of ${expected} had to be claimed by ${deadline}; no claim is recorded.`, expected)); T.lost += expected; }
      else if (deadline && daysBetween(asOf, deadline) <= Number(s.soon_days ?? 30)) f.push(finding('match_deadline_soon', `Gift ${str(g.gift_id)}: claim the ${e.name} match of ${expected} by ${deadline} (${daysBetween(asOf, deadline)} days).`, expected));
      else f.push(finding('match_not_claimed', `Gift ${str(g.gift_id)}: ${e.name} matches ${e.ratio}:1; ${expected} can be claimed${deadline ? ` until ${deadline}` : ''}.`, expected));
      if (!(deadline && deadline < asOf)) T.unclaimed += expected;
    } else if (received !== null) {
      if (Math.abs(received - expected) > tol) f.push(finding('match_received_differs', `Gift ${str(g.gift_id)}: ${e.name} paid ${received}; the program terms give ${expected}.`, expected - received));
      T.received += received;
    } else { const age = daysBetween(isoDate(c.submitted_date), asOf); if (age !== null && age > Number(s.pending_days ?? 90)) f.push(finding('claim_pending_long', `Gift ${str(g.gift_id)}: the claim sent on ${isoDate(c.submitted_date)} (${age} days ago) has not been paid.`, expected)); }
    T.expected += expected;
    items.push({ gift_id: str(g.gift_id), donor_id: str(g.donor_id), donor: str(g.donor), email: str(g.email), employer: e.name, gift_date: d, amount, expected_match: expected, deadline, claimed: c ? isoDate(c.submitted_date) : null, received, status: statusOf(f, LEVELS), findings: f });
  }
  return { items, totals: { eligible_gifts: items.filter((i) => i.expected_match !== null).length, expected_match: round2(T.expected), unclaimed: round2(T.unclaimed), received: round2(T.received), missed: round2(T.lost) }, extra: { as_of: asOf } };
}
