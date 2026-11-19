# fairgive-refunds-chargebacks

Matches processor refunds and chargebacks to CRM gifts: refunds still standing as gifts in the CRM, acknowledgements sent for refunded gifts, refunds larger than the gift and disputes with evidence due. Never refunds or responds.

Part of **Fairgive**, the nonprofit, foundation, church and association back-office agents by Mythos Machines. The software is free (MIT); the paid part is a fixed-price setup on your own files. Every result is computed from your files with plain arithmetic, on your computer; no AI model is called by the tools. It reads files and writes reports; it never files, sends, pays or changes a live system, and a person on your team decides and acts on every finding.

## What it needs

Exports you already have, saved as files on your computer (CSV, Excel, JSON; see "Columns it reads" and "Exports it reads" below):

- `events` (required): Refunds and disputes from your processor (Stripe, PayPal, Givebutter or Classy export): transaction id, processor, type, date, amount, gift id, status, evidence due date
- `gifts` (required): Gift export from your donor CRM: gift id, donor, date, amount, status, acknowledgement date
- `settings` (optional): a JSON file with your own thresholds and rules; see "Settings" below.

## What it checks

Matches each processor refund and card dispute to its CRM gift: full refunds whose gift still stands, partial refunds with the gift unchanged, refunds larger than the gift, refunds with no gift, thank-you letters for refunded gifts, and open disputes whose evidence is due soon or overdue.

| Finding | Example from the fictional demo data |
|---|---|
| `ack_sent_for_refunded` | Gift G-2 was thanked on 2026-10-05 and then refunded; send a corrected letter. |
| `dispute_evidence_due` | RF-4: evidence for the 250 dispute on gift G-4 is due on 2026-11-22, in 4 day(s). Gather the receipt and any thank-you letter for the person who responds. |
| `partial_refund_not_adjusted` | RF-5: 20 of gift G-5 (100) was refunded, and the gift shows 100 with a status ("Received") that does not say it was reduced. If the gift was 120 and has been reduced already, mark it partially refunded; otherwise reduce it to 80. |
| `refund_no_gift` | RF-6: a 40 refund on 2026-11-03 has no gift id. |
| `refund_not_reversed_in_crm` | RF-2: gift G-2 (100) was refunded in full and is still "Received" in the CRM. |
| `refund_over_gift` | RF-3: 60 refunded on a gift of 50. |

Each item gets the most serious level of its findings: **flag** (act on it), **review** (data is missing or unclear; a person looks), **watch** (worth knowing) or **ok**. Every finding names the numbers it was worked out from.

## Settings

Put the ones you want to change in a JSON file and pass it as `settings`; anything left out uses the default. The result lists the settings it used under `settings_used`.

| Setting | Default | Meaning |
|---|---|---|
| `as_of` | `null` | Date the check is made at (YYYY-MM-DD); default: today |
| `evidence_warning_days` | `7` | Disputes with evidence due within this many days are flagged (default 7) |
| `tolerance` | `0.01` | Difference ignored (default 0.01) |

<!-- generated:start -->

## A demo run

`npx -y fairgive-refunds-chargebacks demo` runs the agent on the fictional files in [`fixtures/`](fixtures) in a temporary folder. Captured output:

```text
Fairgive Refunds Chargebacks demo (fictional nonprofit data), Auto mode on

▶ Run the check on the exported files
  status: executed  decision: allow
  7 refund(s) and dispute(s) as of 2026-11-18: 295.00 refunded, 250.00 in open disputes, 2 CRM record(s) or letter(s) to fix.
    flag    RF-2                                refund_not_reversed_in_crm, ack_sent_for_refunded
    flag    RF-3                                refund_over_gift
    flag    RF-4                                dispute_evidence_due
    review  RF-5                                partial_refund_not_adjusted
    review  RF-6                                refund_no_gift

▶ Explain RF-2
  status: executed  decision: allow
  RF-2: flag. RF-2: gift G-2 (100) was refunded in full and is still "Received" in the CRM. Gift G-2 was thanked on 2026-10-05 and then refunded; send a corrected letter.

▶ Write the report (CSV worklist and HTML page)
  status: executed  decision: allow
  Refunds and chargebacks written: 7 refund(s) and dispute(s) as of 2026-11-18: 295.00 refunded, 250.00 in open disputes, 2 CRM record(s) or letter(s) to fix.

▶ The agent tries refund_issue itself
  status: blocked  decision: block
  reason: Never issues a refund or reverses a charge with a payment processor.

Audit log: <demo folder>/.fairgive/audit.jsonl
```

## Tools

| Tool | What it does | Policy |
|---|---|---|
| `refunds_check` | Matches each processor refund and card dispute to its CRM gift: full refunds whose gift still stands, partial refunds with the gift unchanged, refunds larger than the gift, refunds with no gift, thank-you letters for … | runs |
| `refunds_explain` | Show one refund or dispute from refunds_check with every finding, the numbers behind it and the setting it was checked against. | runs |
| `refunds_write_report` | Write refunds-chargebacks.csv (one row per item, with blank owner and decision columns) and refunds-chargebacks.html into out_dir (default fairgive-out/refunds). | runs |
| `refunds_recall` | Search this agent's own memory of the customer's setup: accepted facts (in use) and facts waiting for a person. | runs |
| `refunds_learn` | Propose one fact about the customer's setup for this agent to remember. | runs |
| `refunds_accept_learning` | A named person accepts or rejects a fact waiting in this agent's memory. | one named click, even in Auto (`accept_learning`) |
| `refunds_retire_memory` | A named person stops an accepted fact from applying. | one named click, even in Auto (`accept_learning`) |
| `refund_issue` | Never issues a refund or reverses a charge with a payment processor. | refused |
| `crm_update_records` | Never changes, merges or deletes records in the donor CRM; a person does that in the CRM. | refused |
| `dispute_respond` | Never submits evidence or responds to a card dispute; a person does that in the processor dashboard. | refused |

Any tool name not in this table is blocked, including names a model invents. `refused` tools are listed so a model can see they exist and are refused.

## Columns it reads

Table inputs can be CSV, TSV, semicolon- or pipe-separated text, Excel `.xlsx`, JSON or JSONL. Columns are matched by the agent's own name, then by the English names below, then by their names in German, French, Spanish, Portuguese, Italian, Japanese, Chinese and Korean. Dates become `YYYY-MM-DD`; amounts are read with either decimal mark; weights, distances and dimensions are converted when the column says it holds kilograms, kilometres or centimetres. Every result lists under `sources` how each file was read.

### Refunds and disputes (`events`)

| Column | Type | Also read as | For example, in other languages |
|---|---|---|---|
| `txn_id` (required) | text | Transaction ID, id, Refund ID, Dispute ID, Case ID | - |
| `processor` | text | Processor, Platform, Gateway | Zahlungsanbieter, Prestataire de paiement, 決済代行, 支付渠道 |
| `type` | text | Type, Transaction Type, Event | Typ, Type, 種類, 类型 |
| `date` | date | Date, Created (UTC), Created, Refund Date | Datum, Date, 日付, 日期 |
| `amount` | amount | Amount, Refund Amount, Dispute Amount, Gross | Betrag, Montant, 金額, 金额 |
| `gift_id` | text | Gift ID, Donation ID, Metadata Gift ID, Order ID | Spenden-ID, N° de don, 寄付ID, 捐款编号 |
| `status` | text | Status, Refund Status, Dispute Status | Status, Statut, ステータス, 状态 |
| `evidence_due` | date | Evidence Due, Evidence Due By, Respond By, Response Due | Fälligkeitsdatum, Date d'échéance, 期日, 截止日期 |

### CRM gifts (`gifts`)

| Column | Type | Also read as | For example, in other languages |
|---|---|---|---|
| `gift_id` (required) | text | Gift ID, Donation ID, Opportunity ID, Transaction ID, Gift Number, Gift No | Spenden-ID, N° de don, 寄付ID, 捐款编号 |
| `donor` | text | Donor Name, Donor, Constituent Name, Account Name, Name, Full Name | Spender, Donateur, 寄付者, 捐赠人 |
| `gift_date` | date | Gift Date, Donation Date, Close Date, Date, Transaction Date, Received Date | Spendendatum, Date du don, 寄付日, 捐赠日期 |
| `amount` | amount | Amount, Gift Amount, Donation Amount, Total Amount, Gross Amount, Payment Amount | Betrag, Montant, 金額, 金额 |
| `status` | text | Status, Stage, Payment Status, Gift Status | Status, Statut, ステータス, 状态 |
| `ack_date` | date | Ack Date, Acknowledgement Date, Acknowledged Date, Thank You Date, Receipt Date | Bedankt am, Remercié le, 礼状送付日, 致谢日期 |

Named exports recognised by their column names:

| System | Export | Recognised by | Layout checked against vendor docs |
|---|---|---|---|
| Blackbaud Raiser's Edge NXT | Gift list or query export (CSV) | Gift ID, Constituent ID, Gift Amount or Amount | no |
| Salesforce Nonprofit Success Pack | Opportunities (donations) report export | Opportunity ID, Account Name or Account: Account Name, Close Date | no |
| Bloomerang | Transactions export | Transaction Number, Account Number, Amount | no |
| DonorPerfect | Gift export (field names) | gift_id, donor_id, gl_code | no |
| Little Green Light | Gifts export | LGL Gift ID, LGL Constituent ID, Gift Amount | no |
| Neon CRM | Donation report export | Donation ID, Account ID, Donation Amount | no |
| Givebutter | Transactions export | Transaction ID, Campaign Code, Amount or Donated | no |
| GoFundMe Pro (Classy) | Transactions export | Transaction ID, Campaign Name, Gross Transaction Amount or Gross Amount | no |

Where a layout says "checked", its column names were compared with the vendor's documentation on that date. The other layouts were written from knowledge of the export and were not checked. None was tested against a live account.

### Files from other countries

A German export in Windows-1252 with semicolons, `1.234,56` and `03.11.2026`, or a Japanese one in Shift_JIS with `2026/11/03`, is read the same way as the English file. [`fixtures/intl/`](fixtures/intl) has both versions of the demo data, and the eval cases `intl-de-*` and `intl-ja-*` require the same results as the English case. A weight, distance or dimension column found by its translated name with no unit in it is read as metric and converted, and the result says so. Columns named differently? Run `npx fairgive-refunds-chargebacks inspect <file>` (names and shapes only, never values) and name them in `fairgive-sources.json`:

```json
{ "files": { "exports/bills.csv": { "columns": { "invoice_number": "Beleg" }, "date_order": "dmy", "units": { "weight": "kg" } } } }
```

## Memory

fairgive-refunds-chargebacks can remember facts about your setup so the next run does not have to be told again. `refunds_learn` only proposes a fact; it changes nothing until a named person accepts it with `refunds_accept_learning`, which is one click even in Auto. Facts live in one hash-chained file per agent under `.fairgive/memory/`; if the chain does not verify, no fact is used. Credentials, personal identifiers and text that reads like instructions to an AI are refused. Run without memory with `--no-memory`.

| Kind | What an accepted fact changes |
|---|---|
| `note` | nothing (shown by recall only) |

```bash
fairgive-refunds-chargebacks memory list
fairgive-refunds-chargebacks memory accept MEM-1a2b3c4d5e6f --as "Your Name"
fairgive-refunds-chargebacks memory retire MEM-1a2b3c4d5e6f --as "Your Name" --reason "carrier renamed"
```

<!-- sources:start -->
## Exports it reads

Table inputs can be CSV, TSV, semicolon- or pipe-separated text, Excel `.xlsx`, JSON or JSONL. A file already in this agent's own columns is read as it is. The exports below are recognised by their column names and mapped onto those columns; dates become `YYYY-MM-DD`, amounts plain decimals (both decimal marks), and yes/no columns `yes`/`no`. Each result lists, under `sources`, which export was recognised, which columns were mapped, and any rows skipped or dates that could be read two ways.

**Refunds and disputes** (argument `events`)

No named exports: other column names are matched by a list of common alternatives.

**CRM gifts** (argument `gifts`)

| System | Export | Layout checked against vendor docs |
|---|---|---|
| Blackbaud Raiser's Edge NXT | Gift list or query export (CSV) | no |
| Salesforce Nonprofit Success Pack | Opportunities (donations) report export | no |
| Bloomerang | Transactions export | no |
| DonorPerfect | Gift export (field names) | no |
| Little Green Light | Gifts export | no |
| Neon CRM | Donation report export | no |
| Givebutter | Transactions export | no |
| GoFundMe Pro (Classy) | Transactions export | no |

Columns named differently? Run `npx fairgive-refunds-chargebacks inspect <file>` to see how a file is read (column names and shapes only, never values), then name your columns in `fairgive-sources.json` in the root:

```json
{ "files": { "exports/users.csv": { "columns": { "email": "Work E-mail" }, "date_order": "dmy" } } }
```

Where a layout says "checked", its column names were compared with the vendor's documentation on that date. The other layouts were written from knowledge of the export and were not checked. None was tested against a live account. If a real export does not match, the result says which columns were missing; please report it.
<!-- sources:end -->

## Install

Node 20 or newer. No other dependencies.

```bash
npx -y fairgive-refunds-chargebacks demo
npx -y fairgive-refunds-chargebacks mcp --root /path/to/your/files
```

Claude Desktop, Cursor and other MCP hosts:

```json
{
  "mcpServers": {
    "fairgive-refunds-chargebacks": {
      "command": "npx",
      "args": [
        "-y",
        "fairgive-refunds-chargebacks",
        "mcp",
        "--root",
        "/path/to/your/files"
      ]
    }
  }
}
```

Claude Code: `claude mcp add fairgive-refunds-chargebacks -- npx -y fairgive-refunds-chargebacks mcp --root .`, or install the `fairgive-refunds-chargebacks` plugin from this repository's marketplace.

## Modes and approvals

- **Review** (`--mode review`): reads and reports only.
- **Assist** (default): the policy above. A tool that asks returns an `approval_id`; a person approves it once with `fairgive-refunds-chargebacks approve <id> --as "Your Name"` (or on the local approvals page, `fairgive-refunds-chargebacks approvals`), and the same call is repeated.
- **Auto** (`--mode auto --auto <tool,...>`): opt-in per tool, with step caps and a kill switch (`fairgive-refunds-chargebacks kill`). Paying, sending, posting to a ledger or a live system and accepting a learned fact stay **one named click even in Auto**; an approval is tied to the sha256 of the reviewed draft, so a changed draft needs a new click.

## CLI

```bash
fairgive-refunds-chargebacks tools                 # every tool, its policy and arguments
fairgive-refunds-chargebacks sources               # the columns each input is read from
fairgive-refunds-chargebacks inspect <file>        # how a file would be read (names and shapes, never values)
fairgive-refunds-chargebacks call refunds_check '{"events":"<events>","gifts":"<gifts>"}'
fairgive-refunds-chargebacks eval                  # the private eval cases on the fictional fixtures
fairgive-refunds-chargebacks demo
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
