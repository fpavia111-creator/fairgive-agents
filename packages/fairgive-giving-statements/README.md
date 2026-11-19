# fairgive-giving-statements

Builds year-end contribution statements per giver from your church or nonprofit giving records, and flags givers with no address, gifts dated in another year, refunds and loose offering with no giver. Drafts the statements for a person to send.

Part of **Fairgive**, the nonprofit, foundation, church and association back-office agents by Mythos Machines. The software is free (MIT); the paid part is a fixed-price setup on your own files. Every result is computed from your files with plain arithmetic, on your computer; no AI model is called by the tools. It reads files and writes reports and drafts; it never files, sends, pays or changes a live system, and a person on your team decides and acts on every finding.

## What it needs

Exports you already have, saved as files on your computer (CSV, Excel, JSON; see "Columns it reads" and "Exports it reads" below):

- `contributions` (required): Giving records (church management or donor CRM export): gift id, giver id, giver, date, amount, fund, method, envelope number, status (refunded gifts are recognised)
- `givers`: Optional giver list with mailing addresses: giver id, name, address
- `settings` (optional): a JSON file with your own thresholds and rules; see "Settings" below.

## What it checks

Totals each giver's contributions in the statement year by fund for the year-end statement. Leaves refunded gifts out and lists them, lists gifts with no date and loose offering with no giver, and flags givers with no mailing address.

| Finding | Example from the fictional demo data |
|---|---|
| `gift_no_date` | Gift C-11 (60) has no date, so it is not on any year's statement. |
| `giver_missing_address` | Giver GV-2 gave 500 in 2026 and has no mailing address for the statement. |
| `refund_excluded` | Gift C-6 (250, 2026-06-06) was refunded and is left out of the statement. |
| `unattributed` | 1 contribution(s) totalling 87.5 in 2026 have no giver (loose offering) and are not on any statement. |

Each item gets the most serious level of its findings: **flag** (act on it), **review** (data is missing or unclear; a person looks), **watch** (worth knowing) or **ok**. Every finding names the numbers it was worked out from.

## Settings

Put the ones you want to change in a JSON file and pass it as `settings`; anything left out uses the default. The result lists the settings it used under `settings_used`.

| Setting | Default | Meaning |
|---|---|---|
| `year` | `null` | Statement year (default: the latest year in the file) |
| `organization` | `""` | Your church or organization name for the statements |
| `intangible_religious_benefits` | `true` | Word the goods-and-services sentence for a church (intangible religious benefits) when true (default true) |

<!-- generated:start -->

## A demo run

`npx -y fairgive-giving-statements demo` runs the agent on the fictional files in [`fixtures/`](fixtures) in a temporary folder. Captured output:

```text
Fairgive Giving Statements demo (fictional nonprofit data), Auto mode on

▶ Run the check on the exported files
  status: executed  decision: allow
  6 giver(s) in 2026: statements total 2,400.00; 1 with no address, refunds left out 250.00, loose offering not on statements 87.50.
    flag    GV-2                                giver_missing_address
    review  GV-3                                refund_excluded
    review  GV-6                                gift_no_date
    watch   Unattributed                        unattributed

▶ Explain GV-3
  status: executed  decision: allow
  GV-3: review. Gift C-6 (250, 2026-06-06) was refunded and is left out of the statement.

▶ Write the report (CSV worklist and HTML page)
  status: executed  decision: allow
  Giving statements written: 6 giver(s) in 2026: statements total 2,400.00; 1 with no address, refunds left out 250.00, loose offering not on statements 87.50.

▶ Write a draft (Auto is opted in for drafts here)
  status: executed  decision: allow  (auto)
  statement GV-1 drafted for 350 with 1 open marker(s) ([TO CONFIRM wording with your treasurer]). Nothing was sent.

▶ Auto: approving the draft stays one named click
  status: needs_approval  decision: ask
  reason: binding_send stays one-click, even in Auto

▶ Same call after the named click (recorded; a person acts on it)
  status: executed  decision: ask  approved by: Morgan Manager (fictional)
  statement GV-1 approved and recorded. Nothing was sent or paid by the agent.

▶ The agent tries email_send itself
  status: blocked  decision: block
  reason: Never sends email, letters or messages; a person sends the reviewed draft.

Audit log: <demo folder>/.fairgive/audit.jsonl
```

## Tools

| Tool | What it does | Policy |
|---|---|---|
| `statements_check` | Totals each giver's contributions in the statement year by fund for the year-end statement. | runs |
| `statements_explain` | Show one giver from statements_check with every finding, the numbers behind it and the setting it was checked against. | runs |
| `statements_write_report` | Write giving-statements.csv (one row per item, with blank owner and decision columns) and giving-statements.html into out_dir (default fairgive-out/statements). | runs |
| `statements_draft_statement` | Write drafts/statement-<giver id>.md: the year-end contribution statement for one giver, every gift with its date, fund and amount, and the goods-and-services sentence. | asks first (Auto can be opted in) |
| `statements_request_send` | After one named human click (even in Auto), record that the reviewed statement draft is approved in statement-requests.csv. | one named click, even in Auto (`binding_send`) |
| `statements_recall` | Search this agent's own memory of the customer's setup: accepted facts (in use) and facts waiting for a person. | runs |
| `statements_learn` | Propose one fact about the customer's setup for this agent to remember. | runs |
| `statements_accept_learning` | A named person accepts or rejects a fact waiting in this agent's memory. | one named click, even in Auto (`accept_learning`) |
| `statements_retire_memory` | A named person stops an accepted fact from applying. | one named click, even in Auto (`accept_learning`) |
| `email_send` | Never sends email, letters or messages; a person sends the reviewed draft. | refused |
| `crm_update_records` | Never changes, merges or deletes records in the donor CRM; a person does that in the CRM. | refused |

Any tool name not in this table is blocked, including names a model invents. `refused` tools are listed so a model can see they exist and are refused.

## Columns it reads

Table inputs can be CSV, TSV, semicolon- or pipe-separated text, Excel `.xlsx`, JSON or JSONL. Columns are matched by the agent's own name, then by the English names below, then by their names in German, French, Spanish, Portuguese, Italian, Japanese, Chinese and Korean. Dates become `YYYY-MM-DD`; amounts are read with either decimal mark; weights, distances and dimensions are converted when the column says it holds kilograms, kilometres or centimetres. Every result lists under `sources` how each file was read.

### Contributions (`contributions`)

| Column | Type | Also read as | For example, in other languages |
|---|---|---|---|
| `gift_id` (required) | text | Gift ID, Contribution ID, Transaction ID, Batch Item | Spenden-ID, N° de don, 寄付ID, 捐款编号 |
| `giver_id` | text | Giver ID, Donor ID, Member ID, Person ID, Household ID | Spendernummer, N° de donateur, 寄付者ID, 捐赠人编号 |
| `giver` | text | Giver, Donor, Name, Household, Giver Name | Spender, Donateur, 寄付者, 捐赠人 |
| `date` | date | Date, Gift Date, Contribution Date, Received Date | Datum, Date, 日付, 日期 |
| `amount` | amount | Amount, Gift Amount, Contribution Amount | Betrag, Montant, 金額, 金额 |
| `fund` | text | Fund, Fund Name, Designation, Category | Fonds, Fonds, 基金, 基金 |
| `method` | text | Method, Payment Method, Type | Zahlungsart, Mode de paiement, 支払方法, 付款方式 |
| `envelope` | text | Envelope, Envelope Number, Env # | Umschlagnummer, N° d'enveloppe, 献金袋番号, 奉献袋编号 |
| `status` | text | Status, Gift Status | Status, Statut, ステータス, 状态 |

### Givers (`givers`)

| Column | Type | Also read as | For example, in other languages |
|---|---|---|---|
| `giver_id` (required) | text | Giver ID, Donor ID, Member ID, Household ID | Spendernummer, N° de donateur, 寄付者ID, 捐赠人编号 |
| `giver` | text | Giver, Name, Household | Spender, Donateur, 寄付者, 捐赠人 |
| `address` | text | Address, Mailing Address, Street | Adresse, Adresse, 住所, 地址 |

### Files from other countries

A German export in Windows-1252 with semicolons, `1.234,56` and `03.11.2026`, or a Japanese one in Shift_JIS with `2026/11/03`, is read the same way as the English file. [`fixtures/intl/`](fixtures/intl) has both versions of the demo data, and the eval cases `intl-de-*` and `intl-ja-*` require the same results as the English case. A weight, distance or dimension column found by its translated name with no unit in it is read as metric and converted, and the result says so. Columns named differently? Run `npx fairgive-giving-statements inspect <file>` (names and shapes only, never values) and name them in `fairgive-sources.json`:

```json
{ "files": { "exports/bills.csv": { "columns": { "invoice_number": "Beleg" }, "date_order": "dmy", "units": { "weight": "kg" } } } }
```

## Memory

fairgive-giving-statements can remember facts about your setup so the next run does not have to be told again. `statements_learn` only proposes a fact; it changes nothing until a named person accepts it with `statements_accept_learning`, which is one click even in Auto. Facts live in one hash-chained file per agent under `.fairgive/memory/`; if the chain does not verify, no fact is used. Credentials, personal identifiers and text that reads like instructions to an AI are refused. Run without memory with `--no-memory`.

| Kind | What an accepted fact changes |
|---|---|
| `note` | nothing (shown by recall only) |

```bash
fairgive-giving-statements memory list
fairgive-giving-statements memory accept MEM-1a2b3c4d5e6f --as "Your Name"
fairgive-giving-statements memory retire MEM-1a2b3c4d5e6f --as "Your Name" --reason "carrier renamed"
```

<!-- sources:start -->
## Exports it reads

Table inputs can be CSV, TSV, semicolon- or pipe-separated text, Excel `.xlsx`, JSON or JSONL. A file already in this agent's own columns is read as it is. The exports below are recognised by their column names and mapped onto those columns; dates become `YYYY-MM-DD`, amounts plain decimals (both decimal marks), and yes/no columns `yes`/`no`. Each result lists, under `sources`, which export was recognised, which columns were mapped, and any rows skipped or dates that could be read two ways.

**Contributions** (argument `contributions`)

No named exports: other column names are matched by a list of common alternatives.

**Givers** (argument `givers`)

No named exports: other column names are matched by a list of common alternatives.

Columns named differently? Run `npx fairgive-giving-statements inspect <file>` to see how a file is read (column names and shapes only, never values), then name your columns in `fairgive-sources.json` in the root:

```json
{ "files": { "exports/users.csv": { "columns": { "email": "Work E-mail" }, "date_order": "dmy" } } }
```

Where a layout says "checked", its column names were compared with the vendor's documentation on that date. The other layouts were written from knowledge of the export and were not checked. None was tested against a live account. If a real export does not match, the result says which columns were missing; please report it.
<!-- sources:end -->

## Install

Node 20 or newer. No other dependencies.

```bash
npx -y fairgive-giving-statements demo
npx -y fairgive-giving-statements mcp --root /path/to/your/files
```

Claude Desktop, Cursor and other MCP hosts:

```json
{
  "mcpServers": {
    "fairgive-giving-statements": {
      "command": "npx",
      "args": [
        "-y",
        "fairgive-giving-statements",
        "mcp",
        "--root",
        "/path/to/your/files"
      ]
    }
  }
}
```

Claude Code: `claude mcp add fairgive-giving-statements -- npx -y fairgive-giving-statements mcp --root .`, or install the `fairgive-giving-statements` plugin from this repository's marketplace.

## Modes and approvals

- **Review** (`--mode review`): reads and reports only.
- **Assist** (default): the policy above. A tool that asks returns an `approval_id`; a person approves it once with `fairgive-giving-statements approve <id> --as "Your Name"` (or on the local approvals page, `fairgive-giving-statements approvals`), and the same call is repeated.
- **Auto** (`--mode auto --auto <tool,...>`): opt-in per tool, with step caps and a kill switch (`fairgive-giving-statements kill`). Paying, sending, posting to a ledger or a live system and accepting a learned fact stay **one named click even in Auto**; an approval is tied to the sha256 of the reviewed draft, so a changed draft needs a new click.

## CLI

```bash
fairgive-giving-statements tools                 # every tool, its policy and arguments
fairgive-giving-statements sources               # the columns each input is read from
fairgive-giving-statements inspect <file>        # how a file would be read (names and shapes, never values)
fairgive-giving-statements call statements_check '{"contributions":"<contributions>"}'
fairgive-giving-statements eval                  # the private eval cases on the fictional fixtures
fairgive-giving-statements demo
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
