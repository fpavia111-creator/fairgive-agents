# fairgive-in-kind-gifts

Checks the in-kind gift log: gifts with no value or valuation method, values taken only from the donor, items over the appraisal and Form 8283 thresholds in your settings, services that need a recognition decision, and in-kind totals missing from the ledger.

Part of **Fairgive**, the nonprofit, foundation, church and association back-office agents by Mythos Machines. The software is free (MIT); the paid part is a fixed-price setup on your own files. Every result is computed from your files with plain arithmetic, on your computer; no AI model is called by the tools. It reads files and writes reports; it never files, sends, pays or changes a live system, and a person on your team decides and acts on every finding.

## What it needs

Exports you already have, saved as files on your computer (CSV, Excel, JSON; see "Columns it reads" and "Exports it reads" below):

- `inkind` (required): In-kind gift log: gift id, donor, date, description, category (goods, services, facilities, vehicle, art...), value, valuation method, who valued it, appraisal (yes/no), specialized skill (for services), date and amount if sold
- `gl`: Optional general ledger detail, to compare in-kind revenue month by month
- `settings` (optional): a JSON file with your own thresholds and rules; see "Settings" below.

## What it checks

Checks the in-kind gift log: gifts with no value or no valuation method, values taken only from the donor, property over the appraisal threshold in the settings with no appraisal noted, services that may not meet the recognition criteria (not a specialized skill), and property sold within the years in the settings. Compares recognized in-kind value with the in-kind revenue accounts month by month.

| Finding | Example from the fictional demo data |
|---|---|
| `disposed_within_3_years` | In-kind gift K-7 (9000) was sold or disposed of on 2026-08-15 for 6000, within 3 years of the gift on 2025-02-01. Your tax preparer can confirm whether a report to the IRS is due. |
| `donor_value_only` | In-kind gift K-4: the 12000 value comes from the donor only; record your own basis for it. |
| `gl_differs` | 2026-07: the in-kind log has 6000 of recognized gifts, the ledger has 600 of in-kind revenue (difference -5400). |
| `no_valuation_method` | In-kind gift K-3 is valued at 800 with no valuation method recorded. |
| `no_value` | In-kind gift K-2 (Office furniture) has no value. |
| `over_appraisal_threshold` | In-kind gift K-4 (Goods) is valued at 12000, over the 5000 appraisal threshold in the settings, and no appraisal is noted. The donor may need one for their own filing; your tax preparer can confirm. |
| `services_recognition_check` | In-kind gift K-6 is services (Event day volunteering) not marked as a specialized skill; check whether it meets the recognition criteria before booking it. Left out of the recognized total. |

Each item gets the most serious level of its findings: **flag** (act on it), **review** (data is missing or unclear; a person looks), **watch** (worth knowing) or **ok**. Every finding names the numbers it was worked out from.

## Settings

Put the ones you want to change in a JSON file and pass it as `settings`; anything left out uses the default. The result lists the settings it used under `settings_used`.

| Setting | Default | Meaning |
|---|---|---|
| `appraisal_threshold` | `5000` | Property valued over this with no appraisal noted is listed (default 5000; your tax preparer can confirm the rule for each gift) |
| `disposal_years` | `3` | Property sold within this many years of the gift is listed (default 3) |
| `inkind_accounts` | `[]` | Ledger account numbers (or first digits) for in-kind revenue |
| `tolerance` | `0.01` | Difference ignored (default 0.01) |

<!-- generated:start -->

## A demo run

`npx -y fairgive-in-kind-gifts demo` runs the agent on the fictional files in [`fixtures/`](fixtures) in a temporary folder. Captured output:

```text
Fairgive In-Kind Gifts demo (fictional nonprofit data), Auto mode on

▶ Run the check on the exported files
  status: executed  decision: allow
  8 in-kind gift(s) worth 36,300.00, 34,800.00 recognized; 1 with no value, 1 over the appraisal threshold without an appraisal; ledger gap 5,400.00.
    flag    K-2                                 no_value
    flag    K-7                                 disposed_within_3_years
    review  K-3                                 no_valuation_method
    review  K-4                                 donor_value_only, over_appraisal_threshold
    review  K-6                                 services_recognition_check
    review  Month 2026-07                       gl_differs

▶ Explain K-4
  status: executed  decision: allow
  K-4: review. In-kind gift K-4: the 12000 value comes from the donor only; record your own basis for it. In-kind gift K-4 (Goods) is valued at 12000, over the 5000 appraisal threshold in the settings, and no appraisal is noted. The donor may need one for their own filing; your tax preparer can confirm.

▶ Write the report (CSV worklist and HTML page)
  status: executed  decision: allow
  In-kind gifts written: 8 in-kind gift(s) worth 36,300.00, 34,800.00 recognized; 1 with no value, 1 over the appraisal threshold without an appraisal; ledger gap 5,400.00.

▶ The agent tries ledger_post itself
  status: blocked  decision: block
  reason: Never posts journal entries or changes the books; your accountant posts the reviewed entry.

Audit log: <demo folder>/.fairgive/audit.jsonl
```

## Tools

| Tool | What it does | Policy |
|---|---|---|
| `in_kind_check` | Checks the in-kind gift log: gifts with no value or no valuation method, values taken only from the donor, property over the appraisal threshold in the settings with no appraisal noted, services that may not meet the … | runs |
| `in_kind_explain` | Show one gift id or month ("Month 2026-07") from in_kind_check with every finding, the numbers behind it and the setting it was checked against. | runs |
| `in_kind_write_report` | Write in-kind-gifts.csv (one row per item, with blank owner and decision columns) and in-kind-gifts.html into out_dir (default fairgive-out/in_kind). | runs |
| `in_kind_recall` | Search this agent's own memory of the customer's setup: accepted facts (in use) and facts waiting for a person. | runs |
| `in_kind_learn` | Propose one fact about the customer's setup for this agent to remember. | runs |
| `in_kind_accept_learning` | A named person accepts or rejects a fact waiting in this agent's memory. | one named click, even in Auto (`accept_learning`) |
| `in_kind_retire_memory` | A named person stops an accepted fact from applying. | one named click, even in Auto (`accept_learning`) |
| `ledger_post` | Never posts journal entries or changes the books; your accountant posts the reviewed entry. | refused |
| `irs_file` | Never files a Form 990, 1099 or any return with the IRS or a state, and gives no tax advice. | refused |

Any tool name not in this table is blocked, including names a model invents. `refused` tools are listed so a model can see they exist and are refused.

## Columns it reads

Table inputs can be CSV, TSV, semicolon- or pipe-separated text, Excel `.xlsx`, JSON or JSONL. Columns are matched by the agent's own name, then by the English names below, then by their names in German, French, Spanish, Portuguese, Italian, Japanese, Chinese and Korean. Dates become `YYYY-MM-DD`; amounts are read with either decimal mark; weights, distances and dimensions are converted when the column says it holds kilograms, kilometres or centimetres. Every result lists under `sources` how each file was read.

### In-kind gift log (`inkind`)

| Column | Type | Also read as | For example, in other languages |
|---|---|---|---|
| `gift_id` (required) | text | Gift ID, In-Kind ID, Donation ID, Record ID | Spenden-ID, N° de don, 寄付ID, 捐款编号 |
| `donor` | text | Donor, Donor Name, Constituent Name, Name | Spender, Donateur, 寄付者, 捐赠人 |
| `gift_date` | date | Gift Date, Date, Date Received, Received Date | Spendendatum, Date du don, 寄付日, 捐赠日期 |
| `description` | text | Description, Item, Items, Gift Description | Beschreibung, Description, 摘要, 摘要 |
| `category` | text | Category, Type, Gift Type, In-Kind Type | Kategorie, Catégorie, 経費科目, 费用类别 |
| `value` | amount | Value, Fair Value, Fair Market Value, Amount, Estimated Value, In-Kind Value | Wert, Valeur, 評価額, 估值 |
| `valuation_method` | text | Valuation Method, Valuation, Basis of Value, Method | Bewertungsmethode, Méthode d'évaluation, 評価方法, 估值方法 |
| `valued_by` | text | Valued By, Value Source, Source of Value | - |
| `appraisal` | text | Appraisal, Appraised, Qualified Appraisal | - |
| `specialized_skill` | text | Specialized Skill, Specialized Skills, Professional Service, Skilled | - |
| `disposed_date` | date | Disposed Date, Sold Date, Date Sold, Disposition Date | - |
| `disposed_amount` | amount | Disposed Amount, Sale Amount, Sold For, Proceeds | - |

### General ledger detail (`gl`)

| Column | Type | Also read as | For example, in other languages |
|---|---|---|---|
| `entry_id` | text | Entry ID, Journal ID, JE Number, Num, Journal Entry, Transaction ID | - |
| `date` | date | Date, Transaction Date, Posting Date, Post Date, Entry Date, GL Date | Datum, Date, 日付, 日期 |
| `account` (required) | text | Account, Account Number, GL Account, Account No, Account no., Account Code | Konto, Compte, 勘定科目, 科目代码 |
| `account_name` | text | Account Name, Account Title, Account Description | Kontobezeichnung, Libellé du compte, 勘定科目名, 科目名称 |
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

A German export in Windows-1252 with semicolons, `1.234,56` and `03.11.2026`, or a Japanese one in Shift_JIS with `2026/11/03`, is read the same way as the English file. [`fixtures/intl/`](fixtures/intl) has both versions of the demo data, and the eval cases `intl-de-*` and `intl-ja-*` require the same results as the English case. A weight, distance or dimension column found by its translated name with no unit in it is read as metric and converted, and the result says so. Columns named differently? Run `npx fairgive-in-kind-gifts inspect <file>` (names and shapes only, never values) and name them in `fairgive-sources.json`:

```json
{ "files": { "exports/bills.csv": { "columns": { "invoice_number": "Beleg" }, "date_order": "dmy", "units": { "weight": "kg" } } } }
```

## Memory

fairgive-in-kind-gifts can remember facts about your setup so the next run does not have to be told again. `in_kind_learn` only proposes a fact; it changes nothing until a named person accepts it with `in_kind_accept_learning`, which is one click even in Auto. Facts live in one hash-chained file per agent under `.fairgive/memory/`; if the chain does not verify, no fact is used. Credentials, personal identifiers and text that reads like instructions to an AI are refused. Run without memory with `--no-memory`.

| Kind | What an accepted fact changes |
|---|---|
| `note` | nothing (shown by recall only) |

```bash
fairgive-in-kind-gifts memory list
fairgive-in-kind-gifts memory accept MEM-1a2b3c4d5e6f --as "Your Name"
fairgive-in-kind-gifts memory retire MEM-1a2b3c4d5e6f --as "Your Name" --reason "carrier renamed"
```

<!-- sources:start -->
## Exports it reads

Table inputs can be CSV, TSV, semicolon- or pipe-separated text, Excel `.xlsx`, JSON or JSONL. A file already in this agent's own columns is read as it is. The exports below are recognised by their column names and mapped onto those columns; dates become `YYYY-MM-DD`, amounts plain decimals (both decimal marks), and yes/no columns `yes`/`no`. Each result lists, under `sources`, which export was recognised, which columns were mapped, and any rows skipped or dates that could be read two ways.

**In-kind gift log** (argument `inkind`)

No named exports: other column names are matched by a list of common alternatives.

**General ledger detail** (argument `gl`)

| System | Export | Layout checked against vendor docs |
|---|---|---|
| QuickBooks Online | General Ledger report (CSV or Excel) | no |
| Aplos | Transactions export | no |
| Sage Intacct | General ledger detail report export | no |
| Blackbaud Financial Edge NXT | Journal entry or account activity export | no |

Columns named differently? Run `npx fairgive-in-kind-gifts inspect <file>` to see how a file is read (column names and shapes only, never values), then name your columns in `fairgive-sources.json` in the root:

```json
{ "files": { "exports/users.csv": { "columns": { "email": "Work E-mail" }, "date_order": "dmy" } } }
```

Where a layout says "checked", its column names were compared with the vendor's documentation on that date. The other layouts were written from knowledge of the export and were not checked. None was tested against a live account. If a real export does not match, the result says which columns were missing; please report it.
<!-- sources:end -->

## Install

Node 20 or newer. No other dependencies.

```bash
npx -y fairgive-in-kind-gifts demo
npx -y fairgive-in-kind-gifts mcp --root /path/to/your/files
```

Claude Desktop, Cursor and other MCP hosts:

```json
{
  "mcpServers": {
    "fairgive-in-kind-gifts": {
      "command": "npx",
      "args": [
        "-y",
        "fairgive-in-kind-gifts",
        "mcp",
        "--root",
        "/path/to/your/files"
      ]
    }
  }
}
```

Claude Code: `claude mcp add fairgive-in-kind-gifts -- npx -y fairgive-in-kind-gifts mcp --root .`, or install the `fairgive-in-kind-gifts` plugin from this repository's marketplace.

## Modes and approvals

- **Review** (`--mode review`): reads and reports only.
- **Assist** (default): the policy above. A tool that asks returns an `approval_id`; a person approves it once with `fairgive-in-kind-gifts approve <id> --as "Your Name"` (or on the local approvals page, `fairgive-in-kind-gifts approvals`), and the same call is repeated.
- **Auto** (`--mode auto --auto <tool,...>`): opt-in per tool, with step caps and a kill switch (`fairgive-in-kind-gifts kill`). Paying, sending, posting to a ledger or a live system and accepting a learned fact stay **one named click even in Auto**; an approval is tied to the sha256 of the reviewed draft, so a changed draft needs a new click.

## CLI

```bash
fairgive-in-kind-gifts tools                 # every tool, its policy and arguments
fairgive-in-kind-gifts sources               # the columns each input is read from
fairgive-in-kind-gifts inspect <file>        # how a file would be read (names and shapes, never values)
fairgive-in-kind-gifts call in_kind_check '{"inkind":"<inkind>"}'
fairgive-in-kind-gifts eval                  # the private eval cases on the fictional fixtures
fairgive-in-kind-gifts demo
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
