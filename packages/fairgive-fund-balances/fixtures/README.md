# Fixtures

A fictional fund list and one quarter of ledger detail. Planted: the youth programs fund
spent 2,000 more than it had (negative_restricted_balance), the building campaign's
opening balance sits in the unrestricted net asset account (wrong_net_asset_class), the
endowment is 6,000 below its corpus after an investment loss (perpetual_below_corpus), a
fund with no restriction code (no_restriction_code), ledger lines for a fund that is not
in the fund list (unknown_fund) and due-from and due-to lines that are 500 apart
(interfund_not_zero). `exports/` holds an Aplos transactions export (signed amounts).
