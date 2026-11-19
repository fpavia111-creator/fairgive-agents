# fairgive-fund-balances

Fund balances by restriction class from your fund list and ledger: restricted funds spent below zero, funds coded to the wrong net asset class, endowment corpus below the gift value and due-to/due-from that do not net to zero. Never posts entries.

Part of **Fairgive**, the nonprofit, foundation, church and association back-office agents by Mythos Machines. The software is free (MIT); the paid part is a fixed-price setup on your own files. Every result is computed from your files with plain arithmetic, on your computer; no AI model is called by the tools.

## What it checks

Works out the balance of each fund from its activity and net asset lines and totals them by class (without donor restrictions, board designated, with donor restrictions, perpetual). Flags restricted funds below zero, endowments below their corpus, net asset lines in the account of the other class, ledger funds missing from the fund list, funds with no restriction code and due-to/due-from lines that do not net to zero.

| Finding | Example from the fictional demo data |
|---|---|
| `interfund_not_zero` | Due-to and due-from lines across all funds add up to 500, not zero. |
| `negative_restricted_balance` | Fund YOUTH (with donor restrictions) is -2000: more was spent than the restricted gifts it holds. |
| `no_restriction_code` | Fund MISC has no restriction code; its balance 500 is not counted in either class. |
| `perpetual_below_corpus` | Fund ENDOW is 94000, under its corpus (original gift value) of 100000 by 6000. |
| `unknown_fund` | 1 ledger line(s) use fund OLDFUND, which is not in the fund list (balance 300). |
| `wrong_net_asset_class` | Fund CAPITAL is Purpose restricted but 15000 sits in net asset account 3100, which the settings map to the other class. |

Each item gets the most serious level of its findings: **flag** (act on it), **review** (data is missing or unclear; a person looks), **watch** (worth knowing) or **ok**. Every finding names the numbers it was worked out from.

## Settings

Put the ones you want to change in a JSON file and pass it as `settings`; anything left out uses the default. The result lists the settings it used under `settings_used`.

| Setting | Default | Meaning |
|---|---|---|
| `net_asset_accounts` | `{}` | Net asset account numbers (or first digits) and their class, e.g. {"3100": "without", "3200": "with"} |
| `interfund_accounts` | `[]` | Due-to and due-from account numbers (or first digits) that should net to zero across funds |
| `activity_from` | `"3"` | Accounts that start at or after this number are net asset, revenue and expense accounts (default "3") |
| `tolerance` | `0.01` | Difference ignored (default 0.01) |

<!-- generated:start -->

## A demo run

`npx -y fairgive-fund-balances demo` runs the agent on the fictional files in [`fixtures/`](fixtures) in a temporary folder. Captured output:

```text
Fairgive Fund Balances demo (fictional nonprofit data), Auto mode on

▶ Run the check on the exported files
  status: executed  decision: allow
  7 fund(s): without donor restrictions 65,000.00 (board designated 25,000.00), with donor restrictions 116,000.00 (perpetual 94,000.00). Restricted funds below zero 2,000.00, net assets in the wrong class 15,000.00, interfund gap 500.00.
    flag    CAPITAL                             wrong_net_asset_class
    flag    ENDOW                               perpetual_below_corpus
    flag    Interfund                           interfund_not_zero
    flag    YOUTH                               negative_restricted_balance
    review  MISC                                no_restriction_code
    review  OLDFUND                             unknown_fund

▶ Explain YOUTH
  status: executed  decision: allow
  YOUTH: flag. Fund YOUTH (with donor restrictions) is -2000: more was spent than the restricted gifts it holds.

▶ Write the report (CSV worklist and HTML page)
  status: executed  decision: allow
  Fund balances by restriction written: 7 fund(s): without donor restrictions 65,000.00 (board designated 25,000.00), with donor restrictions 116,000.00 (perpetual 94,000.00). Restricted funds below zero 2,000.00, net assets in the wrong class 15,000.00, interfund gap 500.00.

▶ The agent tries ledger_post itself
  status: blocked  decision: block
  reason: Never posts journal entries or changes the books; your accountant posts the reviewed entry.

Audit log: <demo folder>/.fairgive/audit.jsonl
```

## Tools

| Tool | What it does | Policy |
|---|---|---|
| `funds_check` | Works out the balance of each fund from its activity and net asset lines and totals them by class (without donor restrictions, board designated, with donor restrictions, perpetual). | runs |
| `funds_explain` | Show one fund from funds_check with every finding, the numbers behind it and the setting it was checked against. | runs |
| `funds_write_report` | Write fund-balances.csv (one row per item, with blank owner and decision columns) and fund-balances.html into out_dir (default fairgive-out/funds). | runs |
| `funds_recall` | Search this agent's own memory of the customer's setup: accepted facts (in use) and facts waiting for a person. | runs |
| `funds_learn` | Propose one fact about the customer's setup for this agent to remember. | runs |
| `funds_accept_learning` | A named person accepts or rejects a fact waiting in this agent's memory. | one named click, even in Auto (`accept_learning`) |
| `funds_retire_memory` | A named person stops an accepted fact from applying. | one named click, even in Auto (`accept_learning`) |
| `ledger_post` | Never posts journal entries or changes the books; your accountant posts the reviewed entry. | refused |
| `bank_transfer` | Never moves money between bank or investment accounts. | refused |

Any tool name not in this table is blocked, including names a model invents. `refused` tools are listed so a model can see they exist and are refused.

## Columns it reads

Table inputs can be CSV, TSV, semicolon- or pipe-separated text, Excel `.xlsx`, JSON or JSONL. Columns are matched by the agent's own name, then by the English names below, then by their names in German, French, Spanish, Portuguese, Italian, Japanese, Chinese and Korean. Dates become `YYYY-MM-DD`; amounts are read with either decimal mark; weights, distances and dimensions are converted when the column says it holds kilograms, kilometres or centimetres. Every result lists under `sources` how each file was read.

### Fund list (`funds`)

| Column | Type | Also read as | For example, in other languages |
|---|---|---|---|
| `fund` (required) | text | Fund, Fund Code, Fund ID, Fund Number, GAU, Designation | Fonds, Fonds, 基金, 基金 |
| `fund_name` | text | Fund Name, Fund Description, Name, Description | - |
| `restriction` | text | Restriction, Restriction Type, Net Asset Class, Fund Type, Class, Donor Restriction | Zweckbindung, Restriction, 使途制限, 限定性 |
| `corpus` | amount | Corpus, Historic Dollar Value, Original Gift, Original Gift Value, Gift Value | Stiftungskapital, Valeur historique, 当初寄付額, 原始捐赠额 |

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

A German export in Windows-1252 with semicolons, `1.234,56` and `03.11.2026`, or a Japanese one in Shift_JIS with `2026/11/03`, is read the same way as the English file. [`fixtures/intl/`](fixtures/intl) has both versions of the demo data, and the eval cases `intl-de-*` and `intl-ja-*` require the same results as the English case. A weight, distance or dimension column found by its translated name with no unit in it is read as metric and converted, and the result says so. Columns named differently? Run `npx fairgive-fund-balances inspect <file>` (names and shapes only, never values) and name them in `fairgive-sources.json`:

```json
{ "files": { "exports/bills.csv": { "columns": { "invoice_number": "Beleg" }, "date_order": "dmy", "units": { "weight": "kg" } } } }
```

## Memory

fairgive-fund-balances can remember facts about your setup so the next run does not have to be told again. `funds_learn` only proposes a fact; it changes nothing until a named person accepts it with `funds_accept_learning`, which is one click even in Auto. Facts live in one hash-chained file per agent under `.fairgive/memory/`; if the chain does not verify, no fact is used. Credentials, personal identifiers and text that reads like instructions to an AI are refused. Run without memory with `--no-memory`.

| Kind | What an accepted fact changes |
|---|---|
| `note` | nothing (shown by recall only) |

```bash
fairgive-fund-balances memory list
fairgive-fund-balances memory accept MEM-1a2b3c4d5e6f --as "Your Name"
fairgive-fund-balances memory retire MEM-1a2b3c4d5e6f --as "Your Name" --reason "carrier renamed"
```

## Install

Node 20 or newer. No other dependencies.

```bash
npx -y fairgive-fund-balances demo
npx -y fairgive-fund-balances mcp --root /path/to/your/files
```

Claude Desktop, Cursor and other MCP hosts:

```json
{
  "mcpServers": {
    "fairgive-fund-balances": {
      "command": "npx",
      "args": [
        "-y",
        "fairgive-fund-balances",
        "mcp",
        "--root",
        "/path/to/your/files"
      ]
    }
  }
}
```

Claude Code: `claude mcp add fairgive-fund-balances -- npx -y fairgive-fund-balances mcp --root .`, or install the `fairgive-fund-balances` plugin from this repository's marketplace.

## Modes and approvals

- **Review** (`--mode review`): reads and reports only.
- **Assist** (default): the policy above. A tool that asks returns an `approval_id`; a person approves it once with `fairgive-fund-balances approve <id> --as "Your Name"` (or on the local approvals page, `fairgive-fund-balances approvals`), and the same call is repeated.
- **Auto** (`--mode auto --auto <tool,...>`): opt-in per tool, with step caps and a kill switch (`fairgive-fund-balances kill`). Paying, sending, posting to a ledger or a live system and accepting a learned fact stay **one named click even in Auto**; an approval is tied to the sha256 of the reviewed draft, so a changed draft needs a new click.

## CLI

```bash
fairgive-fund-balances tools                 # every tool, its policy and arguments
fairgive-fund-balances sources               # the columns each input is read from
fairgive-fund-balances inspect <file>        # how a file would be read (names and shapes, never values)
fairgive-fund-balances call funds_check '{"funds":"<funds>","gl":"<gl>"}'
fairgive-fund-balances eval                  # the private eval cases on the fictional fixtures
fairgive-fund-balances demo
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
