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
| MCP Registry step (`node ..\add-mcp-registry.cjs fairgive-agents fairgive.html`) | done: mcpName in all 32 agent package.json files, 32 server.json files, websiteUrl https://fair-agents.com/fairgive.html; nothing submitted to the registry |
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

## Final pass (19 Nov 2026)

Run when the main session asked for it (`FINAL-PASS-REQUEST.md`): the eight-point "Final pass" checklist in
`BUILD-BRIEF.md`, Kurt's five review questions answered with numbers, real public data, and the fixes from the
outside critique that fall inside this folder. The numbers in this section replace the ones above. Everything
ran on Windows 10, Node 24.20.0, from a fresh clone of this folder (`git -c core.autocrlf=true clone`, the way
a default Windows git checks out) with npm pointed at an address that does not answer, so nothing used the
network. Nothing was pushed, published, uploaded or sent.

### Final numbers

| Check | Result |
|---|---|
| `npm install` in the fresh clone, npm registry unreachable | passes in 5 s (33 workspace links; the agents have no outside dependencies), with no network |
| Line endings in the fresh clone | 1,041 files LF, 161 CRLF (all international fixtures or calendar files, kept byte-exact), 1 binary; no CRLF anywhere else |
| `node packages/fairgive-gift-deposits/bin/fairgive-gift-deposits.js demo` (the `try_it` command) | runs in about 1 s with no setup: five findings on fictional data, an explanation, the report files, and its own attempt to post to the ledger blocked |
| `npm test` | 816 tests, 816 pass: core 128; agents 21 to 23 each (17 with 21, 14 with 22, 1 with 23); 4 of them are new regression tests from this pass |
| `npm run evals` | 609 eval cases across 32 agents, 0 failed; 17 to 22 per agent (bar is 15) |
| Accuracy (`npm run accuracy`, `docs/accuracy-2026-11-19.md`) | 185 of 185 planted problems found, 0 unplanned findings; 0 findings on 575 clean rows (all 32 agents have a clean set); 90 of 90 one-edit mutation cases caught |
| Masking canaries (`npm run masking`) | 22 agents, 261 fictional values planted, 421 calls, 0 leaks |
| What reaches the model (`npm run model-view`, `docs/model-view-2026-11-19.md`) | 22 agents mask personal columns, 10 read none; free text in clear listed per agent (below) |
| Hostile data (`npm run hostile`) | 32 agents, 3,084 calls, 1,776 planted values, 0 findings |
| Hostile arguments on the five agents whose code changed (`hostile-inputs.mjs --args`) | 5 agents, 2,414 calls, 0 findings (duplicate-donors, quid-pro-quo, refunds-chargebacks and single-audit in the fresh clone; vendor-1099 afterwards in this folder; the full 32-agent pass in the build: 18,335 calls, 0) |
| `npm run intl` | 353 cases with spreadsheet inputs in 8 languages: every case that passes in English passes in every language (355 of 450 column names translated) |
| `npm run bench` (1,000 and 10,000 rows) | 97 tool runs at 1,000 and 10,000 rows, 0 need attention; at 10,000 rows median 0.54 s, slowest 1.2 s; duplicate-donors with its new name index 0.61 s |
| `readme:check` (now also the "Exports it reads" blocks), `plugin:check`, eval and intl generators, root READMEs | all pass in the fresh clone |
| `npm run release:check:offline` | passes in the fresh clone: workspaces, metadata, clean tree, no .npmrc, secret scan of 1,203 files, honest copy in 100 files, one-click policy, tests 816, evals 609/609, hostile 0, pack 33 packages (607 KB, was 582 KB: the clean fixture sets are new), npm names skipped offline (all 33 were free on 18 Nov) |
| Real public data (`npm run realdata`, `docs/realdata-2026-11-19.md`) | three public sources through 4 agents: 70 single audits, 90 Form 990-series returns (53 of them Form 990) and 6,626 registered organizations; the agent and a separate re-count agree on every number below |

### What changed in this pass

1. **Fresh Windows clones.** 41 files had been committed with CRLF. A `.gitattributes` now keeps code, docs and
   fixtures LF and keeps the international fixtures and calendar files byte-exact, and every generated-file
   check (READMEs, eval cases, intl fixtures, plugin files, root READMEs, export blocks) compares without line
   endings. In the fresh clone: 1,041 files LF, 161 CRLF (all international fixtures or `.ics`), 0 failures.
2. **READMEs read as a buyer.** Every agent README now opens with what it does, that it reads files and writes
   reports and drafts, that it never files, sends, pays or changes a live system, and that a person decides; a
   "What it needs" list (each input file, required or optional); and an "Exports it reads" block naming the
   vendor exports it recognises and saying none was checked against the vendor's documentation or a real export.
3. **Accuracy measured** (`scripts/accuracy.mjs`, `scripts/accuracy-specs.mjs`, `fixtures/clean/` in every agent).
   It found two wrong findings on the clean set, both fixed with tests: quid-pro-quo listed an auction item bought
   at exactly its value as "benefit over payment" (and asked for a disclosure when nothing was a contribution);
   refunds said a partially refunded gift "still shows" its amount when the CRM had already reduced it (it now
   accepts a "partially refunded" status and gives both readings).
4. **What reaches the model, measured** (`scripts/model-view.mjs`). It showed that a name typed into a memo is masked
   only when the same name is in a masked column of the files read. The copy that said personal data is masked
   "in everything" sent to the model (core limits, 32 agent READMEs, the 9 root READMEs, `site.json`, the pricing
   page) now says so plainly.
5. **Real data found a real bug** in duplicate-donors: on Vermont's register of 6,626 different organizations it
   grouped 46 sets by name, 33 of them as "similar names" (Brattleboro Outing Club and Brattleboro Tennis Club;
   Hoehl and Landon Family Foundation; Modern Woodmen of America 8514, 10594 and 12137). Names are now similar only
   when every word matches but one and that one is a near-typo, words with numbers must be equal, legal-form words
   (Inc, LLC, Corp) are left out, the same name in a different postal code is a lower-level finding of its own,
   "P.O. Box" reads as "PO BOX", and the old limit that skipped any postal code with more than 200 names (a silent
   gap) is gone. Result: 17 name groups (13 of them the lower-level kind), and 150 of 150 planted copies found (was
   149). The fixture accuracy did not change.
6. **Dated rule.** vendor-1099 used 2,000 as the threshold for every year although its setting said "600 for
   earlier years"; it now follows the tax year when the threshold is not set.
7. **Wording from real data.** single-audit now asks a person to enter a missing pass-through award id or confirm
   none was assigned (23% of real pass-through lines have none).
8. My own test script had three bugs that real files showed (the `<IRS990 documentId=…>` element has attributes,
   "other expenses" lines start with their description, and line 26 joint costs is a memo line, not part of the
   total). These were in `scripts/realdata.mjs`, not in the agents; the counts above are after fixing them.

### The eight points

1. **Names.** Every package, bin, tool prefix, title, README and CHANGELOG uses `fairgive-<job>`. A search for the
   first flower names and for other families' words finds only history (the core README and CHANGELOG say the core
   started from Fairtable and lodestar-core; this review says so too). Fixed: one "restaurant" left in the
   accuracy note.
2. **Each agent read as a buyer.** Done for all 32 through the README changes above; the demo and sample report of
   the four agents whose findings changed were regenerated. No wording promised more than the code does except the
   masking sentence and the 1099 default, both fixed.
3. **Honest copy.** No compliance, certification, savings or tax-advice claims in the READMEs, `site.json`, the
   pricing page, the sample reports or `final-pass.json`; the release check's claim scan passes.
4. **Binding actions.** Paying, refunding, charging, moving money, posting to the books, changing the CRM, filing
   with the IRS, a state or a funder, sending letters and deleting donor data are refused outright (66 refused tools)
   or wait for one named person's click (8 drafts with a `binding_send` one-click, 2 with `go_live` or `move_money`),
   in every mode. The release check's policy rails pass.
5. **The full bar from a clean install.** All pass (table above).
6. **Fixtures.** Fictional people and organizations ("Example ..." names, made-up donors); taxpayer ids are dummy
   values; personal fields are masked. The public data is used only by `scripts/realdata.mjs` from the
   git-ignored `_realdata/`, and the committed results show organization names and postal codes only (the register's
   street column sometimes holds a contact person's name, so it is left out).
7. **site.json, pricing page, samples.** `site.json` matches the pricing page and the 32 agents; sample reports were
   regenerated after every change.
8. **Pack.** No secrets, no `.fairgive` or `fairgive-out` state, no stray files in `npm pack` (release check).

### Kurt's five questions

**1. Accuracy.** Per agent in `docs/accuracy-2026-11-19.md`; for the family: 185/185 planted problems found (recall
100% on fictional data), 0 unplanned findings on the planted set, 0 findings on 575 clean rows (false positives 0),
90/90 one-edit mutation cases caught. The clean sets and mutations were written by the same author as the rules, so
these numbers say the rules do what they are written to do, not how they do on a real organization's exports. On
public data: single-audit agreed with a separate re-count on 70/70 audits; form-990-data on 283/283 grants with no
EIN and 23/23 people with no hours; functional-expenses matched the return's own totals on 48/48 returns;
duplicate-donors found 150/150 planted copies, and on 6,626 different organizations it now groups 17 by name, of
which 4 are at review level (3 look like one organization registered twice, 1 is a sister entity at the same
address) and 13 are the lower-level "same name in another postal code". Before the fix it was 46.

**2. Security.** What the model sees, per agent, is in `docs/model-view-2026-11-19.md` (made from real runs). In
short: names, e-mails, phone numbers, street addresses and taxpayer ids of donors, members, volunteers, staff,
officers and vendors are replaced by tokens in 22 agents (the other 10 read no personal columns); amounts, dates,
rates, finding codes and record ids (donor, gift, employee, volunteer ids) are sent in clear; free text that could
carry a name is sent as typed: memos (functional-expenses, fund-balances, gift-coding, gift-deposits, in-kind-gifts),
bank descriptions (gift-deposits), in-kind descriptions, benefit descriptions (quid-pro-quo), merchants
(expense-reports), employers (matching-gifts), DAF sponsors and Schedule I grantees and purposes. A name typed in
free text is masked when the same name is in a masked column of the same call; otherwise it reaches the model.
Masking canaries 22 agents, 261 fictional values planted, 421 calls, 0 leaks; hostile data 32 agents, 3,084 calls, 1,776 planted values, 0 findings; hostile arguments 5 agents, 2,414 calls, 0 findings (the full 32-agent pass in the build: 18,335 calls, 0). Results go to whatever
model the user's assistant uses; for donor and staff data use a local model or one covered by the user's own
agreements. No compliance claim of any kind is made.

**3. Compatibility.** 19 named vendor exports (Raiser's Edge NXT gifts and constituents, Financial Edge NXT, NPSP
opportunities and contacts, Bloomerang transactions and constituents, DonorPerfect, Little Green Light, Neon,
Givebutter, Classy, PayPal activity, Stripe balance history and payments, QuickBooks Online general ledger and vendor
list, Aplos, Sage Intacct): all 19 are "written from knowledge of the export; not yet checked against documentation
or a real export". None was tested on a real export. Three public formats were tested on public samples, through a
conversion in the test script rather than read directly by the agents: the Federal Audit Clearinghouse API, IRS Form
990 e-file XML and the IRS exempt-organization extract. Any other layout is read by column-name matching, and
`inspect` plus `fairgive-sources.json` name columns by hand.

**4. Commercial traction.** None: no paying customers, and no checkout is live (the main session answers for the
suite).

**5. Support.** Every rule that changes is a setting; defaults live in each agent's `src/logic.js`, every result
lists `settings_used`, and a customer (or support) changes them in a settings JSON file passed as `settings`.

| Rule | Agent and setting | Default | Source and date |
|---|---|---|---|
| Written acknowledgement for gifts of 250 or more | acknowledgements `threshold`, `days_to_send` | 250; 30 days (policy) | IRC 170(f)(8); not indexed |
| Quid pro quo disclosure over 75 | quid-pro-quo `qpq_threshold` | 75 | IRC 6115; not indexed |
| Insubstantial benefit (low-cost article, minimum payment, 2% cap) | quid-pro-quo `low_cost_article`, `low_cost_min_payment`, `insubstantial_pct`, `insubstantial_cap` | 13.60, 68, 2%, 136 | IRS figures for 2025 (Rev. Proc. 2024-40); the IRS updates them every year, and the 2026 figures must be entered |
| Single audit threshold | single-audit `threshold` | 1,000,000 for fiscal years beginning on or after 2024-10-01, 750,000 before | 2 CFR 200.501 as revised in 2024 |
| De minimis indirect rate and subaward cap in MTDC | indirect-costs `de_minimis`, `subaward_cap` | 15% and 50,000 for awards from 2024-10-01; 10% and 25,000 before | 2 CFR 200.414(f) and 200.1 as revised in 2024 |
| 1099-NEC/MISC threshold | vendor-1099 `threshold` | 600 for payments through 2025, 2,000 in 2026 | July 2025 tax law; indexed for inflation after 2026, so set it each year |
| Schedule B, M and I thresholds | form-990-data `schedule_b_threshold`, `schedule_m_threshold`, `schedule_i_threshold` | 5,000; 25,000; 5,000 | Form 990 instructions (general rule; the special rules for some organizations are not modelled) |
| Qualified appraisal and Form 8282 disposal period | in-kind-gifts `appraisal_threshold`, `disposal_years` | 5,000; 3 years | IRC 170(f)(11); IRC 6050L |
| Endowment spending and prudence | endowment-draw `spending_rate`, `quarters`, `prudence_rate` | 4%, 12 quarters, 7% | Policy; 7% is the UPMIFA presumption some states adopted |
| Mileage, per diem, receipts | expense-reports `mileage_rate`, `per_diem`, `receipt_over` | no mileage rate, no per diem, 75 | The organization's own policy (the IRS rate changes every year) |
| Volunteer value, background checks | volunteer-hours `hourly_value`, `background_check_years`, `roles_needing_check` | 0; 3 years; none | The organization's own policy |
| Processor rates | processor-fees `rates` | none | Each processor contract |
| Unallowable cost words | grant-budgets and expense-reports `unallowable_words` | alcohol, lobbying, entertainment, fines and similar | 2 CFR 200 Subpart E (a word list, not the rule) |

Export layouts are maintained the same way: `fairgive-sources.json` maps a changed column by hand, and support
updates the built-in layouts when a vendor changes an export.

### Real data

| File | Source and URL | Date | Licence | What ran and what it found | Wrong findings |
|---|---|---|---|---|---|
| 70 single audits (FY ending 2024-06-30 and 2025-12-31), 472 award lines, 307 pass-through records | Federal Audit Clearinghouse, https://www.fac.gov/ (api.fac.gov, public demo key) | 2026-11-19 | U.S. government data, public domain | single-audit: federal total equals the audit's own total in 70/70, threshold right for each year, 70 at or over it; 71 pass-through lines with no id listed for review; odd listing numbers (21.U01, 84.425U, 14.U01) read as given | none; the pass-through wording was made clearer |
| 90 returns read from the January 2025 TEOS zip by byte range (53 Form 990, 37 Form 990-PF) | IRS, https://apps.irs.gov/pub/epostcard/990/xml/2025/2025_TEOS_XML_01A.zip | 2026-11-19 | IRS public information | form-990-data: 2,427 Schedule I grants in 21 returns, 283 with no recipient EIN (218 of them to 501(c)(3) organizations), 4 with no address; 1,272 Part VII people in 53 returns, 23 with no hours for the filing organization (those returns give hours only for related organizations). functional-expenses: 733 Part IX lines in 48 returns, totals equal the return's own in 48/48, no fundraising-coded-as-program findings | none in the agents; three bugs in the test script, fixed |
| eo_vt.csv, 6,626 organizations | IRS Exempt Organizations Business Master File, https://www.irs.gov/pub/irs-soi/eo_vt.csv | 2026-11-19 | IRS public information | duplicate-donors as published: 17 name groups and 431 address-only groups; with 150 retyped copies planted: 150 found (146 through the name; 4 one-word names such as "Accept" and "Arroway" through the address) | 46 name groups among different organizations before the fix; 4 at review level and 13 at the lower level after |

Nothing public fits the other 28 agents: gifts, pledges, deposits, payroll, volunteers, members and fund ledgers are
private by nature, and no vendor publishes a sample export of them that I could confirm. Their layouts stay "written
from knowledge of the export" until a customer's first export is read.

### Decisions for Kurt

- **Formats.** All 19 named exports are unchecked. The quickest proof is one de-identified export per CRM from the
  first design partner, or permission to compare each layout with the vendor's published help pages and mark the
  ones that match "checked against the vendor's published documentation".
- **2026 insubstantial-benefit figures.** The quid-pro-quo defaults are the 2025 IRS figures. Updating dated
  figures each year is a support task; someone has to enter the 2026 values from the IRS's revenue procedure.
- **Duplicate organizations.** The agent was built for people and now handles organization names better. Chapters and
  parishes with one name in many towns are listed at the lower level. Say whether to sell it for organization
  donor lists too.
- **Lower-cost starter.** The critique suggests a cheaper first step (for example a file review on one export).
  Prices were not changed; that is Kurt's call.
