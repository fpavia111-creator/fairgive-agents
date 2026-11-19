# What reaches the AI model (2026-11-19)

Made by `node scripts/model-view.mjs`: each check is run on its fictional fixtures and every fixture value is looked for in the JSON result the assistant's model receives. Masked columns (donor, giver, member, volunteer, employee, officer and vendor names, e-mails, phone numbers, street addresses and taxpayer ids) are replaced by tokens such as `A.R.#3f9a2c`, `email#…`, `phone#…`, `address#…` or `tin#…` (the same value always gives the same token, so the model can still group by it; the report and draft files on your machine keep the real values). Everything else in the result is sent in clear: amounts, dates, rates, finding codes, record ids (donor, gift, employee, volunteer ids, which name no one by themselves but link back to your systems) and the text columns listed. Free-text columns (memos, bank descriptions, benefit and in-kind descriptions, grant purposes) are sent as typed: if someone types "In memory of Jane Doe" into a gift memo, the model sees that name, unless the same name is in a masked column of the files read in that call (checked on 19 Nov 2026: a gift memo "in memory of Juniper Vance", a donor in the same file, reached the model as "in memory of J.V.#c84c20"; "Ada Stranger", in no masked column, reached it as typed).

The result goes to whatever model the user's assistant uses. For donor, staff and volunteer data, use a model covered by your own agreements or a local model. No compliance claim is made.

| Agent | Masked | Text sent in clear | Free text among them |
|---|---|---|---|
| fairgive-acknowledgements | donor, email | donor_id, gift_id | - |
| fairgive-board-designated | - | fund, fund_name | - |
| fairgive-daf-grants | advisor, donor | daf_sponsor, gift_id, method, pledge_id | daf_sponsor |
| fairgive-duplicate-donors | address, donor, email, phone | donor_id | - |
| fairgive-endowment-draw | - | fund, fund_name | - |
| fairgive-event-revenue | buyer | event, ticket_type | - |
| fairgive-expense-reports | employee | category, grant, merchant, report_id | merchant |
| fairgive-form-990-data | address, donor, name | donor_id, gift_id, gift_type, grantee, purpose, title | grantee, purpose, title |
| fairgive-functional-expenses | - | account_name, basis, memo, program | memo |
| fairgive-fund-balances | - | fund, fund_name, memo, restriction | memo |
| fairgive-gift-coding | donor | appeal, default_fund, fund, fund_name, gift_id, memo | memo |
| fairgive-gift-deposits | donor | batch, deposit_id, description, gift_id, gift_type, memo, method | description, memo |
| fairgive-giving-statements | address, giver | fund, gift_id, giver_id, method | - |
| fairgive-grant-budgets | - | grant, line, pool | - |
| fairgive-grant-drawdowns | - | funder, grant | - |
| fairgive-grant-reports | owner | frequency, funder, grant, report | - |
| fairgive-in-kind-gifts | donor | category, description, gift_id, memo | description, memo |
| fairgive-indirect-costs | - | base, grant | - |
| fairgive-lapsed-donors | donor | donor_id | - |
| fairgive-liquidity | - | account_name, category, restriction | - |
| fairgive-matching-gifts | donor, email | donor_id, employer, gift_id | employer |
| fairgive-memberships | email, member | level, member_id | - |
| fairgive-payroll-allocation | employee | code, employee_id, period | - |
| fairgive-pledges | approved_by, donor, email | donor_id, pledge_id, status | - |
| fairgive-processor-fees | donor, email | deposit_id, gift_id, method, payout_id, processor, txn_id | - |
| fairgive-quid-pro-quo | donor | benefit, gift_id | benefit |
| fairgive-recurring-gifts | donor, email | donor_id, frequency, plan_id, processor | - |
| fairgive-refunds-chargebacks | donor | gift_id, processor, status, txn_id | - |
| fairgive-restriction-releases | - | fund, fund_name | - |
| fairgive-single-audit | - | funder, grant, pass_through | - |
| fairgive-vendor-1099 | address, tin, vendor | entity_type, vendor_id | - |
| fairgive-volunteer-hours | volunteer | program, role, volunteer_id | - |
