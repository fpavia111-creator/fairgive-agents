# Fairgive nonprofit agents

[Deutsch](README.de.md) · [Français](README.fr.md) · [Español](README.es.md) · [Português](README.pt-BR.md) · [Italiano](README.it.md) · [日本語](README.ja.md) · [简体中文](README.zh-Hans.md) · [한국어](README.ko.md)

Thirty-two small MCP agents for the back office of nonprofits, foundations, churches and associations. Each one owns **one job**, such as gifts against bank deposits, releases from restriction, grant drawdowns or year-end giving statements, and cannot act outside it. They read the files you already export from Blackbaud Raiser's Edge NXT and Financial Edge NXT, Salesforce NPSP, Bloomerang, DonorPerfect, Little Green Light, Neon, Givebutter, Classy, PayPal, Stripe, QuickBooks Online, Aplos and Sage Intacct; write their reports on your computer; and wait for one named person before anything that moves money, sends a message, files with a government or funder, or changes a live system.

Part of Fair Agents by Mythos Machines. MIT licence · Node 20 or newer · local files only · no credentials · no runtime dependencies. The software is free; the paid part is a fixed-price setup on your own files.

## Try one

```bash
npx -y fairgive-gift-deposits demo     # gifts against bank deposits and the ledger, fictional data
npx -y fairgive-grant-budgets demo     # grant budget against actual with shared costs
```

Every agent has a `demo` on fictional files, an `eval` with its own test cases and an MCP server (`npx -y <agent> mcp --root <folder>`) for Claude Desktop, Claude Code, Cursor and other MCP hosts.

## The agents

**Gifts and donors (10):** `fairgive-gift-deposits` (CRM gifts against bank deposits and the ledger), `fairgive-acknowledgements` (missing, late or wrong acknowledgement letters), `fairgive-duplicate-donors` (duplicate donor records), `fairgive-recurring-gifts` (failed and missed recurring gifts, expiring cards), `fairgive-lapsed-donors` (LYBUNT, SYBUNT and retention), `fairgive-gift-coding` (gifts coded against donor intent), `fairgive-matching-gifts` (employer matches not claimed, deadlines), `fairgive-daf-grants` (donor-advised fund grants to look at), `fairgive-refunds-chargebacks` (refunds and disputes against CRM gifts), `fairgive-processor-fees` (Stripe, PayPal, Givebutter and Classy fees and payouts).

**Events, benefits, members and volunteers (6):** `fairgive-quid-pro-quo` (quid pro quo disclosures and deductible amounts), `fairgive-event-revenue` (event tickets split into exchange and contribution), `fairgive-in-kind-gifts` (in-kind gift values, appraisals, services), `fairgive-memberships` (dues, renewals and lapsed members), `fairgive-giving-statements` (year-end giving statements for churches and nonprofits), `fairgive-volunteer-hours` (volunteer hours, value and background checks).

**Grants (6):** `fairgive-grant-budgets` (grant budget against actual, shared costs across grants), `fairgive-indirect-costs` (indirect cost base (MTDC) and rates), `fairgive-grant-reports` (grant reporting calendar and overdue reports), `fairgive-grant-drawdowns` (what can be drawn, stale costs, overdraws), `fairgive-single-audit` (federal spending against the single audit threshold), `fairgive-payroll-allocation` (salary charges against effort reports).

**Funds, net assets and cash (6):** `fairgive-fund-balances` (fund balances by restriction class), `fairgive-restriction-releases` (releases from restriction and the release entry), `fairgive-board-designated` (board-designated funds against resolutions), `fairgive-endowment-draw` (endowment draw from the spending policy), `fairgive-liquidity` (financial assets available within one year), `fairgive-pledges` (pledges receivable, aging and write-offs).

**Expenses, payroll and year-end (4):** `fairgive-functional-expenses` (program, management and fundraising split), `fairgive-expense-reports` (expense reports against your policy), `fairgive-vendor-tax-forms` (vendor 1099 readiness, W-9s and taxpayer ids), `fairgive-form-990-data` (data behind Form 990 schedules (no filing)).

## How they stay safe

- **One job each.** Every agent has its own tool allowlist; any other tool name, including ones a model invents, is blocked.
- **Nothing binding happens on its own.** No agent pays, refunds, charges a card, moves money between accounts, posts to the books, changes the CRM, files a Form 990 or 1099, submits to a funder portal or sends a letter. Those are refused outright or wait for one named person's click, even in Auto mode. Drafts are written to a file marked DRAFT; approving one records the decision, and a person acts on it.
- **Personal data is masked.** Donor, member, volunteer, staff and vendor names, e-mails, phone numbers, street addresses and taxpayer ids are replaced with tokens such as `M.H.#eb764c` in everything returned to the AI model. The report and draft files written on your computer keep the real values, so keep them in a private folder. Text typed into memos, notes and bank descriptions is sent as written: a name typed there is masked only when the same name is in a masked column of the files read.
- **Local files only.** No network calls, no telemetry, no credentials. Every call goes to a hash-chained audit log under `.fairgive/`.
- **Your rules, not ours.** Thresholds, rates, dates and policies (acknowledgement threshold, quid pro quo figures, single audit threshold, de minimis rate, spending rate, 1099 threshold) are settings in your own file. The defaults are working examples; the result always says which settings it used.

## Use with Claude Code

```bash
claude mcp add fairgive-gift-deposits -- npx -y fairgive-gift-deposits mcp --root .
```

or add this repository as a plugin marketplace and install the agents you want (`.claude-plugin/marketplace.json`).

## Develop

```bash
npm install
npm test                      # core and 32 agents
npm run evals
npm run hostile
npm run hostile:args
npm run bench
npm run intl
npm run masking
npm run accuracy              # planted, clean and one-edit cases
npm run model-view            # what reaches the AI model, per agent
npm run realdata -- --download # public data (needs the network once)
npm run release:check:offline
```

## How they are tested

See [REVIEW-ver1.md](REVIEW-ver1.md) for every check with its numbers.

## Limits

- The column layouts of named exports were written from knowledge of those systems and not checked against a live account. `inspect` shows how a file was read; `fairgive-sources.json` names columns by hand.
- Thresholds and rules (IRS figures, federal grant rules, state endowment law, your funders' terms) differ and change. They are settings; your accountant, auditor or attorney confirms them.
- Not legal, tax, audit or accounting advice. Nothing is filed with the IRS, a state or a funder, and no money is moved. A person decides what to record, send, file or pay.
- The translations of these READMEs and of the report pages were written by Claude and have not been reviewed by native speakers.

## License

MIT © 2026 Kurt Francisco
