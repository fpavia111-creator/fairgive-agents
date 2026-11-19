# Fixtures

Eight fictional processor transactions (Stripe, PayPal, Givebutter), the matching CRM gifts
and the bank deposits. Names are made up; the rates in the settings are examples, not any
processor's current price list. Planted: a 7.00 fee where the rate gives 4.70
(fee_over_rate), a gift booked in the CRM at the net amount (gift_booked_net), a gift
booked at 25 for a 30 charge (gift_amount_differs), a PayPal donation with no CRM gift
(not_in_crm), a refunded charge whose fee was kept (fee_on_refund) and a PayPal payout
that never reached the bank (payout_not_in_bank). `exports/` holds a PayPal activity
download.
