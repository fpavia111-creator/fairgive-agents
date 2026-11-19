# fairgive-expense-reports

Checks staff expense report lines against your policy settings: missing receipts, meals over the per diem, mileage over the rate, alcohol and other unallowable costs charged to grants, duplicate claims and late submissions. Never pays or approves.

Part of **Fairgive**, the nonprofit, foundation, church and association back-office agents by Mythos Machines. The software is free (MIT); the paid part is a fixed-price setup on your own files. Every result is computed from your files with plain arithmetic, on your computer; no AI model is called by the tools. It reads files and writes reports; it never files, sends, pays or changes a live system, and a person on your team decides and acts on every finding.

## What it needs

Exports you already have, saved as files on your computer (CSV, Excel, JSON; see "Columns it reads" and "Exports it reads" below):

- `lines` (required): Expense report lines (Expensify, Ramp, Concur-style or spreadsheet export): report id, employee, date, category, amount, merchant, receipt (yes/no), grant code, memo, date submitted, miles for mileage
- `settings` (optional): a JSON file with your own thresholds and rules; see "Settings" below.

## What it checks

Checks each expense report line against the policy in the settings: amounts over the receipt limit with no receipt, meals over the per diem per person per day, mileage over the rate, unallowable words on grant-coded lines, the same purchase claimed twice, and reports sent long after the expense.

| Finding | Example from the fictional demo data |
|---|---|
| `duplicate_claim` | R-5: Supplies of 50 at Example Office Store on 2026-09-20 was already claimed on R-4. |
| `late_submission` | R-3 was sent on 2026-10-15, 75 days after its first expense (policy 60). |
| `meals_over_per_diem` | R-1: 75 of meals on 2026-09-10, over the 60 per diem by 15. |
| `mileage_over_rate` | R-2: 120 claimed for 100 miles; at 0.7 a mile that is 70. |
| `receipt_missing` | R-2: Supplies of 90 on 2026-09-16 at Example Office Store has no receipt (limit 75). |
| `unallowable_on_grant` | R-3: 40 on 2026-08-01 charged to grant G-FED mentions "wine", which the settings list as unallowable. |

Each item gets the most serious level of its findings: **flag** (act on it), **review** (data is missing or unclear; a person looks), **watch** (worth knowing) or **ok**. Every finding names the numbers it was worked out from.

## Settings

Put the ones you want to change in a JSON file and pass it as `settings`; anything left out uses the default. The result lists the settings it used under `settings_used`.

| Setting | Default | Meaning |
|---|---|---|
| `receipt_over` | `75` | Lines over this amount need a receipt (default 75) |
| `per_diem` | `{}` | Daily limit per category, e.g. {"Meals": 60} |
| `mileage_rate` | `null` | Rate per mile in your policy (no default; enter the rate you reimburse) |
| `unallowable_words` | `["alcohol","wine","beer","liquor","bar tab"]` | Words that mark a cost your grants do not allow |
| `grant_codes` | `[]` | Grant codes or their start (e.g. "G-") the unallowable check applies to; empty means any line with a grant code |
| `late_days` | `60` | Days after the first expense a report may be sent (default 60) |
| `tolerance` | `0.01` | Difference ignored (default 0.01) |

<!-- generated:start -->

## A demo run

`npx -y fairgive-expense-reports demo` runs the agent on the fictional files in [`fixtures/`](fixtures) in a temporary folder. Captured output:

```text
Fairgive Expense Reports demo (fictional nonprofit data), Auto mode on

▶ Run the check on the exported files
  status: executed  decision: allow
  5 report(s) for 605.00: 230.00 on flagged lines, 1 duplicate claim(s).
    flag    R-2                                 mileage_over_rate, receipt_missing
    flag    R-3                                 unallowable_on_grant, late_submission
    flag    R-5                                 duplicate_claim
    review  R-1                                 meals_over_per_diem

▶ Explain R-2
  status: executed  decision: allow
  R-2: flag. R-2: 120 claimed for 100 miles; at 0.7 a mile that is 70. R-2: Supplies of 90 on 2026-09-16 at Example Office Store has no receipt (limit 75).

▶ Write the report (CSV worklist and HTML page)
  status: executed  decision: allow
  Expense report checks written: 5 report(s) for 605.00: 230.00 on flagged lines, 1 duplicate claim(s).

▶ The agent tries payment_send itself
  status: blocked  decision: block
  reason: Never pays a vendor, grantee, employee or anyone else; your bookkeeper pays the approved amount.

Audit log: <demo folder>/.fairgive/audit.jsonl
```

## Tools

| Tool | What it does | Policy |
|---|---|---|
| `expenses_check` | Checks each expense report line against the policy in the settings: amounts over the receipt limit with no receipt, meals over the per diem per person per day, mileage over the rate, unallowable words on grant-coded l… | runs |
| `expenses_explain` | Show one report from expenses_check with every finding, the numbers behind it and the setting it was checked against. | runs |
| `expenses_write_report` | Write expense-reports.csv (one row per item, with blank owner and decision columns) and expense-reports.html into out_dir (default fairgive-out/expenses). | runs |
| `expenses_recall` | Search this agent's own memory of the customer's setup: accepted facts (in use) and facts waiting for a person. | runs |
| `expenses_learn` | Propose one fact about the customer's setup for this agent to remember. | runs |
| `expenses_accept_learning` | A named person accepts or rejects a fact waiting in this agent's memory. | one named click, even in Auto (`accept_learning`) |
| `expenses_retire_memory` | A named person stops an accepted fact from applying. | one named click, even in Auto (`accept_learning`) |
| `payment_send` | Never pays a vendor, grantee, employee or anyone else; your bookkeeper pays the approved amount. | refused |
| `expense_approve` | Never approves or reimburses an expense report; a manager does that in your expense system. | refused |

Any tool name not in this table is blocked, including names a model invents. `refused` tools are listed so a model can see they exist and are refused.

## Columns it reads

Table inputs can be CSV, TSV, semicolon- or pipe-separated text, Excel `.xlsx`, JSON or JSONL. Columns are matched by the agent's own name, then by the English names below, then by their names in German, French, Spanish, Portuguese, Italian, Japanese, Chinese and Korean. Dates become `YYYY-MM-DD`; amounts are read with either decimal mark; weights, distances and dimensions are converted when the column says it holds kilograms, kilometres or centimetres. Every result lists under `sources` how each file was read.

### Expense report lines (`lines`)

| Column | Type | Also read as | For example, in other languages |
|---|---|---|---|
| `report_id` (required) | text | Report ID, Report, Expense Report, Report Number | Spesenbericht, Note de frais, 経費精算番号, 报销单号 |
| `employee` | text | Employee, Submitter, Employee Name, Name | Mitarbeiter, Employé, 社員名, 员工 |
| `date` | date | Date, Expense Date, Transaction Date | Datum, Date, 日付, 日期 |
| `category` | text | Category, Expense Type, Type | Kategorie, Catégorie, 経費科目, 费用类别 |
| `amount` | amount | Amount, Expense Amount, Total | Betrag, Montant, 金額, 金额 |
| `merchant` | text | Merchant, Vendor, Payee | Händler, Commerçant, 支払先, 商户 |
| `receipt` | text | Receipt, Receipt Attached, Has Receipt | Wareneingang, Réception, 入庫番号, 收货单号 |
| `grant` | text | Grant, Grant Code, Project, Award | Förderkennzeichen, N° de subvention, 助成番号, 资助编号 |
| `memo` | text | Memo, Description, Purpose, Comment | Verwendungszweck, Libellé, 摘要, 摘要 |
| `submitted_date` | date | Submitted Date, Submitted, Submitted On, Report Date | Eingereicht am, Soumis le, 申請日, 提交日期 |
| `miles` | miles (km converted) | Miles, Distance, Mileage | - |

### Files from other countries

A German export in Windows-1252 with semicolons, `1.234,56` and `03.11.2026`, or a Japanese one in Shift_JIS with `2026/11/03`, is read the same way as the English file. [`fixtures/intl/`](fixtures/intl) has both versions of the demo data, and the eval cases `intl-de-*` and `intl-ja-*` require the same results as the English case. A weight, distance or dimension column found by its translated name with no unit in it is read as metric and converted, and the result says so. Columns named differently? Run `npx fairgive-expense-reports inspect <file>` (names and shapes only, never values) and name them in `fairgive-sources.json`:

```json
{ "files": { "exports/bills.csv": { "columns": { "invoice_number": "Beleg" }, "date_order": "dmy", "units": { "weight": "kg" } } } }
```

## Memory

fairgive-expense-reports can remember facts about your setup so the next run does not have to be told again. `expenses_learn` only proposes a fact; it changes nothing until a named person accepts it with `expenses_accept_learning`, which is one click even in Auto. Facts live in one hash-chained file per agent under `.fairgive/memory/`; if the chain does not verify, no fact is used. Credentials, personal identifiers and text that reads like instructions to an AI are refused. Run without memory with `--no-memory`.

| Kind | What an accepted fact changes |
|---|---|
| `note` | nothing (shown by recall only) |

```bash
fairgive-expense-reports memory list
fairgive-expense-reports memory accept MEM-1a2b3c4d5e6f --as "Your Name"
fairgive-expense-reports memory retire MEM-1a2b3c4d5e6f --as "Your Name" --reason "carrier renamed"
```

<!-- sources:start -->
## Exports it reads

Table inputs can be CSV, TSV, semicolon- or pipe-separated text, Excel `.xlsx`, JSON or JSONL. A file already in this agent's own columns is read as it is. The exports below are recognised by their column names and mapped onto those columns; dates become `YYYY-MM-DD`, amounts plain decimals (both decimal marks), and yes/no columns `yes`/`no`. Each result lists, under `sources`, which export was recognised, which columns were mapped, and any rows skipped or dates that could be read two ways.

**Expense report lines** (argument `lines`)

No named exports: other column names are matched by a list of common alternatives.

Columns named differently? Run `npx fairgive-expense-reports inspect <file>` to see how a file is read (column names and shapes only, never values), then name your columns in `fairgive-sources.json` in the root:

```json
{ "files": { "exports/users.csv": { "columns": { "email": "Work E-mail" }, "date_order": "dmy" } } }
```

Where a layout says "checked", its column names were compared with the vendor's documentation on that date. The other layouts were written from knowledge of the export and were not checked. None was tested against a live account. If a real export does not match, the result says which columns were missing; please report it.
<!-- sources:end -->

## Install

Node 20 or newer. No other dependencies.

```bash
npx -y fairgive-expense-reports demo
npx -y fairgive-expense-reports mcp --root /path/to/your/files
```

Claude Desktop, Cursor and other MCP hosts:

```json
{
  "mcpServers": {
    "fairgive-expense-reports": {
      "command": "npx",
      "args": [
        "-y",
        "fairgive-expense-reports",
        "mcp",
        "--root",
        "/path/to/your/files"
      ]
    }
  }
}
```

Claude Code: `claude mcp add fairgive-expense-reports -- npx -y fairgive-expense-reports mcp --root .`, or install the `fairgive-expense-reports` plugin from this repository's marketplace.

## Modes and approvals

- **Review** (`--mode review`): reads and reports only.
- **Assist** (default): the policy above. A tool that asks returns an `approval_id`; a person approves it once with `fairgive-expense-reports approve <id> --as "Your Name"` (or on the local approvals page, `fairgive-expense-reports approvals`), and the same call is repeated.
- **Auto** (`--mode auto --auto <tool,...>`): opt-in per tool, with step caps and a kill switch (`fairgive-expense-reports kill`). Paying, sending, posting to a ledger or a live system and accepting a learned fact stay **one named click even in Auto**; an approval is tied to the sha256 of the reviewed draft, so a changed draft needs a new click.

## CLI

```bash
fairgive-expense-reports tools                 # every tool, its policy and arguments
fairgive-expense-reports sources               # the columns each input is read from
fairgive-expense-reports inspect <file>        # how a file would be read (names and shapes, never values)
fairgive-expense-reports call expenses_check '{"lines":"<lines>"}'
fairgive-expense-reports eval                  # the private eval cases on the fictional fixtures
fairgive-expense-reports demo
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
