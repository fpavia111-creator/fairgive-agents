# fairgive-gift-deposits

Matches gifts in your donor CRM to bank deposits and to contribution revenue in the general ledger, by batch, date and amount. Lists gifts never deposited, deposits with no gifts and months where the CRM and the GL disagree. Never posts or changes anything.

Part of **Fairgive**, the nonprofit, foundation, church and association back-office agents by Mythos Machines. The software is free (MIT); the paid part is a fixed-price setup on your own files. Every result is computed from your files with plain arithmetic, on your computer; no AI model is called by the tools. It reads files and writes reports; it never files, sends, pays or changes a live system, and a person on your team decides and acts on every finding.

## What it needs

Exports you already have, saved as files on your computer (CSV, Excel, JSON; see "Columns it reads" and "Exports it reads" below):

- `gifts` (required): Gift export from your donor CRM (Raiser's Edge NXT, Salesforce NPSP, Bloomerang, DonorPerfect, Little Green Light, Neon, Givebutter or Classy): gift id, donor, date, amount, type, batch
- `deposits` (required): Bank deposits or the bank statement credits: date, amount, description, and the gift batch when your deposit slips name it
- `gl`: Optional general ledger detail (QuickBooks Online, Aplos, Sage Intacct or Financial Edge NXT) to compare contribution revenue month by month
- `settings` (optional): a JSON file with your own thresholds and rules; see "Settings" below.

## What it checks

Groups cash gifts by gift batch and matches each batch to the bank deposit that names it, or to a deposit of the same amount within the day window; lists batches never deposited or deposited short or over, gifts that may still be in transit, deposits with no gift in the CRM, and months where contribution revenue in the ledger differs from the CRM. Noncash gifts are left out of deposit matching.

| Finding | Example from the fictional demo data |
|---|---|
| `batch_total_mismatch` | Batch B-102: gifts total 575, deposit D-2 on 2026-10-12 is 565 (difference -10). |
| `deposit_not_in_crm` | Deposit D-4 on 2026-10-25 for 250 (Mobile deposit) matches no gift or batch in the CRM. |
| `gl_differs` | 2026-10: the CRM has 7420 of gifts, the ledger has 6515 of contribution revenue (difference -905). |
| `in_transit` | Gift G-1011 (125, 2026-10-29) is newer than the deposit window before the last deposit in the file (2026-10-25); it may still be on its way. |
| `not_deposited` | Batch B-103 (1020, gifts G-1006, G-1007, latest 2026-10-14) matches no deposit by batch or by amount within 5 days. |

Each item gets the most serious level of its findings: **flag** (act on it), **review** (data is missing or unclear; a person looks), **watch** (worth knowing) or **ok**. Every finding names the numbers it was worked out from.

## Settings

Put the ones you want to change in a JSON file and pass it as `settings`; anything left out uses the default. The result lists the settings it used under `settings_used`.

| Setting | Default | Meaning |
|---|---|---|
| `days` | `5` | Days between a gift date and its deposit that still count as a match (default 5) |
| `tolerance` | `0.01` | Difference ignored when comparing amounts (default 0.01) |
| `noncash_types` | `["Stock","Securities","In-Kind","Gift in kind","Noncash","Property"]` | Gift types or payment methods that never reach the bank (stock, in-kind) and are left out of deposit matching |
| `revenue_accounts` | `["4"]` | Ledger account numbers, or their first digits, that hold contribution revenue (default ["4"]) |
| `ignore_deposit_words` | `[]` | Words in a deposit description that mark it as not a gift deposit (interest, transfer) |

<!-- generated:start -->

## A demo run

`npx -y fairgive-gift-deposits demo` runs the agent on the fictional files in [`fixtures/`](fixtures) in a temporary folder. Captured output:

```text
Fairgive Gift Deposits demo (fictional nonprofit data), Auto mode on

▶ Run the check on the exported files
  status: executed  decision: allow
  10 cash gift(s) for 2,620.00 and 5 deposit(s) for 1,715.00: not deposited 1,020.00, deposits short or over 10.00, deposits with no gift 250.00, in transit 125.00, ledger gap 905.00.
    flag    Batch B-102                         batch_total_mismatch
    flag    Batch B-103                         not_deposited
    review  Deposit D-4                         deposit_not_in_crm
    review  Month 2026-10                       gl_differs
    watch   Gift G-1011                         in_transit

▶ Explain Batch B-102
  status: executed  decision: allow
  Batch B-102: flag. Batch B-102: gifts total 575, deposit D-2 on 2026-10-12 is 565 (difference -10).

▶ Write the report (CSV worklist and HTML page)
  status: executed  decision: allow
  Gift and deposit reconciliation written: 10 cash gift(s) for 2,620.00 and 5 deposit(s) for 1,715.00: not deposited 1,020.00, deposits short or over 10.00, deposits with no gift 250.00, in transit 125.00, ledger gap 905.00.

▶ The agent tries ledger_post itself
  status: blocked  decision: block
  reason: Never posts journal entries or changes the books; your accountant posts the reviewed entry.

Audit log: <demo folder>/.fairgive/audit.jsonl
```

## Tools

| Tool | What it does | Policy |
|---|---|---|
| `deposits_check` | Groups cash gifts by gift batch and matches each batch to the bank deposit that names it, or to a deposit of the same amount within the day window; lists batches never deposited or deposited short or over, gifts that … | runs |
| `deposits_explain` | Show one batch, gift, deposit or month from deposits_check with every finding, the numbers behind it and the setting it was checked against. | runs |
| `deposits_write_report` | Write gift-deposits.csv (one row per item, with blank owner and decision columns) and gift-deposits.html into out_dir (default fairgive-out/deposits). | runs |
| `deposits_recall` | Search this agent's own memory of the customer's setup: accepted facts (in use) and facts waiting for a person. | runs |
| `deposits_learn` | Propose one fact about the customer's setup for this agent to remember. | runs |
| `deposits_accept_learning` | A named person accepts or rejects a fact waiting in this agent's memory. | one named click, even in Auto (`accept_learning`) |
| `deposits_retire_memory` | A named person stops an accepted fact from applying. | one named click, even in Auto (`accept_learning`) |
| `ledger_post` | Never posts journal entries or changes the books; your accountant posts the reviewed entry. | refused |
| `crm_update_records` | Never changes, merges or deletes records in the donor CRM; a person does that in the CRM. | refused |
| `bank_transfer` | Never moves money between bank or investment accounts. | refused |

Any tool name not in this table is blocked, including names a model invents. `refused` tools are listed so a model can see they exist and are refused.

## Columns it reads

Table inputs can be CSV, TSV, semicolon- or pipe-separated text, Excel `.xlsx`, JSON or JSONL. Columns are matched by the agent's own name, then by the English names below, then by their names in German, French, Spanish, Portuguese, Italian, Japanese, Chinese and Korean. Dates become `YYYY-MM-DD`; amounts are read with either decimal mark; weights, distances and dimensions are converted when the column says it holds kilograms, kilometres or centimetres. Every result lists under `sources` how each file was read.

### CRM gifts (`gifts`)

| Column | Type | Also read as | For example, in other languages |
|---|---|---|---|
| `gift_id` (required) | text | Gift ID, Donation ID, Opportunity ID, Transaction ID, Gift Number, Gift No | Spenden-ID, N° de don, 寄付ID, 捐款编号 |
| `donor_id` | text | Constituent ID, Donor ID, Account ID, Contact ID, Account Number, LGL Constituent ID | Spendernummer, N° de donateur, 寄付者ID, 捐赠人编号 |
| `donor` | text | Donor Name, Donor, Constituent Name, Account Name, Name, Full Name | Spender, Donateur, 寄付者, 捐赠人 |
| `gift_date` | date | Gift Date, Donation Date, Close Date, Date, Transaction Date, Received Date | Spendendatum, Date du don, 寄付日, 捐赠日期 |
| `amount` | amount | Amount, Gift Amount, Donation Amount, Total Amount, Gross Amount, Payment Amount | Betrag, Montant, 金額, 金额 |
| `fund` | text | Fund, Fund Code, Fund ID, Fund Name, Designation, General Accounting Unit | Fonds, Fonds, 基金, 基金 |
| `gift_type` | text | Gift Type, Type, Donation Type, Record Type, Gift Subtype, Opportunity Record Type | Spendenart, Type de don, 寄付種別, 捐赠类型 |
| `method` | text | Payment Method, Method, Pay Method, Payment Type, Tender, Gift Payment Type | Zahlungsart, Mode de paiement, 支払方法, 付款方式 |
| `batch` | text | Batch, Batch Number, Batch ID, Gift Batch, Deposit Batch, Batch No | Stapel, Lot de dons, バッチ番号, 批次号 |

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

### Bank deposits (`deposits`)

| Column | Type | Also read as | For example, in other languages |
|---|---|---|---|
| `deposit_id` | text | Deposit ID, Deposit Number, Deposit, FITID, Bank Reference, Transaction ID | Einzahlungsnummer, N° de remise, 入金番号, 存款编号 |
| `date` (required) | date | Date, Deposit Date, Posting Date, Posted Date, Transaction Date, Value Date | Datum, Date, 日付, 日期 |
| `amount` (required) | amount | Amount, Deposit Amount, Credit, Credits, Net Amount, Net | Betrag, Montant, 金額, 金额 |
| `description` | text | Description, Memo, Details, Transaction Description, Narrative, Payee | Beschreibung, Description, 摘要, 摘要 |
| `batch` | text | Batch, Batch Number, Batch ID, Deposit Batch, Gift Batch Number | Stapel, Lot de dons, バッチ番号, 批次号 |
| `source` | text | Source, Processor, Bank Account, Account, Channel | - |

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

A German export in Windows-1252 with semicolons, `1.234,56` and `03.11.2026`, or a Japanese one in Shift_JIS with `2026/11/03`, is read the same way as the English file. [`fixtures/intl/`](fixtures/intl) has both versions of the demo data, and the eval cases `intl-de-*` and `intl-ja-*` require the same results as the English case. A weight, distance or dimension column found by its translated name with no unit in it is read as metric and converted, and the result says so. Columns named differently? Run `npx fairgive-gift-deposits inspect <file>` (names and shapes only, never values) and name them in `fairgive-sources.json`:

```json
{ "files": { "exports/bills.csv": { "columns": { "invoice_number": "Beleg" }, "date_order": "dmy", "units": { "weight": "kg" } } } }
```

## Memory

fairgive-gift-deposits can remember facts about your setup so the next run does not have to be told again. `deposits_learn` only proposes a fact; it changes nothing until a named person accepts it with `deposits_accept_learning`, which is one click even in Auto. Facts live in one hash-chained file per agent under `.fairgive/memory/`; if the chain does not verify, no fact is used. Credentials, personal identifiers and text that reads like instructions to an AI are refused. Run without memory with `--no-memory`.

| Kind | What an accepted fact changes |
|---|---|
| `note` | nothing (shown by recall only) |

```bash
fairgive-gift-deposits memory list
fairgive-gift-deposits memory accept MEM-1a2b3c4d5e6f --as "Your Name"
fairgive-gift-deposits memory retire MEM-1a2b3c4d5e6f --as "Your Name" --reason "carrier renamed"
```

<!-- sources:start -->
## Exports it reads

Table inputs can be CSV, TSV, semicolon- or pipe-separated text, Excel `.xlsx`, JSON or JSONL. A file already in this agent's own columns is read as it is. The exports below are recognised by their column names and mapped onto those columns; dates become `YYYY-MM-DD`, amounts plain decimals (both decimal marks), and yes/no columns `yes`/`no`. Each result lists, under `sources`, which export was recognised, which columns were mapped, and any rows skipped or dates that could be read two ways.

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

**Bank deposits** (argument `deposits`)

No named exports: other column names are matched by a list of common alternatives.

**General ledger detail** (argument `gl`)

| System | Export | Layout checked against vendor docs |
|---|---|---|
| QuickBooks Online | General Ledger report (CSV or Excel) | no |
| Aplos | Transactions export | no |
| Sage Intacct | General ledger detail report export | no |
| Blackbaud Financial Edge NXT | Journal entry or account activity export | no |

Columns named differently? Run `npx fairgive-gift-deposits inspect <file>` to see how a file is read (column names and shapes only, never values), then name your columns in `fairgive-sources.json` in the root:

```json
{ "files": { "exports/users.csv": { "columns": { "email": "Work E-mail" }, "date_order": "dmy" } } }
```

Where a layout says "checked", its column names were compared with the vendor's documentation on that date. The other layouts were written from knowledge of the export and were not checked. None was tested against a live account. If a real export does not match, the result says which columns were missing; please report it.
<!-- sources:end -->

## Install

Node 20 or newer. No other dependencies.

```bash
npx -y fairgive-gift-deposits demo
npx -y fairgive-gift-deposits mcp --root /path/to/your/files
```

Claude Desktop, Cursor and other MCP hosts:

```json
{
  "mcpServers": {
    "fairgive-gift-deposits": {
      "command": "npx",
      "args": [
        "-y",
        "fairgive-gift-deposits",
        "mcp",
        "--root",
        "/path/to/your/files"
      ]
    }
  }
}
```

Claude Code: `claude mcp add fairgive-gift-deposits -- npx -y fairgive-gift-deposits mcp --root .`, or install the `fairgive-gift-deposits` plugin from this repository's marketplace.

## Modes and approvals

- **Review** (`--mode review`): reads and reports only.
- **Assist** (default): the policy above. A tool that asks returns an `approval_id`; a person approves it once with `fairgive-gift-deposits approve <id> --as "Your Name"` (or on the local approvals page, `fairgive-gift-deposits approvals`), and the same call is repeated.
- **Auto** (`--mode auto --auto <tool,...>`): opt-in per tool, with step caps and a kill switch (`fairgive-gift-deposits kill`). Paying, sending, posting to a ledger or a live system and accepting a learned fact stay **one named click even in Auto**; an approval is tied to the sha256 of the reviewed draft, so a changed draft needs a new click.

## CLI

```bash
fairgive-gift-deposits tools                 # every tool, its policy and arguments
fairgive-gift-deposits sources               # the columns each input is read from
fairgive-gift-deposits inspect <file>        # how a file would be read (names and shapes, never values)
fairgive-gift-deposits call deposits_check '{"gifts":"<gifts>","deposits":"<deposits>"}'
fairgive-gift-deposits eval                  # the private eval cases on the fictional fixtures
fairgive-gift-deposits demo
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
