# fairgive-vendor-tax-forms

Finds vendors paid at or over the 1099 threshold in your settings, with payments by card left out: no W-9 on file, no or malformed taxpayer id, missing address, attorneys paid as corporations. Taxpayer ids are masked. Files nothing.

Part of **Fairgive**, the nonprofit, foundation, church and association back-office agents by Fair Agents. The software is free (MIT); the paid part is a fixed-price setup on your own files. Every result is computed from your files with plain arithmetic, on your computer; no AI model is called by the tools. It reads files and writes reports; it never files, sends, pays or changes a live system, and a person on your team decides and acts on every finding.

## What it needs

Exports you already have, saved as files on your computer (CSV, Excel, JSON; see "Columns it reads" and "Exports it reads" below):

- `vendors` (required): Vendor list (QuickBooks Online vendor contact list or your AP system): vendor id, name, entity type, taxpayer id, W-9 on file, address, attorney (yes/no)
- `payments` (required): Vendor payments: vendor id, date, amount, payment method, category
- `settings` (optional): a JSON file with your own thresholds and rules; see "Settings" below.

## What it checks

Totals each vendor's payments in the tax year, leaving out payments by card or a payment app, and marks vendors paid at or over the threshold in the settings as reportable unless they are corporations (attorneys are kept). Flags reportable vendors with no W-9, no taxpayer id or a malformed one; lists missing addresses, corporations left out and payments to vendors not in the list. Taxpayer ids are masked.

| Finding | Example from the fictional demo data |
|---|---|
| `address_missing` | Vendor V-2 has no address for the form. |
| `attorney_reportable` | Vendor V-3 is a corporation paid 5000 for legal services; attorney fees are usually reported even for corporations. |
| `corporation_exempt` | Vendor V-4 (Corporation) was paid 9000; corporations are usually not reported. Confirm the W-9 says so. |
| `needs_1099_no_w9` | Vendor V-2 was paid 2500 and there is no W-9 on file. Ask for one before the filing season. |
| `tin_malformed` | Vendor V-5 has a taxpayer id with 7 digits; it should have 9. |
| `tin_missing` | Vendor V-2 has no taxpayer id. |

Each item gets the most serious level of its findings: **flag** (act on it), **review** (data is missing or unclear; a person looks), **watch** (worth knowing) or **ok**. Every finding names the numbers it was worked out from.

## Settings

Put the ones you want to change in a JSON file and pass it as `settings`; anything left out uses the default. The result lists the settings it used under `settings_used`.

| Setting | Default | Meaning |
|---|---|---|
| `tax_year` | `null` | Tax year (default: the latest year in the payments) |
| `threshold` | `null` | Payments at or over this make a vendor reportable (left unset: 600 for payments through 2025 and 2000 for payments in 2026; after 2026 the IRS indexes it for inflation, so set it each year; your preparer confirms) |
| `exclude_methods` | `["credit card","card","paypal","venmo"]` | Payment methods left out because the processor reports them (card, PayPal...) |

<!-- generated:start -->

## A demo run

`npx -y fairgive-vendor-tax-forms demo` runs the agent on the fictional files in [`fixtures/`](fixtures) in a temporary folder. Captured output:

```text
Fairgive Vendor 1099 demo (fictional nonprofit data), Auto mode on

▶ Run the check on the exported files
  status: executed  decision: allow
  Tax year 2026: 7 vendor(s) paid, 5 reportable for 25,200.00; 1 with no W-9, 2 with a taxpayer id problem.
    flag    V-2                                 needs_1099_no_w9, tin_missing, address_missing
    flag    V-5                                 tin_malformed
    watch   V-3                                 attorney_reportable
    watch   V-4                                 corporation_exempt

▶ Explain V-2
  status: executed  decision: allow
  V-2: flag. Vendor V-2 was paid 2500 and there is no W-9 on file. Ask for one before the filing season. Vendor V-2 has no taxpayer id. Vendor V-2 has no address for the form.

▶ Write the report (CSV worklist and HTML page)
  status: executed  decision: allow
  1099 readiness written: Tax year 2026: 7 vendor(s) paid, 5 reportable for 25,200.00; 1 with no W-9, 2 with a taxpayer id problem.

▶ The agent tries irs_file itself
  status: blocked  decision: block
  reason: Never files a Form 990, 1099 or any return with the IRS or a state, and gives no tax advice.

Audit log: <demo folder>/.fairgive/audit.jsonl
```

## Tools

| Tool | What it does | Policy |
|---|---|---|
| `vendor_1099_check` | Totals each vendor's payments in the tax year, leaving out payments by card or a payment app, and marks vendors paid at or over the threshold in the settings as reportable unless they are corporations (attorneys are k… | runs |
| `vendor_1099_explain` | Show one vendor from vendor_1099_check with every finding, the numbers behind it and the setting it was checked against. | runs |
| `vendor_1099_write_report` | Write vendor-1099.csv (one row per item, with blank owner and decision columns) and vendor-1099.html into out_dir (default fairgive-out/vendor_1099). | runs |
| `vendor_1099_recall` | Search this agent's own memory of the customer's setup: accepted facts (in use) and facts waiting for a person. | runs |
| `vendor_1099_learn` | Propose one fact about the customer's setup for this agent to remember. | runs |
| `vendor_1099_accept_learning` | A named person accepts or rejects a fact waiting in this agent's memory. | one named click, even in Auto (`accept_learning`) |
| `vendor_1099_retire_memory` | A named person stops an accepted fact from applying. | one named click, even in Auto (`accept_learning`) |
| `irs_file` | Never files a Form 990, 1099 or any return with the IRS or a state, and gives no tax advice. | refused |
| `payment_send` | Never pays a vendor, grantee, employee or anyone else; your bookkeeper pays the approved amount. | refused |

Any tool name not in this table is blocked, including names a model invents. `refused` tools are listed so a model can see they exist and are refused.

## Columns it reads

Table inputs can be CSV, TSV, semicolon- or pipe-separated text, Excel `.xlsx`, JSON or JSONL. Columns are matched by the agent's own name, then by the English names below, then by their names in German, French, Spanish, Portuguese, Italian, Japanese, Chinese and Korean. Dates become `YYYY-MM-DD`; amounts are read with either decimal mark; weights, distances and dimensions are converted when the column says it holds kilograms, kilometres or centimetres. Every result lists under `sources` how each file was read.

### Vendors (`vendors`)

| Column | Type | Also read as | For example, in other languages |
|---|---|---|---|
| `vendor_id` (required) | text | Vendor ID, Vendor Number, Supplier ID, Vendor | Lieferantennummer, Code fournisseur, 仕入先コード, 供应商编号 |
| `vendor` | text | Vendor Name, Name, Company, Display Name, Payee | Lieferant, Fournisseur, 仕入先, 供应商 |
| `entity_type` | text | Entity Type, Tax Classification, Business Type, Classification | - |
| `tin` | text | TIN, Tax ID, EIN, SSN, Taxpayer ID | Steuernummer, Numéro de TVA, 法人番号, 统一社会信用代码 |
| `w9_on_file` | text | W9 On File, W-9 On File, W-9, W9, Track payments for 1099 | - |
| `address` | text | Address, Billing Address, Street, Address Line 1 | Adresse, Adresse, 住所, 地址 |
| `attorney` | text | Attorney, Legal Services, Is Attorney | - |

### Vendor payments (`payments`)

| Column | Type | Also read as | For example, in other languages |
|---|---|---|---|
| `payment_id` | text | Payment ID, Check Number, Num, Reference | - |
| `vendor_id` (required) | text | Vendor ID, Vendor Number, Supplier ID, Vendor | Lieferantennummer, Code fournisseur, 仕入先コード, 供应商编号 |
| `date` | date | Date, Payment Date, Paid Date | Datum, Date, 日付, 日期 |
| `amount` | amount | Amount, Payment Amount, Paid | Betrag, Montant, 金額, 金额 |
| `method` | text | Method, Payment Method, Type | Zahlungsart, Mode de paiement, 支払方法, 付款方式 |
| `category` | text | Category, Account, Expense Account | Kategorie, Catégorie, 経費科目, 费用类别 |

### Files from other countries

A German export in Windows-1252 with semicolons, `1.234,56` and `03.11.2026`, or a Japanese one in Shift_JIS with `2026/11/03`, is read the same way as the English file. [`fixtures/intl/`](fixtures/intl) has both versions of the demo data, and the eval cases `intl-de-*` and `intl-ja-*` require the same results as the English case. A weight, distance or dimension column found by its translated name with no unit in it is read as metric and converted, and the result says so. Columns named differently? Run `npx fairgive-vendor-tax-forms inspect <file>` (names and shapes only, never values) and name them in `fairgive-sources.json`:

```json
{ "files": { "exports/bills.csv": { "columns": { "invoice_number": "Beleg" }, "date_order": "dmy", "units": { "weight": "kg" } } } }
```

## Memory

fairgive-vendor-tax-forms can remember facts about your setup so the next run does not have to be told again. `vendor_1099_learn` only proposes a fact; it changes nothing until a named person accepts it with `vendor_1099_accept_learning`, which is one click even in Auto. Facts live in one hash-chained file per agent under `.fairgive/memory/`; if the chain does not verify, no fact is used. Credentials, personal identifiers and text that reads like instructions to an AI are refused. Run without memory with `--no-memory`.

| Kind | What an accepted fact changes |
|---|---|
| `note` | nothing (shown by recall only) |

```bash
fairgive-vendor-tax-forms memory list
fairgive-vendor-tax-forms memory accept MEM-1a2b3c4d5e6f --as "Your Name"
fairgive-vendor-tax-forms memory retire MEM-1a2b3c4d5e6f --as "Your Name" --reason "carrier renamed"
```

<!-- sources:start -->
## Exports it reads

Table inputs can be CSV, TSV, semicolon- or pipe-separated text, Excel `.xlsx`, JSON or JSONL. A file already in this agent's own columns is read as it is. The exports below are recognised by their column names and mapped onto those columns; dates become `YYYY-MM-DD`, amounts plain decimals (both decimal marks), and yes/no columns `yes`/`no`. Each result lists, under `sources`, which export was recognised, which columns were mapped, and any rows skipped or dates that could be read two ways.

**Vendors** (argument `vendors`)

No named exports: other column names are matched by a list of common alternatives.

**Vendor payments** (argument `payments`)

No named exports: other column names are matched by a list of common alternatives.

Columns named differently? Run `npx fairgive-vendor-tax-forms inspect <file>` to see how a file is read (column names and shapes only, never values), then name your columns in `fairgive-sources.json` in the root:

```json
{ "files": { "exports/users.csv": { "columns": { "email": "Work E-mail" }, "date_order": "dmy" } } }
```

Where a layout says "checked", its column names were compared with the vendor's documentation on that date. The other layouts were written from knowledge of the export and were not checked. None was tested against a live account. If a real export does not match, the result says which columns were missing; please report it.
<!-- sources:end -->

## Install

Node 20 or newer. No other dependencies.

```bash
npx -y fairgive-vendor-tax-forms demo
npx -y fairgive-vendor-tax-forms mcp --root /path/to/your/files
```

Claude Desktop, Cursor and other MCP hosts:

```json
{
  "mcpServers": {
    "fairgive-vendor-tax-forms": {
      "command": "npx",
      "args": [
        "-y",
        "fairgive-vendor-tax-forms",
        "mcp",
        "--root",
        "/path/to/your/files"
      ]
    }
  }
}
```

Claude Code: `claude mcp add fairgive-vendor-tax-forms -- npx -y fairgive-vendor-tax-forms mcp --root .`, or install the `fairgive-vendor-tax-forms` plugin from this repository's marketplace.

## Modes and approvals

- **Review** (`--mode review`): reads and reports only.
- **Assist** (default): the policy above. A tool that asks returns an `approval_id`; a person approves it once with `fairgive-vendor-tax-forms approve <id> --as "Your Name"` (or on the local approvals page, `fairgive-vendor-tax-forms approvals`), and the same call is repeated.
- **Auto** (`--mode auto --auto <tool,...>`): opt-in per tool, with step caps and a kill switch (`fairgive-vendor-tax-forms kill`). Paying, sending, posting to a ledger or a live system and accepting a learned fact stay **one named click even in Auto**; an approval is tied to the sha256 of the reviewed draft, so a changed draft needs a new click.

## CLI

```bash
fairgive-vendor-tax-forms tools                 # every tool, its policy and arguments
fairgive-vendor-tax-forms sources               # the columns each input is read from
fairgive-vendor-tax-forms inspect <file>        # how a file would be read (names and shapes, never values)
fairgive-vendor-tax-forms call vendor_1099_check '{"vendors":"<vendors>","payments":"<payments>"}'
fairgive-vendor-tax-forms eval                  # the private eval cases on the fictional fixtures
fairgive-vendor-tax-forms demo
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
