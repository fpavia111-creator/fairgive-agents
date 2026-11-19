# fairgive-functional-expenses

Builds the natural-by-function expense table (program, management and general, fundraising) from your ledger and allocation rules, and flags expenses with no function, shared costs not allocated and allocation rules that do not add to 100%.

Part of **Fairgive**, the nonprofit, foundation, church and association back-office agents by Mythos Machines. The software is free (MIT); the paid part is a fixed-price setup on your own files. Every result is computed from your files with plain arithmetic, on your computer; no AI model is called by the tools. It reads files and writes reports; it never files, sends, pays or changes a live system, and a person on your team decides and acts on every finding.

## What it needs

Exports you already have, saved as files on your computer (CSV, Excel, JSON; see "Columns it reads" and "Exports it reads" below):

- `gl` (required): Expense lines from the general ledger: account, account name, department or program, function if the system has one, amount, memo
- `rules`: Optional allocation rules for shared costs: account number or department, program %, management %, fundraising %, basis
- `settings` (optional): a JSON file with your own thresholds and rules; see "Settings" below.

## What it checks

Gives every expense line a function (program, management and general, fundraising) from its own function column, its department in the settings map, or the allocation rule for its account or department, and totals the natural-by-function table. Flags lines with no function and rules that do not add to 100%; lists program lines whose memo names fundraising words.

| Finding | Example from the fictional demo data |
|---|---|
| `allocation_not_100` | Rule 6100 (Square feet) splits 90% across program, management and fundraising; 600 is left unassigned. |
| `expense_without_function` | L7 on 7100 Supplies (2000) has no function, no department in the settings map and no allocation rule. |
| `fundraising_coded_program` | L6 on 7000 Printing (3000, "Gala invitations") is coded to a program but mentions "gala"; it may be a fundraising cost. |

Each item gets the most serious level of its findings: **flag** (act on it), **review** (data is missing or unclear; a person looks), **watch** (worth knowing) or **ok**. Every finding names the numbers it was worked out from.

## Settings

Put the ones you want to change in a JSON file and pass it as `settings`; anything left out uses the default. The result lists the settings it used under `settings_used`.

| Setting | Default | Meaning |
|---|---|---|
| `expense_from` | `"5"` | Expense accounts start at this number (default "5") |
| `department_functions` | `{}` | Department or program code and its function, e.g. {"Youth": "program", "Admin": "management", "Development": "fundraising"} |
| `fundraising_words` | `["gala","appeal","donor","fundraising","campaign mailing","auction"]` | Words in a memo that suggest a fundraising cost |
| `tolerance` | `0.01` | Difference ignored (default 0.01) |

<!-- generated:start -->

## A demo run

`npx -y fairgive-functional-expenses demo` runs the agent on the fictional files in [`fixtures/`](fixtures) in a temporary folder. Captured output:

```text
Fairgive Functional Expenses demo (fictional nonprofit data), Auto mode on

▶ Run the check on the exported files
  status: executed  decision: allow
  116,500.00 of expenses: program 63,400.00 (54.42%), management and general 31,000.00, fundraising 19,500.00, no function yet 2,600.00.
    flag    6100                                allocation_not_100
    flag    7100                                expense_without_function
    review  7000                                fundraising_coded_program

▶ Explain 6100
  status: executed  decision: allow
  6100: flag. Rule 6100 (Square feet) splits 90% across program, management and fundraising; 600 is left unassigned.

▶ Write the report (CSV worklist and HTML page)
  status: executed  decision: allow
  Functional expenses written: 116,500.00 of expenses: program 63,400.00 (54.42%), management and general 31,000.00, fundraising 19,500.00, no function yet 2,600.00.

▶ The agent tries ledger_post itself
  status: blocked  decision: block
  reason: Never posts journal entries or changes the books; your accountant posts the reviewed entry.

Audit log: <demo folder>/.fairgive/audit.jsonl
```

## Tools

| Tool | What it does | Policy |
|---|---|---|
| `functional_check` | Gives every expense line a function (program, management and general, fundraising) from its own function column, its department in the settings map, or the allocation rule for its account or department, and totals the… | runs |
| `functional_explain` | Show one expense account from functional_check with every finding, the numbers behind it and the setting it was checked against. | runs |
| `functional_write_report` | Write functional-expenses.csv (one row per item, with blank owner and decision columns) and functional-expenses.html into out_dir (default fairgive-out/functional). | runs |
| `functional_recall` | Search this agent's own memory of the customer's setup: accepted facts (in use) and facts waiting for a person. | runs |
| `functional_learn` | Propose one fact about the customer's setup for this agent to remember. | runs |
| `functional_accept_learning` | A named person accepts or rejects a fact waiting in this agent's memory. | one named click, even in Auto (`accept_learning`) |
| `functional_retire_memory` | A named person stops an accepted fact from applying. | one named click, even in Auto (`accept_learning`) |
| `ledger_post` | Never posts journal entries or changes the books; your accountant posts the reviewed entry. | refused |
| `irs_file` | Never files a Form 990, 1099 or any return with the IRS or a state, and gives no tax advice. | refused |

Any tool name not in this table is blocked, including names a model invents. `refused` tools are listed so a model can see they exist and are refused.

## Columns it reads

Table inputs can be CSV, TSV, semicolon- or pipe-separated text, Excel `.xlsx`, JSON or JSONL. Columns are matched by the agent's own name, then by the English names below, then by their names in German, French, Spanish, Portuguese, Italian, Japanese, Chinese and Korean. Dates become `YYYY-MM-DD`; amounts are read with either decimal mark; weights, distances and dimensions are converted when the column says it holds kilograms, kilometres or centimetres. Every result lists under `sources` how each file was read.

### Expense lines (`gl`)

| Column | Type | Also read as | For example, in other languages |
|---|---|---|---|
| `entry_id` | text | Entry ID, Journal ID, JE Number, Num, Journal Entry, Transaction ID | - |
| `date` | date | Date, Transaction Date, Posting Date, Post Date, Entry Date, GL Date | Datum, Date, 日付, 日期 |
| `account` (required) | text | Account, Account Number, GL Account, Account No, Account no., Account Code | Konto, Compte, 勘定科目, 科目代码 |
| `account_name` | text | Account Name, Account Title, Account Description | Kontobezeichnung, Libellé du compte, 勘定科目名, 科目名称 |
| `program` | text | Program, Program Code, Class, Department, Program Name, Cost Center | Programm, Programme, プログラム, 项目 |
| `function` | text | Function, Functional Class, Functional Expense, Expense Function | Funktionsbereich, Destination, 機能区分, 功能分类 |
| `debit` | amount | Debit, Debit Amount, Dr | Ausgang, Débit, 出金, 支出 |
| `credit` | amount | Credit, Credit Amount, Cr | Eingang, Crédit, 入金, 收入 |
| `amount` | amount | Amount, Net Amount, Transaction Amount, Signed Amount | Betrag, Montant, 金額, 金额 |
| `memo` | text | Memo, Description, Memo/Description, Line Description, Transaction Description, Narrative | Verwendungszweck, Libellé, 摘要, 摘要 |

Named exports recognised by their column names:

| System | Export | Recognised by | Layout checked against vendor docs |
|---|---|---|---|
| QuickBooks Online | General Ledger report (CSV or Excel) | Transaction Type, Num, Split, Amount | no |
| Aplos | Transactions export | Fund, Account, Tag, Amount | no |
| Sage Intacct | General ledger detail report export | Journal, Account no., Debit, Credit | no |
| Blackbaud Financial Edge NXT | Journal entry or account activity export | Journal, Account number, Transaction amount | no |

Where a layout says "checked", its column names were compared with the vendor's documentation on that date. The other layouts were written from knowledge of the export and were not checked. None was tested against a live account.

### Allocation rules (`rules`)

| Column | Type | Also read as | For example, in other languages |
|---|---|---|---|
| `key` (required) | text | Key, Account, Department, Cost Pool, Pool | - |
| `program` | number | Program, Program %, Program Pct | Programm, Programme, プログラム, 项目 |
| `management` | number | Management, Management %, M&G %, G&A % | - |
| `fundraising` | number | Fundraising, Fundraising % | - |
| `basis` | text | Basis, Allocation Basis, Method | - |

### Files from other countries

A German export in Windows-1252 with semicolons, `1.234,56` and `03.11.2026`, or a Japanese one in Shift_JIS with `2026/11/03`, is read the same way as the English file. [`fixtures/intl/`](fixtures/intl) has both versions of the demo data, and the eval cases `intl-de-*` and `intl-ja-*` require the same results as the English case. A weight, distance or dimension column found by its translated name with no unit in it is read as metric and converted, and the result says so. Columns named differently? Run `npx fairgive-functional-expenses inspect <file>` (names and shapes only, never values) and name them in `fairgive-sources.json`:

```json
{ "files": { "exports/bills.csv": { "columns": { "invoice_number": "Beleg" }, "date_order": "dmy", "units": { "weight": "kg" } } } }
```

## Memory

fairgive-functional-expenses can remember facts about your setup so the next run does not have to be told again. `functional_learn` only proposes a fact; it changes nothing until a named person accepts it with `functional_accept_learning`, which is one click even in Auto. Facts live in one hash-chained file per agent under `.fairgive/memory/`; if the chain does not verify, no fact is used. Credentials, personal identifiers and text that reads like instructions to an AI are refused. Run without memory with `--no-memory`.

| Kind | What an accepted fact changes |
|---|---|
| `note` | nothing (shown by recall only) |

```bash
fairgive-functional-expenses memory list
fairgive-functional-expenses memory accept MEM-1a2b3c4d5e6f --as "Your Name"
fairgive-functional-expenses memory retire MEM-1a2b3c4d5e6f --as "Your Name" --reason "carrier renamed"
```

<!-- sources:start -->
## Exports it reads

Table inputs can be CSV, TSV, semicolon- or pipe-separated text, Excel `.xlsx`, JSON or JSONL. A file already in this agent's own columns is read as it is. The exports below are recognised by their column names and mapped onto those columns; dates become `YYYY-MM-DD`, amounts plain decimals (both decimal marks), and yes/no columns `yes`/`no`. Each result lists, under `sources`, which export was recognised, which columns were mapped, and any rows skipped or dates that could be read two ways.

**Expense lines** (argument `gl`)

| System | Export | Layout checked against vendor docs |
|---|---|---|
| QuickBooks Online | General Ledger report (CSV or Excel) | no |
| Aplos | Transactions export | no |
| Sage Intacct | General ledger detail report export | no |
| Blackbaud Financial Edge NXT | Journal entry or account activity export | no |

**Allocation rules** (argument `rules`)

No named exports: other column names are matched by a list of common alternatives.

Columns named differently? Run `npx fairgive-functional-expenses inspect <file>` to see how a file is read (column names and shapes only, never values), then name your columns in `fairgive-sources.json` in the root:

```json
{ "files": { "exports/users.csv": { "columns": { "email": "Work E-mail" }, "date_order": "dmy" } } }
```

Where a layout says "checked", its column names were compared with the vendor's documentation on that date. The other layouts were written from knowledge of the export and were not checked. None was tested against a live account. If a real export does not match, the result says which columns were missing; please report it.
<!-- sources:end -->

## Install

Node 20 or newer. No other dependencies.

```bash
npx -y fairgive-functional-expenses demo
npx -y fairgive-functional-expenses mcp --root /path/to/your/files
```

Claude Desktop, Cursor and other MCP hosts:

```json
{
  "mcpServers": {
    "fairgive-functional-expenses": {
      "command": "npx",
      "args": [
        "-y",
        "fairgive-functional-expenses",
        "mcp",
        "--root",
        "/path/to/your/files"
      ]
    }
  }
}
```

Claude Code: `claude mcp add fairgive-functional-expenses -- npx -y fairgive-functional-expenses mcp --root .`, or install the `fairgive-functional-expenses` plugin from this repository's marketplace.

## Modes and approvals

- **Review** (`--mode review`): reads and reports only.
- **Assist** (default): the policy above. A tool that asks returns an `approval_id`; a person approves it once with `fairgive-functional-expenses approve <id> --as "Your Name"` (or on the local approvals page, `fairgive-functional-expenses approvals`), and the same call is repeated.
- **Auto** (`--mode auto --auto <tool,...>`): opt-in per tool, with step caps and a kill switch (`fairgive-functional-expenses kill`). Paying, sending, posting to a ledger or a live system and accepting a learned fact stay **one named click even in Auto**; an approval is tied to the sha256 of the reviewed draft, so a changed draft needs a new click.

## CLI

```bash
fairgive-functional-expenses tools                 # every tool, its policy and arguments
fairgive-functional-expenses sources               # the columns each input is read from
fairgive-functional-expenses inspect <file>        # how a file would be read (names and shapes, never values)
fairgive-functional-expenses call functional_check '{"gl":"<gl>"}'
fairgive-functional-expenses eval                  # the private eval cases on the fictional fixtures
fairgive-functional-expenses demo
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
