# fairgive-lapsed-donors

Lists donors who gave last year but not this year (LYBUNT) and in an earlier year but not this one (SYBUNT), with retention, upgrades and downgrades by fiscal year. Reads your gift export only. Never contacts anyone.

Part of **Fairgive**, the nonprofit, foundation, church and association back-office agents by Fair Agents. The software is free (MIT); the paid part is a fixed-price setup on your own files. Every result is computed from your files with plain arithmetic, on your computer; no AI model is called by the tools. It reads files and writes reports; it never files, sends, pays or changes a live system, and a person on your team decides and acts on every finding.

## What it needs

Exports you already have, saved as files on your computer (CSV, Excel, JSON; see "Columns it reads" and "Exports it reads" below):

- `gifts` (required): Gift export from your donor CRM covering at least the look-back years: donor id, donor, gift date, amount
- `settings` (optional): a JSON file with your own thresholds and rules; see "Settings" below.

## What it checks

Totals each donor's giving by fiscal year and lists donors who gave last year and not yet this year (LYBUNT), donors who gave in an earlier year of the look-back and not since (SYBUNT), donors giving well below last year so far, and new donors. Shows retention: last year's donors who gave again this year.

| Finding | Example from the fictional demo data |
|---|---|
| `downgraded` | FY2027 so far 200, against 1000 in FY2026. |
| `lybunt` | Gave 1000 in FY2026 and nothing yet in FY2027 (last gift 2026-03-01). |
| `sybunt` | Last gave in FY2024 (300; last gift 2024-01-10), nothing in FY2026 or FY2027. |

Each item gets the most serious level of its findings: **flag** (act on it), **review** (data is missing or unclear; a person looks), **watch** (worth knowing) or **ok**. Every finding names the numbers it was worked out from.

## Settings

Put the ones you want to change in a JSON file and pass it as `settings`; anything left out uses the default. The result lists the settings it used under `settings_used`.

| Setting | Default | Meaning |
|---|---|---|
| `fiscal_year_start` | `1` | First month of your fiscal year (1 = January, 7 = July; default 1) |
| `as_of` | `null` | Date the check is made at (YYYY-MM-DD); default: the latest gift date |
| `lookback_years` | `4` | Fiscal years before this one that count for SYBUNT (default 4) |
| `downgrade_pct` | `25` | Percent below last year that counts as a downgrade so far (default 25) |

<!-- generated:start -->

## A demo run

`npx -y fairgive-lapsed-donors demo` runs the agent on the fictional files in [`fixtures/`](fixtures) in a temporary folder. Captured output:

```text
Fairgive Lapsed Donors demo (fictional nonprofit data), Auto mode on

▶ Run the check on the exported files
  status: executed  decision: allow
  FY2027 as of 2026-11-18: 2 LYBUNT donor(s) (1,500.00 last year), 2 SYBUNT (375.00), 1 new. Retention 60% (3 of 5).
    flag    C-2                                 lybunt
    flag    C-3                                 lybunt
    review  C-4                                 sybunt
    review  C-5                                 sybunt
    watch   C-7                                 downgraded

▶ Explain C-2
  status: executed  decision: allow
  C-2: flag. Gave 1000 in FY2026 and nothing yet in FY2027 (last gift 2026-03-01).

▶ Write the report (CSV worklist and HTML page)
  status: executed  decision: allow
  Lapsed donors written: FY2027 as of 2026-11-18: 2 LYBUNT donor(s) (1,500.00 last year), 2 SYBUNT (375.00), 1 new. Retention 60% (3 of 5).

▶ The agent tries email_send itself
  status: blocked  decision: block
  reason: Never sends email, letters or messages; a person sends the reviewed draft.

Audit log: <demo folder>/.fairgive/audit.jsonl
```

## Tools

| Tool | What it does | Policy |
|---|---|---|
| `lapsed_check` | Totals each donor's giving by fiscal year and lists donors who gave last year and not yet this year (LYBUNT), donors who gave in an earlier year of the look-back and not since (SYBUNT), donors giving well below last y… | runs |
| `lapsed_explain` | Show one donor from lapsed_check with every finding, the numbers behind it and the setting it was checked against. | runs |
| `lapsed_write_report` | Write lapsed-donors.csv (one row per item, with blank owner and decision columns) and lapsed-donors.html into out_dir (default fairgive-out/lapsed). | runs |
| `lapsed_recall` | Search this agent's own memory of the customer's setup: accepted facts (in use) and facts waiting for a person. | runs |
| `lapsed_learn` | Propose one fact about the customer's setup for this agent to remember. | runs |
| `lapsed_accept_learning` | A named person accepts or rejects a fact waiting in this agent's memory. | one named click, even in Auto (`accept_learning`) |
| `lapsed_retire_memory` | A named person stops an accepted fact from applying. | one named click, even in Auto (`accept_learning`) |
| `email_send` | Never sends email, letters or messages; a person sends the reviewed draft. | refused |
| `crm_update_records` | Never changes, merges or deletes records in the donor CRM; a person does that in the CRM. | refused |

Any tool name not in this table is blocked, including names a model invents. `refused` tools are listed so a model can see they exist and are refused.

## Columns it reads

Table inputs can be CSV, TSV, semicolon- or pipe-separated text, Excel `.xlsx`, JSON or JSONL. Columns are matched by the agent's own name, then by the English names below, then by their names in German, French, Spanish, Portuguese, Italian, Japanese, Chinese and Korean. Dates become `YYYY-MM-DD`; amounts are read with either decimal mark; weights, distances and dimensions are converted when the column says it holds kilograms, kilometres or centimetres. Every result lists under `sources` how each file was read.

### CRM gifts (`gifts`)

| Column | Type | Also read as | For example, in other languages |
|---|---|---|---|
| `gift_id` (required) | text | Gift ID, Donation ID, Opportunity ID, Transaction ID, Gift Number, Gift No | Spenden-ID, N° de don, 寄付ID, 捐款编号 |
| `donor_id` | text | Constituent ID, Donor ID, Account ID, Contact ID, Account Number, LGL Constituent ID | Spendernummer, N° de donateur, 寄付者ID, 捐赠人编号 |
| `donor` | text | Donor Name, Donor, Constituent Name, Account Name, Name, Full Name | Spender, Donateur, 寄付者, 捐赠人 |
| `gift_date` | date | Gift Date, Donation Date, Close Date, Date, Transaction Date, Received Date | Spendendatum, Date du don, 寄付日, 捐赠日期 |
| `amount` | amount | Amount, Gift Amount, Donation Amount, Total Amount, Gross Amount, Payment Amount | Betrag, Montant, 金額, 金额 |

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

A German export in Windows-1252 with semicolons, `1.234,56` and `03.11.2026`, or a Japanese one in Shift_JIS with `2026/11/03`, is read the same way as the English file. [`fixtures/intl/`](fixtures/intl) has both versions of the demo data, and the eval cases `intl-de-*` and `intl-ja-*` require the same results as the English case. A weight, distance or dimension column found by its translated name with no unit in it is read as metric and converted, and the result says so. Columns named differently? Run `npx fairgive-lapsed-donors inspect <file>` (names and shapes only, never values) and name them in `fairgive-sources.json`:

```json
{ "files": { "exports/bills.csv": { "columns": { "invoice_number": "Beleg" }, "date_order": "dmy", "units": { "weight": "kg" } } } }
```

## Memory

fairgive-lapsed-donors can remember facts about your setup so the next run does not have to be told again. `lapsed_learn` only proposes a fact; it changes nothing until a named person accepts it with `lapsed_accept_learning`, which is one click even in Auto. Facts live in one hash-chained file per agent under `.fairgive/memory/`; if the chain does not verify, no fact is used. Credentials, personal identifiers and text that reads like instructions to an AI are refused. Run without memory with `--no-memory`.

| Kind | What an accepted fact changes |
|---|---|
| `note` | nothing (shown by recall only) |

```bash
fairgive-lapsed-donors memory list
fairgive-lapsed-donors memory accept MEM-1a2b3c4d5e6f --as "Your Name"
fairgive-lapsed-donors memory retire MEM-1a2b3c4d5e6f --as "Your Name" --reason "carrier renamed"
```

<!-- sources:start -->
## Exports it reads

Table inputs can be CSV, TSV, semicolon- or pipe-separated text, Excel `.xlsx`, JSON or JSONL. A file already in this agent's own columns is read as it is. The exports below are recognised by their column names and mapped onto those columns; dates become `YYYY-MM-DD`, amounts plain decimals (both decimal marks), and yes/no columns `yes`/`no`. Each result lists, under `sources`, which export was recognised, which columns were mapped, and any rows skipped or dates that could be read two ways.

**CRM gifts** (argument `gifts`)

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

Columns named differently? Run `npx fairgive-lapsed-donors inspect <file>` to see how a file is read (column names and shapes only, never values), then name your columns in `fairgive-sources.json` in the root:

```json
{ "files": { "exports/users.csv": { "columns": { "email": "Work E-mail" }, "date_order": "dmy" } } }
```

Where a layout says "checked", its column names were compared with the vendor's documentation on that date. The other layouts were written from knowledge of the export and were not checked. None was tested against a live account. If a real export does not match, the result says which columns were missing; please report it.
<!-- sources:end -->

## Install

Node 20 or newer. No other dependencies.

```bash
npx -y fairgive-lapsed-donors demo
npx -y fairgive-lapsed-donors mcp --root /path/to/your/files
```

Claude Desktop, Cursor and other MCP hosts:

```json
{
  "mcpServers": {
    "fairgive-lapsed-donors": {
      "command": "npx",
      "args": [
        "-y",
        "fairgive-lapsed-donors",
        "mcp",
        "--root",
        "/path/to/your/files"
      ]
    }
  }
}
```

Claude Code: `claude mcp add fairgive-lapsed-donors -- npx -y fairgive-lapsed-donors mcp --root .`, or install the `fairgive-lapsed-donors` plugin from this repository's marketplace.

## Modes and approvals

- **Review** (`--mode review`): reads and reports only.
- **Assist** (default): the policy above. A tool that asks returns an `approval_id`; a person approves it once with `fairgive-lapsed-donors approve <id> --as "Your Name"` (or on the local approvals page, `fairgive-lapsed-donors approvals`), and the same call is repeated.
- **Auto** (`--mode auto --auto <tool,...>`): opt-in per tool, with step caps and a kill switch (`fairgive-lapsed-donors kill`). Paying, sending, posting to a ledger or a live system and accepting a learned fact stay **one named click even in Auto**; an approval is tied to the sha256 of the reviewed draft, so a changed draft needs a new click.

## CLI

```bash
fairgive-lapsed-donors tools                 # every tool, its policy and arguments
fairgive-lapsed-donors sources               # the columns each input is read from
fairgive-lapsed-donors inspect <file>        # how a file would be read (names and shapes, never values)
fairgive-lapsed-donors call lapsed_check '{"gifts":"<gifts>"}'
fairgive-lapsed-donors eval                  # the private eval cases on the fictional fixtures
fairgive-lapsed-donors demo
```

## Audit log and data

Every call is written to `.fairgive/audit.jsonl` under the root: hash-chained JSON lines, with arguments stored as a hash, signed with an Ed25519 key when you configure one. Everything runs on your machine on files you choose. No network calls, no telemetry, no credentials. The bundled fixtures are fictional.

<!-- generated:end -->

## Limits

- Reads only the files you give it. It does not log in to a donor CRM, giving platform, payment processor, bank, payroll or accounting system, and changes nothing in them.
- Thresholds, rates, dates and policies are settings in your own file, with working defaults; check them against your own policies, funder agreements and current rules before you rely on them.
- Not legal, tax, audit or accounting advice. A person decides what to record, send, file or pay.
- Names, e-mails, phone numbers, street addresses and taxpayer ids of donors, members, volunteers, staff and vendors are masked in results returned to the AI model. Text typed into memos, notes and bank descriptions is sent as written, so a name typed only there reaches the model. The report and draft files written here keep the real values: keep them in a private folder.
- Column names for the named exports were written from knowledge of those systems and not checked against a live account; `inspect` shows how a file was read and `fairgive-sources.json` names columns by hand.
- The bundled fixtures are fictional. Version 0.1.0; nothing has been published yet.
