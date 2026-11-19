# fairgive-recurring-gifts

Checks recurring gift plans against processor charges: failed charges, plans with several failures in a row, missed months, cards about to expire and charges after a cancellation. Drafts update-your-card notes. Never charges or sends.

Part of **Fairgive**, the nonprofit, foundation, church and association back-office agents by Mythos Machines. The software is free (MIT); the paid part is a fixed-price setup on your own files. Every result is computed from your files with plain arithmetic, on your computer; no AI model is called by the tools. It reads files and writes reports and drafts; it never files, sends, pays or changes a live system, and a person on your team decides and acts on every finding.

## What it needs

Exports you already have, saved as files on your computer (CSV, Excel, JSON; see "Columns it reads" and "Exports it reads" below):

- `plans` (required): Recurring gift plans (from Stripe, PayPal, Givebutter, Classy or your CRM): plan id, donor, e-mail, amount, frequency, start date, status, cancel date, card expiry
- `charges` (required): Charges or transactions with the plan id: date, amount, status (succeeded or failed)
- `settings` (optional): a JSON file with your own thresholds and rules; see "Settings" below.

## What it checks

Checks each recurring plan against its charges: the last charges failed, the schedule expected a charge that was never attempted, the card expired or expires soon, a charge after the plan was cancelled, or a charge for another amount. Shows the monthly value of the active plans and the part at risk.

| Finding | Example from the fictional demo data |
|---|---|
| `amount_changed` | Plan P-6 is 150 but 175 was charged on 2026-11-01. |
| `card_expired` | Plan P-8: the card on file expired on 2026-08-31. Check whether the processor updated it. |
| `card_expiring` | Plan P-2: the card expires on 2026-11-30, 12 days from 2026-11-18. |
| `charge_after_cancel` | Plan P-5 was cancelled on 2026-09-30 but 30 was charged on 2026-10-20. |
| `missed_charge` | Plan P-4 expected a charge on 2026-09-15 and none was attempted by 2026-11-18. |
| `repeated_failures` | Plan P-3: the last 2 charges failed (latest 2026-11-01). |

Each item gets the most serious level of its findings: **flag** (act on it), **review** (data is missing or unclear; a person looks), **watch** (worth knowing) or **ok**. Every finding names the numbers it was worked out from.

## Settings

Put the ones you want to change in a JSON file and pass it as `settings`; anything left out uses the default. The result lists the settings it used under `settings_used`.

| Setting | Default | Meaning |
|---|---|---|
| `as_of` | `null` | Date the check is made at (YYYY-MM-DD); default: the latest charge date |
| `failures_in_a_row` | `2` | Failed charges in a row that count as repeated failures (default 2) |
| `expiry_warning_days` | `45` | Days before a card expires to warn (default 45) |
| `grace_days` | `7` | Days after a charge was due before it counts as missed (default 7) |
| `organization` | `""` | Your organization name for the drafted notes |
| `tolerance` | `0.01` | Difference ignored between plan and charge amounts (default 0.01) |

<!-- generated:start -->

## A demo run

`npx -y fairgive-recurring-gifts demo` runs the agent on the fictional files in [`fixtures/`](fixtures) in a temporary folder. Captured output:

```text
Fairgive Recurring Gifts demo (fictional nonprofit data), Auto mode on

▶ Run the check on the exported files
  status: executed  decision: allow
  8 plan(s), 7 active, worth 301.67 a month as of 2026-11-18: 185.00 a month at risk, 1 failing, 1 missed, 2 card(s) to update.
    flag    P-3                                 repeated_failures
    flag    P-5                                 charge_after_cancel
    review  P-4                                 missed_charge
    review  P-8                                 card_expired
    watch   P-2                                 card_expiring
    watch   P-6                                 amount_changed

▶ Explain P-3
  status: executed  decision: allow
  P-3: flag. Plan P-3: the last 2 charges failed (latest 2026-11-01).

▶ Write the report (CSV worklist and HTML page)
  status: executed  decision: allow
  Recurring gifts written: 8 plan(s), 7 active, worth 301.67 a month as of 2026-11-18: 185.00 a month at risk, 1 failing, 1 missed, 2 card(s) to update.

▶ Write a draft (Auto is opted in for drafts here)
  status: executed  decision: allow  (auto)
  card note P-3 drafted for 20 with 1 open marker(s) ([TO CONFIRM link to your giving page]). Nothing was sent.

▶ Auto: approving the draft stays one named click
  status: needs_approval  decision: ask
  reason: binding_send stays one-click, even in Auto

▶ Same call after the named click (recorded; a person acts on it)
  status: executed  decision: ask  approved by: Morgan Manager (fictional)
  card note P-3 approved and recorded. Nothing was sent or paid by the agent.

▶ The agent tries email_send itself
  status: blocked  decision: block
  reason: Never sends email, letters or messages; a person sends the reviewed draft.

Audit log: <demo folder>/.fairgive/audit.jsonl
```

## Tools

| Tool | What it does | Policy |
|---|---|---|
| `recurring_check` | Checks each recurring plan against its charges: the last charges failed, the schedule expected a charge that was never attempted, the card expired or expires soon, a charge after the plan was cancelled, or a charge fo… | runs |
| `recurring_explain` | Show one plan from recurring_check with every finding, the numbers behind it and the setting it was checked against. | runs |
| `recurring_write_report` | Write recurring-gifts.csv (one row per item, with blank owner and decision columns) and recurring-gifts.html into out_dir (default fairgive-out/recurring). | runs |
| `recurring_draft_card_note` | Write drafts/card_note-<plan id>.md: a short note asking one donor to update the card for their recurring gift, with the amount and what happened. | asks first (Auto can be opted in) |
| `recurring_request_send` | After one named human click (even in Auto), record that the reviewed card note draft is approved in card_note-requests.csv. | one named click, even in Auto (`binding_send`) |
| `recurring_recall` | Search this agent's own memory of the customer's setup: accepted facts (in use) and facts waiting for a person. | runs |
| `recurring_learn` | Propose one fact about the customer's setup for this agent to remember. | runs |
| `recurring_accept_learning` | A named person accepts or rejects a fact waiting in this agent's memory. | one named click, even in Auto (`accept_learning`) |
| `recurring_retire_memory` | A named person stops an accepted fact from applying. | one named click, even in Auto (`accept_learning`) |
| `email_send` | Never sends email, letters or messages; a person sends the reviewed draft. | refused |
| `refund_issue` | Never issues a refund or reverses a charge with a payment processor. | refused |
| `card_charge` | Never charges or retries a card, and never changes a plan with the processor. | refused |

Any tool name not in this table is blocked, including names a model invents. `refused` tools are listed so a model can see they exist and are refused.

## Columns it reads

Table inputs can be CSV, TSV, semicolon- or pipe-separated text, Excel `.xlsx`, JSON or JSONL. Columns are matched by the agent's own name, then by the English names below, then by their names in German, French, Spanish, Portuguese, Italian, Japanese, Chinese and Korean. Dates become `YYYY-MM-DD`; amounts are read with either decimal mark; weights, distances and dimensions are converted when the column says it holds kilograms, kilometres or centimetres. Every result lists under `sources` how each file was read.

### Recurring plans (`plans`)

| Column | Type | Also read as | For example, in other languages |
|---|---|---|---|
| `plan_id` (required) | text | Plan ID, Subscription ID, Recurring ID, Recurring Gift ID, Schedule ID, Recurring Donation ID | - |
| `donor_id` | text | Donor ID, Constituent ID, Customer ID, Account ID, Contact ID | Spendernummer, N° de donateur, 寄付者ID, 捐赠人编号 |
| `donor` | text | Donor, Donor Name, Name, Customer Name, Full Name | Spender, Donateur, 寄付者, 捐赠人 |
| `email` | text | Email, Customer Email, Donor Email, Email Address | E-Mail, E-mail, メールアドレス, 邮箱 |
| `amount` | amount | Amount, Recurring Amount, Plan Amount, Installment Amount | Betrag, Montant, 金額, 金额 |
| `frequency` | text | Frequency, Interval, Installment Period, Billing Interval, Schedule | - |
| `start_date` | date | Start Date, Created, Created (UTC), Established Date, First Charge | Eintrittsdatum, Date d'entrée, 入社日, 入职日期 |
| `status` | text | Status, Plan Status, Subscription Status, Recurring Status | Status, Statut, ステータス, 状态 |
| `cancel_date` | date | Cancel Date, Canceled At (UTC), Cancelled Date, Closed Date, Ended At | Austrittsdatum, Date de sortie, 退職日, 离职日期 |
| `card_expiry` | text | Card Expiry, Card Expiration, Expiration, Exp Date, Card Exp | Ablaufdatum, Date d'expiration, 有効期限, 到期日 |
| `processor` | text | Processor, Platform, Gateway, Payment Processor | Zahlungsanbieter, Prestataire de paiement, 決済代行, 支付渠道 |

### Charges (`charges`)

| Column | Type | Also read as | For example, in other languages |
|---|---|---|---|
| `txn_id` | text | Transaction ID, id, Charge ID, Payment ID | - |
| `plan_id` (required) | text | Plan ID, Subscription ID, Subscription, Recurring ID, Recurring Gift ID | - |
| `date` (required) | date | Date, Created (UTC), Created, Charge Date, Transaction Date | Datum, Date, 日付, 日期 |
| `amount` | amount | Amount, Charge Amount, Gross | Betrag, Montant, 金額, 金额 |
| `status` | text | Status, Payment Status, Charge Status, Outcome | Status, Statut, ステータス, 状态 |

### Files from other countries

A German export in Windows-1252 with semicolons, `1.234,56` and `03.11.2026`, or a Japanese one in Shift_JIS with `2026/11/03`, is read the same way as the English file. [`fixtures/intl/`](fixtures/intl) has both versions of the demo data, and the eval cases `intl-de-*` and `intl-ja-*` require the same results as the English case. A weight, distance or dimension column found by its translated name with no unit in it is read as metric and converted, and the result says so. Columns named differently? Run `npx fairgive-recurring-gifts inspect <file>` (names and shapes only, never values) and name them in `fairgive-sources.json`:

```json
{ "files": { "exports/bills.csv": { "columns": { "invoice_number": "Beleg" }, "date_order": "dmy", "units": { "weight": "kg" } } } }
```

## Memory

fairgive-recurring-gifts can remember facts about your setup so the next run does not have to be told again. `recurring_learn` only proposes a fact; it changes nothing until a named person accepts it with `recurring_accept_learning`, which is one click even in Auto. Facts live in one hash-chained file per agent under `.fairgive/memory/`; if the chain does not verify, no fact is used. Credentials, personal identifiers and text that reads like instructions to an AI are refused. Run without memory with `--no-memory`.

| Kind | What an accepted fact changes |
|---|---|
| `note` | nothing (shown by recall only) |

```bash
fairgive-recurring-gifts memory list
fairgive-recurring-gifts memory accept MEM-1a2b3c4d5e6f --as "Your Name"
fairgive-recurring-gifts memory retire MEM-1a2b3c4d5e6f --as "Your Name" --reason "carrier renamed"
```

<!-- sources:start -->
## Exports it reads

Table inputs can be CSV, TSV, semicolon- or pipe-separated text, Excel `.xlsx`, JSON or JSONL. A file already in this agent's own columns is read as it is. The exports below are recognised by their column names and mapped onto those columns; dates become `YYYY-MM-DD`, amounts plain decimals (both decimal marks), and yes/no columns `yes`/`no`. Each result lists, under `sources`, which export was recognised, which columns were mapped, and any rows skipped or dates that could be read two ways.

**Recurring plans** (argument `plans`)

No named exports: other column names are matched by a list of common alternatives.

**Charges** (argument `charges`)

No named exports: other column names are matched by a list of common alternatives.

Columns named differently? Run `npx fairgive-recurring-gifts inspect <file>` to see how a file is read (column names and shapes only, never values), then name your columns in `fairgive-sources.json` in the root:

```json
{ "files": { "exports/users.csv": { "columns": { "email": "Work E-mail" }, "date_order": "dmy" } } }
```

Where a layout says "checked", its column names were compared with the vendor's documentation on that date. The other layouts were written from knowledge of the export and were not checked. None was tested against a live account. If a real export does not match, the result says which columns were missing; please report it.
<!-- sources:end -->

## Install

Node 20 or newer. No other dependencies.

```bash
npx -y fairgive-recurring-gifts demo
npx -y fairgive-recurring-gifts mcp --root /path/to/your/files
```

Claude Desktop, Cursor and other MCP hosts:

```json
{
  "mcpServers": {
    "fairgive-recurring-gifts": {
      "command": "npx",
      "args": [
        "-y",
        "fairgive-recurring-gifts",
        "mcp",
        "--root",
        "/path/to/your/files"
      ]
    }
  }
}
```

Claude Code: `claude mcp add fairgive-recurring-gifts -- npx -y fairgive-recurring-gifts mcp --root .`, or install the `fairgive-recurring-gifts` plugin from this repository's marketplace.

## Modes and approvals

- **Review** (`--mode review`): reads and reports only.
- **Assist** (default): the policy above. A tool that asks returns an `approval_id`; a person approves it once with `fairgive-recurring-gifts approve <id> --as "Your Name"` (or on the local approvals page, `fairgive-recurring-gifts approvals`), and the same call is repeated.
- **Auto** (`--mode auto --auto <tool,...>`): opt-in per tool, with step caps and a kill switch (`fairgive-recurring-gifts kill`). Paying, sending, posting to a ledger or a live system and accepting a learned fact stay **one named click even in Auto**; an approval is tied to the sha256 of the reviewed draft, so a changed draft needs a new click.

## CLI

```bash
fairgive-recurring-gifts tools                 # every tool, its policy and arguments
fairgive-recurring-gifts sources               # the columns each input is read from
fairgive-recurring-gifts inspect <file>        # how a file would be read (names and shapes, never values)
fairgive-recurring-gifts call recurring_check '{"plans":"<plans>","charges":"<charges>"}'
fairgive-recurring-gifts eval                  # the private eval cases on the fictional fixtures
fairgive-recurring-gifts demo
```

## Audit log and data

Every call is written to `.fairgive/audit.jsonl` under the root: hash-chained JSON lines, with arguments stored as a hash, signed with an Ed25519 key when you configure one. Everything runs on your machine on files you choose. No network calls, no telemetry, no credentials. The bundled fixtures are fictional.

<!-- generated:end -->

## Limits

- Reads only the files you give it. It does not log in to a donor CRM, giving platform, payment processor, bank, payroll or accounting system, and changes nothing in them.
- Thresholds, rates, dates and policies are settings in your own file, with working defaults; check them against your own policies, funder agreements and current rules before you rely on them.
- Not legal, tax, audit or accounting advice. A person decides what to record, send, file or pay.
- Names, e-mails, phone numbers, street addresses and taxpayer ids of donors, members, volunteers, staff and vendors are masked in results returned to the AI model. The report and draft files written here keep the real values: keep them in a private folder.
- Column names for the named exports were written from knowledge of those systems and not checked against a live account; `inspect` shows how a file was read and `fairgive-sources.json` names columns by hand.
- The bundled fixtures are fictional. Version 0.1.0; nothing has been published yet.
