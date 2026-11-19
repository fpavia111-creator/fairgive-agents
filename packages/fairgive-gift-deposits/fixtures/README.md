# Fixtures

Fictional gifts, deposits and ledger lines for one small organization (September and
October 2026). Names are made up. Planted: batch B-102 deposited 10.00 short
(batch_total_mismatch), batch B-103 never deposited (not_deposited), a card gift from
two days before the last deposit (in_transit), a 250.00 mobile deposit with no gift in
the CRM (deposit_not_in_crm), and October contributions in the ledger that are 905.00
under the CRM (gl_differs: the missing batch, the short deposit and the gift in transit).
The stock gift is left out of deposit matching (noncash) and the interest credit is
ignored by the settings. `exports/` holds a Salesforce NPSP opportunities export.
