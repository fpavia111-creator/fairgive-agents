# fairgive-gift-coding

Checks how gifts were coded: notes that name a restricted purpose on an unrestricted fund, gifts to inactive funds, appeals coded to a fund other than their default and restricted funds used for another purpose. Never changes the CRM.

Part of **Fairgive**, the nonprofit, foundation, church and association back-office agents by Fair Agents. The software is free (MIT); the paid part is a fixed-price setup on your own files. Every result is computed from your files with plain arithmetic, on your computer; no AI model is called by the tools. It reads files and writes reports; it never files, sends, pays or changes a live system, and a person on your team decides and acts on every finding.

## What it needs

Exports you already have, saved as files on your computer (CSV, Excel, JSON; see "Columns it reads" and "Exports it reads" below):

- `gifts` (required): Gift export from your donor CRM: gift id, donor, date, amount, fund, appeal, gift note or memo
- `funds` (required): Fund list: fund code, name, restriction, active (yes/no), the words that name its purpose (separated by ;)
- `appeals`: Optional appeals: appeal code, default fund
- `settings` (optional): a JSON file with your own thresholds and rules; see "Settings" below.

## What it checks

Reads each gift's note against the words that name each restricted fund's purpose and flags gifts coded to another fund. Lists notes that designate a gift for a purpose no fund matches, gifts coded to inactive or unknown funds, and gifts whose appeal has a different default fund, with the fund the gift probably belongs to.

| Finding | Example from the fictional demo data |
|---|---|
| `appeal_fund_mismatch` | Gift CG-6 came from appeal CAP26, whose default fund is CAPITAL, and is coded to GEN. |
| `fund_inactive` | Gift CG-4 is coded to OLD-GALA, which is marked inactive. |
| `memo_names_restricted_purpose` | Gift CG-2 (500) says "For the scholarship fund", which names SCHOL (Scholarships), but it is coded to GEN. |
| `memo_says_restricted` | Gift CG-8 (200) says "Designated for the music program only" but is coded to GEN, which is not restricted, and no fund matches the purpose. |
| `unknown_fund` | Gift CG-5 is coded to "MISC", which is not in the fund list. |

Each item gets the most serious level of its findings: **flag** (act on it), **review** (data is missing or unclear; a person looks), **watch** (worth knowing) or **ok**. Every finding names the numbers it was worked out from.

## Settings

Put the ones you want to change in a JSON file and pass it as `settings`; anything left out uses the default. The result lists the settings it used under `settings_used`.

| Setting | Default | Meaning |
|---|---|---|
| `restriction_words` | `["designated for","restricted to","only for","in support of the"]` | Words in a note that say the donor designated the gift ("designated for", "only for") |

<!-- generated:start -->

## A demo run

`npx -y fairgive-gift-coding demo` runs the agent on the fictional files in [`fixtures/`](fixtures) in a temporary folder. Captured output:

```text
Fairgive Gift Coding demo (fictional nonprofit data), Auto mode on

▶ Run the check on the exported files
  status: executed  decision: allow
  8 gift(s) for 2,485.00: 2 likely coded to the wrong fund (1,500.00), 3 to review.
    flag    CG-2                                memo_names_restricted_purpose
    flag    CG-6                                memo_names_restricted_purpose, appeal_fund_mismatch
    review  CG-4                                fund_inactive
    review  CG-5                                unknown_fund
    review  CG-8                                memo_says_restricted
    watch   CG-7                                appeal_fund_mismatch

▶ Explain CG-2
  status: executed  decision: allow
  CG-2: flag. Gift CG-2 (500) says "For the scholarship fund", which names SCHOL (Scholarships), but it is coded to GEN.

▶ Write the report (CSV worklist and HTML page)
  status: executed  decision: allow
  Gift coding written: 8 gift(s) for 2,485.00: 2 likely coded to the wrong fund (1,500.00), 3 to review.

▶ The agent tries crm_update_records itself
  status: blocked  decision: block
  reason: Never changes, merges or deletes records in the donor CRM; a person does that in the CRM.

Audit log: <demo folder>/.fairgive/audit.jsonl
```

## Tools

| Tool | What it does | Policy |
|---|---|---|
| `coding_check` | Reads each gift's note against the words that name each restricted fund's purpose and flags gifts coded to another fund. | runs |
| `coding_explain` | Show one gift from coding_check with every finding, the numbers behind it and the setting it was checked against. | runs |
| `coding_write_report` | Write gift-coding.csv (one row per item, with blank owner and decision columns) and gift-coding.html into out_dir (default fairgive-out/coding). | runs |
| `coding_recall` | Search this agent's own memory of the customer's setup: accepted facts (in use) and facts waiting for a person. | runs |
| `coding_learn` | Propose one fact about the customer's setup for this agent to remember. | runs |
| `coding_accept_learning` | A named person accepts or rejects a fact waiting in this agent's memory. | one named click, even in Auto (`accept_learning`) |
| `coding_retire_memory` | A named person stops an accepted fact from applying. | one named click, even in Auto (`accept_learning`) |
| `crm_update_records` | Never changes, merges or deletes records in the donor CRM; a person does that in the CRM. | refused |

Any tool name not in this table is blocked, including names a model invents. `refused` tools are listed so a model can see they exist and are refused.

## Columns it reads

Table inputs can be CSV, TSV, semicolon- or pipe-separated text, Excel `.xlsx`, JSON or JSONL. Columns are matched by the agent's own name, then by the English names below, then by their names in German, French, Spanish, Portuguese, Italian, Japanese, Chinese and Korean. Dates become `YYYY-MM-DD`; amounts are read with either decimal mark; weights, distances and dimensions are converted when the column says it holds kilograms, kilometres or centimetres. Every result lists under `sources` how each file was read.

### CRM gifts (`gifts`)

| Column | Type | Also read as | For example, in other languages |
|---|---|---|---|
| `gift_id` (required) | text | Gift ID, Donation ID, Opportunity ID, Transaction ID, Gift Number, Gift No | Spenden-ID, N° de don, 寄付ID, 捐款编号 |
| `donor` | text | Donor Name, Donor, Constituent Name, Account Name, Name, Full Name | Spender, Donateur, 寄付者, 捐赠人 |
| `gift_date` | date | Gift Date, Donation Date, Close Date, Date, Transaction Date, Received Date | Spendendatum, Date du don, 寄付日, 捐赠日期 |
| `amount` | amount | Amount, Gift Amount, Donation Amount, Total Amount, Gross Amount, Payment Amount | Betrag, Montant, 金額, 金额 |
| `fund` | text | Fund, Fund Code, Fund ID, Fund Name, Designation, General Accounting Unit | Fonds, Fonds, 基金, 基金 |
| `appeal` | text | Appeal, Appeal ID, Appeal Code, Solicitation, Solicit Code, Source Code | Spendenaufruf, Appel aux dons, 募金依頼, 募捐呼吁 |
| `memo` | text | Notes, Memo, Gift Notes, Description, Comments, Gift Comment | Verwendungszweck, Libellé, 摘要, 摘要 |

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

### Fund list (`funds`)

| Column | Type | Also read as | For example, in other languages |
|---|---|---|---|
| `fund` (required) | text | Fund, Fund Code, Fund ID, Fund Number, GAU, Designation | Fonds, Fonds, 基金, 基金 |
| `fund_name` | text | Fund Name, Fund Description, Name, Description | - |
| `restriction` | text | Restriction, Restriction Type, Net Asset Class, Fund Type, Class, Donor Restriction | Zweckbindung, Restriction, 使途制限, 限定性 |
| `active` | text | Active, Status, Is Active | - |
| `keywords` | text | Keywords, Match Words, Terms | - |

### Appeals (`appeals`)

| Column | Type | Also read as | For example, in other languages |
|---|---|---|---|
| `appeal` (required) | text | Appeal, Appeal ID, Appeal Code, Campaign | Spendenaufruf, Appel aux dons, 募金依頼, 募捐呼吁 |
| `default_fund` | text | Default Fund, Fund, Designation | Fonds, Fonds, 基金, 基金 |

### Files from other countries

A German export in Windows-1252 with semicolons, `1.234,56` and `03.11.2026`, or a Japanese one in Shift_JIS with `2026/11/03`, is read the same way as the English file. [`fixtures/intl/`](fixtures/intl) has both versions of the demo data, and the eval cases `intl-de-*` and `intl-ja-*` require the same results as the English case. A weight, distance or dimension column found by its translated name with no unit in it is read as metric and converted, and the result says so. Columns named differently? Run `npx fairgive-gift-coding inspect <file>` (names and shapes only, never values) and name them in `fairgive-sources.json`:

```json
{ "files": { "exports/bills.csv": { "columns": { "invoice_number": "Beleg" }, "date_order": "dmy", "units": { "weight": "kg" } } } }
```

## Memory

fairgive-gift-coding can remember facts about your setup so the next run does not have to be told again. `coding_learn` only proposes a fact; it changes nothing until a named person accepts it with `coding_accept_learning`, which is one click even in Auto. Facts live in one hash-chained file per agent under `.fairgive/memory/`; if the chain does not verify, no fact is used. Credentials, personal identifiers and text that reads like instructions to an AI are refused. Run without memory with `--no-memory`.

| Kind | What an accepted fact changes |
|---|---|
| `fund_alias` | reads gifts coded with that name as coded to the fund it means |
| `note` | nothing (shown by recall only) |

```bash
fairgive-gift-coding memory list
fairgive-gift-coding memory accept MEM-1a2b3c4d5e6f --as "Your Name"
fairgive-gift-coding memory retire MEM-1a2b3c4d5e6f --as "Your Name" --reason "carrier renamed"
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

**Fund list** (argument `funds`)

No named exports: other column names are matched by a list of common alternatives.

**Appeals** (argument `appeals`)

No named exports: other column names are matched by a list of common alternatives.

Columns named differently? Run `npx fairgive-gift-coding inspect <file>` to see how a file is read (column names and shapes only, never values), then name your columns in `fairgive-sources.json` in the root:

```json
{ "files": { "exports/users.csv": { "columns": { "email": "Work E-mail" }, "date_order": "dmy" } } }
```

Where a layout says "checked", its column names were compared with the vendor's documentation on that date. The other layouts were written from knowledge of the export and were not checked. None was tested against a live account. If a real export does not match, the result says which columns were missing; please report it.
<!-- sources:end -->

## Install

Node 20 or newer. No other dependencies.

```bash
npx -y fairgive-gift-coding demo
npx -y fairgive-gift-coding mcp --root /path/to/your/files
```

Claude Desktop, Cursor and other MCP hosts:

```json
{
  "mcpServers": {
    "fairgive-gift-coding": {
      "command": "npx",
      "args": [
        "-y",
        "fairgive-gift-coding",
        "mcp",
        "--root",
        "/path/to/your/files"
      ]
    }
  }
}
```

Claude Code: `claude mcp add fairgive-gift-coding -- npx -y fairgive-gift-coding mcp --root .`, or install the `fairgive-gift-coding` plugin from this repository's marketplace.

## Modes and approvals

- **Review** (`--mode review`): reads and reports only.
- **Assist** (default): the policy above. A tool that asks returns an `approval_id`; a person approves it once with `fairgive-gift-coding approve <id> --as "Your Name"` (or on the local approvals page, `fairgive-gift-coding approvals`), and the same call is repeated.
- **Auto** (`--mode auto --auto <tool,...>`): opt-in per tool, with step caps and a kill switch (`fairgive-gift-coding kill`). Paying, sending, posting to a ledger or a live system and accepting a learned fact stay **one named click even in Auto**; an approval is tied to the sha256 of the reviewed draft, so a changed draft needs a new click.

## CLI

```bash
fairgive-gift-coding tools                 # every tool, its policy and arguments
fairgive-gift-coding sources               # the columns each input is read from
fairgive-gift-coding inspect <file>        # how a file would be read (names and shapes, never values)
fairgive-gift-coding call coding_check '{"gifts":"<gifts>","funds":"<funds>"}'
fairgive-gift-coding eval                  # the private eval cases on the fictional fixtures
fairgive-gift-coding demo
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
