# fairgive-endowment-draw

Works out each endowment fund's draw from your spending policy (rate times the average of past quarter-end values), flags underwater funds, too little history and rates over the prudence presumption in your settings, and drafts the draw memo.

Part of **Fairgive**, the nonprofit, foundation, church and association back-office agents by Mythos Machines. The software is free (MIT); the paid part is a fixed-price setup on your own files. Every result is computed from your files with plain arithmetic, on your computer; no AI model is called by the tools. It reads files and writes reports and drafts; it never files, sends, pays or changes a live system, and a person on your team decides and acts on every finding.

## What it needs

Exports you already have, saved as files on your computer (CSV, Excel, JSON; see "Columns it reads" and "Exports it reads" below):

- `funds` (required): Endowment funds: fund code, name, corpus (historic dollar value of the gifts)
- `values` (required): Quarter-end market values (from your investment statements): fund, date, market value
- `draws`: Optional draws already booked: fund, fiscal year, amount
- `settings` (optional): a JSON file with your own thresholds and rules; see "Settings" below.

## What it checks

Works out each endowment fund's draw as the spending rate times the average of its last quarter-end market values up to the value date. Lists funds below their corpus (and gives them no draw when the settings say so), funds with less history than the policy averages, booked draws that differ from the policy figure, and a spending rate over the prudence figure in the settings.

| Finding | Example from the fictional demo data |
|---|---|
| `draw_differs` | ENDOW-B: 10000 is booked as the draw; the policy gives 9375 (4.5% of the 12-quarter average 208333.33). |
| `insufficient_history` | ENDOW-C has 6 quarter-end value(s), fewer than the 12 the policy averages; the draw uses the 6 there are. |
| `underwater` | ENDOW-B is 190000, 10000 below its corpus of 200000. The board should look at the draw before it is made. |

Each item gets the most serious level of its findings: **flag** (act on it), **review** (data is missing or unclear; a person looks), **watch** (worth knowing) or **ok**. Every finding names the numbers it was worked out from.

## Settings

Put the ones you want to change in a JSON file and pass it as `settings`; anything left out uses the default. The result lists the settings it used under `settings_used`.

| Setting | Default | Meaning |
|---|---|---|
| `spending_rate` | `4` | Percent of the average value drawn each year, from your spending policy (default 4) |
| `quarters` | `12` | Quarter-end values averaged (default 12) |
| `value_date` | `null` | Last quarter end to use (YYYY-MM-DD); default: the latest value in the file |
| `fiscal_year` | `null` | Fiscal year of the draw, to pick booked draws |
| `prudence_rate` | `7` | Rate above which spending is flagged for the board (default 7, the figure many state laws use; check yours) |
| `underwater_policy` | `"spend"` | Whether your policy allows a draw from a fund below its corpus (default spend, listed for the board) |
| `organization` | `""` | Your organization name for the draw memo |
| `tolerance` | `0.01` | Difference ignored (default 0.01) |

<!-- generated:start -->

## A demo run

`npx -y fairgive-endowment-draw demo` runs the agent on the fictional files in [`fixtures/`](fixtures) in a temporary folder. Captured output:

```text
Fairgive Endowment Draw demo (fictional nonprofit data), Auto mode on

▶ Run the check on the exported files
  status: executed  decision: allow
  3 endowment fund(s) worth 379,000.00 at 2026-06-30: policy draw 17,272.50 at 4.5%; 1 fund(s) below corpus.
    flag    ENDOW-B                             underwater, draw_differs
    review  ENDOW-C                             insufficient_history

▶ Explain ENDOW-B
  status: executed  decision: allow
  ENDOW-B: flag. ENDOW-B is 190000, 10000 below its corpus of 200000. The board should look at the draw before it is made. ENDOW-B: 10000 is booked as the draw; the policy gives 9375 (4.5% of the 12-quarter average 208333.33).

▶ Write the report (CSV worklist and HTML page)
  status: executed  decision: allow
  Endowment draw written: 3 endowment fund(s) worth 379,000.00 at 2026-06-30: policy draw 17,272.50 at 4.5%; 1 fund(s) below corpus.

▶ Write a draft (Auto is opted in for drafts here)
  status: executed  decision: allow  (auto)
  draw memo 2027 drafted for 17272.5 with 2 open marker(s) ([TO CONFIRM finance committee], [TO CONFIRM date and minute reference]). Nothing was sent.

▶ Auto: approving the draft stays one named click
  status: needs_approval  decision: ask
  reason: move_money stays one-click, even in Auto

▶ Same call after the named click (recorded; a person acts on it)
  status: executed  decision: ask  approved by: Morgan Manager (fictional)
  draw memo 2027 approved and recorded. Nothing was sent or paid by the agent.

▶ The agent tries bank_transfer itself
  status: blocked  decision: block
  reason: Never moves money between bank or investment accounts.

Audit log: <demo folder>/.fairgive/audit.jsonl
```

## Tools

| Tool | What it does | Policy |
|---|---|---|
| `endowment_check` | Works out each endowment fund's draw as the spending rate times the average of its last quarter-end market values up to the value date. | runs |
| `endowment_explain` | Show one fund from endowment_check with every finding, the numbers behind it and the setting it was checked against. | runs |
| `endowment_write_report` | Write endowment-draw.csv (one row per item, with blank owner and decision columns) and endowment-draw.html into out_dir (default fairgive-out/endowment). | runs |
| `endowment_draft_draw_memo` | Write drafts/draw_memo-<fiscal year>.md: the draw for each fund with the average and rate behind it, for the finance committee to approve. | asks first (Auto can be opted in) |
| `endowment_request_transfer` | After one named human click (even in Auto), record that the reviewed draw memo draft is approved in draw_memo-requests.csv. | one named click, even in Auto (`move_money`) |
| `endowment_recall` | Search this agent's own memory of the customer's setup: accepted facts (in use) and facts waiting for a person. | runs |
| `endowment_learn` | Propose one fact about the customer's setup for this agent to remember. | runs |
| `endowment_accept_learning` | A named person accepts or rejects a fact waiting in this agent's memory. | one named click, even in Auto (`accept_learning`) |
| `endowment_retire_memory` | A named person stops an accepted fact from applying. | one named click, even in Auto (`accept_learning`) |
| `bank_transfer` | Never moves money between bank or investment accounts. | refused |
| `ledger_post` | Never posts journal entries or changes the books; your accountant posts the reviewed entry. | refused |

Any tool name not in this table is blocked, including names a model invents. `refused` tools are listed so a model can see they exist and are refused.

## Columns it reads

Table inputs can be CSV, TSV, semicolon- or pipe-separated text, Excel `.xlsx`, JSON or JSONL. Columns are matched by the agent's own name, then by the English names below, then by their names in German, French, Spanish, Portuguese, Italian, Japanese, Chinese and Korean. Dates become `YYYY-MM-DD`; amounts are read with either decimal mark; weights, distances and dimensions are converted when the column says it holds kilograms, kilometres or centimetres. Every result lists under `sources` how each file was read.

### Endowment funds (`funds`)

| Column | Type | Also read as | For example, in other languages |
|---|---|---|---|
| `fund` (required) | text | Fund, Fund Code, Fund ID, Fund Number, GAU, Designation | Fonds, Fonds, 基金, 基金 |
| `fund_name` | text | Fund Name, Fund Description, Name, Description | - |
| `corpus` | amount | Corpus, Historic Dollar Value, Original Gift Value, Gift Value | Stiftungskapital, Valeur historique, 当初寄付額, 原始捐赠额 |

### Quarter-end values (`values`)

| Column | Type | Also read as | For example, in other languages |
|---|---|---|---|
| `fund` (required) | text | Fund, Fund Code, Account, Pool | Fonds, Fonds, 基金, 基金 |
| `date` | date | Date, Quarter End, As Of, Valuation Date, Period End | Datum, Date, 日付, 日期 |
| `market_value` | amount | Market Value, Value, Fair Value, Ending Value, Balance | Kurswert, Valeur de marché, 時価評価額, 市值 |

### Booked draws (`draws`)

| Column | Type | Also read as | For example, in other languages |
|---|---|---|---|
| `fund` (required) | text | Fund, Fund Code | Fonds, Fonds, 基金, 基金 |
| `fiscal_year` | number | Fiscal Year, FY, Year | - |
| `amount` | amount | Amount, Draw, Distribution, Appropriation | Betrag, Montant, 金額, 金额 |

### Files from other countries

A German export in Windows-1252 with semicolons, `1.234,56` and `03.11.2026`, or a Japanese one in Shift_JIS with `2026/11/03`, is read the same way as the English file. [`fixtures/intl/`](fixtures/intl) has both versions of the demo data, and the eval cases `intl-de-*` and `intl-ja-*` require the same results as the English case. A weight, distance or dimension column found by its translated name with no unit in it is read as metric and converted, and the result says so. Columns named differently? Run `npx fairgive-endowment-draw inspect <file>` (names and shapes only, never values) and name them in `fairgive-sources.json`:

```json
{ "files": { "exports/bills.csv": { "columns": { "invoice_number": "Beleg" }, "date_order": "dmy", "units": { "weight": "kg" } } } }
```

## Memory

fairgive-endowment-draw can remember facts about your setup so the next run does not have to be told again. `endowment_learn` only proposes a fact; it changes nothing until a named person accepts it with `endowment_accept_learning`, which is one click even in Auto. Facts live in one hash-chained file per agent under `.fairgive/memory/`; if the chain does not verify, no fact is used. Credentials, personal identifiers and text that reads like instructions to an AI are refused. Run without memory with `--no-memory`.

| Kind | What an accepted fact changes |
|---|---|
| `note` | nothing (shown by recall only) |

```bash
fairgive-endowment-draw memory list
fairgive-endowment-draw memory accept MEM-1a2b3c4d5e6f --as "Your Name"
fairgive-endowment-draw memory retire MEM-1a2b3c4d5e6f --as "Your Name" --reason "carrier renamed"
```

<!-- sources:start -->
## Exports it reads

Table inputs can be CSV, TSV, semicolon- or pipe-separated text, Excel `.xlsx`, JSON or JSONL. A file already in this agent's own columns is read as it is. The exports below are recognised by their column names and mapped onto those columns; dates become `YYYY-MM-DD`, amounts plain decimals (both decimal marks), and yes/no columns `yes`/`no`. Each result lists, under `sources`, which export was recognised, which columns were mapped, and any rows skipped or dates that could be read two ways.

**Endowment funds** (argument `funds`)

No named exports: other column names are matched by a list of common alternatives.

**Quarter-end values** (argument `values`)

No named exports: other column names are matched by a list of common alternatives.

**Booked draws** (argument `draws`)

No named exports: other column names are matched by a list of common alternatives.

Columns named differently? Run `npx fairgive-endowment-draw inspect <file>` to see how a file is read (column names and shapes only, never values), then name your columns in `fairgive-sources.json` in the root:

```json
{ "files": { "exports/users.csv": { "columns": { "email": "Work E-mail" }, "date_order": "dmy" } } }
```

Where a layout says "checked", its column names were compared with the vendor's documentation on that date. The other layouts were written from knowledge of the export and were not checked. None was tested against a live account. If a real export does not match, the result says which columns were missing; please report it.
<!-- sources:end -->

## Install

Node 20 or newer. No other dependencies.

```bash
npx -y fairgive-endowment-draw demo
npx -y fairgive-endowment-draw mcp --root /path/to/your/files
```

Claude Desktop, Cursor and other MCP hosts:

```json
{
  "mcpServers": {
    "fairgive-endowment-draw": {
      "command": "npx",
      "args": [
        "-y",
        "fairgive-endowment-draw",
        "mcp",
        "--root",
        "/path/to/your/files"
      ]
    }
  }
}
```

Claude Code: `claude mcp add fairgive-endowment-draw -- npx -y fairgive-endowment-draw mcp --root .`, or install the `fairgive-endowment-draw` plugin from this repository's marketplace.

## Modes and approvals

- **Review** (`--mode review`): reads and reports only.
- **Assist** (default): the policy above. A tool that asks returns an `approval_id`; a person approves it once with `fairgive-endowment-draw approve <id> --as "Your Name"` (or on the local approvals page, `fairgive-endowment-draw approvals`), and the same call is repeated.
- **Auto** (`--mode auto --auto <tool,...>`): opt-in per tool, with step caps and a kill switch (`fairgive-endowment-draw kill`). Paying, sending, posting to a ledger or a live system and accepting a learned fact stay **one named click even in Auto**; an approval is tied to the sha256 of the reviewed draft, so a changed draft needs a new click.

## CLI

```bash
fairgive-endowment-draw tools                 # every tool, its policy and arguments
fairgive-endowment-draw sources               # the columns each input is read from
fairgive-endowment-draw inspect <file>        # how a file would be read (names and shapes, never values)
fairgive-endowment-draw call endowment_check '{"funds":"<funds>","values":"<values>"}'
fairgive-endowment-draw eval                  # the private eval cases on the fictional fixtures
fairgive-endowment-draw demo
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
