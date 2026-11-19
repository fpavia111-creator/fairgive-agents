# fairgive-restriction-releases

Compares spending on restricted purposes and time restrictions that have ended with the releases recorded. Lists releases still to record, releases over the spending or the balance, and drafts the release entry for your accountant. Never posts it.

Part of **Fairgive**, the nonprofit, foundation, church and association back-office agents by Mythos Machines. The software is free (MIT); the paid part is a fixed-price setup on your own files. Every result is computed from your files with plain arithmetic, on your computer; no AI model is called by the tools. It reads files and writes reports and drafts; it never files, sends, pays or changes a live system, and a person on your team decides and acts on every finding.

## What it needs

Exports you already have, saved as files on your computer (CSV, Excel, JSON; see "Columns it reads" and "Exports it reads" below):

- `funds` (required): Fund list: fund code, name, restriction (purpose or time) and the release date of time restrictions
- `gl` (required): General ledger detail with a fund on every line: net asset, contribution, expense and release lines
- `settings` (optional): a JSON file with your own thresholds and rules; see "Settings" below.

## What it checks

For each purpose-restricted fund, compares what was spent on its purpose with what was released (up to what the fund received); for each time-restricted fund, checks whether its release date has passed. Flags releases still to record, releases over the spending or over what the fund had, time restrictions that ended without a release and releases recorded before the date.

| Finding | Example from the fictional demo data |
|---|---|
| `release_before_time` | Fund SCHOL-2027: 2000 was released before the restriction ends on 2027-07-01. |
| `release_due` | Fund YOUTH: 5000 was spent on its purpose and 3000 released; 2000 more should be released (limited to the 8000 the fund received). |
| `release_over_balance` | Fund MUSIC: 2500 released but the fund only received 1500 (1000 more than it had). |
| `release_over_spending` | Fund MUSIC: 2500 released but only 1000 spent on its purpose (1500 too much). |
| `time_restriction_ended` | Fund SCHOL-2026: the time restriction ended on 2026-09-01 and 10000 is still restricted (inflow 10000, released 0). |

Each item gets the most serious level of its findings: **flag** (act on it), **review** (data is missing or unclear; a person looks), **watch** (worth knowing) or **ok**. Every finding names the numbers it was worked out from.

## Settings

Put the ones you want to change in a JSON file and pass it as `settings`; anything left out uses the default. The result lists the settings it used under `settings_used`.

| Setting | Default | Meaning |
|---|---|---|
| `release_accounts` | `["39"]` | Account numbers (or first digits) used for net assets released from restriction (default ["39"]) |
| `expense_from` | `"5"` | Expense accounts start at this number (default "5") |
| `as_of` | `null` | Date the check is made at (YYYY-MM-DD); default: the latest date in the ledger |
| `tolerance` | `0.01` | Difference ignored (default 0.01) |

<!-- generated:start -->

## A demo run

`npx -y fairgive-restriction-releases demo` runs the agent on the fictional files in [`fixtures/`](fixtures) in a temporary folder. Captured output:

```text
Fairgive Restriction Releases demo (fictional nonprofit data), Auto mode on

▶ Run the check on the exported files
  status: executed  decision: allow
  5 restricted fund(s) as of 2026-09-30: 12,000.00 to release, 4,500.00 released in error or too early.
    flag    MUSIC                               release_over_spending, release_over_balance
    flag    SCHOL-2026                          time_restriction_ended
    flag    SCHOL-2027                          release_before_time
    flag    YOUTH                               release_due

▶ Explain MUSIC
  status: executed  decision: allow
  MUSIC: flag. Fund MUSIC: 2500 released but only 1000 spent on its purpose (1500 too much). Fund MUSIC: 2500 released but the fund only received 1500 (1000 more than it had).

▶ Write the report (CSV worklist and HTML page)
  status: executed  decision: allow
  Releases from restriction written: 5 restricted fund(s) as of 2026-09-30: 12,000.00 to release, 4,500.00 released in error or too early.

▶ Write a draft (Auto is opted in for drafts here)
  status: executed  decision: allow  (auto)
  release entry Quarter ended 2026-09-30 drafted for 12000 with 4 open marker(s) ([TO CONFIRM: who receives this], [TO CONFIRM: your name and role], [TO CONFIRM operating fund], [TO CONFIRM]). Nothing was sent.

▶ Auto: approving the draft stays one named click
  status: needs_approval  decision: ask
  reason: go_live stays one-click, even in Auto

▶ Same call after the named click (recorded; a person acts on it)
  status: executed  decision: ask  approved by: Morgan Manager (fictional)
  release entry Quarter-ended-2026-09-30 approved and recorded. Nothing was sent or paid by the agent.

▶ The agent tries ledger_post itself
  status: blocked  decision: block
  reason: Never posts journal entries or changes the books; your accountant posts the reviewed entry.

Audit log: <demo folder>/.fairgive/audit.jsonl
```

## Tools

| Tool | What it does | Policy |
|---|---|---|
| `releases_check` | For each purpose-restricted fund, compares what was spent on its purpose with what was released (up to what the fund received); for each time-restricted fund, checks whether its release date has passed. | runs |
| `releases_explain` | Show one fund from releases_check with every finding, the numbers behind it and the setting it was checked against. | runs |
| `releases_write_report` | Write restriction-releases.csv (one row per item, with blank owner and decision columns) and restriction-releases.html into out_dir (default fairgive-out/releases). | runs |
| `releases_draft_release_entry` | Write drafts/release_entry-<period>.md: the journal entry that releases the amounts due, one pair of lines per fund. | asks first (Auto can be opted in) |
| `releases_request_post` | After one named human click (even in Auto), record that the reviewed release entry draft is approved in release_entry-requests.csv. | one named click, even in Auto (`go_live`) |
| `releases_recall` | Search this agent's own memory of the customer's setup: accepted facts (in use) and facts waiting for a person. | runs |
| `releases_learn` | Propose one fact about the customer's setup for this agent to remember. | runs |
| `releases_accept_learning` | A named person accepts or rejects a fact waiting in this agent's memory. | one named click, even in Auto (`accept_learning`) |
| `releases_retire_memory` | A named person stops an accepted fact from applying. | one named click, even in Auto (`accept_learning`) |
| `ledger_post` | Never posts journal entries or changes the books; your accountant posts the reviewed entry. | refused |

Any tool name not in this table is blocked, including names a model invents. `refused` tools are listed so a model can see they exist and are refused.

## Columns it reads

Table inputs can be CSV, TSV, semicolon- or pipe-separated text, Excel `.xlsx`, JSON or JSONL. Columns are matched by the agent's own name, then by the English names below, then by their names in German, French, Spanish, Portuguese, Italian, Japanese, Chinese and Korean. Dates become `YYYY-MM-DD`; amounts are read with either decimal mark; weights, distances and dimensions are converted when the column says it holds kilograms, kilometres or centimetres. Every result lists under `sources` how each file was read.

### Fund list (`funds`)

| Column | Type | Also read as | For example, in other languages |
|---|---|---|---|
| `fund` (required) | text | Fund, Fund Code, Fund ID, Fund Number, GAU, Designation | Fonds, Fonds, 基金, 基金 |
| `fund_name` | text | Fund Name, Fund Description, Name, Description | - |
| `restriction` | text | Restriction, Restriction Type, Net Asset Class, Fund Type, Class, Donor Restriction | Zweckbindung, Restriction, 使途制限, 限定性 |
| `release_date` | date | Release Date, Time Restriction Ends, Available From, Restricted Until | - |

### General ledger detail (`gl`)

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

A German export in Windows-1252 with semicolons, `1.234,56` and `03.11.2026`, or a Japanese one in Shift_JIS with `2026/11/03`, is read the same way as the English file. [`fixtures/intl/`](fixtures/intl) has both versions of the demo data, and the eval cases `intl-de-*` and `intl-ja-*` require the same results as the English case. A weight, distance or dimension column found by its translated name with no unit in it is read as metric and converted, and the result says so. Columns named differently? Run `npx fairgive-restriction-releases inspect <file>` (names and shapes only, never values) and name them in `fairgive-sources.json`:

```json
{ "files": { "exports/bills.csv": { "columns": { "invoice_number": "Beleg" }, "date_order": "dmy", "units": { "weight": "kg" } } } }
```

## Memory

fairgive-restriction-releases can remember facts about your setup so the next run does not have to be told again. `releases_learn` only proposes a fact; it changes nothing until a named person accepts it with `releases_accept_learning`, which is one click even in Auto. Facts live in one hash-chained file per agent under `.fairgive/memory/`; if the chain does not verify, no fact is used. Credentials, personal identifiers and text that reads like instructions to an AI are refused. Run without memory with `--no-memory`.

| Kind | What an accepted fact changes |
|---|---|
| `note` | nothing (shown by recall only) |

```bash
fairgive-restriction-releases memory list
fairgive-restriction-releases memory accept MEM-1a2b3c4d5e6f --as "Your Name"
fairgive-restriction-releases memory retire MEM-1a2b3c4d5e6f --as "Your Name" --reason "carrier renamed"
```

<!-- sources:start -->
## Exports it reads

Table inputs can be CSV, TSV, semicolon- or pipe-separated text, Excel `.xlsx`, JSON or JSONL. A file already in this agent's own columns is read as it is. The exports below are recognised by their column names and mapped onto those columns; dates become `YYYY-MM-DD`, amounts plain decimals (both decimal marks), and yes/no columns `yes`/`no`. Each result lists, under `sources`, which export was recognised, which columns were mapped, and any rows skipped or dates that could be read two ways.

**Fund list** (argument `funds`)

No named exports: other column names are matched by a list of common alternatives.

**General ledger detail** (argument `gl`)

| System | Export | Layout checked against vendor docs |
|---|---|---|
| QuickBooks Online | General Ledger report (CSV or Excel) | no |
| Aplos | Transactions export | no |
| Sage Intacct | General ledger detail report export | no |
| Blackbaud Financial Edge NXT | Journal entry or account activity export | no |

Columns named differently? Run `npx fairgive-restriction-releases inspect <file>` to see how a file is read (column names and shapes only, never values), then name your columns in `fairgive-sources.json` in the root:

```json
{ "files": { "exports/users.csv": { "columns": { "email": "Work E-mail" }, "date_order": "dmy" } } }
```

Where a layout says "checked", its column names were compared with the vendor's documentation on that date. The other layouts were written from knowledge of the export and were not checked. None was tested against a live account. If a real export does not match, the result says which columns were missing; please report it.
<!-- sources:end -->

## Install

Node 20 or newer. No other dependencies.

```bash
npx -y fairgive-restriction-releases demo
npx -y fairgive-restriction-releases mcp --root /path/to/your/files
```

Claude Desktop, Cursor and other MCP hosts:

```json
{
  "mcpServers": {
    "fairgive-restriction-releases": {
      "command": "npx",
      "args": [
        "-y",
        "fairgive-restriction-releases",
        "mcp",
        "--root",
        "/path/to/your/files"
      ]
    }
  }
}
```

Claude Code: `claude mcp add fairgive-restriction-releases -- npx -y fairgive-restriction-releases mcp --root .`, or install the `fairgive-restriction-releases` plugin from this repository's marketplace.

## Modes and approvals

- **Review** (`--mode review`): reads and reports only.
- **Assist** (default): the policy above. A tool that asks returns an `approval_id`; a person approves it once with `fairgive-restriction-releases approve <id> --as "Your Name"` (or on the local approvals page, `fairgive-restriction-releases approvals`), and the same call is repeated.
- **Auto** (`--mode auto --auto <tool,...>`): opt-in per tool, with step caps and a kill switch (`fairgive-restriction-releases kill`). Paying, sending, posting to a ledger or a live system and accepting a learned fact stay **one named click even in Auto**; an approval is tied to the sha256 of the reviewed draft, so a changed draft needs a new click.

## CLI

```bash
fairgive-restriction-releases tools                 # every tool, its policy and arguments
fairgive-restriction-releases sources               # the columns each input is read from
fairgive-restriction-releases inspect <file>        # how a file would be read (names and shapes, never values)
fairgive-restriction-releases call releases_check '{"funds":"<funds>","gl":"<gl>"}'
fairgive-restriction-releases eval                  # the private eval cases on the fictional fixtures
fairgive-restriction-releases demo
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
