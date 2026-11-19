# fairgive-pledges

Ages pledges receivable from pledge and payment exports: overdue installments, overpaid and paid-off pledges still open, write-offs without an approval, and multi-year pledges with no discount. Drafts pledge reminders. Never writes off or sends.

Part of **Fairgive**, the nonprofit, foundation, church and association back-office agents by Mythos Machines. The software is free (MIT); the paid part is a fixed-price setup on your own files. Every result is computed from your files with plain arithmetic, on your computer; no AI model is called by the tools. It reads files and writes reports and drafts; it never files, sends, pays or changes a live system, and a person on your team decides and acts on every finding.

## What it needs

Exports you already have, saved as files on your computer (CSV, Excel, JSON; see "Columns it reads" and "Exports it reads" below):

- `pledges` (required): Pledge export: pledge id, donor, e-mail, pledge date, total, number of installments, frequency, first due date, status, conditional (yes/no)
- `payments`: Pledge payments: pledge id, date, amount
- `writeoffs`: Optional write-off log: pledge id, date, amount, approved by
- `settings` (optional): a JSON file with your own thresholds and rules; see "Settings" below.

## What it checks

Splits each pledge into its installments, works out what was due by the as-of date, and ages what is past due from the oldest unpaid installment. Flags pledges over 90 days past due, overpaid pledges and write-offs with no approver or over the balance; lists pledges paid and still open, conditional pledges kept open and multi-year pledges with no discount rate. Shows the present value when a discount rate is set.

| Finding | Example from the fictional demo data |
|---|---|
| `conditional_booked` | Pledge PL-7 is marked conditional with 10000 open. A conditional pledge is usually not booked until its condition is met; check how it is recorded. |
| `multi_year_not_discounted` | Pledge PL-5 runs to 2028-01-01, more than a year after 2025-12-01, and no discount rate is set for its present value. |
| `overdue_90` | Pledge PL-2: 5000 was due by 2026-11-18, 0 paid; 5000 past due since 2026-06-30 (141 days). |
| `overdue_installment` | Pledge PL-1: 1100 was due by 2026-11-18, 1000 paid; 100 past due since 2026-11-15 (3 days). |
| `overpaid` | Pledge PL-4 is 1000 and 1100 was paid (100 over). |
| `paid_still_open` | Pledge PL-3 is paid in full (600) and still marked "Open". |
| `writeoff_no_approval` | Pledge PL-6: 2000 written off on 2026-10-01 with no approver recorded. |

Each item gets the most serious level of its findings: **flag** (act on it), **review** (data is missing or unclear; a person looks), **watch** (worth knowing) or **ok**. Every finding names the numbers it was worked out from.

## Settings

Put the ones you want to change in a JSON file and pass it as `settings`; anything left out uses the default. The result lists the settings it used under `settings_used`.

| Setting | Default | Meaning |
|---|---|---|
| `as_of` | `null` | Date the check is made at (YYYY-MM-DD); default: today |
| `buckets` | `[30,60,90]` | Aging bucket limits in days (default [30, 60, 90]) |
| `discount_rate` | `0` | Annual percent to discount installments to present value (default 0: none; your auditor sets the rate) |
| `organization` | `""` | Your organization name for the drafted reminder |
| `tolerance` | `0.01` | Difference ignored (default 0.01) |

<!-- generated:start -->

## A demo run

`npx -y fairgive-pledges demo` runs the agent on the fictional files in [`fixtures/`](fixtures) in a temporary folder. Captured output:

```text
Fairgive Pledges demo (fictional nonprofit data), Auto mode on

▶ Run the check on the exported files
  status: executed  decision: allow
  8 pledge(s) as of 2026-11-18: receivable 7,700.00 (past due 5,100.00), conditional 10,000.00, written off 2,000.00.
    flag    PL-2                                overdue_90
    flag    PL-4                                overpaid
    flag    PL-6                                writeoff_no_approval
    review  PL-1                                overdue_installment
    review  PL-3                                paid_still_open
    review  PL-7                                conditional_booked
    watch   PL-5                                multi_year_not_discounted

▶ Explain PL-2
  status: executed  decision: allow
  PL-2: flag. Pledge PL-2: 5000 was due by 2026-11-18, 0 paid; 5000 past due since 2026-06-30 (141 days).

▶ Write the report (CSV worklist and HTML page)
  status: executed  decision: allow
  Pledges receivable written: 8 pledge(s) as of 2026-11-18: receivable 7,700.00 (past due 5,100.00), conditional 10,000.00, written off 2,000.00.

▶ Write a draft (Auto is opted in for drafts here)
  status: executed  decision: allow  (auto)
  reminder PL-2 drafted for 5000 with 1 open marker(s) ([TO CONFIRM giving page or mailing address]). Nothing was sent.

▶ Auto: approving the draft stays one named click
  status: needs_approval  decision: ask
  reason: binding_send stays one-click, even in Auto

▶ Same call after the named click (recorded; a person acts on it)
  status: executed  decision: ask  approved by: Morgan Manager (fictional)
  reminder PL-2 approved and recorded. Nothing was sent or paid by the agent.

▶ The agent tries email_send itself
  status: blocked  decision: block
  reason: Never sends email, letters or messages; a person sends the reviewed draft.

Audit log: <demo folder>/.fairgive/audit.jsonl
```

## Tools

| Tool | What it does | Policy |
|---|---|---|
| `pledges_check` | Splits each pledge into its installments, works out what was due by the as-of date, and ages what is past due from the oldest unpaid installment. | runs |
| `pledges_explain` | Show one pledge from pledges_check with every finding, the numbers behind it and the setting it was checked against. | runs |
| `pledges_write_report` | Write pledges.csv (one row per item, with blank owner and decision columns) and pledges.html into out_dir (default fairgive-out/pledges). | runs |
| `pledges_draft_reminder` | Write drafts/reminder-<pledge id>.md: a friendly pledge reminder to one donor with the amount past due and the balance. | asks first (Auto can be opted in) |
| `pledges_request_send` | After one named human click (even in Auto), record that the reviewed reminder draft is approved in reminder-requests.csv. | one named click, even in Auto (`binding_send`) |
| `pledges_recall` | Search this agent's own memory of the customer's setup: accepted facts (in use) and facts waiting for a person. | runs |
| `pledges_learn` | Propose one fact about the customer's setup for this agent to remember. | runs |
| `pledges_accept_learning` | A named person accepts or rejects a fact waiting in this agent's memory. | one named click, even in Auto (`accept_learning`) |
| `pledges_retire_memory` | A named person stops an accepted fact from applying. | one named click, even in Auto (`accept_learning`) |
| `email_send` | Never sends email, letters or messages; a person sends the reviewed draft. | refused |
| `ledger_post` | Never posts journal entries or changes the books; your accountant posts the reviewed entry. | refused |
| `crm_update_records` | Never changes, merges or deletes records in the donor CRM; a person does that in the CRM. | refused |

Any tool name not in this table is blocked, including names a model invents. `refused` tools are listed so a model can see they exist and are refused.

## Columns it reads

Table inputs can be CSV, TSV, semicolon- or pipe-separated text, Excel `.xlsx`, JSON or JSONL. Columns are matched by the agent's own name, then by the English names below, then by their names in German, French, Spanish, Portuguese, Italian, Japanese, Chinese and Korean. Dates become `YYYY-MM-DD`; amounts are read with either decimal mark; weights, distances and dimensions are converted when the column says it holds kilograms, kilometres or centimetres. Every result lists under `sources` how each file was read.

### Pledges (`pledges`)

| Column | Type | Also read as | For example, in other languages |
|---|---|---|---|
| `pledge_id` (required) | text | Pledge ID, Opportunity ID, Pledge Number, Commitment ID | Zusagenummer, N° de promesse, 寄付約束番号, 认捐编号 |
| `donor_id` | text | Donor ID, Constituent ID, Account ID, Contact ID | Spendernummer, N° de donateur, 寄付者ID, 捐赠人编号 |
| `donor` | text | Donor, Donor Name, Constituent Name, Account Name, Name | Spender, Donateur, 寄付者, 捐赠人 |
| `email` | text | Email, Email Address, Donor Email | E-Mail, E-mail, メールアドレス, 邮箱 |
| `pledge_date` | date | Pledge Date, Date, Close Date, Commitment Date | Datum, Date, 日付, 日期 |
| `total` | amount | Total, Pledge Amount, Amount, Commitment Amount | Betrag, Montant, 金額, 金额 |
| `installments` | number | Installments, Number of Installments, Number of Payments, Payments | Rate, Échéance, 分割回, 分期 |
| `frequency` | text | Frequency, Installment Period, Schedule | - |
| `first_due` | date | First Due, First Installment Date, First Payment Date, Due Date, Start Date | Fälligkeitsdatum, Date d'échéance, 期日, 截止日期 |
| `status` | text | Status, Stage, Pledge Status | Status, Statut, ステータス, 状态 |
| `conditional` | text | Conditional, Is Conditional, Condition | - |

### Pledge payments (`payments`)

| Column | Type | Also read as | For example, in other languages |
|---|---|---|---|
| `pledge_id` (required) | text | Pledge ID, Opportunity ID, Pledge Number | Zusagenummer, N° de promesse, 寄付約束番号, 认捐编号 |
| `date` | date | Date, Payment Date, Received Date | Datum, Date, 日付, 日期 |
| `amount` | amount | Amount, Payment Amount, Paid Amount | Betrag, Montant, 金額, 金额 |

### Write-offs (`writeoffs`)

| Column | Type | Also read as | For example, in other languages |
|---|---|---|---|
| `pledge_id` (required) | text | Pledge ID, Opportunity ID | Zusagenummer, N° de promesse, 寄付約束番号, 认捐编号 |
| `date` | date | Date, Write-off Date | Datum, Date, 日付, 日期 |
| `amount` | amount | Amount, Write-off Amount, Written Off | Betrag, Montant, 金額, 金额 |
| `approved_by` | text | Approved By, Approver, Authorized By | Vorab genehmigt von, Pré-approuvé par, 事前承認者, 预先审批人 |

### Files from other countries

A German export in Windows-1252 with semicolons, `1.234,56` and `03.11.2026`, or a Japanese one in Shift_JIS with `2026/11/03`, is read the same way as the English file. [`fixtures/intl/`](fixtures/intl) has both versions of the demo data, and the eval cases `intl-de-*` and `intl-ja-*` require the same results as the English case. A weight, distance or dimension column found by its translated name with no unit in it is read as metric and converted, and the result says so. Columns named differently? Run `npx fairgive-pledges inspect <file>` (names and shapes only, never values) and name them in `fairgive-sources.json`:

```json
{ "files": { "exports/bills.csv": { "columns": { "invoice_number": "Beleg" }, "date_order": "dmy", "units": { "weight": "kg" } } } }
```

## Memory

fairgive-pledges can remember facts about your setup so the next run does not have to be told again. `pledges_learn` only proposes a fact; it changes nothing until a named person accepts it with `pledges_accept_learning`, which is one click even in Auto. Facts live in one hash-chained file per agent under `.fairgive/memory/`; if the chain does not verify, no fact is used. Credentials, personal identifiers and text that reads like instructions to an AI are refused. Run without memory with `--no-memory`.

| Kind | What an accepted fact changes |
|---|---|
| `note` | nothing (shown by recall only) |

```bash
fairgive-pledges memory list
fairgive-pledges memory accept MEM-1a2b3c4d5e6f --as "Your Name"
fairgive-pledges memory retire MEM-1a2b3c4d5e6f --as "Your Name" --reason "carrier renamed"
```

<!-- sources:start -->
## Exports it reads

Table inputs can be CSV, TSV, semicolon- or pipe-separated text, Excel `.xlsx`, JSON or JSONL. A file already in this agent's own columns is read as it is. The exports below are recognised by their column names and mapped onto those columns; dates become `YYYY-MM-DD`, amounts plain decimals (both decimal marks), and yes/no columns `yes`/`no`. Each result lists, under `sources`, which export was recognised, which columns were mapped, and any rows skipped or dates that could be read two ways.

**Pledges** (argument `pledges`)

No named exports: other column names are matched by a list of common alternatives.

**Pledge payments** (argument `payments`)

No named exports: other column names are matched by a list of common alternatives.

**Write-offs** (argument `writeoffs`)

No named exports: other column names are matched by a list of common alternatives.

Columns named differently? Run `npx fairgive-pledges inspect <file>` to see how a file is read (column names and shapes only, never values), then name your columns in `fairgive-sources.json` in the root:

```json
{ "files": { "exports/users.csv": { "columns": { "email": "Work E-mail" }, "date_order": "dmy" } } }
```

Where a layout says "checked", its column names were compared with the vendor's documentation on that date. The other layouts were written from knowledge of the export and were not checked. None was tested against a live account. If a real export does not match, the result says which columns were missing; please report it.
<!-- sources:end -->

## Install

Node 20 or newer. No other dependencies.

```bash
npx -y fairgive-pledges demo
npx -y fairgive-pledges mcp --root /path/to/your/files
```

Claude Desktop, Cursor and other MCP hosts:

```json
{
  "mcpServers": {
    "fairgive-pledges": {
      "command": "npx",
      "args": [
        "-y",
        "fairgive-pledges",
        "mcp",
        "--root",
        "/path/to/your/files"
      ]
    }
  }
}
```

Claude Code: `claude mcp add fairgive-pledges -- npx -y fairgive-pledges mcp --root .`, or install the `fairgive-pledges` plugin from this repository's marketplace.

## Modes and approvals

- **Review** (`--mode review`): reads and reports only.
- **Assist** (default): the policy above. A tool that asks returns an `approval_id`; a person approves it once with `fairgive-pledges approve <id> --as "Your Name"` (or on the local approvals page, `fairgive-pledges approvals`), and the same call is repeated.
- **Auto** (`--mode auto --auto <tool,...>`): opt-in per tool, with step caps and a kill switch (`fairgive-pledges kill`). Paying, sending, posting to a ledger or a live system and accepting a learned fact stay **one named click even in Auto**; an approval is tied to the sha256 of the reviewed draft, so a changed draft needs a new click.

## CLI

```bash
fairgive-pledges tools                 # every tool, its policy and arguments
fairgive-pledges sources               # the columns each input is read from
fairgive-pledges inspect <file>        # how a file would be read (names and shapes, never values)
fairgive-pledges call pledges_check '{"pledges":"<pledges>"}'
fairgive-pledges eval                  # the private eval cases on the fictional fixtures
fairgive-pledges demo
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
