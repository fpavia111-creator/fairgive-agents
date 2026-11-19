# fairgive-liquidity

Works out financial assets available for general spending within one year from your balance sheet accounts and restrictions, with months of operating expenses covered. Flags restricted cash counted as available and receivables due after a year.

Part of **Fairgive**, the nonprofit, foundation, church and association back-office agents by Mythos Machines. The software is free (MIT); the paid part is a fixed-price setup on your own files. Every result is computed from your files with plain arithmetic, on your computer; no AI model is called by the tools.

## What it checks

Works out the financial assets available for general spending within one year: cash, investments and receivables, less donor-restricted amounts (time restrictions ending within the year count), less board designations unless the settings include them, less receivables due after a year. Shows the months of expenses they cover and lists restricted amounts marked available, board designations left out, long-term receivables and accounts with no category.

| Finding | Example from the fictional demo data |
|---|---|
| `board_designated_excluded` | Account 1210 Board reserve investments (80000) is board designated and left out; the board can undo a designation, so say so in the note. |
| `no_category` | Account 1700 Suspense (5000) has no category, so it is not counted. |
| `receivable_beyond_year` | Account 1310 Pledges receivable - long term (40000) is due after one year and left out. |
| `restricted_marked_available` | Account 1030 Grant cash advance (15000) is donor-restricted for a purpose but marked available within a year; it is left out until the restriction is met. |

Each item gets the most serious level of its findings: **flag** (act on it), **review** (data is missing or unclear; a person looks), **watch** (worth knowing) or **ok**. Every finding names the numbers it was worked out from.

## Settings

Put the ones you want to change in a JSON file and pass it as `settings`; anything left out uses the default. The result lists the settings it used under `settings_used`.

| Setting | Default | Meaning |
|---|---|---|
| `annual_expenses` | `null` | Yearly operating expenses, to show months covered |
| `min_months` | `3` | Months of expenses below which liquidity is watched (default 3) |
| `include_board_designated` | `false` | Count board-designated amounts as available (default false) |
| `financial_categories` | `["cash","investments","receivable","pledges receivable","grants receivable","accounts receivable"]` | Categories that are financial assets |

<!-- generated:start -->

## A demo run

`npx -y fairgive-liquidity demo` runs the agent on the fictional files in [`fixtures/`](fixtures) in a temporary folder. Captured output:

```text
Fairgive Liquidity demo (fictional nonprofit data), Auto mode on

▶ Run the check on the exported files
  status: executed  decision: allow
  Financial assets 560,000.00; available for general spending within one year 395,000.00, 3.95 months of expenses.
    flag    1030                                restricted_marked_available
    review  1700                                no_category
    watch   1210                                board_designated_excluded
    watch   1310                                receivable_beyond_year

▶ Explain 1030
  status: executed  decision: allow
  1030: flag. Account 1030 Grant cash advance (15000) is donor-restricted for a purpose but marked available within a year; it is left out until the restriction is met.

▶ Write the report (CSV worklist and HTML page)
  status: executed  decision: allow
  Liquidity and availability written: Financial assets 560,000.00; available for general spending within one year 395,000.00, 3.95 months of expenses.

▶ The agent tries bank_transfer itself
  status: blocked  decision: block
  reason: Never moves money between bank or investment accounts.

Audit log: <demo folder>/.fairgive/audit.jsonl
```

## Tools

| Tool | What it does | Policy |
|---|---|---|
| `liquidity_check` | Works out the financial assets available for general spending within one year: cash, investments and receivables, less donor-restricted amounts (time restrictions ending within the year count), less board designations… | runs |
| `liquidity_explain` | Show one account from liquidity_check with every finding, the numbers behind it and the setting it was checked against. | runs |
| `liquidity_write_report` | Write liquidity.csv (one row per item, with blank owner and decision columns) and liquidity.html into out_dir (default fairgive-out/liquidity). | runs |
| `liquidity_recall` | Search this agent's own memory of the customer's setup: accepted facts (in use) and facts waiting for a person. | runs |
| `liquidity_learn` | Propose one fact about the customer's setup for this agent to remember. | runs |
| `liquidity_accept_learning` | A named person accepts or rejects a fact waiting in this agent's memory. | one named click, even in Auto (`accept_learning`) |
| `liquidity_retire_memory` | A named person stops an accepted fact from applying. | one named click, even in Auto (`accept_learning`) |
| `bank_transfer` | Never moves money between bank or investment accounts. | refused |
| `ledger_post` | Never posts journal entries or changes the books; your accountant posts the reviewed entry. | refused |

Any tool name not in this table is blocked, including names a model invents. `refused` tools are listed so a model can see they exist and are refused.

## Columns it reads

Table inputs can be CSV, TSV, semicolon- or pipe-separated text, Excel `.xlsx`, JSON or JSONL. Columns are matched by the agent's own name, then by the English names below, then by their names in German, French, Spanish, Portuguese, Italian, Japanese, Chinese and Korean. Dates become `YYYY-MM-DD`; amounts are read with either decimal mark; weights, distances and dimensions are converted when the column says it holds kilograms, kilometres or centimetres. Every result lists under `sources` how each file was read.

### Asset balances (`balances`)

| Column | Type | Also read as | For example, in other languages |
|---|---|---|---|
| `account` (required) | text | Account, Account Number, Account No, GL Account | Konto, Compte, 勘定科目, 科目代码 |
| `account_name` | text | Account Name, Account Title, Description | Kontobezeichnung, Libellé du compte, 勘定科目名, 科目名称 |
| `category` | text | Category, Asset Category, Type, Account Type | Kategorie, Catégorie, 経費科目, 费用类别 |
| `balance` | amount | Balance, Ending Balance, Amount, Debit | Saldo, Solde, 残高, 余额 |
| `restriction` | text | Restriction, Net Asset Class, Fund Type | Zweckbindung, Restriction, 使途制限, 限定性 |
| `available_within_year` | text | Available Within Year, Available Within One Year, Current, Due Within Year | - |

### Files from other countries

A German export in Windows-1252 with semicolons, `1.234,56` and `03.11.2026`, or a Japanese one in Shift_JIS with `2026/11/03`, is read the same way as the English file. [`fixtures/intl/`](fixtures/intl) has both versions of the demo data, and the eval cases `intl-de-*` and `intl-ja-*` require the same results as the English case. A weight, distance or dimension column found by its translated name with no unit in it is read as metric and converted, and the result says so. Columns named differently? Run `npx fairgive-liquidity inspect <file>` (names and shapes only, never values) and name them in `fairgive-sources.json`:

```json
{ "files": { "exports/bills.csv": { "columns": { "invoice_number": "Beleg" }, "date_order": "dmy", "units": { "weight": "kg" } } } }
```

## Memory

fairgive-liquidity can remember facts about your setup so the next run does not have to be told again. `liquidity_learn` only proposes a fact; it changes nothing until a named person accepts it with `liquidity_accept_learning`, which is one click even in Auto. Facts live in one hash-chained file per agent under `.fairgive/memory/`; if the chain does not verify, no fact is used. Credentials, personal identifiers and text that reads like instructions to an AI are refused. Run without memory with `--no-memory`.

| Kind | What an accepted fact changes |
|---|---|
| `note` | nothing (shown by recall only) |

```bash
fairgive-liquidity memory list
fairgive-liquidity memory accept MEM-1a2b3c4d5e6f --as "Your Name"
fairgive-liquidity memory retire MEM-1a2b3c4d5e6f --as "Your Name" --reason "carrier renamed"
```

## Install

Node 20 or newer. No other dependencies.

```bash
npx -y fairgive-liquidity demo
npx -y fairgive-liquidity mcp --root /path/to/your/files
```

Claude Desktop, Cursor and other MCP hosts:

```json
{
  "mcpServers": {
    "fairgive-liquidity": {
      "command": "npx",
      "args": [
        "-y",
        "fairgive-liquidity",
        "mcp",
        "--root",
        "/path/to/your/files"
      ]
    }
  }
}
```

Claude Code: `claude mcp add fairgive-liquidity -- npx -y fairgive-liquidity mcp --root .`, or install the `fairgive-liquidity` plugin from this repository's marketplace.

## Modes and approvals

- **Review** (`--mode review`): reads and reports only.
- **Assist** (default): the policy above. A tool that asks returns an `approval_id`; a person approves it once with `fairgive-liquidity approve <id> --as "Your Name"` (or on the local approvals page, `fairgive-liquidity approvals`), and the same call is repeated.
- **Auto** (`--mode auto --auto <tool,...>`): opt-in per tool, with step caps and a kill switch (`fairgive-liquidity kill`). Paying, sending, posting to a ledger or a live system and accepting a learned fact stay **one named click even in Auto**; an approval is tied to the sha256 of the reviewed draft, so a changed draft needs a new click.

## CLI

```bash
fairgive-liquidity tools                 # every tool, its policy and arguments
fairgive-liquidity sources               # the columns each input is read from
fairgive-liquidity inspect <file>        # how a file would be read (names and shapes, never values)
fairgive-liquidity call liquidity_check '{"balances":"<balances>"}'
fairgive-liquidity eval                  # the private eval cases on the fictional fixtures
fairgive-liquidity demo
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
