# fairgive-grant-drawdowns

For reimbursement and advance grants, allowable costs incurred against draws received: the amount you can draw, costs waiting too long, draws over costs or over the award. Drafts the drawdown request for a person. Never submits it.

Part of **Fairgive**, the nonprofit, foundation, church and association back-office agents by Mythos Machines. The software is free (MIT); the paid part is a fixed-price setup on your own files. Every result is computed from your files with plain arithmetic, on your computer; no AI model is called by the tools.

## What it checks

For each grant, sets the draws against allowable costs inside the award period, oldest first, and shows what can still be drawn (costs up to the award, less draws). Flags costs carried longer than the stale days, reimbursement grants drawn ahead of costs, grants drawn over the award; lists advance cash not yet spent, draws requested long ago and not received, and costs dated outside the award period.

| Finding | Example from the fictional demo data |
|---|---|
| `costs_outside_period` | G-FED: 3000 of costs are dated outside the award period 2026-07-01 to 2027-06-30 and were left out. |
| `draw_available` | G-FED: 27000 can be drawn (costs 54000, drawn 27000). |
| `draw_over_award` | G-CITY: 17000 drawn against an award of 15000. |
| `excess_cash` | G-ADV (advance): 6000 drawn and not yet spent. Check how long the funder lets you hold advance cash. |
| `overdrawn` | G-CITY: 17000 drawn but only 15000 of allowable costs; 2000 drawn ahead of costs on a reimbursement grant. |
| `pending_too_long` | G-STATE: draw D5 for 8000 was requested 44 days ago and is not marked received. |
| `stale_unreimbursed` | G-FED: 14000 of costs older than 45 days have not been drawn. |

Each item gets the most serious level of its findings: **flag** (act on it), **review** (data is missing or unclear; a person looks), **watch** (worth knowing) or **ok**. Every finding names the numbers it was worked out from.

## Settings

Put the ones you want to change in a JSON file and pass it as `settings`; anything left out uses the default. The result lists the settings it used under `settings_used`.

| Setting | Default | Meaning |
|---|---|---|
| `as_of` | `null` | Date the check is made at (YYYY-MM-DD); default: the latest date in the files |
| `stale_days` | `45` | Costs older than this and not yet drawn are flagged (default 45) |
| `pending_days` | `30` | A requested draw not received after this many days needs review (default 30) |
| `organization` | `""` | Your organization name for the drafted request |
| `tolerance` | `0.01` | Difference ignored (default 0.01) |

<!-- generated:start -->

## A demo run

`npx -y fairgive-grant-drawdowns demo` runs the agent on the fictional files in [`fixtures/`](fixtures) in a temporary folder. Captured output:

```text
Fairgive Grant Drawdowns demo (fictional nonprofit data), Auto mode on

▶ Run the check on the exported files
  status: executed  decision: allow
  4 grant(s) as of 2026-11-18: costs 106,000.00, drawn 87,000.00, can draw 27,000.00 (14,000.00 older than the stale days); overdrawn 2,000.00, advance cash unspent 6,000.00, draws pending 8,000.00.
    flag    G-CITY                              draw_over_award, overdrawn
    flag    G-FED                               costs_outside_period, stale_unreimbursed, draw_available
    review  G-ADV                               excess_cash
    review  G-STATE                             pending_too_long

▶ Explain G-FED
  status: executed  decision: allow
  G-FED: flag. G-FED: 3000 of costs are dated outside the award period 2026-07-01 to 2027-06-30 and were left out. G-FED: 14000 of costs older than 45 days have not been drawn. G-FED: 27000 can be drawn (costs 54000, drawn 27000).

▶ Write the report (CSV worklist and HTML page)
  status: executed  decision: allow
  Grant drawdowns written: 4 grant(s) as of 2026-11-18: costs 106,000.00, drawn 87,000.00, can draw 27,000.00 (14,000.00 older than the stale days); overdrawn 2,000.00, advance cash unspent 6,000.00, draws pending 8,000.00.

▶ Write a draft (Auto is opted in for drafts here)
  status: executed  decision: allow  (auto)
  draw request G-FED drafted for 27000 with 3 open marker(s) ([TO CONFIRM portal and account], [ATTACH cost detail for the period], [TO CONFIRM authorized official]). Nothing was sent.

▶ Auto: approving the draft stays one named click
  status: needs_approval  decision: ask
  reason: binding_send stays one-click, even in Auto

▶ Same call after the named click (recorded; a person acts on it)
  status: executed  decision: ask  approved by: Morgan Manager (fictional)
  draw request G-FED approved and recorded. Nothing was sent or paid by the agent.

▶ The agent tries funder_portal_submit itself
  status: blocked  decision: block
  reason: Never logs in to or submits anything on a funder, grants or payment-management portal.

Audit log: <demo folder>/.fairgive/audit.jsonl
```

## Tools

| Tool | What it does | Policy |
|---|---|---|
| `drawdowns_check` | For each grant, sets the draws against allowable costs inside the award period, oldest first, and shows what can still be drawn (costs up to the award, less draws). | runs |
| `drawdowns_explain` | Show one grant from drawdowns_check with every finding, the numbers behind it and the setting it was checked against. | runs |
| `drawdowns_write_report` | Write grant-drawdowns.csv (one row per item, with blank owner and decision columns) and grant-drawdowns.html into out_dir (default fairgive-out/drawdowns). | runs |
| `drawdowns_draft_draw_request` | Write drafts/draw_request-<grant>.md: the amount to draw on one grant with the costs it covers, for a person to enter in the funder's portal. | asks first (Auto can be opted in) |
| `drawdowns_request_submit` | After one named human click (even in Auto), record that the reviewed draw request draft is approved in draw_request-requests.csv. | one named click, even in Auto (`binding_send`) |
| `drawdowns_recall` | Search this agent's own memory of the customer's setup: accepted facts (in use) and facts waiting for a person. | runs |
| `drawdowns_learn` | Propose one fact about the customer's setup for this agent to remember. | runs |
| `drawdowns_accept_learning` | A named person accepts or rejects a fact waiting in this agent's memory. | one named click, even in Auto (`accept_learning`) |
| `drawdowns_retire_memory` | A named person stops an accepted fact from applying. | one named click, even in Auto (`accept_learning`) |
| `funder_portal_submit` | Never logs in to or submits anything on a funder, grants or payment-management portal. | refused |
| `bank_transfer` | Never moves money between bank or investment accounts. | refused |

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
| `payment_basis` | text | Payment Basis, Basis, Payment Method, Funding Type | - |

### Allowable costs (`expenses`)

| Column | Type | Also read as | For example, in other languages |
|---|---|---|---|
| `entry_id` | text | Entry ID, Journal, Num, Transaction ID | - |
| `date` | date | Date, Posting Date, Transaction Date | Datum, Date, 日付, 日期 |
| `grant` (required) | text | Grant, Grant ID, Grant Code, Project, Award, Job | Förderkennzeichen, N° de subvention, 助成番号, 资助编号 |
| `amount` | amount | Amount, Debit, Expense, Net Amount | Betrag, Montant, 金額, 金额 |
| `memo` | text | Memo, Description, Narrative | Verwendungszweck, Libellé, 摘要, 摘要 |

### Draws (`draws`)

| Column | Type | Also read as | For example, in other languages |
|---|---|---|---|
| `draw_id` | text | Draw ID, Request ID, Drawdown ID, Payment Request, Reference | - |
| `grant` (required) | text | Grant, Grant ID, Grant Code, Award, Project | Förderkennzeichen, N° de subvention, 助成番号, 资助编号 |
| `date` | date | Date, Request Date, Draw Date, Received Date | Datum, Date, 日付, 日期 |
| `amount` | amount | Amount, Draw Amount, Requested Amount | Abgerufen, Montant versé, 交付済額, 已拨付金额 |
| `status` | text | Status, Draw Status, Payment Status | Status, Statut, ステータス, 状态 |

### Files from other countries

A German export in Windows-1252 with semicolons, `1.234,56` and `03.11.2026`, or a Japanese one in Shift_JIS with `2026/11/03`, is read the same way as the English file. [`fixtures/intl/`](fixtures/intl) has both versions of the demo data, and the eval cases `intl-de-*` and `intl-ja-*` require the same results as the English case. A weight, distance or dimension column found by its translated name with no unit in it is read as metric and converted, and the result says so. Columns named differently? Run `npx fairgive-grant-drawdowns inspect <file>` (names and shapes only, never values) and name them in `fairgive-sources.json`:

```json
{ "files": { "exports/bills.csv": { "columns": { "invoice_number": "Beleg" }, "date_order": "dmy", "units": { "weight": "kg" } } } }
```

## Memory

fairgive-grant-drawdowns can remember facts about your setup so the next run does not have to be told again. `drawdowns_learn` only proposes a fact; it changes nothing until a named person accepts it with `drawdowns_accept_learning`, which is one click even in Auto. Facts live in one hash-chained file per agent under `.fairgive/memory/`; if the chain does not verify, no fact is used. Credentials, personal identifiers and text that reads like instructions to an AI are refused. Run without memory with `--no-memory`.

| Kind | What an accepted fact changes |
|---|---|
| `note` | nothing (shown by recall only) |

```bash
fairgive-grant-drawdowns memory list
fairgive-grant-drawdowns memory accept MEM-1a2b3c4d5e6f --as "Your Name"
fairgive-grant-drawdowns memory retire MEM-1a2b3c4d5e6f --as "Your Name" --reason "carrier renamed"
```

## Install

Node 20 or newer. No other dependencies.

```bash
npx -y fairgive-grant-drawdowns demo
npx -y fairgive-grant-drawdowns mcp --root /path/to/your/files
```

Claude Desktop, Cursor and other MCP hosts:

```json
{
  "mcpServers": {
    "fairgive-grant-drawdowns": {
      "command": "npx",
      "args": [
        "-y",
        "fairgive-grant-drawdowns",
        "mcp",
        "--root",
        "/path/to/your/files"
      ]
    }
  }
}
```

Claude Code: `claude mcp add fairgive-grant-drawdowns -- npx -y fairgive-grant-drawdowns mcp --root .`, or install the `fairgive-grant-drawdowns` plugin from this repository's marketplace.

## Modes and approvals

- **Review** (`--mode review`): reads and reports only.
- **Assist** (default): the policy above. A tool that asks returns an `approval_id`; a person approves it once with `fairgive-grant-drawdowns approve <id> --as "Your Name"` (or on the local approvals page, `fairgive-grant-drawdowns approvals`), and the same call is repeated.
- **Auto** (`--mode auto --auto <tool,...>`): opt-in per tool, with step caps and a kill switch (`fairgive-grant-drawdowns kill`). Paying, sending, posting to a ledger or a live system and accepting a learned fact stay **one named click even in Auto**; an approval is tied to the sha256 of the reviewed draft, so a changed draft needs a new click.

## CLI

```bash
fairgive-grant-drawdowns tools                 # every tool, its policy and arguments
fairgive-grant-drawdowns sources               # the columns each input is read from
fairgive-grant-drawdowns inspect <file>        # how a file would be read (names and shapes, never values)
fairgive-grant-drawdowns call drawdowns_check '{"grants":"<grants>","expenses":"<expenses>","draws":"<draws>"}'
fairgive-grant-drawdowns eval                  # the private eval cases on the fictional fixtures
fairgive-grant-drawdowns demo
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
