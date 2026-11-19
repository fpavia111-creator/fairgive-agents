# fairgive-matching-gifts

Finds gifts from donors whose employer matches, with the match amount, the claim deadline and the claims sent or received: eligible gifts not claimed, deadlines close or passed, matches received that differ. Drafts donor reminders. Never submits a claim.

Part of **Fairgive**, the nonprofit, foundation, church and association back-office agents by Mythos Machines. The software is free (MIT); the paid part is a fixed-price setup on your own files. Every result is computed from your files with plain arithmetic, on your computer; no AI model is called by the tools.

## What it checks

For each gift from a donor whose employer matches gifts: the expected match (gift times the ratio, within the minimum gift and the yearly maximum per donor), the claim deadline and the claim recorded. Flags matches whose deadline passed or is close; lists matches not claimed, matches paid for another amount, claims waiting too long and employers not in your program list.

| Finding | Example from the fictional demo data |
|---|---|
| `claim_pending_long` | Gift M-6: the claim sent on 2026-07-05 (136 days ago) has not been paid. |
| `employer_not_in_list` | Gift M-8 (250) is from a donor who works at Example Widgets Inc, which is not in your matching program list. Check whether it matches gifts. |
| `match_deadline_passed` | Gift M-4: the Example Foods match of 200 had to be claimed by 2026-10-15; no claim is recorded. |
| `match_deadline_soon` | Gift M-3: claim the Example Tech match of 2000 by 2026-11-28 (10 days). |
| `match_not_claimed` | Gift M-2: Example Tech matches 2:1; 600 can be claimed until 2026-12-30. |
| `match_received_differs` | Gift M-5: Example Bank paid 1500; the program terms give 2000. |

Each item gets the most serious level of its findings: **flag** (act on it), **review** (data is missing or unclear; a person looks), **watch** (worth knowing) or **ok**. Every finding names the numbers it was worked out from.

## Settings

Put the ones you want to change in a JSON file and pass it as `settings`; anything left out uses the default. The result lists the settings it used under `settings_used`.

| Setting | Default | Meaning |
|---|---|---|
| `as_of` | `null` | Date the check is made at (YYYY-MM-DD); default: today |
| `soon_days` | `30` | A claim deadline within this many days is flagged (default 30) |
| `pending_days` | `90` | A claim not paid after this many days is watched (default 90) |
| `organization` | `""` | Your organization name for the drafted reminder |
| `tolerance` | `0.01` | Difference ignored (default 0.01) |

<!-- generated:start -->

## A demo run

`npx -y fairgive-matching-gifts demo` runs the agent on the fictional files in [`fixtures/`](fixtures) in a temporary folder. Captured output:

```text
Fairgive Matching Gifts demo (fictional nonprofit data), Auto mode on

▶ Run the check on the exported files
  status: executed  decision: allow
  6 matchable gift(s) as of 2026-11-18: expected match 5,500.00, not yet claimed 2,600.00, received 2,000.00, missed (deadline passed) 200.00.
    flag    M-3                                 match_deadline_soon
    flag    M-4                                 match_deadline_passed
    review  M-2                                 match_not_claimed
    review  M-5                                 match_received_differs
    review  M-8                                 employer_not_in_list
    watch   M-6                                 claim_pending_long

▶ Explain M-3
  status: executed  decision: allow
  M-3: flag. Gift M-3: claim the Example Tech match of 2000 by 2026-11-28 (10 days).

▶ Write the report (CSV worklist and HTML page)
  status: executed  decision: allow
  Matching gift claims written: 6 matchable gift(s) as of 2026-11-18: expected match 5,500.00, not yet claimed 2,600.00, received 2,000.00, missed (deadline passed) 200.00.

▶ Write a draft (Auto is opted in for drafts here)
  status: executed  decision: allow  (auto)
  match reminder M-3 drafted for 2000 with 1 open marker(s) ([TO CONFIRM link]). Nothing was sent.

▶ Auto: approving the draft stays one named click
  status: needs_approval  decision: ask
  reason: binding_send stays one-click, even in Auto

▶ Same call after the named click (recorded; a person acts on it)
  status: executed  decision: ask  approved by: Morgan Manager (fictional)
  match reminder M-3 approved and recorded. Nothing was sent or paid by the agent.

▶ The agent tries email_send itself
  status: blocked  decision: block
  reason: Never sends email, letters or messages; a person sends the reviewed draft.

Audit log: <demo folder>/.fairgive/audit.jsonl
```

## Tools

| Tool | What it does | Policy |
|---|---|---|
| `matching_check` | For each gift from a donor whose employer matches gifts: the expected match (gift times the ratio, within the minimum gift and the yearly maximum per donor), the claim deadline and the claim recorded. | runs |
| `matching_explain` | Show one gift from matching_check with every finding, the numbers behind it and the setting it was checked against. | runs |
| `matching_write_report` | Write matching-gifts.csv (one row per item, with blank owner and decision columns) and matching-gifts.html into out_dir (default fairgive-out/matching). | runs |
| `matching_draft_match_reminder` | Write drafts/match_reminder-<gift id>.md: a note asking one donor to submit their employer's matching gift request, with the amount and deadline. | asks first (Auto can be opted in) |
| `matching_request_send` | After one named human click (even in Auto), record that the reviewed match reminder draft is approved in match_reminder-requests.csv. | one named click, even in Auto (`binding_send`) |
| `matching_recall` | Search this agent's own memory of the customer's setup: accepted facts (in use) and facts waiting for a person. | runs |
| `matching_learn` | Propose one fact about the customer's setup for this agent to remember. | runs |
| `matching_accept_learning` | A named person accepts or rejects a fact waiting in this agent's memory. | one named click, even in Auto (`accept_learning`) |
| `matching_retire_memory` | A named person stops an accepted fact from applying. | one named click, even in Auto (`accept_learning`) |
| `email_send` | Never sends email, letters or messages; a person sends the reviewed draft. | refused |
| `match_portal_submit` | Never logs in to an employer matching portal or submits a claim. | refused |

Any tool name not in this table is blocked, including names a model invents. `refused` tools are listed so a model can see they exist and are refused.

## Columns it reads

Table inputs can be CSV, TSV, semicolon- or pipe-separated text, Excel `.xlsx`, JSON or JSONL. Columns are matched by the agent's own name, then by the English names below, then by their names in German, French, Spanish, Portuguese, Italian, Japanese, Chinese and Korean. Dates become `YYYY-MM-DD`; amounts are read with either decimal mark; weights, distances and dimensions are converted when the column says it holds kilograms, kilometres or centimetres. Every result lists under `sources` how each file was read.

### CRM gifts (`gifts`)

| Column | Type | Also read as | For example, in other languages |
|---|---|---|---|
| `gift_id` (required) | text | Gift ID, Donation ID, Opportunity ID, Transaction ID, Gift Number, Gift No | Spenden-ID, N° de don, 寄付ID, 捐款编号 |
| `donor_id` | text | Constituent ID, Donor ID, Account ID, Contact ID, Account Number, LGL Constituent ID | Spendernummer, N° de donateur, 寄付者ID, 捐赠人编号 |
| `donor` | text | Donor Name, Donor, Constituent Name, Account Name, Name, Full Name | Spender, Donateur, 寄付者, 捐赠人 |
| `email` | text | Email, Email Address, Donor Email, Primary Email, Contact Email, E-mail | E-Mail, E-mail, メールアドレス, 邮箱 |
| `gift_date` | date | Gift Date, Donation Date, Close Date, Date, Transaction Date, Received Date | Spendendatum, Date du don, 寄付日, 捐赠日期 |
| `amount` | amount | Amount, Gift Amount, Donation Amount, Total Amount, Gross Amount, Payment Amount | Betrag, Montant, 金額, 金额 |
| `employer` | text | Employer, Company, Organization, Employer Name, Matching Company | Arbeitgeber, Employeur, 勤務先, 雇主 |

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

### Matching programs (`employers`)

| Column | Type | Also read as | For example, in other languages |
|---|---|---|---|
| `employer` (required) | text | Employer, Company, Matching Company | Arbeitgeber, Employeur, 勤務先, 雇主 |
| `ratio` | number | Ratio, Match Ratio, Multiplier | - |
| `min_gift` | amount | Min Gift, Minimum Gift, Minimum | - |
| `max_per_year` | amount | Max Per Year, Annual Maximum, Maximum, Max | - |
| `deadline_days` | number | Deadline Days, Days To Submit, Submission Window Days | Tage, Jours, 日数, 天数 |

### Match claims (`claims`)

| Column | Type | Also read as | For example, in other languages |
|---|---|---|---|
| `gift_id` (required) | text | Gift ID, Donation ID, Opportunity ID | Spenden-ID, N° de don, 寄付ID, 捐款编号 |
| `submitted_date` | date | Submitted Date, Submitted, Claim Date, Date Submitted | Datum, Date, 日付, 日期 |
| `status` | text | Status, Claim Status | Status, Statut, ステータス, 状态 |
| `received_amount` | amount | Received Amount, Amount Received, Match Amount, Paid Amount | Betrag, Montant, 金額, 金额 |
| `received_date` | date | Received Date, Paid Date, Date Received | Datum, Date, 日付, 日期 |

### Files from other countries

A German export in Windows-1252 with semicolons, `1.234,56` and `03.11.2026`, or a Japanese one in Shift_JIS with `2026/11/03`, is read the same way as the English file. [`fixtures/intl/`](fixtures/intl) has both versions of the demo data, and the eval cases `intl-de-*` and `intl-ja-*` require the same results as the English case. A weight, distance or dimension column found by its translated name with no unit in it is read as metric and converted, and the result says so. Columns named differently? Run `npx fairgive-matching-gifts inspect <file>` (names and shapes only, never values) and name them in `fairgive-sources.json`:

```json
{ "files": { "exports/bills.csv": { "columns": { "invoice_number": "Beleg" }, "date_order": "dmy", "units": { "weight": "kg" } } } }
```

## Memory

fairgive-matching-gifts can remember facts about your setup so the next run does not have to be told again. `matching_learn` only proposes a fact; it changes nothing until a named person accepts it with `matching_accept_learning`, which is one click even in Auto. Facts live in one hash-chained file per agent under `.fairgive/memory/`; if the chain does not verify, no fact is used. Credentials, personal identifiers and text that reads like instructions to an AI are refused. Run without memory with `--no-memory`.

| Kind | What an accepted fact changes |
|---|---|
| `note` | nothing (shown by recall only) |

```bash
fairgive-matching-gifts memory list
fairgive-matching-gifts memory accept MEM-1a2b3c4d5e6f --as "Your Name"
fairgive-matching-gifts memory retire MEM-1a2b3c4d5e6f --as "Your Name" --reason "carrier renamed"
```

## Install

Node 20 or newer. No other dependencies.

```bash
npx -y fairgive-matching-gifts demo
npx -y fairgive-matching-gifts mcp --root /path/to/your/files
```

Claude Desktop, Cursor and other MCP hosts:

```json
{
  "mcpServers": {
    "fairgive-matching-gifts": {
      "command": "npx",
      "args": [
        "-y",
        "fairgive-matching-gifts",
        "mcp",
        "--root",
        "/path/to/your/files"
      ]
    }
  }
}
```

Claude Code: `claude mcp add fairgive-matching-gifts -- npx -y fairgive-matching-gifts mcp --root .`, or install the `fairgive-matching-gifts` plugin from this repository's marketplace.

## Modes and approvals

- **Review** (`--mode review`): reads and reports only.
- **Assist** (default): the policy above. A tool that asks returns an `approval_id`; a person approves it once with `fairgive-matching-gifts approve <id> --as "Your Name"` (or on the local approvals page, `fairgive-matching-gifts approvals`), and the same call is repeated.
- **Auto** (`--mode auto --auto <tool,...>`): opt-in per tool, with step caps and a kill switch (`fairgive-matching-gifts kill`). Paying, sending, posting to a ledger or a live system and accepting a learned fact stay **one named click even in Auto**; an approval is tied to the sha256 of the reviewed draft, so a changed draft needs a new click.

## CLI

```bash
fairgive-matching-gifts tools                 # every tool, its policy and arguments
fairgive-matching-gifts sources               # the columns each input is read from
fairgive-matching-gifts inspect <file>        # how a file would be read (names and shapes, never values)
fairgive-matching-gifts call matching_check '{"gifts":"<gifts>","employers":"<employers>"}'
fairgive-matching-gifts eval                  # the private eval cases on the fictional fixtures
fairgive-matching-gifts demo
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
