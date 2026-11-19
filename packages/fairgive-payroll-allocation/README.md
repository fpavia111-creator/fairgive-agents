# fairgive-payroll-allocation

Compares salaries charged to programs and grants with timesheets or effort reports: charges that differ from effort, effort over 100%, grant-funded staff with no effort certification and pay never allocated. Never changes payroll.

Part of **Fairgive**, the nonprofit, foundation, church and association back-office agents by Mythos Machines. The software is free (MIT); the paid part is a fixed-price setup on your own files. Every result is computed from your files with plain arithmetic, on your computer; no AI model is called by the tools.

## What it checks

For each employee and period, compares the salary charged to each program and grant with the effort reported (percent, or hours turned into percent). Flags charges that differ from effort by more than the tolerance, effort over 100% and charges to codes with no effort; lists pay not charged anywhere and grant charges with no effort certification.

| Finding | Example from the fictional demo data |
|---|---|
| `certification_missing` | E-3: 6000 charged to grants in 2026-Q3 and no effort certification is on file. |
| `charge_differs_from_effort` | E-2: ADMIN carries 50% of the pay charged (6000); effort says 75% (about 9000). |
| `charged_without_effort` | E-5: 2000 charged to G-FED in 2026-Q3 with no effort reported there. |
| `effort_over_100` | E-3 reports 110% effort for 2026-Q3. |
| `payroll_not_allocated` | E-4: payroll 9000 for 2026-Q3, 7000 charged to programs and grants; 2000 is not charged anywhere. |

Each item gets the most serious level of its findings: **flag** (act on it), **review** (data is missing or unclear; a person looks), **watch** (worth knowing) or **ok**. Every finding names the numbers it was worked out from.

## Settings

Put the ones you want to change in a JSON file and pass it as `settings`; anything left out uses the default. The result lists the settings it used under `settings_used`.

| Setting | Default | Meaning |
|---|---|---|
| `tolerance_pct` | `5` | Percentage points a charge may differ from effort before it is flagged (default 5) |
| `certify_codes` | `[]` | Codes (or their start) of grants that need effort certification, e.g. ["G-"] |
| `tolerance` | `0.01` | Amount difference ignored (default 0.01) |

<!-- generated:start -->

## A demo run

`npx -y fairgive-payroll-allocation demo` runs the agent on the fictional files in [`fixtures/`](fixtures) in a temporary folder. Captured output:

```text
Fairgive Payroll Allocation demo (fictional nonprofit data), Auto mode on

▶ Run the check on the exported files
  status: executed  decision: allow
  5 employee period(s): payroll 54,000.00, charged 52,000.00, not charged 2,000.00; 5,000.00 charged beyond the effort reported, 6,000.00 of grant charges with no certification.
    flag    E-2 2026-Q3                         charge_differs_from_effort, charge_differs_from_effort
    flag    E-3 2026-Q3                         effort_over_100, charge_differs_from_effort, certification_missing
    flag    E-5 2026-Q3                         charge_differs_from_effort, charged_without_effort
    review  E-4 2026-Q3                         payroll_not_allocated

▶ Explain E-2 2026-Q3
  status: executed  decision: allow
  E-2 2026-Q3: flag. E-2: ADMIN carries 50% of the pay charged (6000); effort says 75% (about 9000). E-2: G-FED carries 50% of the pay charged (6000); effort says 25% (about 3000).

▶ Write the report (CSV worklist and HTML page)
  status: executed  decision: allow
  Payroll allocation against effort written: 5 employee period(s): payroll 54,000.00, charged 52,000.00, not charged 2,000.00; 5,000.00 charged beyond the effort reported, 6,000.00 of grant charges with no certification.

▶ The agent tries payroll_submit itself
  status: blocked  decision: block
  reason: Never submits or changes payroll; your payroll person does.

Audit log: <demo folder>/.fairgive/audit.jsonl
```

## Tools

| Tool | What it does | Policy |
|---|---|---|
| `payroll_alloc_check` | For each employee and period, compares the salary charged to each program and grant with the effort reported (percent, or hours turned into percent). | runs |
| `payroll_alloc_explain` | Show one employee and period ("E-2 2026-Q3") from payroll_alloc_check with every finding, the numbers behind it and the setting it was checked against. | runs |
| `payroll_alloc_write_report` | Write payroll-allocation.csv (one row per item, with blank owner and decision columns) and payroll-allocation.html into out_dir (default fairgive-out/payroll_alloc). | runs |
| `payroll_alloc_recall` | Search this agent's own memory of the customer's setup: accepted facts (in use) and facts waiting for a person. | runs |
| `payroll_alloc_learn` | Propose one fact about the customer's setup for this agent to remember. | runs |
| `payroll_alloc_accept_learning` | A named person accepts or rejects a fact waiting in this agent's memory. | one named click, even in Auto (`accept_learning`) |
| `payroll_alloc_retire_memory` | A named person stops an accepted fact from applying. | one named click, even in Auto (`accept_learning`) |
| `payroll_submit` | Never submits or changes payroll; your payroll person does. | refused |
| `ledger_post` | Never posts journal entries or changes the books; your accountant posts the reviewed entry. | refused |

Any tool name not in this table is blocked, including names a model invents. `refused` tools are listed so a model can see they exist and are refused.

## Columns it reads

Table inputs can be CSV, TSV, semicolon- or pipe-separated text, Excel `.xlsx`, JSON or JSONL. Columns are matched by the agent's own name, then by the English names below, then by their names in German, French, Spanish, Portuguese, Italian, Japanese, Chinese and Korean. Dates become `YYYY-MM-DD`; amounts are read with either decimal mark; weights, distances and dimensions are converted when the column says it holds kilograms, kilometres or centimetres. Every result lists under `sources` how each file was read.

### Payroll register (`payroll`)

| Column | Type | Also read as | For example, in other languages |
|---|---|---|---|
| `employee_id` (required) | text | Employee ID, Emp ID, Employee Number, File Number | Personalnummer, Matricule, 社員番号, 员工编号 |
| `employee` | text | Employee, Employee Name, Name | Mitarbeiter, Employé, 社員名, 员工 |
| `period` | text | Period, Pay Period, Quarter, Month | Periode, Période, 期間, 期间 |
| `gross` | amount | Gross, Gross Pay, Gross Wages, Total Pay | Brutto, Brut, 総額, 总额 |

### Effort reports (`effort`)

| Column | Type | Also read as | For example, in other languages |
|---|---|---|---|
| `employee_id` (required) | text | Employee ID, Emp ID, Employee Number | Personalnummer, Matricule, 社員番号, 员工编号 |
| `period` | text | Period, Pay Period, Quarter, Month | Periode, Période, 期間, 期间 |
| `code` | text | Code, Program, Grant, Project, Cost Center | Programm, Programme, プログラム, 项目 |
| `pct` | number | Pct, Percent, Effort %, Effort Percent | Anteil %, Pourcentage, 配賦率, 分摊比例 |
| `hours` | number | Hours, Hours Worked | Stunden, Heures, 時間数, 小时数 |

### Salary charges (`charges`)

| Column | Type | Also read as | For example, in other languages |
|---|---|---|---|
| `employee_id` (required) | text | Employee ID, Emp ID, Employee Number | Personalnummer, Matricule, 社員番号, 员工编号 |
| `period` | text | Period, Pay Period, Quarter, Month | Periode, Période, 期間, 期间 |
| `code` | text | Code, Program, Grant, Project, Cost Center, Class | Programm, Programme, プログラム, 项目 |
| `amount` | amount | Amount, Charged, Salary Charged, Debit | Betrag, Montant, 金額, 金额 |

### Effort certifications (`certifications`)

| Column | Type | Also read as | For example, in other languages |
|---|---|---|---|
| `employee_id` (required) | text | Employee ID, Emp ID | Personalnummer, Matricule, 社員番号, 员工编号 |
| `period` | text | Period, Quarter, Certification Period | Periode, Période, 期間, 期间 |
| `certified_date` | date | Certification Date, Signed Date, Signature Date, Date Signed | Datum, Date, 日付, 日期 |

### Files from other countries

A German export in Windows-1252 with semicolons, `1.234,56` and `03.11.2026`, or a Japanese one in Shift_JIS with `2026/11/03`, is read the same way as the English file. [`fixtures/intl/`](fixtures/intl) has both versions of the demo data, and the eval cases `intl-de-*` and `intl-ja-*` require the same results as the English case. A weight, distance or dimension column found by its translated name with no unit in it is read as metric and converted, and the result says so. Columns named differently? Run `npx fairgive-payroll-allocation inspect <file>` (names and shapes only, never values) and name them in `fairgive-sources.json`:

```json
{ "files": { "exports/bills.csv": { "columns": { "invoice_number": "Beleg" }, "date_order": "dmy", "units": { "weight": "kg" } } } }
```

## Memory

fairgive-payroll-allocation can remember facts about your setup so the next run does not have to be told again. `payroll_alloc_learn` only proposes a fact; it changes nothing until a named person accepts it with `payroll_alloc_accept_learning`, which is one click even in Auto. Facts live in one hash-chained file per agent under `.fairgive/memory/`; if the chain does not verify, no fact is used. Credentials, personal identifiers and text that reads like instructions to an AI are refused. Run without memory with `--no-memory`.

| Kind | What an accepted fact changes |
|---|---|
| `note` | nothing (shown by recall only) |

```bash
fairgive-payroll-allocation memory list
fairgive-payroll-allocation memory accept MEM-1a2b3c4d5e6f --as "Your Name"
fairgive-payroll-allocation memory retire MEM-1a2b3c4d5e6f --as "Your Name" --reason "carrier renamed"
```

## Install

Node 20 or newer. No other dependencies.

```bash
npx -y fairgive-payroll-allocation demo
npx -y fairgive-payroll-allocation mcp --root /path/to/your/files
```

Claude Desktop, Cursor and other MCP hosts:

```json
{
  "mcpServers": {
    "fairgive-payroll-allocation": {
      "command": "npx",
      "args": [
        "-y",
        "fairgive-payroll-allocation",
        "mcp",
        "--root",
        "/path/to/your/files"
      ]
    }
  }
}
```

Claude Code: `claude mcp add fairgive-payroll-allocation -- npx -y fairgive-payroll-allocation mcp --root .`, or install the `fairgive-payroll-allocation` plugin from this repository's marketplace.

## Modes and approvals

- **Review** (`--mode review`): reads and reports only.
- **Assist** (default): the policy above. A tool that asks returns an `approval_id`; a person approves it once with `fairgive-payroll-allocation approve <id> --as "Your Name"` (or on the local approvals page, `fairgive-payroll-allocation approvals`), and the same call is repeated.
- **Auto** (`--mode auto --auto <tool,...>`): opt-in per tool, with step caps and a kill switch (`fairgive-payroll-allocation kill`). Paying, sending, posting to a ledger or a live system and accepting a learned fact stay **one named click even in Auto**; an approval is tied to the sha256 of the reviewed draft, so a changed draft needs a new click.

## CLI

```bash
fairgive-payroll-allocation tools                 # every tool, its policy and arguments
fairgive-payroll-allocation sources               # the columns each input is read from
fairgive-payroll-allocation inspect <file>        # how a file would be read (names and shapes, never values)
fairgive-payroll-allocation call payroll_alloc_check '{"effort":"<effort>","charges":"<charges>"}'
fairgive-payroll-allocation eval                  # the private eval cases on the fictional fixtures
fairgive-payroll-allocation demo
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
