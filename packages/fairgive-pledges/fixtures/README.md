# Fixtures

Eight fictional pledges with payments and one write-off, checked on 2026-11-18. Names and
e-mails are made up. Planted: a monthly pledge three days behind (overdue_installment), a
5,000 pledge 141 days past due (overdue_90), a pledge paid in full and still open
(paid_still_open), a pledge paid 100 over (overpaid), a three-year pledge with no discount
rate set (multi_year_not_discounted), a write-off with no approver (writeoff_no_approval)
and a conditional 10,000 pledge kept open (conditional_booked). `exports/` holds a
Salesforce NPSP payments export that pays the 5,000 pledge.
