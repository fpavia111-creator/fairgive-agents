# Fixtures

Seven fictional refunds and card disputes and the CRM gifts they belong to, checked on
2026-11-18. Names are made up. Planted: a full refund whose gift still stands as received
and was thanked (refund_not_reversed_in_crm, ack_sent_for_refunded), a refund larger than
its gift (refund_over_gift), a dispute whose evidence is due in four days
(dispute_evidence_due), a partial refund with the gift amount unchanged
(partial_refund_not_adjusted) and a refund with no gift id (refund_no_gift). A refund
already reversed and a dispute won are in order. `exports/` holds a Stripe balance
history export with the gift id added.
