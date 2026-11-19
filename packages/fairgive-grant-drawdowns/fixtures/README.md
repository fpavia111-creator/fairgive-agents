# Fixtures

Four fictional grants paid by reimbursement or in advance, their costs and their draws,
checked on 2026-11-18. Planted: a federal grant with 27,000 of costs not yet drawn, of
which September's 14,000 is older than 45 days (draw_available, stale_unreimbursed), and
a cost dated before its award period (costs_outside_period); a state draw requested 44
days ago and not received (pending_too_long); an advance with 6,000 more drawn than spent
(excess_cash); and a city grant drawn 2,000 over its costs and its award (overdrawn,
draw_over_award). `exports/` holds a Sage Intacct ledger export with the grant in the
Project column.
