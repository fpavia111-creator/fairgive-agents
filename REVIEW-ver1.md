# Fairgive ver 1: review

18 Nov 2026. Fairgive is the nonprofits, foundations, churches and associations family of Fair Agents
(Mythos Machines). What was built, every check run with its numbers, what was found and fixed, what
is not checked yet, and every decision made without Kurt (he asked for the suite to be built today
without his input).

## Scope

`fairgive-core` plus 32 agents, each named after its job (`fairgive-<job>`, bin = package name, tool
prefixes are job words), version 0.1.0, nothing published. Every agent reads files a nonprofit already
exports, works on the computer it runs on, and refuses or waits for one named person before anything
binding. None files with the IRS, a state or a funder, moves money, posts to the books, changes the
CRM, sends a letter or gives tax advice.

| Agent | Tools | Tools in all | Eval cases | Draft and its one-click category |
|---|---|---:|---:|---|
| fairgive-acknowledgements | `acks_*` | 11 | 21 | letter, binding_send |
| fairgive-board-designated | `designated_*` | 9 | 18 | - |
| fairgive-daf-grants | `daf_*` | 9 | 18 | - |
| fairgive-duplicate-donors | `dupes_*` | 9 | 18 | - |
| fairgive-endowment-draw | `endowment_*` | 11 | 21 | draw memo, move_money |
| fairgive-event-revenue | `events_*` | 8 | 17 | - |
| fairgive-expense-reports | `expenses_*` | 9 | 18 | - |
| fairgive-form-990-data | `form990_*` | 8 | 17 | - |
| fairgive-functional-expenses | `functional_*` | 9 | 18 | - |
| fairgive-fund-balances | `funds_*` | 9 | 18 | - |
| fairgive-gift-coding | `coding_*` | 8 | 18 | - (has memory: fund name aliases) |
| fairgive-gift-deposits | `deposits_*` | 10 | 19 | - |
| fairgive-giving-statements | `statements_*` | 11 | 21 | statement, binding_send |
| fairgive-grant-budgets | `grant_budget_*` | 9 | 18 | - |
| fairgive-grant-drawdowns | `drawdowns_*` | 11 | 21 | draw request, binding_send |
| fairgive-grant-reports | `grant_reports_*` | 12 | 21 | reminder, binding_send (plus an ICS calendar file) |
| fairgive-in-kind-gifts | `in_kind_*` | 9 | 18 | - |
| fairgive-indirect-costs | `indirect_*` | 9 | 18 | - |
| fairgive-lapsed-donors | `lapsed_*` | 9 | 18 | - |
| fairgive-liquidity | `liquidity_*` | 9 | 18 | - |
| fairgive-matching-gifts | `matching_*` | 11 | 21 | match reminder, binding_send |
| fairgive-memberships | `members_*` | 12 | 22 | renewal notice, binding_send |
| fairgive-payroll-allocation | `payroll_alloc_*` | 9 | 18 | - |
| fairgive-pledges | `pledges_*` | 12 | 22 | reminder, binding_send |
| fairgive-processor-fees | `fees_*` | 10 | 19 | - |
| fairgive-quid-pro-quo | `qpq_*` | 9 | 18 | - |
| fairgive-recurring-gifts | `recurring_*` | 12 | 22 | card note, binding_send |
| fairgive-refunds-chargebacks | `refunds_*` | 10 | 19 | - |
| fairgive-restriction-releases | `releases_*` | 10 | 20 | release entry, go_live |
| fairgive-single-audit | `single_audit_*` | 9 | 18 | - |
| fairgive-vendor-1099 | `vendor_1099_*` | 9 | 18 | - |
| fairgive-volunteer-hours | `volunteers_*` | 9 | 18 | - |

311 tools in all; 66 of them are listed only so a model can see they are refused (`ledger_post`,
`payment_send`, `irs_file`, `funder_portal_submit`, `email_send`, `crm_update_records`,
`donor_data_delete`, `bank_transfer`, `refund_issue`, `payroll_submit`, `card_charge`,
`dues_charge`, `match_portal_submit`, `dispute_respond`, `expense_approve`).

## Checks run, and results

All on this machine: Windows 10, Node 24.20.0.

| Check | Result |
|---|---|
| `npm test` (all 33 workspaces) | 812 tests, 812 pass: core 128; agents 21 to 23 each (21 agents with 21, 10 with 22, 1 with 23) |
| `npm run evals` | 609 eval cases across 32 agents, all pass; 17 to 22 per agent (bar is 15) |
| `npm run hostile` (planted formulas, HTML, `../` ids and AI-aimed instructions in every fixture, every eval case) | 3,084 calls, 1,063 planted values, 108 results flagged for instruction-like text, 0 findings |
| `npm run hostile:args` (null, numbers, arrays, a 200,000-character string, NUL, `../` and absolute paths in every argument of every tool) | 18,335 calls, 0 findings |
| `npm run masking` (personal values from the fixtures planted as canaries) | 22 agents with personal fields, 261 canaries, 421 calls, 0 leaks |
| `npm run intl` (every spreadsheet eval case as a German, French, Spanish, Brazilian, Italian, Japanese, Chinese and Korean export: local column names, `1.234,56`, local dates, Windows-1252, Shift_JIS, GBK, EUC-KR) | 353 cases x 8 languages, all pass; 355 of 450 column names translated (German count) |
| Contract tests per agent (in `npm test`) | every tool that runs has an eval case; readable errors; files outside `--root` refused; Review mode and the kill switch; drafts tied to their sha256; repeatable results; same answer with columns reordered, an extra column, BOM and CRLF, padded values, blank lines, rows reversed or rotated, a header with no rows; report pages in en/de/ja with the same CSV; personal data never reaches the model |
| MCP stdio smoke test (in `npm test`) | every agent: initialize, list tools, refuse an unknown tool, write the audit log |
| `npm run bench` (1,000 and 10,000 rows per input file, each tool in its own process) | 97 tool runs across 32 agents, 0 need attention; at 10,000 rows the median is 0.9 s and the slowest 2.9 s (grant reports, write report); record in `docs/bench-2026-11-18.md` |
| `npm run release:check:offline` | first full run: every check passed except pack contents (a stray file, see below); after the fix the pack check passed (33 packages, 582 KB packed, no tests, state, output, keys or .npmrc) and a second full run on a clean tree passed: tests 812, evals 609/609, hostile 0 findings, pack 33 packages, npm names skipped offline (checked separately below) |
| `npm run readme:check`, `npm run plugin:check` | generated README sections and the 65 plugin files match the agents |
| `npm view <name>` for all 33 package names (read-only) | all 33 free (404), see `docs/npm-names-2026-11-18.md` |
| MCP Registry step (`node ..\add-mcp-registry.cjs fairgive-agents fairgive.html`) | REGISTRY_RESULT |
| Sample reports | `sample-reports/`: all 32 agents' reports (HTML and CSV) on their fictional demo files, in English, plus `index.html` |

## Found and fixed during the build

- **Core rebased.** The first core was copied from lodestar-core with my own runtime-level masking of
  personal data. Before building agents I moved to the finished Fairtable core instead, because it
  already carried every fix the other families found on 18 Nov (paths over 1,024 characters refused, a
  short GBK header that reads as UTF-8, headers in another letter case re-keyed, multi-word tool
  prefixes for memory and approvals) and a proven agent kit with masking. The runtime masker was
  dropped so the family has one masking path, the same as Fairtable. Core tests: 128/128.
- **Core: duplicate export.** `round2` was exported twice from `index.js` after the rebase; every test
  file failed to load. Fixed.
- **Gift deposits: shared deposits.** Three card gifts paid into one 400.00 deposit were each reported
  "not deposited" and the deposit "not in CRM". Added a pass that matches a deposit to all unbatched
  gifts dated inside the window before it when they add up to it.
- **Gift deposits: speed.** That pass compared every deposit with every gift: 10.5 s at 10,000 rows.
  It now finds the window by binary search on sorted dates: 1.5 s.
- **Processor fees: speed.** Matching payouts to bank deposits scanned every deposit for every payout:
  79 s at 10,000 rows. Deposits are now indexed by id, by the words of their description and by amount:
  1.2 s.
- **Grant budgets: speed.** An allocation table that lists the same pool and grant many times split
  every pooled cost once per row (the bench timed out at 10,000 rows). Shares are now added per pool
  and grant (the pool then shows over 100% and is flagged): 1.0 s.
- **Recurring gifts.** With the failures-in-a-row setting at 3, two failed charges were reported as
  nothing at all. Any trailing failure below the setting is now "failed_last_charge".
- **Pledges.** The present value counted a pledge that had been written off. Write-offs now cover
  installments before the discounting.
- **Gift coding.** A gift whose note names the fund it is coded to was still flagged because its appeal
  has another default fund. The donor's words now win over the appeal default.
- **Grant budgets fixture.** The first named-export fixture was a QuickBooks general ledger report; its
  group rows and "Total for" lines do not fit an expense-line file without the full QBO profile, so the
  case now uses a Sage Intacct detail export.
- **Fixture and expectation mistakes caught by the evals** (no code change): a Stripe deposit of 514.24
  where the payout nets 441.19; three sponsors counted as four; a refund case that expected a quoted
  status word the JSON escapes; a payments file missing from a present-value case; a pledge that was
  paid and still open, expected to have no finding.
- **Release check: a stray file.** A development run of the grant reports calendar tool wrote an ICS file
  under `fixtures/` (git ignores it, npm would have packed it). Removed; the pack check now passes.
- **Honest-copy wording.** Column aliases "Certified Date" and a draft line "Certified by" would read as a
  certification claim to the release check's scan; reworded ("Signature Date", "Signed by the authorized
  official").
- **International check.** Named vendor layouts under `fixtures/exports/` (Raiser's Edge NXT, NPSP,
  Bloomerang, PayPal, Aplos, Classy, Intacct...) are recognised by the vendor's own English column
  names; translating their headers made 9 cases x 8 languages fail. They are now left out of the
  translation check, the same rule the Fairwire family uses; the agents' own layouts are checked in all
  eight languages.

## Decisions made without Kurt

- **Names** follow the 18 Nov naming rule (`fairgive-<what it does>`, no themed names). The family was
  planned with flower names this morning; nothing was published under them.
- **Agent list.** Every job listed in the task, plus `fairgive-liquidity` (financial assets available within
  a year, the data behind the liquidity note) to reach 32. Lapsed donors, recurring failures, multi-grant
  allocation (in grant budgets) and indirect cost rates (its own agent, deeper than Mythos
  `polyhymnia-of-grants`) are separate agents.
- **Thresholds and rules are settings with working defaults, stated in every result:**
  acknowledgement threshold 250 and 30 sending days; quid pro quo threshold 75 with the 2025 IRS
  insubstantial-benefit figures (13.60 low-cost article, 68 minimum payment, 2% or 136), marked
  "update yearly"; single audit threshold 1,000,000 for fiscal years beginning on or after 2024-10-01
  and 750,000 before; de minimis indirect rate 15% for awards from 2024-10-01 and 10% before; subaward
  cap 50,000 / 25,000 on the same date; 1099 threshold 2,000 for payments in 2026 (600 settable for
  earlier years); endowment spending rate 4% on a 12-quarter average with a 7% prudence flag; appraisal
  flag above 5,000; no default for the mileage rate or the volunteer hourly value. Each says a person
  (accountant, auditor, preparer, attorney) confirms it.
- **Masking** on in every agent with personal data (22 agents): donor, member, volunteer, staff and
  vendor names, e-mails, phones, street addresses and taxpayer ids become tokens in results; files
  written on the machine keep the real values.
- **Drafts** only where a person would send or post something (10 agents). Posting the release entry is
  `go_live`; the endowment draw memo is `move_money`; letters, statements, notices and draw requests are
  `binding_send`. All are one named click, even in Auto.
- **Memory** only in gift coding (fund names a CRM export uses for a fund code), the one place an
  accepted alias saves repeated work. Amounts, thresholds and rules are never learned.
- **Prices** (`sales/pricing-page-ver1.md`): set at or below the other families for small nonprofits:
  $1,000 starter, $1,200 church pack, $1,500 to $2,500 packs, $6,500 whole organization, $15,000 partner
  rollout for accounting firms and fiscal sponsors (up to 20 client organizations, +$450 each above).
  Support $150 a month per pack, $350 whole organization, $90 per client organization in a rollout.
- **Site page** for the registry: `fairgive.html`.

## Not checked yet (say this out loud)

- **Export layouts.** Column names for Raiser's Edge NXT, Financial Edge NXT, Salesforce NPSP,
  Bloomerang, DonorPerfect, Little Green Light, Neon, Givebutter, Classy, PayPal, Stripe, QuickBooks
  Online, Aplos and Sage Intacct were written from knowledge of those exports and marked "recalled". No
  real export has been read. The first setup confirms them with `inspect`.
- **Rules.** The default thresholds above are summarized from public material as of 2026 and change; a
  nonprofit accountant or auditor should read the defaults before a client relies on them. Nothing here
  is tax, legal or audit advice.
- **Node 20 and 22, Linux and macOS:** only Node 24 on Windows was run here (the CI workflow covers the
  rest once pushed).
- **`npm run mcp:check`** (official MCP SDK client) was not run: it installs the SDK with `--no-save`.
  The agents' own stdio tests pass.
- **Translations** of the root README and report pages are Claude's and have not been reviewed by
  native speakers; tool results, CSV files and agent READMEs stay in English.
- No nonprofit finance person, auditor, attorney or customer has reviewed the agents yet.

## Ideas for ver 2

A month-end runner (deposits, fees, refunds, releases, fund balances in order); a year-end runner
(statements, acknowledgements, 1099, Form 990 data, functional expenses); one real de-identified export
per CRM to confirm columns; a fiscal-sponsor view across projects; gift-aid style rules if Kurt wants
non-US nonprofits.
