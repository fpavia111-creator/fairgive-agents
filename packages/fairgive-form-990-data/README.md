# fairgive-form-990-data

Checks that the data behind common Form 990 schedules is complete: Schedule B contributors over the threshold with name and address, Schedule M noncash gifts, Schedule I grants with EIN, and officer hours and pay. Files nothing; not tax advice.

Part of **Fairgive**, the nonprofit, foundation, church and association back-office agents by Mythos Machines. The software is free (MIT); the paid part is a fixed-price setup on your own files. Every result is computed from your files with plain arithmetic, on your computer; no AI model is called by the tools. It reads files and writes reports; it never files, sends, pays or changes a live system, and a person on your team decides and acts on every finding.

## What it needs

Exports you already have, saved as files on your computer (CSV, Excel, JSON; see "Columns it reads" and "Exports it reads" below):

- `gifts` (required): Gift export: gift id, donor id, donor, address, date, amount, gift type (cash or noncash), description of noncash gifts
- `officers`: Optional officers, directors and key employees: name, title, average hours per week, compensation
- `grants_paid`: Optional grants your organization paid: grantee, EIN, address, amount, purpose
- `settings` (optional): a JSON file with your own thresholds and rules; see "Settings" below.

## What it checks

Checks that the data behind common Form 990 schedules is complete for the tax year: contributors at or over the Schedule B threshold with an address and a description of noncash gifts, noncash totals over the Schedule M threshold, officers with average hours and compensation, and grants over the Schedule I threshold with the grantee's EIN and address. It prepares data for your preparer; it files nothing and decides no schedule.

| Finding | Example from the fictional demo data |
|---|---|
| `officer_missing_comp` | Treasurer has no compensation entered (enter 0 when unpaid). |
| `officer_missing_hours` | Board Chair has no average hours per week. |
| `schedule_m_likely` | Noncash gifts in 2026 total 28000, over 25000; your preparer will look at Schedule M. |
| `scheduleb_missing_address` | Contributor C-2 gave 10000 in 2026, at or over 5000, and has no address on file. |
| `scheduleb_noncash_no_description` | Contributor C-3: noncash gift G-4 (8000) has no description. |
| `schedulei_missing_ein` | Grant of 6000 to Example Arts Studio has no EIN. |

Each item gets the most serious level of its findings: **flag** (act on it), **review** (data is missing or unclear; a person looks), **watch** (worth knowing) or **ok**. Every finding names the numbers it was worked out from.

## Settings

Put the ones you want to change in a JSON file and pass it as `settings`; anything left out uses the default. The result lists the settings it used under `settings_used`.

| Setting | Default | Meaning |
|---|---|---|
| `tax_year` | `null` | Tax year, named by the year it ends in (default: the latest year in the gifts) |
| `fiscal_year_start` | `1` | First month of your tax year (default 1) |
| `schedule_b_threshold` | `5000` | Contributor total at or over this needs Schedule B data (default 5000; your preparer confirms which rule applies to you) |
| `schedule_m_threshold` | `25000` | Noncash total over this is shown for Schedule M (default 25000) |
| `schedule_i_threshold` | `5000` | Grants over this need Schedule I data (default 5000) |

<!-- generated:start -->

## A demo run

`npx -y fairgive-form-990-data demo` runs the agent on the fictional files in [`fixtures/`](fixtures) in a temporary folder. Captured output:

```text
Fairgive Form 990 Data demo (fictional nonprofit data), Auto mode on

▶ Run the check on the exported files
  status: executed  decision: allow
  Tax year 2026: 4 Schedule B contributor(s), noncash 28000, 3 officer(s), 2 Schedule I grant(s); 5 line(s) with data to complete.
    flag    Schedule B C-2                      scheduleb_missing_address
    flag    Schedule I Example Arts Studio      schedulei_missing_ein
    review  Part VII Board Chair                officer_missing_hours
    review  Part VII Treasurer                  officer_missing_comp
    review  Schedule B C-3                      scheduleb_noncash_no_description
    watch   Schedule M noncash total            schedule_m_likely

▶ Explain Schedule B C-2
  status: executed  decision: allow
  Schedule B C-2: flag. Contributor C-2 gave 10000 in 2026, at or over 5000, and has no address on file.

▶ Write the report (CSV worklist and HTML page)
  status: executed  decision: allow
  Form 990 schedule data readiness written: Tax year 2026: 4 Schedule B contributor(s), noncash 28000, 3 officer(s), 2 Schedule I grant(s); 5 line(s) with data to complete.

▶ The agent tries irs_file itself
  status: blocked  decision: block
  reason: Never files a Form 990, 1099 or any return with the IRS or a state, and gives no tax advice.

Audit log: <demo folder>/.fairgive/audit.jsonl
```

## Tools

| Tool | What it does | Policy |
|---|---|---|
| `form990_check` | Checks that the data behind common Form 990 schedules is complete for the tax year: contributors at or over the Schedule B threshold with an address and a description of noncash gifts, noncash totals over the Schedule… | runs |
| `form990_explain` | Show one line ("Schedule B C-2", "Part VII Treasurer", "Schedule I Example Arts Studio") from form990_check with every finding, the numbers behind it and the setting it was checked against. | runs |
| `form990_write_report` | Write form-990-data.csv (one row per item, with blank owner and decision columns) and form-990-data.html into out_dir (default fairgive-out/form990). | runs |
| `form990_recall` | Search this agent's own memory of the customer's setup: accepted facts (in use) and facts waiting for a person. | runs |
| `form990_learn` | Propose one fact about the customer's setup for this agent to remember. | runs |
| `form990_accept_learning` | A named person accepts or rejects a fact waiting in this agent's memory. | one named click, even in Auto (`accept_learning`) |
| `form990_retire_memory` | A named person stops an accepted fact from applying. | one named click, even in Auto (`accept_learning`) |
| `irs_file` | Never files a Form 990, 1099 or any return with the IRS or a state, and gives no tax advice. | refused |

Any tool name not in this table is blocked, including names a model invents. `refused` tools are listed so a model can see they exist and are refused.

## Columns it reads

Table inputs can be CSV, TSV, semicolon- or pipe-separated text, Excel `.xlsx`, JSON or JSONL. Columns are matched by the agent's own name, then by the English names below, then by their names in German, French, Spanish, Portuguese, Italian, Japanese, Chinese and Korean. Dates become `YYYY-MM-DD`; amounts are read with either decimal mark; weights, distances and dimensions are converted when the column says it holds kilograms, kilometres or centimetres. Every result lists under `sources` how each file was read.

### Gifts (`gifts`)

| Column | Type | Also read as | For example, in other languages |
|---|---|---|---|
| `gift_id` (required) | text | Gift ID, Donation ID, Opportunity ID, Transaction ID, Gift Number, Gift No | Spenden-ID, N° de don, 寄付ID, 捐款编号 |
| `donor_id` | text | Constituent ID, Donor ID, Account ID, Contact ID, Account Number, LGL Constituent ID | Spendernummer, N° de donateur, 寄付者ID, 捐赠人编号 |
| `donor` | text | Donor Name, Donor, Constituent Name, Account Name, Name, Full Name | Spender, Donateur, 寄付者, 捐赠人 |
| `address` | text | Address, Street, Address Line 1, Mailing Address, Preferred Address | Adresse, Adresse, 住所, 地址 |
| `gift_date` | date | Gift Date, Donation Date, Close Date, Date, Transaction Date, Received Date | Spendendatum, Date du don, 寄付日, 捐赠日期 |
| `amount` | amount | Amount, Gift Amount, Donation Amount, Total Amount, Gross Amount, Payment Amount | Betrag, Montant, 金額, 金额 |
| `gift_type` | text | Gift Type, Type, Donation Type, Record Type, Gift Subtype, Opportunity Record Type | Spendenart, Type de don, 寄付種別, 捐赠类型 |
| `description` | text | Description, Noncash Description, Item Description, Property Description | Beschreibung, Description, 摘要, 摘要 |

### Officers and key employees (`officers`)

| Column | Type | Also read as | For example, in other languages |
|---|---|---|---|
| `name` (required) | text | Name, Officer, Full Name | Name, Nom, 名前, 名称 |
| `title` | text | Title, Position, Role | Rolle, Rôle, ロール, 角色 |
| `hours_per_week` | number | Hours Per Week, Average Hours, Hours | Stunden, Heures, 時間数, 小时数 |
| `compensation` | amount | Compensation, Reportable Compensation, Salary, Pay | - |

### Grants paid (`grants_paid`)

| Column | Type | Also read as | For example, in other languages |
|---|---|---|---|
| `grantee` (required) | text | Grantee, Organization, Recipient, Name | - |
| `ein` | text | EIN, Grantee EIN, Tax ID | Steuernummer, Numéro de TVA, 法人番号, 统一社会信用代码 |
| `address` | text | Address, Street, Mailing Address | Adresse, Adresse, 住所, 地址 |
| `amount` | amount | Amount, Grant Amount, Paid | Betrag, Montant, 金額, 金额 |
| `purpose` | text | Purpose, Description, Use | Zweck, Motif, 目的, 事由 |

### Files from other countries

A German export in Windows-1252 with semicolons, `1.234,56` and `03.11.2026`, or a Japanese one in Shift_JIS with `2026/11/03`, is read the same way as the English file. [`fixtures/intl/`](fixtures/intl) has both versions of the demo data, and the eval cases `intl-de-*` and `intl-ja-*` require the same results as the English case. A weight, distance or dimension column found by its translated name with no unit in it is read as metric and converted, and the result says so. Columns named differently? Run `npx fairgive-form-990-data inspect <file>` (names and shapes only, never values) and name them in `fairgive-sources.json`:

```json
{ "files": { "exports/bills.csv": { "columns": { "invoice_number": "Beleg" }, "date_order": "dmy", "units": { "weight": "kg" } } } }
```

## Memory

fairgive-form-990-data can remember facts about your setup so the next run does not have to be told again. `form990_learn` only proposes a fact; it changes nothing until a named person accepts it with `form990_accept_learning`, which is one click even in Auto. Facts live in one hash-chained file per agent under `.fairgive/memory/`; if the chain does not verify, no fact is used. Credentials, personal identifiers and text that reads like instructions to an AI are refused. Run without memory with `--no-memory`.

| Kind | What an accepted fact changes |
|---|---|
| `note` | nothing (shown by recall only) |

```bash
fairgive-form-990-data memory list
fairgive-form-990-data memory accept MEM-1a2b3c4d5e6f --as "Your Name"
fairgive-form-990-data memory retire MEM-1a2b3c4d5e6f --as "Your Name" --reason "carrier renamed"
```

<!-- sources:start -->
## Exports it reads

Table inputs can be CSV, TSV, semicolon- or pipe-separated text, Excel `.xlsx`, JSON or JSONL. A file already in this agent's own columns is read as it is. The exports below are recognised by their column names and mapped onto those columns; dates become `YYYY-MM-DD`, amounts plain decimals (both decimal marks), and yes/no columns `yes`/`no`. Each result lists, under `sources`, which export was recognised, which columns were mapped, and any rows skipped or dates that could be read two ways.

**Gifts** (argument `gifts`)

No named exports: other column names are matched by a list of common alternatives.

**Officers and key employees** (argument `officers`)

No named exports: other column names are matched by a list of common alternatives.

**Grants paid** (argument `grants_paid`)

No named exports: other column names are matched by a list of common alternatives.

Columns named differently? Run `npx fairgive-form-990-data inspect <file>` to see how a file is read (column names and shapes only, never values), then name your columns in `fairgive-sources.json` in the root:

```json
{ "files": { "exports/users.csv": { "columns": { "email": "Work E-mail" }, "date_order": "dmy" } } }
```

Where a layout says "checked", its column names were compared with the vendor's documentation on that date. The other layouts were written from knowledge of the export and were not checked. None was tested against a live account. If a real export does not match, the result says which columns were missing; please report it.
<!-- sources:end -->

## Install

Node 20 or newer. No other dependencies.

```bash
npx -y fairgive-form-990-data demo
npx -y fairgive-form-990-data mcp --root /path/to/your/files
```

Claude Desktop, Cursor and other MCP hosts:

```json
{
  "mcpServers": {
    "fairgive-form-990-data": {
      "command": "npx",
      "args": [
        "-y",
        "fairgive-form-990-data",
        "mcp",
        "--root",
        "/path/to/your/files"
      ]
    }
  }
}
```

Claude Code: `claude mcp add fairgive-form-990-data -- npx -y fairgive-form-990-data mcp --root .`, or install the `fairgive-form-990-data` plugin from this repository's marketplace.

## Modes and approvals

- **Review** (`--mode review`): reads and reports only.
- **Assist** (default): the policy above. A tool that asks returns an `approval_id`; a person approves it once with `fairgive-form-990-data approve <id> --as "Your Name"` (or on the local approvals page, `fairgive-form-990-data approvals`), and the same call is repeated.
- **Auto** (`--mode auto --auto <tool,...>`): opt-in per tool, with step caps and a kill switch (`fairgive-form-990-data kill`). Paying, sending, posting to a ledger or a live system and accepting a learned fact stay **one named click even in Auto**; an approval is tied to the sha256 of the reviewed draft, so a changed draft needs a new click.

## CLI

```bash
fairgive-form-990-data tools                 # every tool, its policy and arguments
fairgive-form-990-data sources               # the columns each input is read from
fairgive-form-990-data inspect <file>        # how a file would be read (names and shapes, never values)
fairgive-form-990-data call form990_check '{"gifts":"<gifts>"}'
fairgive-form-990-data eval                  # the private eval cases on the fictional fixtures
fairgive-form-990-data demo
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
