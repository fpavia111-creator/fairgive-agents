# fairgive-memberships

Checks members and dues payments: memberships expiring soon or lapsed, dues paid that do not match the level, payments that did not extend the membership, and active members with no payment. Drafts renewal notices. Never charges or sends.

Part of **Fairgive**, the nonprofit, foundation, church and association back-office agents by Mythos Machines. The software is free (MIT); the paid part is a fixed-price setup on your own files. Every result is computed from your files with plain arithmetic, on your computer; no AI model is called by the tools. It reads files and writes reports and drafts; it never files, sends, pays or changes a live system, and a person on your team decides and acts on every finding.

## What it needs

Exports you already have, saved as files on your computer (CSV, Excel, JSON; see "Columns it reads" and "Exports it reads" below):

- `members` (required): Member export (Neon, Wild Apricot-style or CRM export): member id, name, e-mail, level, start date, end date, auto-renew
- `payments`: Dues payments: member id, date, amount
- `levels` (required): Membership levels: level, dues, term in months
- `settings` (optional): a JSON file with your own thresholds and rules; see "Settings" below.

## What it checks

Checks each membership against its level and payments: memberships ending within the expiring days, ended past the grace days with no renewal, dues paid that do not match the level, renewal payments that did not move the end date, active memberships with no payment for the current term and levels not in the level list.

| Finding | Example from the fictional demo data |
|---|---|
| `active_without_payment` | Member MB-6 is active until 2027-06-30 and no payment is on file for the current term. |
| `expiring_soon` | Member MB-2: the membership ends on 2026-12-05, in 17 days. |
| `lapsed` | Member MB-3: the membership ended on 2026-09-01 (78 days ago) with no renewal. |
| `paid_not_extended` | Member MB-5 paid 100 on 2026-10-10 but the membership still ends on 2026-10-15. |
| `paid_wrong_amount` | Member MB-4 paid 400 on 2026-05-01; Patron dues are 500. |

Each item gets the most serious level of its findings: **flag** (act on it), **review** (data is missing or unclear; a person looks), **watch** (worth knowing) or **ok**. Every finding names the numbers it was worked out from.

## Settings

Put the ones you want to change in a JSON file and pass it as `settings`; anything left out uses the default. The result lists the settings it used under `settings_used`.

| Setting | Default | Meaning |
|---|---|---|
| `as_of` | `null` | Date the check is made at (YYYY-MM-DD); default: today |
| `expiring_days` | `30` | Memberships ending within this many days are shown (default 30) |
| `grace_days` | `30` | Days after the end date before a membership counts as lapsed (default 30) |
| `organization` | `""` | Your organization name for the renewal notice |
| `tolerance` | `0.01` | Difference ignored (default 0.01) |

<!-- generated:start -->

## A demo run

`npx -y fairgive-memberships demo` runs the agent on the fictional files in [`fixtures/`](fixtures) in a temporary folder. Captured output:

```text
Fairgive Memberships demo (fictional nonprofit data), Auto mode on

▶ Run the check on the exported files
  status: executed  decision: allow
  7 member(s) as of 2026-11-18: 5 active (1,200.00 of yearly dues), 1 expiring soon, 1 lapsed; 1,150.00 received in the last 12 months.
    flag    MB-4                                paid_wrong_amount
    flag    MB-5                                paid_not_extended
    review  MB-3                                lapsed
    review  MB-6                                active_without_payment
    watch   MB-2                                expiring_soon

▶ Explain MB-5
  status: executed  decision: allow
  MB-5: flag. Member MB-5 paid 100 on 2026-10-10 but the membership still ends on 2026-10-15.

▶ Write the report (CSV worklist and HTML page)
  status: executed  decision: allow
  Memberships and renewals written: 7 member(s) as of 2026-11-18: 5 active (1,200.00 of yearly dues), 1 expiring soon, 1 lapsed; 1,150.00 received in the last 12 months.

▶ Write a draft (Auto is opted in for drafts here)
  status: executed  decision: allow  (auto)
  renewal notice MB-2 drafted for 100 with 1 open marker(s) ([TO CONFIRM renewal link or address]). Nothing was sent.

▶ Auto: approving the draft stays one named click
  status: needs_approval  decision: ask
  reason: binding_send stays one-click, even in Auto

▶ Same call after the named click (recorded; a person acts on it)
  status: executed  decision: ask  approved by: Morgan Manager (fictional)
  renewal notice MB-2 approved and recorded. Nothing was sent or paid by the agent.

▶ The agent tries email_send itself
  status: blocked  decision: block
  reason: Never sends email, letters or messages; a person sends the reviewed draft.

Audit log: <demo folder>/.fairgive/audit.jsonl
```

## Tools

| Tool | What it does | Policy |
|---|---|---|
| `members_check` | Checks each membership against its level and payments: memberships ending within the expiring days, ended past the grace days with no renewal, dues paid that do not match the level, renewal payments that did not move … | runs |
| `members_explain` | Show one member from members_check with every finding, the numbers behind it and the setting it was checked against. | runs |
| `members_write_report` | Write memberships.csv (one row per item, with blank owner and decision columns) and memberships.html into out_dir (default fairgive-out/members). | runs |
| `members_draft_renewal_notice` | Write drafts/renewal_notice-<member id>.md: a renewal notice to one member with the level, dues and end date. | asks first (Auto can be opted in) |
| `members_request_send` | After one named human click (even in Auto), record that the reviewed renewal notice draft is approved in renewal_notice-requests.csv. | one named click, even in Auto (`binding_send`) |
| `members_recall` | Search this agent's own memory of the customer's setup: accepted facts (in use) and facts waiting for a person. | runs |
| `members_learn` | Propose one fact about the customer's setup for this agent to remember. | runs |
| `members_accept_learning` | A named person accepts or rejects a fact waiting in this agent's memory. | one named click, even in Auto (`accept_learning`) |
| `members_retire_memory` | A named person stops an accepted fact from applying. | one named click, even in Auto (`accept_learning`) |
| `email_send` | Never sends email, letters or messages; a person sends the reviewed draft. | refused |
| `crm_update_records` | Never changes, merges or deletes records in the donor CRM; a person does that in the CRM. | refused |
| `dues_charge` | Never charges a card or bank account for dues. | refused |

Any tool name not in this table is blocked, including names a model invents. `refused` tools are listed so a model can see they exist and are refused.

## Columns it reads

Table inputs can be CSV, TSV, semicolon- or pipe-separated text, Excel `.xlsx`, JSON or JSONL. Columns are matched by the agent's own name, then by the English names below, then by their names in German, French, Spanish, Portuguese, Italian, Japanese, Chinese and Korean. Dates become `YYYY-MM-DD`; amounts are read with either decimal mark; weights, distances and dimensions are converted when the column says it holds kilograms, kilometres or centimetres. Every result lists under `sources` how each file was read.

### Members (`members`)

| Column | Type | Also read as | For example, in other languages |
|---|---|---|---|
| `member_id` (required) | text | Member ID, Membership ID, Account ID, Constituent ID | Mitgliedsnummer, N° d'adhérent, 会員番号, 会员编号 |
| `member` | text | Member, Name, Member Name, Full Name | - |
| `email` | text | Email, Email Address | E-Mail, E-mail, メールアドレス, 邮箱 |
| `level` | text | Level, Membership Level, Membership Type, Tier | Mitgliedschaftsstufe, Niveau d'adhésion, 会員種別, 会员等级 |
| `start_date` | date | Start Date, Member Since, Joined | Eintrittsdatum, Date d'entrée, 入社日, 入职日期 |
| `expires` | date | Expires, End Date, Expiration Date, Renewal Date, Valid Until | Ablaufdatum, Date d'expiration, 有効期限, 到期日 |
| `auto_renew` | text | Auto Renew, Auto-Renew, Recurring | Automatische Verlängerung, Renouvellement automatique, 自動更新, 自动续费 |

### Dues payments (`payments`)

| Column | Type | Also read as | For example, in other languages |
|---|---|---|---|
| `member_id` (required) | text | Member ID, Membership ID, Account ID | Mitgliedsnummer, N° d'adhérent, 会員番号, 会员编号 |
| `date` | date | Date, Payment Date, Paid On | Datum, Date, 日付, 日期 |
| `amount` | amount | Amount, Dues, Payment Amount | Betrag, Montant, 金額, 金额 |

### Membership levels (`levels`)

| Column | Type | Also read as | For example, in other languages |
|---|---|---|---|
| `level` (required) | text | Level, Membership Level, Membership Type | Mitgliedschaftsstufe, Niveau d'adhésion, 会員種別, 会员等级 |
| `dues` | amount | Dues, Fee, Price, Amount | - |
| `term_months` | number | Term Months, Term, Months | - |

### Files from other countries

A German export in Windows-1252 with semicolons, `1.234,56` and `03.11.2026`, or a Japanese one in Shift_JIS with `2026/11/03`, is read the same way as the English file. [`fixtures/intl/`](fixtures/intl) has both versions of the demo data, and the eval cases `intl-de-*` and `intl-ja-*` require the same results as the English case. A weight, distance or dimension column found by its translated name with no unit in it is read as metric and converted, and the result says so. Columns named differently? Run `npx fairgive-memberships inspect <file>` (names and shapes only, never values) and name them in `fairgive-sources.json`:

```json
{ "files": { "exports/bills.csv": { "columns": { "invoice_number": "Beleg" }, "date_order": "dmy", "units": { "weight": "kg" } } } }
```

## Memory

fairgive-memberships can remember facts about your setup so the next run does not have to be told again. `members_learn` only proposes a fact; it changes nothing until a named person accepts it with `members_accept_learning`, which is one click even in Auto. Facts live in one hash-chained file per agent under `.fairgive/memory/`; if the chain does not verify, no fact is used. Credentials, personal identifiers and text that reads like instructions to an AI are refused. Run without memory with `--no-memory`.

| Kind | What an accepted fact changes |
|---|---|
| `note` | nothing (shown by recall only) |

```bash
fairgive-memberships memory list
fairgive-memberships memory accept MEM-1a2b3c4d5e6f --as "Your Name"
fairgive-memberships memory retire MEM-1a2b3c4d5e6f --as "Your Name" --reason "carrier renamed"
```

<!-- sources:start -->
## Exports it reads

Table inputs can be CSV, TSV, semicolon- or pipe-separated text, Excel `.xlsx`, JSON or JSONL. A file already in this agent's own columns is read as it is. The exports below are recognised by their column names and mapped onto those columns; dates become `YYYY-MM-DD`, amounts plain decimals (both decimal marks), and yes/no columns `yes`/`no`. Each result lists, under `sources`, which export was recognised, which columns were mapped, and any rows skipped or dates that could be read two ways.

**Members** (argument `members`)

No named exports: other column names are matched by a list of common alternatives.

**Dues payments** (argument `payments`)

No named exports: other column names are matched by a list of common alternatives.

**Membership levels** (argument `levels`)

No named exports: other column names are matched by a list of common alternatives.

Columns named differently? Run `npx fairgive-memberships inspect <file>` to see how a file is read (column names and shapes only, never values), then name your columns in `fairgive-sources.json` in the root:

```json
{ "files": { "exports/users.csv": { "columns": { "email": "Work E-mail" }, "date_order": "dmy" } } }
```

Where a layout says "checked", its column names were compared with the vendor's documentation on that date. The other layouts were written from knowledge of the export and were not checked. None was tested against a live account. If a real export does not match, the result says which columns were missing; please report it.
<!-- sources:end -->

## Install

Node 20 or newer. No other dependencies.

```bash
npx -y fairgive-memberships demo
npx -y fairgive-memberships mcp --root /path/to/your/files
```

Claude Desktop, Cursor and other MCP hosts:

```json
{
  "mcpServers": {
    "fairgive-memberships": {
      "command": "npx",
      "args": [
        "-y",
        "fairgive-memberships",
        "mcp",
        "--root",
        "/path/to/your/files"
      ]
    }
  }
}
```

Claude Code: `claude mcp add fairgive-memberships -- npx -y fairgive-memberships mcp --root .`, or install the `fairgive-memberships` plugin from this repository's marketplace.

## Modes and approvals

- **Review** (`--mode review`): reads and reports only.
- **Assist** (default): the policy above. A tool that asks returns an `approval_id`; a person approves it once with `fairgive-memberships approve <id> --as "Your Name"` (or on the local approvals page, `fairgive-memberships approvals`), and the same call is repeated.
- **Auto** (`--mode auto --auto <tool,...>`): opt-in per tool, with step caps and a kill switch (`fairgive-memberships kill`). Paying, sending, posting to a ledger or a live system and accepting a learned fact stay **one named click even in Auto**; an approval is tied to the sha256 of the reviewed draft, so a changed draft needs a new click.

## CLI

```bash
fairgive-memberships tools                 # every tool, its policy and arguments
fairgive-memberships sources               # the columns each input is read from
fairgive-memberships inspect <file>        # how a file would be read (names and shapes, never values)
fairgive-memberships call members_check '{"members":"<members>","levels":"<levels>"}'
fairgive-memberships eval                  # the private eval cases on the fictional fixtures
fairgive-memberships demo
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
