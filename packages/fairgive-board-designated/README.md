# fairgive-board-designated

Checks board-designated funds against the board resolutions log: designations and spending with no resolution, balances below zero, designations shown as donor-restricted and designations above unrestricted net assets. Never posts.

Part of **Fairgive**, the nonprofit, foundation, church and association back-office agents by Mythos Machines. The software is free (MIT); the paid part is a fixed-price setup on your own files. Every result is computed from your files with plain arithmetic, on your computer; no AI model is called by the tools. It reads files and writes reports; it never files, sends, pays or changes a live system, and a person on your team decides and acts on every finding.

## What it needs

Exports you already have, saved as files on your computer (CSV, Excel, JSON; see "Columns it reads" and "Exports it reads" below):

- `funds` (required): Board-designated funds: fund code, name, designated amount
- `resolutions` (required): Board resolutions log: resolution id, date, fund, action (designate, spend, undesignate), amount
- `gl` (required): Ledger lines with a fund on every line: transfers into and out of the funds, spending, net asset lines
- `settings` (optional): a JSON file with your own thresholds and rules; see "Settings" below.

## What it checks

Compares each board-designated fund in the ledger with the board resolutions log: money moved in or spent beyond what resolutions approve, releases voted and not booked, donor-restricted net asset lines inside a board fund, balances below zero, and designations that add up to more than the unrestricted net assets in the settings.

| Finding | Example from the fictional demo data |
|---|---|
| `balance_below_zero` | RES-NEW is -5000. |
| `designation_without_resolution` | RES-NEW: 20000 was moved into the fund; resolutions approve 0. |
| `designations_over_unrestricted` | Board-designated balances total 106000, more than the 100000 of unrestricted net assets in the settings. |
| `reported_as_donor_restricted` | RES-SCH: 5000 sits in a donor-restricted net asset account, but a board-designated fund is without donor restrictions. |
| `spending_without_resolution` | RES-CAP: 14000 spent from the fund; resolutions approve 10000 of spending. |
| `undesignation_not_recorded` | RES-SCH: the board released 15000; 0 has been moved out in the ledger. |

Each item gets the most serious level of its findings: **flag** (act on it), **review** (data is missing or unclear; a person looks), **watch** (worth knowing) or **ok**. Every finding names the numbers it was worked out from.

## Settings

Put the ones you want to change in a JSON file and pass it as `settings`; anything left out uses the default. The result lists the settings it used under `settings_used`.

| Setting | Default | Meaning |
|---|---|---|
| `transfer_accounts` | `[]` | Accounts (or first digits) used to move money into and out of board-designated funds |
| `expense_from` | `"5"` | Expense accounts start at this number (default "5") |
| `net_asset_accounts` | `{}` | Net asset accounts and their class, to spot donor-restricted lines in a board fund |
| `unrestricted_net_assets` | `null` | Unrestricted net assets from your balance sheet, to compare with the total designated |
| `tolerance` | `0.01` | Difference ignored (default 0.01) |

<!-- generated:start -->

## A demo run

`npx -y fairgive-board-designated demo` runs the agent on the fictional files in [`fixtures/`](fixtures) in a temporary folder. Captured output:

```text
Fairgive Board Designated demo (fictional nonprofit data), Auto mode on

▶ Run the check on the exported files
  status: executed  decision: allow
  4 board-designated fund(s) totalling 106,000.00 against 100,000.00 unrestricted; spending without a resolution 29,000.00.
    flag    All designated funds                designations_over_unrestricted
    flag    RES-CAP                             spending_without_resolution
    flag    RES-NEW                             designation_without_resolution, spending_without_resolution, balance_below_zero
    review  RES-SCH                             undesignation_not_recorded, reported_as_donor_restricted

▶ Explain RES-NEW
  status: executed  decision: allow
  RES-NEW: flag. RES-NEW: 20000 was moved into the fund; resolutions approve 0. RES-NEW: 25000 spent from the fund; resolutions approve 0 of spending. RES-NEW is -5000.

▶ Write the report (CSV worklist and HTML page)
  status: executed  decision: allow
  Board-designated funds written: 4 board-designated fund(s) totalling 106,000.00 against 100,000.00 unrestricted; spending without a resolution 29,000.00.

▶ The agent tries ledger_post itself
  status: blocked  decision: block
  reason: Never posts journal entries or changes the books; your accountant posts the reviewed entry.

Audit log: <demo folder>/.fairgive/audit.jsonl
```

## Tools

| Tool | What it does | Policy |
|---|---|---|
| `designated_check` | Compares each board-designated fund in the ledger with the board resolutions log: money moved in or spent beyond what resolutions approve, releases voted and not booked, donor-restricted net asset lines inside a board… | runs |
| `designated_explain` | Show one fund from designated_check with every finding, the numbers behind it and the setting it was checked against. | runs |
| `designated_write_report` | Write board-designated.csv (one row per item, with blank owner and decision columns) and board-designated.html into out_dir (default fairgive-out/designated). | runs |
| `designated_recall` | Search this agent's own memory of the customer's setup: accepted facts (in use) and facts waiting for a person. | runs |
| `designated_learn` | Propose one fact about the customer's setup for this agent to remember. | runs |
| `designated_accept_learning` | A named person accepts or rejects a fact waiting in this agent's memory. | one named click, even in Auto (`accept_learning`) |
| `designated_retire_memory` | A named person stops an accepted fact from applying. | one named click, even in Auto (`accept_learning`) |
| `ledger_post` | Never posts journal entries or changes the books; your accountant posts the reviewed entry. | refused |
| `bank_transfer` | Never moves money between bank or investment accounts. | refused |

Any tool name not in this table is blocked, including names a model invents. `refused` tools are listed so a model can see they exist and are refused.

## Columns it reads

Table inputs can be CSV, TSV, semicolon- or pipe-separated text, Excel `.xlsx`, JSON or JSONL. Columns are matched by the agent's own name, then by the English names below, then by their names in German, French, Spanish, Portuguese, Italian, Japanese, Chinese and Korean. Dates become `YYYY-MM-DD`; amounts are read with either decimal mark; weights, distances and dimensions are converted when the column says it holds kilograms, kilometres or centimetres. Every result lists under `sources` how each file was read.

### Board-designated funds (`funds`)

| Column | Type | Also read as | For example, in other languages |
|---|---|---|---|
| `fund` (required) | text | Fund, Fund Code, Fund ID, Fund Number, GAU, Designation | Fonds, Fonds, 基金, 基金 |
| `fund_name` | text | Fund Name, Fund Description, Name, Description | - |
| `designated_amount` | amount | Designated Amount, Target, Amount | - |

### Board resolutions (`resolutions`)

| Column | Type | Also read as | For example, in other languages |
|---|---|---|---|
| `resolution_id` (required) | text | Resolution ID, Resolution, Motion, Minute Ref | - |
| `date` | date | Date, Meeting Date, Approved On | Datum, Date, 日付, 日期 |
| `fund` | text | Fund, Fund Code, Designated Fund | Fonds, Fonds, 基金, 基金 |
| `action` | text | Action, Type, Decision | - |
| `amount` | amount | Amount, Approved Amount | Betrag, Montant, 金額, 金额 |

### Ledger lines (`gl`)

| Column | Type | Also read as | For example, in other languages |
|---|---|---|---|
| `entry_id` | text | Entry ID, Journal ID, JE Number, Num, Journal Entry, Transaction ID | - |
| `date` | date | Date, Transaction Date, Posting Date, Post Date, Entry Date, GL Date | Datum, Date, 日付, 日期 |
| `account` (required) | text | Account, Account Number, GL Account, Account No, Account no., Account Code | Konto, Compte, 勘定科目, 科目代码 |
| `account_name` | text | Account Name, Account Title, Account Description | Kontobezeichnung, Libellé du compte, 勘定科目名, 科目名称 |
| `fund` | text | Fund, Fund Code, Fund ID, Fund Name, Restriction, Net Asset Class | Fonds, Fonds, 基金, 基金 |
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

### Files from other countries

A German export in Windows-1252 with semicolons, `1.234,56` and `03.11.2026`, or a Japanese one in Shift_JIS with `2026/11/03`, is read the same way as the English file. [`fixtures/intl/`](fixtures/intl) has both versions of the demo data, and the eval cases `intl-de-*` and `intl-ja-*` require the same results as the English case. A weight, distance or dimension column found by its translated name with no unit in it is read as metric and converted, and the result says so. Columns named differently? Run `npx fairgive-board-designated inspect <file>` (names and shapes only, never values) and name them in `fairgive-sources.json`:

```json
{ "files": { "exports/bills.csv": { "columns": { "invoice_number": "Beleg" }, "date_order": "dmy", "units": { "weight": "kg" } } } }
```

## Memory

fairgive-board-designated can remember facts about your setup so the next run does not have to be told again. `designated_learn` only proposes a fact; it changes nothing until a named person accepts it with `designated_accept_learning`, which is one click even in Auto. Facts live in one hash-chained file per agent under `.fairgive/memory/`; if the chain does not verify, no fact is used. Credentials, personal identifiers and text that reads like instructions to an AI are refused. Run without memory with `--no-memory`.

| Kind | What an accepted fact changes |
|---|---|
| `note` | nothing (shown by recall only) |

```bash
fairgive-board-designated memory list
fairgive-board-designated memory accept MEM-1a2b3c4d5e6f --as "Your Name"
fairgive-board-designated memory retire MEM-1a2b3c4d5e6f --as "Your Name" --reason "carrier renamed"
```

<!-- sources:start -->
## Exports it reads

Table inputs can be CSV, TSV, semicolon- or pipe-separated text, Excel `.xlsx`, JSON or JSONL. A file already in this agent's own columns is read as it is. The exports below are recognised by their column names and mapped onto those columns; dates become `YYYY-MM-DD`, amounts plain decimals (both decimal marks), and yes/no columns `yes`/`no`. Each result lists, under `sources`, which export was recognised, which columns were mapped, and any rows skipped or dates that could be read two ways.

**Board-designated funds** (argument `funds`)

No named exports: other column names are matched by a list of common alternatives.

**Board resolutions** (argument `resolutions`)

No named exports: other column names are matched by a list of common alternatives.

**Ledger lines** (argument `gl`)

| System | Export | Layout checked against vendor docs |
|---|---|---|
| QuickBooks Online | General Ledger report (CSV or Excel) | no |
| Aplos | Transactions export | no |
| Sage Intacct | General ledger detail report export | no |
| Blackbaud Financial Edge NXT | Journal entry or account activity export | no |

Columns named differently? Run `npx fairgive-board-designated inspect <file>` to see how a file is read (column names and shapes only, never values), then name your columns in `fairgive-sources.json` in the root:

```json
{ "files": { "exports/users.csv": { "columns": { "email": "Work E-mail" }, "date_order": "dmy" } } }
```

Where a layout says "checked", its column names were compared with the vendor's documentation on that date. The other layouts were written from knowledge of the export and were not checked. None was tested against a live account. If a real export does not match, the result says which columns were missing; please report it.
<!-- sources:end -->

## Install

Node 20 or newer. No other dependencies.

```bash
npx -y fairgive-board-designated demo
npx -y fairgive-board-designated mcp --root /path/to/your/files
```

Claude Desktop, Cursor and other MCP hosts:

```json
{
  "mcpServers": {
    "fairgive-board-designated": {
      "command": "npx",
      "args": [
        "-y",
        "fairgive-board-designated",
        "mcp",
        "--root",
        "/path/to/your/files"
      ]
    }
  }
}
```

Claude Code: `claude mcp add fairgive-board-designated -- npx -y fairgive-board-designated mcp --root .`, or install the `fairgive-board-designated` plugin from this repository's marketplace.

## Modes and approvals

- **Review** (`--mode review`): reads and reports only.
- **Assist** (default): the policy above. A tool that asks returns an `approval_id`; a person approves it once with `fairgive-board-designated approve <id> --as "Your Name"` (or on the local approvals page, `fairgive-board-designated approvals`), and the same call is repeated.
- **Auto** (`--mode auto --auto <tool,...>`): opt-in per tool, with step caps and a kill switch (`fairgive-board-designated kill`). Paying, sending, posting to a ledger or a live system and accepting a learned fact stay **one named click even in Auto**; an approval is tied to the sha256 of the reviewed draft, so a changed draft needs a new click.

## CLI

```bash
fairgive-board-designated tools                 # every tool, its policy and arguments
fairgive-board-designated sources               # the columns each input is read from
fairgive-board-designated inspect <file>        # how a file would be read (names and shapes, never values)
fairgive-board-designated call designated_check '{"funds":"<funds>","resolutions":"<resolutions>","gl":"<gl>"}'
fairgive-board-designated eval                  # the private eval cases on the fictional fixtures
fairgive-board-designated demo
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
