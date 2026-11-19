# fairgive-quid-pro-quo

Finds payments over your quid pro quo threshold where the donor received goods or services and the receipt has no disclosure, no fair market value or the wrong deductible amount. Thresholds are settings. Not tax advice.

Part of **Fairgive**, the nonprofit, foundation, church and association back-office agents by Mythos Machines. The software is free (MIT); the paid part is a fixed-price setup on your own files. Every result is computed from your files with plain arithmetic, on your computer; no AI model is called by the tools. It reads files and writes reports; it never files, sends, pays or changes a live system, and a person on your team decides and acts on every finding.

## What it needs

Exports you already have, saved as files on your computer (CSV, Excel, JSON; see "Columns it reads" and "Exports it reads" below):

- `payments` (required): Payments where the donor may have received something (event tickets, auction purchases, premiums): gift id, donor, date, amount, benefit, benefit value, the deductible amount the receipt states, disclosure given (yes/no)
- `settings` (optional): a JSON file with your own thresholds and rules; see "Settings" below.

## What it checks

For each payment where the donor received goods or services: works out the deductible part (payment less the value received), skips benefits inside the insubstantial-benefit limits in the settings, and lists payments over the threshold with no disclosure, receipts that state the wrong deductible amount, benefits with no value and benefits worth as much as the payment.

| Finding | Example from the fictional demo data |
|---|---|
| `benefit_over_payment` | Payment Q-6 of 200 bought "Auction item: weekend cabin" valued at 250: nothing is a contribution. |
| `deductible_wrong` | Payment Q-2: the receipt says 150 is deductible; payment 150 less benefit 60 is 90. |
| `disclosure_missing` | Payment Q-2 of 150 is over 75 and the donor received "Gala dinner" (60); no written disclosure is recorded. |
| `fmv_missing` | Payment Q-4 of 500 came with "Golf round and lunch" and no value for it, so the deductible part cannot be worked out. |
| `insubstantial_benefit` | Payment Q-3: "Logo tote bag" (8) is within the insubstantial-benefit limits in the settings, so it can be treated as fully deductible. |

Each item gets the most serious level of its findings: **flag** (act on it), **review** (data is missing or unclear; a person looks), **watch** (worth knowing) or **ok**. Every finding names the numbers it was worked out from.

## Settings

Put the ones you want to change in a JSON file and pass it as `settings`; anything left out uses the default. The result lists the settings it used under `settings_used`.

| Setting | Default | Meaning |
|---|---|---|
| `qpq_threshold` | `75` | Payments over this need a written disclosure when a benefit was received (default 75) |
| `low_cost_article` | `13.6` | Value of a low-cost article that counts as insubstantial (default 13.60, the 2025 IRS figure; update yearly) |
| `low_cost_min_payment` | `68` | Smallest payment for the low-cost article rule (default 68, the 2025 IRS figure; update yearly) |
| `insubstantial_pct` | `2` | Benefit up to this percent of the payment is insubstantial (default 2) |
| `insubstantial_cap` | `136` | and no more than this amount (default 136, the 2025 IRS figure; update yearly) |
| `tolerance` | `0.01` | Difference ignored (default 0.01) |

<!-- generated:start -->

## A demo run

`npx -y fairgive-quid-pro-quo demo` runs the agent on the fictional files in [`fixtures/`](fixtures) in a temporary folder. Captured output:

```text
Fairgive Quid Pro Quo demo (fictional nonprofit data), Auto mode on

▶ Run the check on the exported files
  status: executed  decision: allow
  8 payment(s), 7 with a benefit: 1 with no disclosure, 1 receipt(s) to correct (deductible overstated by 60.00).
    flag    Q-2                                 disclosure_missing, deductible_wrong
    review  Q-4                                 fmv_missing
    review  Q-6                                 benefit_over_payment
    watch   Q-3                                 insubstantial_benefit

▶ Explain Q-2
  status: executed  decision: allow
  Q-2: flag. Payment Q-2 of 150 is over 75 and the donor received "Gala dinner" (60); no written disclosure is recorded. Payment Q-2: the receipt says 150 is deductible; payment 150 less benefit 60 is 90.

▶ Write the report (CSV worklist and HTML page)
  status: executed  decision: allow
  Quid pro quo disclosures written: 8 payment(s), 7 with a benefit: 1 with no disclosure, 1 receipt(s) to correct (deductible overstated by 60.00).

▶ The agent tries email_send itself
  status: blocked  decision: block
  reason: Never sends email, letters or messages; a person sends the reviewed draft.

Audit log: <demo folder>/.fairgive/audit.jsonl
```

## Tools

| Tool | What it does | Policy |
|---|---|---|
| `qpq_check` | For each payment where the donor received goods or services: works out the deductible part (payment less the value received), skips benefits inside the insubstantial-benefit limits in the settings, and lists payments … | runs |
| `qpq_explain` | Show one payment from qpq_check with every finding, the numbers behind it and the setting it was checked against. | runs |
| `qpq_write_report` | Write quid-pro-quo.csv (one row per item, with blank owner and decision columns) and quid-pro-quo.html into out_dir (default fairgive-out/qpq). | runs |
| `qpq_recall` | Search this agent's own memory of the customer's setup: accepted facts (in use) and facts waiting for a person. | runs |
| `qpq_learn` | Propose one fact about the customer's setup for this agent to remember. | runs |
| `qpq_accept_learning` | A named person accepts or rejects a fact waiting in this agent's memory. | one named click, even in Auto (`accept_learning`) |
| `qpq_retire_memory` | A named person stops an accepted fact from applying. | one named click, even in Auto (`accept_learning`) |
| `email_send` | Never sends email, letters or messages; a person sends the reviewed draft. | refused |
| `irs_file` | Never files a Form 990, 1099 or any return with the IRS or a state, and gives no tax advice. | refused |

Any tool name not in this table is blocked, including names a model invents. `refused` tools are listed so a model can see they exist and are refused.

## Columns it reads

Table inputs can be CSV, TSV, semicolon- or pipe-separated text, Excel `.xlsx`, JSON or JSONL. Columns are matched by the agent's own name, then by the English names below, then by their names in German, French, Spanish, Portuguese, Italian, Japanese, Chinese and Korean. Dates become `YYYY-MM-DD`; amounts are read with either decimal mark; weights, distances and dimensions are converted when the column says it holds kilograms, kilometres or centimetres. Every result lists under `sources` how each file was read.

### Payments with benefits (`payments`)

| Column | Type | Also read as | For example, in other languages |
|---|---|---|---|
| `gift_id` (required) | text | Gift ID, Donation ID, Opportunity ID, Transaction ID, Gift Number, Gift No | Spenden-ID, N° de don, 寄付ID, 捐款编号 |
| `donor` | text | Donor Name, Donor, Constituent Name, Account Name, Name, Full Name | Spender, Donateur, 寄付者, 捐赠人 |
| `gift_date` | date | Gift Date, Donation Date, Close Date, Date, Transaction Date, Received Date | Spendendatum, Date du don, 寄付日, 捐赠日期 |
| `amount` | amount | Amount, Gift Amount, Donation Amount, Total Amount, Gross Amount, Payment Amount | Betrag, Montant, 金額, 金额 |
| `benefit` | text | Benefit, Benefit Description, Premium, Goods or Services, Item Received | - |
| `benefit_value` | amount | Benefit Value, Fair Market Value, FMV, Premium Value, Goods and Services Value, Non-Deductible Amount | Wert der Gegenleistung, Valeur des contreparties, 公正価値, 公允价值 |
| `receipt_deductible` | amount | Receipt Deductible, Deductible Amount, Tax Deductible Amount, Receipt Amount, Receiptable Amount | Abzugsfähiger Betrag, Montant déductible, 控除対象額, 可抵扣金额 |
| `disclosure` | text | Disclosure, Disclosure Given, QPQ Disclosure, Quid Pro Quo Statement | - |

Named exports recognised by their column names:

| System | Export | Recognised by | Layout checked against vendor docs |
|---|---|---|---|
| Blackbaud Raiser's Edge NXT | Gift list or query export (CSV) | Gift ID, Constituent ID, Gift Amount or Amount | no |
| Salesforce Nonprofit Success Pack | Opportunities (donations) report export | Opportunity ID, Account Name or Account: Account Name, Close Date | no |
| Bloomerang | Transactions export | Transaction Number, Account Number, Amount | no |
| DonorPerfect | Gift export (field names) | gift_id, donor_id, gl_code | no |
| Little Green Light | Gifts export | LGL Gift ID, LGL Constituent ID, Gift Amount | no |
| Neon CRM | Donation report export | Donation ID, Account ID, Donation Amount | no |
| Givebutter | Transactions export | Transaction ID, Campaign Code, Amount or Donated | no |
| GoFundMe Pro (Classy) | Transactions export | Transaction ID, Campaign Name, Gross Transaction Amount or Gross Amount | no |

Where a layout says "checked", its column names were compared with the vendor's documentation on that date. The other layouts were written from knowledge of the export and were not checked. None was tested against a live account.

### Files from other countries

A German export in Windows-1252 with semicolons, `1.234,56` and `03.11.2026`, or a Japanese one in Shift_JIS with `2026/11/03`, is read the same way as the English file. [`fixtures/intl/`](fixtures/intl) has both versions of the demo data, and the eval cases `intl-de-*` and `intl-ja-*` require the same results as the English case. A weight, distance or dimension column found by its translated name with no unit in it is read as metric and converted, and the result says so. Columns named differently? Run `npx fairgive-quid-pro-quo inspect <file>` (names and shapes only, never values) and name them in `fairgive-sources.json`:

```json
{ "files": { "exports/bills.csv": { "columns": { "invoice_number": "Beleg" }, "date_order": "dmy", "units": { "weight": "kg" } } } }
```

## Memory

fairgive-quid-pro-quo can remember facts about your setup so the next run does not have to be told again. `qpq_learn` only proposes a fact; it changes nothing until a named person accepts it with `qpq_accept_learning`, which is one click even in Auto. Facts live in one hash-chained file per agent under `.fairgive/memory/`; if the chain does not verify, no fact is used. Credentials, personal identifiers and text that reads like instructions to an AI are refused. Run without memory with `--no-memory`.

| Kind | What an accepted fact changes |
|---|---|
| `note` | nothing (shown by recall only) |

```bash
fairgive-quid-pro-quo memory list
fairgive-quid-pro-quo memory accept MEM-1a2b3c4d5e6f --as "Your Name"
fairgive-quid-pro-quo memory retire MEM-1a2b3c4d5e6f --as "Your Name" --reason "carrier renamed"
```

<!-- sources:start -->
## Exports it reads

Table inputs can be CSV, TSV, semicolon- or pipe-separated text, Excel `.xlsx`, JSON or JSONL. A file already in this agent's own columns is read as it is. The exports below are recognised by their column names and mapped onto those columns; dates become `YYYY-MM-DD`, amounts plain decimals (both decimal marks), and yes/no columns `yes`/`no`. Each result lists, under `sources`, which export was recognised, which columns were mapped, and any rows skipped or dates that could be read two ways.

**Payments with benefits** (argument `payments`)

| System | Export | Layout checked against vendor docs |
|---|---|---|
| Blackbaud Raiser's Edge NXT | Gift list or query export (CSV) | no |
| Salesforce Nonprofit Success Pack | Opportunities (donations) report export | no |
| Bloomerang | Transactions export | no |
| DonorPerfect | Gift export (field names) | no |
| Little Green Light | Gifts export | no |
| Neon CRM | Donation report export | no |
| Givebutter | Transactions export | no |
| GoFundMe Pro (Classy) | Transactions export | no |

Columns named differently? Run `npx fairgive-quid-pro-quo inspect <file>` to see how a file is read (column names and shapes only, never values), then name your columns in `fairgive-sources.json` in the root:

```json
{ "files": { "exports/users.csv": { "columns": { "email": "Work E-mail" }, "date_order": "dmy" } } }
```

Where a layout says "checked", its column names were compared with the vendor's documentation on that date. The other layouts were written from knowledge of the export and were not checked. None was tested against a live account. If a real export does not match, the result says which columns were missing; please report it.
<!-- sources:end -->

## Install

Node 20 or newer. No other dependencies.

```bash
npx -y fairgive-quid-pro-quo demo
npx -y fairgive-quid-pro-quo mcp --root /path/to/your/files
```

Claude Desktop, Cursor and other MCP hosts:

```json
{
  "mcpServers": {
    "fairgive-quid-pro-quo": {
      "command": "npx",
      "args": [
        "-y",
        "fairgive-quid-pro-quo",
        "mcp",
        "--root",
        "/path/to/your/files"
      ]
    }
  }
}
```

Claude Code: `claude mcp add fairgive-quid-pro-quo -- npx -y fairgive-quid-pro-quo mcp --root .`, or install the `fairgive-quid-pro-quo` plugin from this repository's marketplace.

## Modes and approvals

- **Review** (`--mode review`): reads and reports only.
- **Assist** (default): the policy above. A tool that asks returns an `approval_id`; a person approves it once with `fairgive-quid-pro-quo approve <id> --as "Your Name"` (or on the local approvals page, `fairgive-quid-pro-quo approvals`), and the same call is repeated.
- **Auto** (`--mode auto --auto <tool,...>`): opt-in per tool, with step caps and a kill switch (`fairgive-quid-pro-quo kill`). Paying, sending, posting to a ledger or a live system and accepting a learned fact stay **one named click even in Auto**; an approval is tied to the sha256 of the reviewed draft, so a changed draft needs a new click.

## CLI

```bash
fairgive-quid-pro-quo tools                 # every tool, its policy and arguments
fairgive-quid-pro-quo sources               # the columns each input is read from
fairgive-quid-pro-quo inspect <file>        # how a file would be read (names and shapes, never values)
fairgive-quid-pro-quo call qpq_check '{"payments":"<payments>"}'
fairgive-quid-pro-quo eval                  # the private eval cases on the fictional fixtures
fairgive-quid-pro-quo demo
```

## Audit log and data

Every call is written to `.fairgive/audit.jsonl` under the root: hash-chained JSON lines, with arguments stored as a hash, signed with an Ed25519 key when you configure one. Everything runs on your machine on files you choose. No network calls, no telemetry, no credentials. The bundled fixtures are fictional.

<!-- generated:end -->

## Limits

- Reads only the files you give it. It does not log in to a donor CRM, giving platform, payment processor, bank, payroll or accounting system, and changes nothing in them.
- Thresholds, rates, dates and policies are settings in your own file, with working defaults; check them against your own policies, funder agreements and current rules before you rely on them.
- Not legal, tax, audit or accounting advice. A person decides what to record, send, file or pay.
- Names, e-mails, phone numbers, street addresses and taxpayer ids of donors, members, volunteers, staff and vendors are masked in results returned to the AI model. The report and draft files written here keep the real values: keep them in a private folder.
- Column names for the named exports were written from knowledge of those systems and not checked against a live account; `inspect` shows how a file was read and `fairgive-sources.json` names columns by hand.
- The bundled fixtures are fictional. Version 0.1.0; nothing has been published yet.
