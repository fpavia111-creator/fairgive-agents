# fairgive-event-revenue

Splits event ticket and table sales into the exchange part (fair market value of the benefits) and the contribution part, and compares the split with your ledger. Lists ticket types with no fair market value. Never posts.

Part of **Fairgive**, the nonprofit, foundation, church and association back-office agents by Fair Agents. The software is free (MIT); the paid part is a fixed-price setup on your own files. Every result is computed from your files with plain arithmetic, on your computer; no AI model is called by the tools. It reads files and writes reports; it never files, sends, pays or changes a live system, and a person on your team decides and acts on every finding.

## What it needs

Exports you already have, saved as files on your computer (CSV, Excel, JSON; see "Columns it reads" and "Exports it reads" below):

- `sales` (required): Ticket and registration sales (Givebutter, Classy, Eventbrite-style or CRM export): order id, event, ticket type, quantity, price per ticket, extra donation
- `ticket_types` (required): Fair market value of what each ticket type gives the buyer: event, ticket type, value per ticket
- `gl`: Optional ledger lines with an event column, to compare event revenue and contributions
- `settings` (optional): a JSON file with your own thresholds and rules; see "Settings" below.

## What it checks

Splits every ticket into the exchange part (up to the fair market value of what the buyer receives) and the contribution part, adds extra donations to contributions, and totals both by event. Lists ticket types with no fair market value (left unsplit), tickets sold under their value, events with no ledger lines, and events where the ledger's exchange or contribution accounts differ from the split.

| Finding | Example from the fictional demo data |
|---|---|
| `event_not_in_gl` | GALA-26 has 8200 of sales and no ledger lines coded to it. |
| `gl_contribution_differs` | GOLF-26: the ledger has 0 of contributions; the split says 1600. |
| `gl_exchange_differs` | GOLF-26: the ledger has 3400 of event (exchange) revenue; the split says 1800. |
| `no_fmv_for_ticket_type` | GALA-26 Sponsor: 5000 of sales with no fair market value for the ticket, so it cannot be split. |
| `ticket_below_fmv` | GALA-26 Individual: 1 ticket(s) sold under their fair market value; no part of them is a contribution. |

Each item gets the most serious level of its findings: **flag** (act on it), **review** (data is missing or unclear; a person looks), **watch** (worth knowing) or **ok**. Every finding names the numbers it was worked out from.

## Settings

Put the ones you want to change in a JSON file and pass it as `settings`; anything left out uses the default. The result lists the settings it used under `settings_used`.

| Setting | Default | Meaning |
|---|---|---|
| `exchange_accounts` | `[]` | Ledger accounts (or first digits) for special event (exchange) revenue |
| `contribution_accounts` | `[]` | Ledger accounts (or first digits) for event contributions |
| `tolerance` | `0.01` | Difference ignored (default 0.01) |

<!-- generated:start -->

## A demo run

`npx -y fairgive-event-revenue demo` runs the agent on the fictional files in [`fixtures/`](fixtures) in a temporary folder. Captured output:

```text
Fairgive Event Revenue demo (fictional nonprofit data), Auto mode on

▶ Run the check on the exported files
  status: executed  decision: allow
  3 event(s): gross 13,000.00, exchange 4,100.00, contribution 3,900.00, not split for lack of a value 5,000.00.
    flag    GOLF-26                             gl_exchange_differs, gl_contribution_differs
    review  GALA-26                             no_fmv_for_ticket_type, ticket_below_fmv, event_not_in_gl

▶ Explain GOLF-26
  status: executed  decision: allow
  GOLF-26: flag. GOLF-26: the ledger has 3400 of event (exchange) revenue; the split says 1800. GOLF-26: the ledger has 0 of contributions; the split says 1600.

▶ Write the report (CSV worklist and HTML page)
  status: executed  decision: allow
  Event revenue split written: 3 event(s): gross 13,000.00, exchange 4,100.00, contribution 3,900.00, not split for lack of a value 5,000.00.

▶ The agent tries ledger_post itself
  status: blocked  decision: block
  reason: Never posts journal entries or changes the books; your accountant posts the reviewed entry.

Audit log: <demo folder>/.fairgive/audit.jsonl
```

## Tools

| Tool | What it does | Policy |
|---|---|---|
| `events_check` | Splits every ticket into the exchange part (up to the fair market value of what the buyer receives) and the contribution part, adds extra donations to contributions, and totals both by event. | runs |
| `events_explain` | Show one event from events_check with every finding, the numbers behind it and the setting it was checked against. | runs |
| `events_write_report` | Write event-revenue.csv (one row per item, with blank owner and decision columns) and event-revenue.html into out_dir (default fairgive-out/events). | runs |
| `events_recall` | Search this agent's own memory of the customer's setup: accepted facts (in use) and facts waiting for a person. | runs |
| `events_learn` | Propose one fact about the customer's setup for this agent to remember. | runs |
| `events_accept_learning` | A named person accepts or rejects a fact waiting in this agent's memory. | one named click, even in Auto (`accept_learning`) |
| `events_retire_memory` | A named person stops an accepted fact from applying. | one named click, even in Auto (`accept_learning`) |
| `ledger_post` | Never posts journal entries or changes the books; your accountant posts the reviewed entry. | refused |

Any tool name not in this table is blocked, including names a model invents. `refused` tools are listed so a model can see they exist and are refused.

## Columns it reads

Table inputs can be CSV, TSV, semicolon- or pipe-separated text, Excel `.xlsx`, JSON or JSONL. Columns are matched by the agent's own name, then by the English names below, then by their names in German, French, Spanish, Portuguese, Italian, Japanese, Chinese and Korean. Dates become `YYYY-MM-DD`; amounts are read with either decimal mark; weights, distances and dimensions are converted when the column says it holds kilograms, kilometres or centimetres. Every result lists under `sources` how each file was read.

### Ticket sales (`sales`)

| Column | Type | Also read as | For example, in other languages |
|---|---|---|---|
| `order_id` (required) | text | Order ID, Transaction ID, Registration ID, Order Number | Bestellnummer, N° de commande, 注文番号, 订单号 |
| `event` | text | Event, Event Name, Event Code, Campaign Code, Campaign | Veranstaltung, Événement, イベント, 活动名称 |
| `ticket_type` | text | Ticket Type, Ticket, Ticket Level, Registration Type | Ticketart, Type de billet, チケット種別, 票种 |
| `qty` | number | Qty, Quantity, Tickets, Number of Tickets | Menge, Quantité, 数量, 数量 |
| `price` | amount | Price, Ticket Price, Unit Price, Price Per Ticket | Einzelpreis, Prix unitaire, 単価, 单价 |
| `extra_donation` | amount | Extra Donation, Additional Donation, Donation, Add-on Donation | - |
| `date` | date | Date, Order Date, Transaction Date | Datum, Date, 日付, 日期 |
| `buyer` | text | Buyer, Name, Purchaser, Attendee | - |

### Ticket values (`ticket_types`)

| Column | Type | Also read as | For example, in other languages |
|---|---|---|---|
| `event` (required) | text | Event, Event Name, Event Code | Veranstaltung, Événement, イベント, 活动名称 |
| `ticket_type` | text | Ticket Type, Ticket, Ticket Level | Ticketart, Type de billet, チケット種別, 票种 |
| `fmv` | amount | FMV, Fair Market Value, Value, Benefit Value, Value Per Ticket | Wert der Gegenleistung, Valeur des contreparties, 公正価値, 公允价值 |

### Ledger lines (`gl`)

| Column | Type | Also read as | For example, in other languages |
|---|---|---|---|
| `entry_id` | text | Entry ID, Journal ID, JE Number, Num, Journal Entry, Transaction ID | - |
| `date` | date | Date, Transaction Date, Posting Date, Post Date, Entry Date, GL Date | Datum, Date, 日付, 日期 |
| `account` (required) | text | Account, Account Number, GL Account, Account No, Account no., Account Code | Konto, Compte, 勘定科目, 科目代码 |
| `account_name` | text | Account Name, Account Title, Account Description | Kontobezeichnung, Libellé du compte, 勘定科目名, 科目名称 |
| `event` | text | Event, Event Code, Class, Campaign, Project | Veranstaltung, Événement, イベント, 活动名称 |
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

A German export in Windows-1252 with semicolons, `1.234,56` and `03.11.2026`, or a Japanese one in Shift_JIS with `2026/11/03`, is read the same way as the English file. [`fixtures/intl/`](fixtures/intl) has both versions of the demo data, and the eval cases `intl-de-*` and `intl-ja-*` require the same results as the English case. A weight, distance or dimension column found by its translated name with no unit in it is read as metric and converted, and the result says so. Columns named differently? Run `npx fairgive-event-revenue inspect <file>` (names and shapes only, never values) and name them in `fairgive-sources.json`:

```json
{ "files": { "exports/bills.csv": { "columns": { "invoice_number": "Beleg" }, "date_order": "dmy", "units": { "weight": "kg" } } } }
```

## Memory

fairgive-event-revenue can remember facts about your setup so the next run does not have to be told again. `events_learn` only proposes a fact; it changes nothing until a named person accepts it with `events_accept_learning`, which is one click even in Auto. Facts live in one hash-chained file per agent under `.fairgive/memory/`; if the chain does not verify, no fact is used. Credentials, personal identifiers and text that reads like instructions to an AI are refused. Run without memory with `--no-memory`.

| Kind | What an accepted fact changes |
|---|---|
| `note` | nothing (shown by recall only) |

```bash
fairgive-event-revenue memory list
fairgive-event-revenue memory accept MEM-1a2b3c4d5e6f --as "Your Name"
fairgive-event-revenue memory retire MEM-1a2b3c4d5e6f --as "Your Name" --reason "carrier renamed"
```

<!-- sources:start -->
## Exports it reads

Table inputs can be CSV, TSV, semicolon- or pipe-separated text, Excel `.xlsx`, JSON or JSONL. A file already in this agent's own columns is read as it is. The exports below are recognised by their column names and mapped onto those columns; dates become `YYYY-MM-DD`, amounts plain decimals (both decimal marks), and yes/no columns `yes`/`no`. Each result lists, under `sources`, which export was recognised, which columns were mapped, and any rows skipped or dates that could be read two ways.

**Ticket sales** (argument `sales`)

No named exports: other column names are matched by a list of common alternatives.

**Ticket values** (argument `ticket_types`)

No named exports: other column names are matched by a list of common alternatives.

**Ledger lines** (argument `gl`)

| System | Export | Layout checked against vendor docs |
|---|---|---|
| QuickBooks Online | General Ledger report (CSV or Excel) | no |
| Aplos | Transactions export | no |
| Sage Intacct | General ledger detail report export | no |
| Blackbaud Financial Edge NXT | Journal entry or account activity export | no |

Columns named differently? Run `npx fairgive-event-revenue inspect <file>` to see how a file is read (column names and shapes only, never values), then name your columns in `fairgive-sources.json` in the root:

```json
{ "files": { "exports/users.csv": { "columns": { "email": "Work E-mail" }, "date_order": "dmy" } } }
```

Where a layout says "checked", its column names were compared with the vendor's documentation on that date. The other layouts were written from knowledge of the export and were not checked. None was tested against a live account. If a real export does not match, the result says which columns were missing; please report it.
<!-- sources:end -->

## Install

Node 20 or newer. No other dependencies.

```bash
npx -y fairgive-event-revenue demo
npx -y fairgive-event-revenue mcp --root /path/to/your/files
```

Claude Desktop, Cursor and other MCP hosts:

```json
{
  "mcpServers": {
    "fairgive-event-revenue": {
      "command": "npx",
      "args": [
        "-y",
        "fairgive-event-revenue",
        "mcp",
        "--root",
        "/path/to/your/files"
      ]
    }
  }
}
```

Claude Code: `claude mcp add fairgive-event-revenue -- npx -y fairgive-event-revenue mcp --root .`, or install the `fairgive-event-revenue` plugin from this repository's marketplace.

## Modes and approvals

- **Review** (`--mode review`): reads and reports only.
- **Assist** (default): the policy above. A tool that asks returns an `approval_id`; a person approves it once with `fairgive-event-revenue approve <id> --as "Your Name"` (or on the local approvals page, `fairgive-event-revenue approvals`), and the same call is repeated.
- **Auto** (`--mode auto --auto <tool,...>`): opt-in per tool, with step caps and a kill switch (`fairgive-event-revenue kill`). Paying, sending, posting to a ledger or a live system and accepting a learned fact stay **one named click even in Auto**; an approval is tied to the sha256 of the reviewed draft, so a changed draft needs a new click.

## CLI

```bash
fairgive-event-revenue tools                 # every tool, its policy and arguments
fairgive-event-revenue sources               # the columns each input is read from
fairgive-event-revenue inspect <file>        # how a file would be read (names and shapes, never values)
fairgive-event-revenue call events_check '{"sales":"<sales>","ticket_types":"<ticket_types>"}'
fairgive-event-revenue eval                  # the private eval cases on the fictional fixtures
fairgive-event-revenue demo
```

## Audit log and data

Every call is written to `.fairgive/audit.jsonl` under the root: hash-chained JSON lines, with arguments stored as a hash, signed with an Ed25519 key when you configure one. Everything runs on your machine on files you choose. No network calls, no telemetry, no credentials. The bundled fixtures are fictional.

<!-- generated:end -->

## Limits

- Reads only the files you give it. It does not log in to a donor CRM, giving platform, payment processor, bank, payroll or accounting system, and changes nothing in them.
- Thresholds, rates, dates and policies are settings in your own file, with working defaults; check them against your own policies, funder agreements and current rules before you rely on them.
- Not legal, tax, audit or accounting advice. A person decides what to record, send, file or pay.
- Names, e-mails, phone numbers, street addresses and taxpayer ids of donors, members, volunteers, staff and vendors are masked in results returned to the AI model. Text typed into memos, notes and bank descriptions is sent as written, so a name typed only there reaches the model. The report and draft files written here keep the real values: keep them in a private folder.
- Column names for the named exports were written from knowledge of those systems and not checked against a live account; `inspect` shows how a file was read and `fairgive-sources.json` names columns by hand.
- The bundled fixtures are fictional. Version 0.1.0; nothing has been published yet.
