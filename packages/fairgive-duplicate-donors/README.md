# fairgive-duplicate-donors

Finds likely duplicate donor records in a constituent export by e-mail, phone, address and name similarity, with the gifts on each record. Writes a merge worklist for a person. Never merges or deletes records.

Part of **Fairgive**, the nonprofit, foundation, church and association back-office agents by Mythos Machines. The software is free (MIT); the paid part is a fixed-price setup on your own files. Every result is computed from your files with plain arithmetic, on your computer; no AI model is called by the tools. It reads files and writes reports; it never files, sends, pays or changes a live system, and a person on your team decides and acts on every finding.

## What it needs

Exports you already have, saved as files on your computer (CSV, Excel, JSON; see "Columns it reads" and "Exports it reads" below):

- `constituents` (required): Constituent or contact export (Raiser's Edge NXT, Salesforce NPSP, Bloomerang or any CRM): id, name, e-mail, phone, street address, postal code, created date
- `gifts`: Optional gift export, to show how many gifts sit on each record
- `settings` (optional): a JSON file with your own thresholds and rules; see "Settings" below.

## What it checks

Groups constituent records that share an e-mail (without +tags), a phone number, the same name in any order (legal-form words such as Inc left out), a street address, or a name a letter or two apart in one word in the same postal code (numbers must match). The same name in two postal codes is listed at a lower level. Shared office e-mails in the settings are ignored. Groups linked only by address are households to look at. Each group shows its records, the rules that linked them, the gifts on them and the oldest record as the one to keep.

| Finding | Example from the fictional demo data |
|---|---|
| `same_address` | Records C-1 + C-2 share a street address. |
| `same_email` | Records C-1 + C-2 share an e-mail address. |
| `same_name` | Records C-1 + C-2 have the same name (M.H.#eb764c). |
| `same_phone` | Records C-3 + C-4 share a phone number. |
| `similar_name` | Records C-5 + C-6 have names that differ by a letter or two in one word (J.V.#c84c20 / J.V.#fc93a9) in the same postal code. |

Each item gets the most serious level of its findings: **flag** (act on it), **review** (data is missing or unclear; a person looks), **watch** (worth knowing) or **ok**. Every finding names the numbers it was worked out from.

## Settings

Put the ones you want to change in a JSON file and pass it as `settings`; anything left out uses the default. The result lists the settings it used under `settings_used`.

| Setting | Default | Meaning |
|---|---|---|
| `name_similarity` | `0.92` | Two names in one postal code are grouped when every word matches but one, and that word is at least this close (Jaro-Winkler, 0 to 1; default 0.92); words with numbers must match exactly |
| `shared_emails` | `[]` | E-mail addresses several people use (office@, info@) that should not link records |
| `max_ids_shown` | `12` | Record ids shown per group before "and n more" (default 12) |

<!-- generated:start -->

## A demo run

`npx -y fairgive-duplicate-donors demo` runs the agent on the fictional files in [`fixtures/`](fixtures) in a temporary folder. Captured output:

```text
Fairgive Duplicate Donors demo (fictional nonprofit data), Auto mode on

▶ Run the check on the exported files
  status: executed  decision: allow
  12 record(s): 4 group(s), 2 likely duplicate(s), 1 to review, 1 household(s); 3 extra record(s) if every duplicate group were merged.
    flag    C-1                                 same_address, same_email, same_name
    flag    C-3                                 same_name, same_phone
    review  C-5                                 same_address, similar_name
    watch   C-7                                 same_address

▶ Explain C-3
  status: executed  decision: allow
  C-3: flag. Records C-3 + C-4 have the same name (R.E.#38f014 / R.E.#38f014). Records C-3 + C-4 share a phone number.

▶ Write the report (CSV worklist and HTML page)
  status: executed  decision: allow
  Duplicate donor records written: 12 record(s): 4 group(s), 2 likely duplicate(s), 1 to review, 1 household(s); 3 extra record(s) if every duplicate group were merged.

▶ The agent tries crm_update_records itself
  status: blocked  decision: block
  reason: Never changes, merges or deletes records in the donor CRM; a person does that in the CRM.

Audit log: <demo folder>/.fairgive/audit.jsonl
```

## Tools

| Tool | What it does | Policy |
|---|---|---|
| `dupes_check` | Groups constituent records that share an e-mail (without +tags), a phone number, the same name in any order (legal-form words such as Inc left out), a street address, or a name a letter or two apart in one word in the… | runs |
| `dupes_explain` | Show one group (its first record id) from dupes_check with every finding, the numbers behind it and the setting it was checked against. | runs |
| `dupes_write_report` | Write duplicate-donors.csv (one row per item, with blank owner and decision columns) and duplicate-donors.html into out_dir (default fairgive-out/dupes). | runs |
| `dupes_recall` | Search this agent's own memory of the customer's setup: accepted facts (in use) and facts waiting for a person. | runs |
| `dupes_learn` | Propose one fact about the customer's setup for this agent to remember. | runs |
| `dupes_accept_learning` | A named person accepts or rejects a fact waiting in this agent's memory. | one named click, even in Auto (`accept_learning`) |
| `dupes_retire_memory` | A named person stops an accepted fact from applying. | one named click, even in Auto (`accept_learning`) |
| `crm_update_records` | Never changes, merges or deletes records in the donor CRM; a person does that in the CRM. | refused |
| `donor_data_delete` | Never deletes donor, member or volunteer personal data. | refused |

Any tool name not in this table is blocked, including names a model invents. `refused` tools are listed so a model can see they exist and are refused.

## Columns it reads

Table inputs can be CSV, TSV, semicolon- or pipe-separated text, Excel `.xlsx`, JSON or JSONL. Columns are matched by the agent's own name, then by the English names below, then by their names in German, French, Spanish, Portuguese, Italian, Japanese, Chinese and Korean. Dates become `YYYY-MM-DD`; amounts are read with either decimal mark; weights, distances and dimensions are converted when the column says it holds kilograms, kilometres or centimetres. Every result lists under `sources` how each file was read.

### Constituents (`constituents`)

| Column | Type | Also read as | For example, in other languages |
|---|---|---|---|
| `donor_id` (required) | text | Constituent ID, Donor ID, Account ID, Contact ID, Account Number, LGL Constituent ID | Spendernummer, N° de donateur, 寄付者ID, 捐赠人编号 |
| `donor` | text | Name, Donor Name, Full Name, Constituent Name, Account Name, Contact Name | Spender, Donateur, 寄付者, 捐赠人 |
| `email` | text | Email, Email Address, Primary Email, Personal Email | E-Mail, E-mail, メールアドレス, 邮箱 |
| `phone` | text | Phone, Phone Number, Primary Phone, Home Phone, Mobile Phone | Telefon, Téléphone, 電話番号, 电话 |
| `address` | text | Address, Street, Address Line 1, Preferred Address Line 1, Mailing Street, Street Address | Adresse, Adresse, 住所, 地址 |
| `postal` | text | Postal Code, ZIP, Zip Code, Zip, Mailing Zip/Postal Code, Preferred ZIP | - |
| `created` | date | Created Date, Date Added, Created, Date Created | - |

Named exports recognised by their column names:

| System | Export | Recognised by | Layout checked against vendor docs |
|---|---|---|---|
| Blackbaud Raiser's Edge NXT | Constituent list export (CSV) | Constituent ID, Last Name, Preferred Address Line 1 or Address | no |
| Salesforce Nonprofit Success Pack | Contacts report export | Contact ID, Account Name, Mailing Street | no |
| Bloomerang | Constituents export | Account Number, First Name, Primary Email | no |

Where a layout says "checked", its column names were compared with the vendor's documentation on that date. The other layouts were written from knowledge of the export and were not checked. None was tested against a live account.

### Gifts (`gifts`)

| Column | Type | Also read as | For example, in other languages |
|---|---|---|---|
| `gift_id` (required) | text | Gift ID, Donation ID, Opportunity ID, Transaction ID, Gift Number, Gift No | Spenden-ID, N° de don, 寄付ID, 捐款编号 |
| `donor_id` | text | Constituent ID, Donor ID, Account ID, Contact ID, Account Number, LGL Constituent ID | Spendernummer, N° de donateur, 寄付者ID, 捐赠人编号 |
| `gift_date` | date | Gift Date, Donation Date, Close Date, Date, Transaction Date, Received Date | Spendendatum, Date du don, 寄付日, 捐赠日期 |
| `amount` | amount | Amount, Gift Amount, Donation Amount, Total Amount, Gross Amount, Payment Amount | Betrag, Montant, 金額, 金额 |

### Files from other countries

A German export in Windows-1252 with semicolons, `1.234,56` and `03.11.2026`, or a Japanese one in Shift_JIS with `2026/11/03`, is read the same way as the English file. [`fixtures/intl/`](fixtures/intl) has both versions of the demo data, and the eval cases `intl-de-*` and `intl-ja-*` require the same results as the English case. A weight, distance or dimension column found by its translated name with no unit in it is read as metric and converted, and the result says so. Columns named differently? Run `npx fairgive-duplicate-donors inspect <file>` (names and shapes only, never values) and name them in `fairgive-sources.json`:

```json
{ "files": { "exports/bills.csv": { "columns": { "invoice_number": "Beleg" }, "date_order": "dmy", "units": { "weight": "kg" } } } }
```

## Memory

fairgive-duplicate-donors can remember facts about your setup so the next run does not have to be told again. `dupes_learn` only proposes a fact; it changes nothing until a named person accepts it with `dupes_accept_learning`, which is one click even in Auto. Facts live in one hash-chained file per agent under `.fairgive/memory/`; if the chain does not verify, no fact is used. Credentials, personal identifiers and text that reads like instructions to an AI are refused. Run without memory with `--no-memory`.

| Kind | What an accepted fact changes |
|---|---|
| `note` | nothing (shown by recall only) |

```bash
fairgive-duplicate-donors memory list
fairgive-duplicate-donors memory accept MEM-1a2b3c4d5e6f --as "Your Name"
fairgive-duplicate-donors memory retire MEM-1a2b3c4d5e6f --as "Your Name" --reason "carrier renamed"
```

<!-- sources:start -->
## Exports it reads

Table inputs can be CSV, TSV, semicolon- or pipe-separated text, Excel `.xlsx`, JSON or JSONL. A file already in this agent's own columns is read as it is. The exports below are recognised by their column names and mapped onto those columns; dates become `YYYY-MM-DD`, amounts plain decimals (both decimal marks), and yes/no columns `yes`/`no`. Each result lists, under `sources`, which export was recognised, which columns were mapped, and any rows skipped or dates that could be read two ways.

**Constituents** (argument `constituents`)

| System | Export | Layout checked against vendor docs |
|---|---|---|
| Blackbaud Raiser's Edge NXT | Constituent list export (CSV) | no |
| Salesforce Nonprofit Success Pack | Contacts report export | no |
| Bloomerang | Constituents export | no |

**Gifts** (argument `gifts`)

No named exports: other column names are matched by a list of common alternatives.

Columns named differently? Run `npx fairgive-duplicate-donors inspect <file>` to see how a file is read (column names and shapes only, never values), then name your columns in `fairgive-sources.json` in the root:

```json
{ "files": { "exports/users.csv": { "columns": { "email": "Work E-mail" }, "date_order": "dmy" } } }
```

Where a layout says "checked", its column names were compared with the vendor's documentation on that date. The other layouts were written from knowledge of the export and were not checked. None was tested against a live account. If a real export does not match, the result says which columns were missing; please report it.
<!-- sources:end -->

## Install

Node 20 or newer. No other dependencies.

```bash
npx -y fairgive-duplicate-donors demo
npx -y fairgive-duplicate-donors mcp --root /path/to/your/files
```

Claude Desktop, Cursor and other MCP hosts:

```json
{
  "mcpServers": {
    "fairgive-duplicate-donors": {
      "command": "npx",
      "args": [
        "-y",
        "fairgive-duplicate-donors",
        "mcp",
        "--root",
        "/path/to/your/files"
      ]
    }
  }
}
```

Claude Code: `claude mcp add fairgive-duplicate-donors -- npx -y fairgive-duplicate-donors mcp --root .`, or install the `fairgive-duplicate-donors` plugin from this repository's marketplace.

## Modes and approvals

- **Review** (`--mode review`): reads and reports only.
- **Assist** (default): the policy above. A tool that asks returns an `approval_id`; a person approves it once with `fairgive-duplicate-donors approve <id> --as "Your Name"` (or on the local approvals page, `fairgive-duplicate-donors approvals`), and the same call is repeated.
- **Auto** (`--mode auto --auto <tool,...>`): opt-in per tool, with step caps and a kill switch (`fairgive-duplicate-donors kill`). Paying, sending, posting to a ledger or a live system and accepting a learned fact stay **one named click even in Auto**; an approval is tied to the sha256 of the reviewed draft, so a changed draft needs a new click.

## CLI

```bash
fairgive-duplicate-donors tools                 # every tool, its policy and arguments
fairgive-duplicate-donors sources               # the columns each input is read from
fairgive-duplicate-donors inspect <file>        # how a file would be read (names and shapes, never values)
fairgive-duplicate-donors call dupes_check '{"constituents":"<constituents>"}'
fairgive-duplicate-donors eval                  # the private eval cases on the fictional fixtures
fairgive-duplicate-donors demo
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
