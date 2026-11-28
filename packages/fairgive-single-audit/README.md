# fairgive-single-audit

Totals federal award spending by assistance listing number for the fiscal year against the single audit threshold in your settings, and lists missing listing numbers and pass-through ids. Data for your auditor, not a determination.

Part of **Fairgive**, the nonprofit, foundation, church and association back-office agents by Fair Agents. The software is free (MIT); the paid part is a fixed-price setup on your own files. Every result is computed from your files with plain arithmetic, on your computer; no AI model is called by the tools. It reads files and writes reports; it never files, sends, pays or changes a live system, and a person on your team decides and acts on every finding.

## What it needs

Exports you already have, saved as files on your computer (CSV, Excel, JSON; see "Columns it reads" and "Exports it reads" below):

- `grants` (required): Grant list: grant code, funder, federal (yes/no), assistance listing number, pass-through entity and its award id
- `expenses` (required): Spending by grant (ledger lines with the grant or project code): date, grant, amount
- `settings` (optional): a JSON file with your own thresholds and rules; see "Settings" below.

## What it checks

Totals spending on federal grants in the fiscal year by assistance listing number (the lines of a schedule of expenditures of federal awards) and compares the total with the single audit threshold in the settings (by default 1,000,000 for fiscal years beginning on or after 2024-10-01, 750,000 before). Lists federal grants with no listing number, pass-through awards with no award id and spending coded to grants not in the list.

| Finding | Example from the fictional demo data |
|---|---|
| `missing_aln` | G-NOALN (Example Federal Labor Agency) is federal but has no assistance listing number; 60000 cannot be placed on the schedule. |
| `pass_through_missing_id` | G-HHS comes through Example County Community Action and has no pass-through award id. The schedule shows the id the pass-through entity assigned: enter it, or confirm that none was assigned. |
| `threshold_met` | Federal award spending in FY2026 is 1040000, at or over the 1000000 threshold in the settings. Talk to your auditor about a single audit. |

Each item gets the most serious level of its findings: **flag** (act on it), **review** (data is missing or unclear; a person looks), **watch** (worth knowing) or **ok**. Every finding names the numbers it was worked out from.

## Settings

Put the ones you want to change in a JSON file and pass it as `settings`; anything left out uses the default. The result lists the settings it used under `settings_used`.

| Setting | Default | Meaning |
|---|---|---|
| `fiscal_year_start` | `1` | First month of your fiscal year (default 1) |
| `fiscal_year` | `null` | Fiscal year to total, named by the year it ends in (default: the latest year in the file) |
| `threshold` | `null` | Threshold to compare with (default: 1,000,000 for fiscal years beginning on or after 2024-10-01, else 750,000; confirm with your auditor) |
| `approaching_pct` | `80` | Percent of the threshold at which to warn (default 80) |

<!-- generated:start -->

## A demo run

`npx -y fairgive-single-audit demo` runs the agent on the fictional files in [`fixtures/`](fixtures) in a temporary folder. Captured output:

```text
Fairgive Single Audit demo (fictional nonprofit data), Auto mode on

▶ Run the check on the exported files
  status: executed  decision: allow
  FY2026: federal award spending 1,040,000.00 across 4 listing number(s), 104% of the 1,000,000.00 threshold in the settings.
    flag    Total federal spending              threshold_met
    review  ALN (no ALN)                        missing_aln
    review  ALN 93.568                          pass_through_missing_id

▶ Explain ALN 93.568
  status: executed  decision: allow
  ALN 93.568: review. G-HHS comes through Example County Community Action and has no pass-through award id. The schedule shows the id the pass-through entity assigned: enter it, or confirm that none was assigned.

▶ Write the report (CSV worklist and HTML page)
  status: executed  decision: allow
  Federal awards and the single audit threshold written: FY2026: federal award spending 1,040,000.00 across 4 listing number(s), 104% of the 1,000,000.00 threshold in the settings.

▶ The agent tries irs_file itself
  status: blocked  decision: block
  reason: Never files a Form 990, 1099 or any return with the IRS or a state, and gives no tax advice.

Audit log: <demo folder>/.fairgive/audit.jsonl
```

## Tools

| Tool | What it does | Policy |
|---|---|---|
| `single_audit_check` | Totals spending on federal grants in the fiscal year by assistance listing number (the lines of a schedule of expenditures of federal awards) and compares the total with the single audit threshold in the settings (by … | runs |
| `single_audit_explain` | Show one line ("ALN 84.287" or "Total federal spending") from single_audit_check with every finding, the numbers behind it and the setting it was checked against. | runs |
| `single_audit_write_report` | Write single-audit.csv (one row per item, with blank owner and decision columns) and single-audit.html into out_dir (default fairgive-out/single_audit). | runs |
| `single_audit_recall` | Search this agent's own memory of the customer's setup: accepted facts (in use) and facts waiting for a person. | runs |
| `single_audit_learn` | Propose one fact about the customer's setup for this agent to remember. | runs |
| `single_audit_accept_learning` | A named person accepts or rejects a fact waiting in this agent's memory. | one named click, even in Auto (`accept_learning`) |
| `single_audit_retire_memory` | A named person stops an accepted fact from applying. | one named click, even in Auto (`accept_learning`) |
| `irs_file` | Never files a Form 990, 1099 or any return with the IRS or a state, and gives no tax advice. | refused |
| `funder_portal_submit` | Never logs in to or submits anything on a funder, grants or payment-management portal. | refused |

Any tool name not in this table is blocked, including names a model invents. `refused` tools are listed so a model can see they exist and are refused.

## Columns it reads

Table inputs can be CSV, TSV, semicolon- or pipe-separated text, Excel `.xlsx`, JSON or JSONL. Columns are matched by the agent's own name, then by the English names below, then by their names in German, French, Spanish, Portuguese, Italian, Japanese, Chinese and Korean. Dates become `YYYY-MM-DD`; amounts are read with either decimal mark; weights, distances and dimensions are converted when the column says it holds kilograms, kilometres or centimetres. Every result lists under `sources` how each file was read.

### Grants (`grants`)

| Column | Type | Also read as | For example, in other languages |
|---|---|---|---|
| `grant` (required) | text | Grant, Grant ID, Grant Code, Award, Award Number, Project | Förderprojekt, Subvention, 助成金, 资助项目 |
| `grant_name` | text | Grant Name, Award Name, Project Name, Title, Program Name | - |
| `funder` | text | Funder, Grantor, Funding Agency, Agency, Foundation, Awarding Agency | - |
| `federal` | text | Federal, Federal Award, Is Federal, Federal Funds | - |
| `aln` | text | ALN, Assistance Listing, Assistance Listing Number, CFDA, CFDA Number | - |
| `pass_through` | text | Pass-Through Entity, Pass Through Entity, Pass-through, Subrecipient Of | - |
| `pass_through_id` | text | Pass-Through ID, Pass Through Award ID, Subaward Number, Pass-through Identifying Number | - |

### Spending by grant (`expenses`)

| Column | Type | Also read as | For example, in other languages |
|---|---|---|---|
| `entry_id` | text | Entry ID, Journal, Num, Transaction ID | - |
| `date` | date | Date, Posting Date, Transaction Date | Datum, Date, 日付, 日期 |
| `grant` (required) | text | Grant, Grant ID, Grant Code, Project, Award, Job | Förderkennzeichen, N° de subvention, 助成番号, 资助编号 |
| `amount` | amount | Amount, Debit, Expense, Net Amount | Betrag, Montant, 金額, 金额 |

### Files from other countries

A German export in Windows-1252 with semicolons, `1.234,56` and `03.11.2026`, or a Japanese one in Shift_JIS with `2026/11/03`, is read the same way as the English file. [`fixtures/intl/`](fixtures/intl) has both versions of the demo data, and the eval cases `intl-de-*` and `intl-ja-*` require the same results as the English case. A weight, distance or dimension column found by its translated name with no unit in it is read as metric and converted, and the result says so. Columns named differently? Run `npx fairgive-single-audit inspect <file>` (names and shapes only, never values) and name them in `fairgive-sources.json`:

```json
{ "files": { "exports/bills.csv": { "columns": { "invoice_number": "Beleg" }, "date_order": "dmy", "units": { "weight": "kg" } } } }
```

## Memory

fairgive-single-audit can remember facts about your setup so the next run does not have to be told again. `single_audit_learn` only proposes a fact; it changes nothing until a named person accepts it with `single_audit_accept_learning`, which is one click even in Auto. Facts live in one hash-chained file per agent under `.fairgive/memory/`; if the chain does not verify, no fact is used. Credentials, personal identifiers and text that reads like instructions to an AI are refused. Run without memory with `--no-memory`.

| Kind | What an accepted fact changes |
|---|---|
| `note` | nothing (shown by recall only) |

```bash
fairgive-single-audit memory list
fairgive-single-audit memory accept MEM-1a2b3c4d5e6f --as "Your Name"
fairgive-single-audit memory retire MEM-1a2b3c4d5e6f --as "Your Name" --reason "carrier renamed"
```

<!-- sources:start -->
## Exports it reads

Table inputs can be CSV, TSV, semicolon- or pipe-separated text, Excel `.xlsx`, JSON or JSONL. A file already in this agent's own columns is read as it is. The exports below are recognised by their column names and mapped onto those columns; dates become `YYYY-MM-DD`, amounts plain decimals (both decimal marks), and yes/no columns `yes`/`no`. Each result lists, under `sources`, which export was recognised, which columns were mapped, and any rows skipped or dates that could be read two ways.

**Grants** (argument `grants`)

No named exports: other column names are matched by a list of common alternatives.

**Spending by grant** (argument `expenses`)

No named exports: other column names are matched by a list of common alternatives.

Columns named differently? Run `npx fairgive-single-audit inspect <file>` to see how a file is read (column names and shapes only, never values), then name your columns in `fairgive-sources.json` in the root:

```json
{ "files": { "exports/users.csv": { "columns": { "email": "Work E-mail" }, "date_order": "dmy" } } }
```

Where a layout says "checked", its column names were compared with the vendor's documentation on that date. The other layouts were written from knowledge of the export and were not checked. None was tested against a live account. If a real export does not match, the result says which columns were missing; please report it.
<!-- sources:end -->

## Install

Node 20 or newer. No other dependencies.

```bash
npx -y fairgive-single-audit demo
npx -y fairgive-single-audit mcp --root /path/to/your/files
```

Claude Desktop, Cursor and other MCP hosts:

```json
{
  "mcpServers": {
    "fairgive-single-audit": {
      "command": "npx",
      "args": [
        "-y",
        "fairgive-single-audit",
        "mcp",
        "--root",
        "/path/to/your/files"
      ]
    }
  }
}
```

Claude Code: `claude mcp add fairgive-single-audit -- npx -y fairgive-single-audit mcp --root .`, or install the `fairgive-single-audit` plugin from this repository's marketplace.

## Modes and approvals

- **Review** (`--mode review`): reads and reports only.
- **Assist** (default): the policy above. A tool that asks returns an `approval_id`; a person approves it once with `fairgive-single-audit approve <id> --as "Your Name"` (or on the local approvals page, `fairgive-single-audit approvals`), and the same call is repeated.
- **Auto** (`--mode auto --auto <tool,...>`): opt-in per tool, with step caps and a kill switch (`fairgive-single-audit kill`). Paying, sending, posting to a ledger or a live system and accepting a learned fact stay **one named click even in Auto**; an approval is tied to the sha256 of the reviewed draft, so a changed draft needs a new click.

## CLI

```bash
fairgive-single-audit tools                 # every tool, its policy and arguments
fairgive-single-audit sources               # the columns each input is read from
fairgive-single-audit inspect <file>        # how a file would be read (names and shapes, never values)
fairgive-single-audit call single_audit_check '{"grants":"<grants>","expenses":"<expenses>"}'
fairgive-single-audit eval                  # the private eval cases on the fictional fixtures
fairgive-single-audit demo
```

## Audit log and data

Every call is written to `.fairgive/audit.jsonl` under the root: hash-chained JSON lines, with arguments stored as a hash, signed with an Ed25519 key when you configure one. Everything runs on your machine on files you choose. No network calls, no telemetry, no credentials. The bundled fixtures are fictional.

<!-- generated:end -->

## Limits

- Reads only the files you give it. It does not log in to a donor CRM, giving platform, payment processor, bank, payroll or accounting system, and changes nothing in them.
- Thresholds, rates, dates and policies are settings in your own file, with working defaults; check them against your own policies, funder agreements and current rules before you rely on them.
- Not legal, tax, audit or accounting advice. A person decides what to record, send, file or pay.
- Column names for the named exports were written from knowledge of those systems and not checked against a live account; `inspect` shows how a file was read and `fairgive-sources.json` names columns by hand.
- The bundled fixtures are fictional. Version 0.1.0; nothing has been published yet.
