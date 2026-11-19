# fairgive-processor-fees

Checks Stripe, PayPal, Givebutter or Classy transactions against the fee rates in your settings: fees over the rate, gifts booked net of fees, donor-covered fees, refund fees and payouts missing from the bank. Never moves money.

Part of **Fairgive**, the nonprofit, foundation, church and association back-office agents by Mythos Machines. The software is free (MIT); the paid part is a fixed-price setup on your own files. Every result is computed from your files with plain arithmetic, on your computer; no AI model is called by the tools. It reads files and writes reports; it never files, sends, pays or changes a live system, and a person on your team decides and acts on every finding.

## What it needs

Exports you already have, saved as files on your computer (CSV, Excel, JSON; see "Columns it reads" and "Exports it reads" below):

- `transactions` (required): Processor transactions (Stripe balance or payments export, PayPal activity download, Givebutter or Classy transactions): id, processor, date, gross, fee, net, payout id and date, linked gift id, refunded amount
- `gifts` (required): Gift export from your donor CRM: gift id, amount
- `deposits`: Optional bank deposits, to check that each payout arrived
- `settings` (optional): a JSON file with your own thresholds and rules; see "Settings" below.

## What it checks

Compares each charge's fee with the rate in the settings for its processor (percent of gross plus a fixed amount), checks that the CRM gift linked to the charge is the gross and not the net, and lists charges with no gift, fees kept on refunds and payouts that do not match a bank deposit by payout id or amount.

| Finding | Example from the fictional demo data |
|---|---|
| `fee_on_refund` | T-6 was refunded (75) and its 1.95 fee was not returned. |
| `fee_over_rate` | T-2 (Stripe): fee 7 on 200; the rate in the settings gives 4.7. |
| `gift_amount_differs` | Gift G-7 is booked at 25; T-7 charged 30. |
| `gift_booked_net` | Gift G-3 is booked at 48.6, the net of T-3; the gift is 50 and the 1.4 fee is an expense. |
| `not_in_crm` | T-5 (PayPal, 250 on 2026-10-06) has no gift in the CRM. |
| `payout_not_in_bank` | Payout PO-2 (PayPal, 342.05 on 2026-10-12) matches no bank deposit. |

Each item gets the most serious level of its findings: **flag** (act on it), **review** (data is missing or unclear; a person looks), **watch** (worth knowing) or **ok**. Every finding names the numbers it was worked out from.

## Settings

Put the ones you want to change in a JSON file and pass it as `settings`; anything left out uses the default. The result lists the settings it used under `settings_used`.

| Setting | Default | Meaning |
|---|---|---|
| `rates` | `{}` | Your contracted rate per processor, e.g. {"Stripe": {"pct": 2.2, "fixed": 0.30}}; processors not listed are not rate-checked |
| `payout_days` | `5` | Days after the payout date a matching bank deposit may arrive (default 5) |
| `tolerance` | `0.01` | Difference ignored (default 0.01) |

<!-- generated:start -->

## A demo run

`npx -y fairgive-processor-fees demo` runs the agent on the fictional files in [`fixtures/`](fixtures) in a temporary folder. Captured output:

```text
Fairgive Processor Fees demo (fictional nonprofit data), Auto mode on

▶ Run the check on the exported files
  status: executed  decision: allow
  8 transaction(s): gross 845.00, fees 21.76 (2.58%); fees over the rate 2.30, fees taken out of gifts 1.40, payouts not in the bank 342.05.
    flag    T-2                                 fee_over_rate
    flag    T-3                                 gift_booked_net
    review  Payout PO-2                         payout_not_in_bank
    review  T-5                                 not_in_crm
    review  T-7                                 gift_amount_differs
    watch   T-6                                 fee_on_refund

▶ Explain T-3
  status: executed  decision: allow
  T-3: flag. Gift G-3 is booked at 48.6, the net of T-3; the gift is 50 and the 1.4 fee is an expense.

▶ Write the report (CSV worklist and HTML page)
  status: executed  decision: allow
  Payment processor fees written: 8 transaction(s): gross 845.00, fees 21.76 (2.58%); fees over the rate 2.30, fees taken out of gifts 1.40, payouts not in the bank 342.05.

▶ The agent tries refund_issue itself
  status: blocked  decision: block
  reason: Never issues a refund or reverses a charge with a payment processor.

Audit log: <demo folder>/.fairgive/audit.jsonl
```

## Tools

| Tool | What it does | Policy |
|---|---|---|
| `fees_check` | Compares each charge's fee with the rate in the settings for its processor (percent of gross plus a fixed amount), checks that the CRM gift linked to the charge is the gross and not the net, and lists charges with no … | runs |
| `fees_explain` | Show one transaction id or payout ("Payout PO-1") from fees_check with every finding, the numbers behind it and the setting it was checked against. | runs |
| `fees_write_report` | Write processor-fees.csv (one row per item, with blank owner and decision columns) and processor-fees.html into out_dir (default fairgive-out/fees). | runs |
| `fees_recall` | Search this agent's own memory of the customer's setup: accepted facts (in use) and facts waiting for a person. | runs |
| `fees_learn` | Propose one fact about the customer's setup for this agent to remember. | runs |
| `fees_accept_learning` | A named person accepts or rejects a fact waiting in this agent's memory. | one named click, even in Auto (`accept_learning`) |
| `fees_retire_memory` | A named person stops an accepted fact from applying. | one named click, even in Auto (`accept_learning`) |
| `refund_issue` | Never issues a refund or reverses a charge with a payment processor. | refused |
| `bank_transfer` | Never moves money between bank or investment accounts. | refused |
| `crm_update_records` | Never changes, merges or deletes records in the donor CRM; a person does that in the CRM. | refused |

Any tool name not in this table is blocked, including names a model invents. `refused` tools are listed so a model can see they exist and are refused.

## Columns it reads

Table inputs can be CSV, TSV, semicolon- or pipe-separated text, Excel `.xlsx`, JSON or JSONL. Columns are matched by the agent's own name, then by the English names below, then by their names in German, French, Spanish, Portuguese, Italian, Japanese, Chinese and Korean. Dates become `YYYY-MM-DD`; amounts are read with either decimal mark; weights, distances and dimensions are converted when the column says it holds kilograms, kilometres or centimetres. Every result lists under `sources` how each file was read.

### Processor transactions (`transactions`)

| Column | Type | Also read as | For example, in other languages |
|---|---|---|---|
| `txn_id` (required) | text | Transaction ID, id, Charge ID, Payment ID, Reference ID | - |
| `processor` | text | Processor, Platform, Gateway, Payment Processor, Source | Zahlungsanbieter, Prestataire de paiement, 決済代行, 支付渠道 |
| `date` | date | Date, Created (UTC), Created, Transaction Date, Charge Date | Datum, Date, 日付, 日期 |
| `type` | text | Type, Transaction Type, Event | Typ, Type, 種類, 类型 |
| `gross` | amount | Gross, Gross Amount, Amount, Charge Amount, Gross Transaction Amount | Brutto, Brut, 総額, 总额 |
| `fee` | amount | Fee, Fees, Processing Fee, Fee Amount, Platform Fee | Gebühr, Frais, 手数料, 手续费 |
| `net` | amount | Net, Net Amount, Net Deposit | Netto, Net, 純額, 净额 |
| `payout_id` | text | Payout ID, Transfer, Settlement ID, Payout, Deposit ID | Auszahlungs-ID, N° de virement, 振込ID, 结算编号 |
| `payout_date` | date | Payout Date, Available On (UTC), Available On, Settlement Date, Transfer Date | - |
| `gift_id` | text | Gift ID, Donation ID, Invoice ID, Order ID, Metadata Gift ID | Spenden-ID, N° de don, 寄付ID, 捐款编号 |
| `refunded` | amount | Amount Refunded, Refunded, Refund Amount | Erstattet, Remboursé, 返金額, 退款金额 |
| `donor` | text | Name, Donor Name, Customer Name, Payer Name, Billing Name | Spender, Donateur, 寄付者, 捐赠人 |
| `email` | text | From Email Address, Customer Email, Email, Payer Email, Billing Email | E-Mail, E-mail, メールアドレス, 邮箱 |

Named exports recognised by their column names:

| System | Export | Recognised by | Layout checked against vendor docs |
|---|---|---|---|
| PayPal | Activity download (CSV) | Transaction ID, Gross, Fee, Net | no |
| Stripe | Balance history export | id, Type, Amount, Fee, Net | no |
| Stripe | Payments export | id, Created (UTC), Amount, Amount Refunded | no |

Where a layout says "checked", its column names were compared with the vendor's documentation on that date. The other layouts were written from knowledge of the export and were not checked. None was tested against a live account.

### CRM gifts (`gifts`)

| Column | Type | Also read as | For example, in other languages |
|---|---|---|---|
| `gift_id` (required) | text | Gift ID, Donation ID, Opportunity ID, Transaction ID, Gift Number, Gift No | Spenden-ID, N° de don, 寄付ID, 捐款编号 |
| `donor` | text | Donor Name, Donor, Constituent Name, Account Name, Name, Full Name | Spender, Donateur, 寄付者, 捐赠人 |
| `gift_date` | date | Gift Date, Donation Date, Close Date, Date, Transaction Date, Received Date | Spendendatum, Date du don, 寄付日, 捐赠日期 |
| `amount` | amount | Amount, Gift Amount, Donation Amount, Total Amount, Gross Amount, Payment Amount | Betrag, Montant, 金額, 金额 |
| `method` | text | Payment Method, Method, Pay Method, Payment Type, Tender, Gift Payment Type | Zahlungsart, Mode de paiement, 支払方法, 付款方式 |

### Bank deposits (`deposits`)

| Column | Type | Also read as | For example, in other languages |
|---|---|---|---|
| `deposit_id` | text | Deposit ID, Deposit Number, Deposit, FITID, Bank Reference, Transaction ID | Einzahlungsnummer, N° de remise, 入金番号, 存款编号 |
| `date` (required) | date | Date, Deposit Date, Posting Date, Posted Date, Transaction Date, Value Date | Datum, Date, 日付, 日期 |
| `amount` (required) | amount | Amount, Deposit Amount, Credit, Credits, Net Amount, Net | Betrag, Montant, 金額, 金额 |
| `description` | text | Description, Memo, Details, Transaction Description, Narrative, Payee | Beschreibung, Description, 摘要, 摘要 |
| `batch` | text | Batch, Batch Number, Batch ID, Deposit Batch, Gift Batch Number | Stapel, Lot de dons, バッチ番号, 批次号 |
| `source` | text | Source, Processor, Bank Account, Account, Channel | - |

### Files from other countries

A German export in Windows-1252 with semicolons, `1.234,56` and `03.11.2026`, or a Japanese one in Shift_JIS with `2026/11/03`, is read the same way as the English file. [`fixtures/intl/`](fixtures/intl) has both versions of the demo data, and the eval cases `intl-de-*` and `intl-ja-*` require the same results as the English case. A weight, distance or dimension column found by its translated name with no unit in it is read as metric and converted, and the result says so. Columns named differently? Run `npx fairgive-processor-fees inspect <file>` (names and shapes only, never values) and name them in `fairgive-sources.json`:

```json
{ "files": { "exports/bills.csv": { "columns": { "invoice_number": "Beleg" }, "date_order": "dmy", "units": { "weight": "kg" } } } }
```

## Memory

fairgive-processor-fees can remember facts about your setup so the next run does not have to be told again. `fees_learn` only proposes a fact; it changes nothing until a named person accepts it with `fees_accept_learning`, which is one click even in Auto. Facts live in one hash-chained file per agent under `.fairgive/memory/`; if the chain does not verify, no fact is used. Credentials, personal identifiers and text that reads like instructions to an AI are refused. Run without memory with `--no-memory`.

| Kind | What an accepted fact changes |
|---|---|
| `note` | nothing (shown by recall only) |

```bash
fairgive-processor-fees memory list
fairgive-processor-fees memory accept MEM-1a2b3c4d5e6f --as "Your Name"
fairgive-processor-fees memory retire MEM-1a2b3c4d5e6f --as "Your Name" --reason "carrier renamed"
```

<!-- sources:start -->
## Exports it reads

Table inputs can be CSV, TSV, semicolon- or pipe-separated text, Excel `.xlsx`, JSON or JSONL. A file already in this agent's own columns is read as it is. The exports below are recognised by their column names and mapped onto those columns; dates become `YYYY-MM-DD`, amounts plain decimals (both decimal marks), and yes/no columns `yes`/`no`. Each result lists, under `sources`, which export was recognised, which columns were mapped, and any rows skipped or dates that could be read two ways.

**Processor transactions** (argument `transactions`)

| System | Export | Layout checked against vendor docs |
|---|---|---|
| PayPal | Activity download (CSV) | no |
| Stripe | Balance history export | no |
| Stripe | Payments export | no |

**CRM gifts** (argument `gifts`)

No named exports: other column names are matched by a list of common alternatives.

**Bank deposits** (argument `deposits`)

No named exports: other column names are matched by a list of common alternatives.

Columns named differently? Run `npx fairgive-processor-fees inspect <file>` to see how a file is read (column names and shapes only, never values), then name your columns in `fairgive-sources.json` in the root:

```json
{ "files": { "exports/users.csv": { "columns": { "email": "Work E-mail" }, "date_order": "dmy" } } }
```

Where a layout says "checked", its column names were compared with the vendor's documentation on that date. The other layouts were written from knowledge of the export and were not checked. None was tested against a live account. If a real export does not match, the result says which columns were missing; please report it.
<!-- sources:end -->

## Install

Node 20 or newer. No other dependencies.

```bash
npx -y fairgive-processor-fees demo
npx -y fairgive-processor-fees mcp --root /path/to/your/files
```

Claude Desktop, Cursor and other MCP hosts:

```json
{
  "mcpServers": {
    "fairgive-processor-fees": {
      "command": "npx",
      "args": [
        "-y",
        "fairgive-processor-fees",
        "mcp",
        "--root",
        "/path/to/your/files"
      ]
    }
  }
}
```

Claude Code: `claude mcp add fairgive-processor-fees -- npx -y fairgive-processor-fees mcp --root .`, or install the `fairgive-processor-fees` plugin from this repository's marketplace.

## Modes and approvals

- **Review** (`--mode review`): reads and reports only.
- **Assist** (default): the policy above. A tool that asks returns an `approval_id`; a person approves it once with `fairgive-processor-fees approve <id> --as "Your Name"` (or on the local approvals page, `fairgive-processor-fees approvals`), and the same call is repeated.
- **Auto** (`--mode auto --auto <tool,...>`): opt-in per tool, with step caps and a kill switch (`fairgive-processor-fees kill`). Paying, sending, posting to a ledger or a live system and accepting a learned fact stay **one named click even in Auto**; an approval is tied to the sha256 of the reviewed draft, so a changed draft needs a new click.

## CLI

```bash
fairgive-processor-fees tools                 # every tool, its policy and arguments
fairgive-processor-fees sources               # the columns each input is read from
fairgive-processor-fees inspect <file>        # how a file would be read (names and shapes, never values)
fairgive-processor-fees call fees_check '{"transactions":"<transactions>","gifts":"<gifts>"}'
fairgive-processor-fees eval                  # the private eval cases on the fictional fixtures
fairgive-processor-fees demo
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
