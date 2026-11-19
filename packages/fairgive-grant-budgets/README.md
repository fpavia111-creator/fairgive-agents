# fairgive-grant-budgets

Grant budget against actual by grant and budget line, with costs shared across several grants by allocation percentages: lines over budget beyond your flexibility rule, allocations over or under 100%, costs outside the grant period and unallowable categories. Never posts.

Part of **Fairgive**, the nonprofit, foundation, church and association back-office agents by Mythos Machines. The software is free (MIT); the paid part is a fixed-price setup on your own files. Every result is computed from your files with plain arithmetic, on your computer; no AI model is called by the tools.

## What it checks

Charges direct costs to their grant and splits pooled costs by the allocation table, then compares each grant line with its budget: over within the flexibility percentage is watched, beyond it flagged. Also lists costs dated outside the award period, costs whose memo names a word the settings call unallowable, lines with no budget, grants charged over the award, and pools split over or under 100%.

| Finding | Example from the fictional demo data |
|---|---|
| `allocation_over_100` | Pool POOL-RENT is split 110% across grants: 1000 more than the cost was charged. |
| `allocation_under_100` | Pool POOL-STAFF is split 90% across grants; 9000 stays unallocated. |
| `line_over_budget` | G-ARTS / Salaries: actual 36000 against budget 30000, over by 6000 (20%; flexibility 10%). |
| `line_over_small` | G-ARTS / Travel: actual 2100 against budget 2000, over by 100 (5%; flexibility 10%). |
| `no_budget_line` | G-ARTS / Occupancy: 6000 spent and no budget line. |
| `outside_period` | G-FED / Salaries: 25000 is dated outside the award period 2026-07-01 to 2027-06-30. |
| `unallowable_cost` | G-FED / Supplies: entry E6 (300) mentions "wine", which the settings list as unallowable. |

Each item gets the most serious level of its findings: **flag** (act on it), **review** (data is missing or unclear; a person looks), **watch** (worth knowing) or **ok**. Every finding names the numbers it was worked out from.

## Settings

Put the ones you want to change in a JSON file and pass it as `settings`; anything left out uses the default. The result lists the settings it used under `settings_used`.

| Setting | Default | Meaning |
|---|---|---|
| `flexibility_pct` | `10` | Percent over a budget line that is only watched; above it the line is flagged (default 10; check your award terms) |
| `unallowable_words` | `["alcohol","wine","beer","liquor","lobbying","entertainment","penalties","fines","bad debt"]` | Words in a memo or line that mark a cost your funders do not allow (alcohol, lobbying...) |
| `tolerance` | `0.01` | Difference ignored (default 0.01) |

<!-- generated:start -->

## A demo run

`npx -y fairgive-grant-budgets demo` runs the agent on the fictional files in [`fixtures/`](fixtures) in a temporary folder. Captured output:

```text
Fairgive Grant Budgets demo (fictional nonprofit data), Auto mode on

▶ Run the check on the exported files
  status: executed  decision: allow
  2 grant(s): budget 115,000.00, actual 109,000.00; over budget 6,700.00, outside the award period 25,000.00, unallowable 300.00, with no budget line 11,000.00.
    flag    G-ARTS / Salaries                   line_over_budget
    flag    G-ARTS / Supplies                   line_over_budget
    flag    G-FED / Salaries                    outside_period
    flag    G-FED / Supplies                    unallowable_cost
    flag    Pool POOL-RENT                      allocation_over_100
    review  G-ARTS / Occupancy                  no_budget_line
    review  G-FED / Occupancy                   no_budget_line
    watch   G-ARTS / Travel                     line_over_small
    watch   Pool POOL-STAFF                     allocation_under_100

▶ Explain G-FED / Salaries
  status: executed  decision: allow
  G-FED / Salaries: flag. G-FED / Salaries: 25000 is dated outside the award period 2026-07-01 to 2027-06-30.

▶ Write the report (CSV worklist and HTML page)
  status: executed  decision: allow
  Grant budget against actual written: 2 grant(s): budget 115,000.00, actual 109,000.00; over budget 6,700.00, outside the award period 25,000.00, unallowable 300.00, with no budget line 11,000.00.

▶ The agent tries ledger_post itself
  status: blocked  decision: block
  reason: Never posts journal entries or changes the books; your accountant posts the reviewed entry.

Audit log: <demo folder>/.fairgive/audit.jsonl
```

## Tools

| Tool | What it does | Policy |
|---|---|---|
| `grant_budget_check` | Charges direct costs to their grant and splits pooled costs by the allocation table, then compares each grant line with its budget: over within the flexibility percentage is watched, beyond it flagged. | runs |
| `grant_budget_explain` | Show one grant line or pool ("G-FED / Salaries", "Pool POOL-RENT") from grant_budget_check with every finding, the numbers behind it and the setting it was checked against. | runs |
| `grant_budget_write_report` | Write grant-budgets.csv (one row per item, with blank owner and decision columns) and grant-budgets.html into out_dir (default fairgive-out/grant_budget). | runs |
| `grant_budget_recall` | Search this agent's own memory of the customer's setup: accepted facts (in use) and facts waiting for a person. | runs |
| `grant_budget_learn` | Propose one fact about the customer's setup for this agent to remember. | runs |
| `grant_budget_accept_learning` | A named person accepts or rejects a fact waiting in this agent's memory. | one named click, even in Auto (`accept_learning`) |
| `grant_budget_retire_memory` | A named person stops an accepted fact from applying. | one named click, even in Auto (`accept_learning`) |
| `ledger_post` | Never posts journal entries or changes the books; your accountant posts the reviewed entry. | refused |
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
| `award_amount` | amount | Award Amount, Grant Amount, Amount Awarded, Total Award, Award Total, Amount | Fördersumme, Montant accordé, 助成額, 资助金额 |
| `award_start` | date | Start Date, Period Start, Award Start, Project Start, Begin Date | Eintrittsdatum, Date d'entrée, 入社日, 入职日期 |
| `award_end` | date | End Date, Period End, Award End, Project End, Expiration Date | Austrittsdatum, Date de sortie, 退職日, 离职日期 |
| `federal` | text | Federal, Federal Award, Is Federal, Federal Funds | - |

### Grant budgets (`budget`)

| Column | Type | Also read as | For example, in other languages |
|---|---|---|---|
| `grant` (required) | text | Grant, Grant ID, Grant Code, Award, Project | Förderprojekt, Subvention, 助成金, 资助项目 |
| `line` | text | Line, Budget Line, Category, Cost Category, Object Class, Budget Category | Kategorie, Catégorie, 経費科目, 费用类别 |
| `budget_amount` | amount | Budget, Budget Amount, Amount, Approved Budget | Budget, Budget, 予算, 预算 |

### Expense lines (`expenses`)

| Column | Type | Also read as | For example, in other languages |
|---|---|---|---|
| `entry_id` | text | Entry ID, Num, Journal, Transaction ID, Reference | - |
| `date` | date | Date, Posting Date, Transaction Date | Datum, Date, 日付, 日期 |
| `account` | text | Account, GL Account, Account Number | Konto, Compte, 勘定科目, 科目代码 |
| `grant` | text | Grant, Grant ID, Grant Code, Project, Award, Job | Förderprojekt, Subvention, 助成金, 资助项目 |
| `line` | text | Line, Budget Line, Category, Cost Category, Object Class, Account title | Kategorie, Catégorie, 経費科目, 费用类别 |
| `amount` | amount | Amount, Debit, Expense, Net Amount | Betrag, Montant, 金額, 金额 |
| `memo` | text | Memo, Description, Memo/Description, Narrative | Verwendungszweck, Libellé, 摘要, 摘要 |
| `pool` | text | Pool, Cost Pool, Shared Cost Pool, Allocation Pool | - |

### Allocation table (`allocations`)

| Column | Type | Also read as | For example, in other languages |
|---|---|---|---|
| `pool` (required) | text | Pool, Cost Pool, Shared Cost Pool | - |
| `grant` | text | Grant, Grant ID, Grant Code, Project | Förderprojekt, Subvention, 助成金, 资助项目 |
| `pct` | number | Pct, Percent, Percentage, Share, Allocation % | Anteil %, Pourcentage, 配賦率, 分摊比例 |

### Files from other countries

A German export in Windows-1252 with semicolons, `1.234,56` and `03.11.2026`, or a Japanese one in Shift_JIS with `2026/11/03`, is read the same way as the English file. [`fixtures/intl/`](fixtures/intl) has both versions of the demo data, and the eval cases `intl-de-*` and `intl-ja-*` require the same results as the English case. A weight, distance or dimension column found by its translated name with no unit in it is read as metric and converted, and the result says so. Columns named differently? Run `npx fairgive-grant-budgets inspect <file>` (names and shapes only, never values) and name them in `fairgive-sources.json`:

```json
{ "files": { "exports/bills.csv": { "columns": { "invoice_number": "Beleg" }, "date_order": "dmy", "units": { "weight": "kg" } } } }
```

## Memory

fairgive-grant-budgets can remember facts about your setup so the next run does not have to be told again. `grant_budget_learn` only proposes a fact; it changes nothing until a named person accepts it with `grant_budget_accept_learning`, which is one click even in Auto. Facts live in one hash-chained file per agent under `.fairgive/memory/`; if the chain does not verify, no fact is used. Credentials, personal identifiers and text that reads like instructions to an AI are refused. Run without memory with `--no-memory`.

| Kind | What an accepted fact changes |
|---|---|
| `note` | nothing (shown by recall only) |

```bash
fairgive-grant-budgets memory list
fairgive-grant-budgets memory accept MEM-1a2b3c4d5e6f --as "Your Name"
fairgive-grant-budgets memory retire MEM-1a2b3c4d5e6f --as "Your Name" --reason "carrier renamed"
```

## Install

Node 20 or newer. No other dependencies.

```bash
npx -y fairgive-grant-budgets demo
npx -y fairgive-grant-budgets mcp --root /path/to/your/files
```

Claude Desktop, Cursor and other MCP hosts:

```json
{
  "mcpServers": {
    "fairgive-grant-budgets": {
      "command": "npx",
      "args": [
        "-y",
        "fairgive-grant-budgets",
        "mcp",
        "--root",
        "/path/to/your/files"
      ]
    }
  }
}
```

Claude Code: `claude mcp add fairgive-grant-budgets -- npx -y fairgive-grant-budgets mcp --root .`, or install the `fairgive-grant-budgets` plugin from this repository's marketplace.

## Modes and approvals

- **Review** (`--mode review`): reads and reports only.
- **Assist** (default): the policy above. A tool that asks returns an `approval_id`; a person approves it once with `fairgive-grant-budgets approve <id> --as "Your Name"` (or on the local approvals page, `fairgive-grant-budgets approvals`), and the same call is repeated.
- **Auto** (`--mode auto --auto <tool,...>`): opt-in per tool, with step caps and a kill switch (`fairgive-grant-budgets kill`). Paying, sending, posting to a ledger or a live system and accepting a learned fact stay **one named click even in Auto**; an approval is tied to the sha256 of the reviewed draft, so a changed draft needs a new click.

## CLI

```bash
fairgive-grant-budgets tools                 # every tool, its policy and arguments
fairgive-grant-budgets sources               # the columns each input is read from
fairgive-grant-budgets inspect <file>        # how a file would be read (names and shapes, never values)
fairgive-grant-budgets call grant_budget_check '{"budget":"<budget>","expenses":"<expenses>"}'
fairgive-grant-budgets eval                  # the private eval cases on the fictional fixtures
fairgive-grant-budgets demo
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
