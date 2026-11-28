# fairgive-volunteer-hours

Totals volunteer hours by program from your hours log, values them at your hourly rate setting, and flags shifts over your daily maximum, future dates, duplicate entries, missing programs, background checks due and skilled services to look at for recognition.

Part of **Fairgive**, the nonprofit, foundation, church and association back-office agents by Fair Agents. The software is free (MIT); the paid part is a fixed-price setup on your own files. Every result is computed from your files with plain arithmetic, on your computer; no AI model is called by the tools. It reads files and writes reports; it never files, sends, pays or changes a live system, and a person on your team decides and acts on every finding.

## What it needs

Exports you already have, saved as files on your computer (CSV, Excel, JSON; see "Columns it reads" and "Exports it reads" below):

- `hours` (required): Volunteer hours log (from your volunteer system or a sign-in sheet): entry id, volunteer id, name, date, hours, program, role, skilled (yes/no)
- `volunteers`: Optional volunteer list: volunteer id, name, role, background check date, waiver (yes/no)
- `settings` (optional): a JSON file with your own thresholds and rules; see "Settings" below.

## What it checks

Totals volunteer hours by volunteer and program and values them at the hourly rate in the settings. Lists entries over the daily maximum, dated after the as-of date, entered twice or with no program; volunteers in roles that need a background check with none or an old one, missing waivers, and skilled hours that may count as contributed services.

| Finding | Example from the fictional demo data |
|---|---|
| `background_check_expired` | Driver: the background check of 2022-05-01 is older than 3 years. |
| `background_check_missing` | Youth mentor: no background check on file. |
| `duplicate_entry` | 3 hours on 2026-10-05 for Food pantry are entered more than once. |
| `future_date` | 2 hours are dated 2026-12-01, after 2026-11-18. |
| `missing_program` | 10 hours on 2026-10-10 have no program. |
| `shift_over_max` | 14 hours on 2026-10-04, more than the 12 hour daily maximum in the settings. |
| `skilled_service_candidate` | 10 skilled hours (Pro bono accountant); they may count as contributed services in the in-kind log if they meet the criteria. |
| `waiver_missing` | No signed waiver on file. |

Each item gets the most serious level of its findings: **flag** (act on it), **review** (data is missing or unclear; a person looks), **watch** (worth knowing) or **ok**. Every finding names the numbers it was worked out from.

## Settings

Put the ones you want to change in a JSON file and pass it as `settings`; anything left out uses the default. The result lists the settings it used under `settings_used`.

| Setting | Default | Meaning |
|---|---|---|
| `as_of` | `null` | Date the check is made at (YYYY-MM-DD); default: today |
| `hourly_value` | `0` | Value of a volunteer hour you use for reports (default 0: not valued; enter the published figure your organization uses) |
| `max_hours_per_day` | `12` | Hours in one entry above this are listed (default 12) |
| `background_check_years` | `3` | A background check older than this is expired (default 3) |
| `roles_needing_check` | `[]` | Roles that need a background check (youth mentor, driver...) |

<!-- generated:start -->

## A demo run

`npx -y fairgive-volunteer-hours demo` runs the agent on the fictional files in [`fixtures/`](fixtures) in a temporary folder. Captured output:

```text
Fairgive Volunteer Hours demo (fictional nonprofit data), Auto mode on

▶ Run the check on the exported files
  status: executed  decision: allow
  5 volunteer(s), 48 hour(s) as of 2026-11-18 valued at 1440; 2 background check(s) to fix, 10 skilled hour(s) to look at.
    flag    V-2                                 background_check_expired
    flag    V-3                                 background_check_missing, waiver_missing
    review  V-4                                 shift_over_max, duplicate_entry, future_date
    review  V-5                                 missing_program, skilled_service_candidate

▶ Explain V-4
  status: executed  decision: allow
  V-4: review. 14 hours on 2026-10-04, more than the 12 hour daily maximum in the settings. 3 hours on 2026-10-05 for Food pantry are entered more than once. 2 hours are dated 2026-12-01, after 2026-11-18.

▶ Write the report (CSV worklist and HTML page)
  status: executed  decision: allow
  Volunteer hours written: 5 volunteer(s), 48 hour(s) as of 2026-11-18 valued at 1440; 2 background check(s) to fix, 10 skilled hour(s) to look at.

▶ The agent tries donor_data_delete itself
  status: blocked  decision: block
  reason: Never deletes donor, member or volunteer personal data.

Audit log: <demo folder>/.fairgive/audit.jsonl
```

## Tools

| Tool | What it does | Policy |
|---|---|---|
| `volunteers_check` | Totals volunteer hours by volunteer and program and values them at the hourly rate in the settings. | runs |
| `volunteers_explain` | Show one volunteer from volunteers_check with every finding, the numbers behind it and the setting it was checked against. | runs |
| `volunteers_write_report` | Write volunteer-hours.csv (one row per item, with blank owner and decision columns) and volunteer-hours.html into out_dir (default fairgive-out/volunteers). | runs |
| `volunteers_recall` | Search this agent's own memory of the customer's setup: accepted facts (in use) and facts waiting for a person. | runs |
| `volunteers_learn` | Propose one fact about the customer's setup for this agent to remember. | runs |
| `volunteers_accept_learning` | A named person accepts or rejects a fact waiting in this agent's memory. | one named click, even in Auto (`accept_learning`) |
| `volunteers_retire_memory` | A named person stops an accepted fact from applying. | one named click, even in Auto (`accept_learning`) |
| `donor_data_delete` | Never deletes donor, member or volunteer personal data. | refused |
| `email_send` | Never sends email, letters or messages; a person sends the reviewed draft. | refused |

Any tool name not in this table is blocked, including names a model invents. `refused` tools are listed so a model can see they exist and are refused.

## Columns it reads

Table inputs can be CSV, TSV, semicolon- or pipe-separated text, Excel `.xlsx`, JSON or JSONL. Columns are matched by the agent's own name, then by the English names below, then by their names in German, French, Spanish, Portuguese, Italian, Japanese, Chinese and Korean. Dates become `YYYY-MM-DD`; amounts are read with either decimal mark; weights, distances and dimensions are converted when the column says it holds kilograms, kilometres or centimetres. Every result lists under `sources` how each file was read.

### Volunteer hours (`hours`)

| Column | Type | Also read as | For example, in other languages |
|---|---|---|---|
| `entry_id` | text | Entry ID, Shift ID, Record ID | - |
| `volunteer_id` | text | Volunteer ID, Constituent ID, Contact ID | - |
| `volunteer` | text | Volunteer, Volunteer Name, Name, Full Name | Ehrenamtliche, Bénévole, ボランティア, 志愿者 |
| `date` (required) | date | Date, Shift Date, Service Date | Datum, Date, 日付, 日期 |
| `hours` | number | Hours, Hours Served, Duration | Stunden, Heures, 時間数, 小时数 |
| `program` | text | Program, Program Name, Opportunity, Project | Programm, Programme, プログラム, 项目 |
| `role` | text | Role, Position, Job | Rolle, Rôle, ロール, 角色 |
| `skilled` | text | Skilled, Specialized Skill, Professional Service, Pro Bono | - |

### Volunteers (`volunteers`)

| Column | Type | Also read as | For example, in other languages |
|---|---|---|---|
| `volunteer_id` | text | Volunteer ID, Constituent ID, Contact ID | - |
| `volunteer` | text | Volunteer, Name, Full Name | Ehrenamtliche, Bénévole, ボランティア, 志愿者 |
| `role` | text | Role, Position | Rolle, Rôle, ロール, 角色 |
| `background_check_date` | date | Background Check Date, Background Check, Screening Date, Cleared On | Datum, Date, 日付, 日期 |
| `waiver` | text | Waiver, Waiver Signed, Release Signed | - |

### Files from other countries

A German export in Windows-1252 with semicolons, `1.234,56` and `03.11.2026`, or a Japanese one in Shift_JIS with `2026/11/03`, is read the same way as the English file. [`fixtures/intl/`](fixtures/intl) has both versions of the demo data, and the eval cases `intl-de-*` and `intl-ja-*` require the same results as the English case. A weight, distance or dimension column found by its translated name with no unit in it is read as metric and converted, and the result says so. Columns named differently? Run `npx fairgive-volunteer-hours inspect <file>` (names and shapes only, never values) and name them in `fairgive-sources.json`:

```json
{ "files": { "exports/bills.csv": { "columns": { "invoice_number": "Beleg" }, "date_order": "dmy", "units": { "weight": "kg" } } } }
```

## Memory

fairgive-volunteer-hours can remember facts about your setup so the next run does not have to be told again. `volunteers_learn` only proposes a fact; it changes nothing until a named person accepts it with `volunteers_accept_learning`, which is one click even in Auto. Facts live in one hash-chained file per agent under `.fairgive/memory/`; if the chain does not verify, no fact is used. Credentials, personal identifiers and text that reads like instructions to an AI are refused. Run without memory with `--no-memory`.

| Kind | What an accepted fact changes |
|---|---|
| `note` | nothing (shown by recall only) |

```bash
fairgive-volunteer-hours memory list
fairgive-volunteer-hours memory accept MEM-1a2b3c4d5e6f --as "Your Name"
fairgive-volunteer-hours memory retire MEM-1a2b3c4d5e6f --as "Your Name" --reason "carrier renamed"
```

<!-- sources:start -->
## Exports it reads

Table inputs can be CSV, TSV, semicolon- or pipe-separated text, Excel `.xlsx`, JSON or JSONL. A file already in this agent's own columns is read as it is. The exports below are recognised by their column names and mapped onto those columns; dates become `YYYY-MM-DD`, amounts plain decimals (both decimal marks), and yes/no columns `yes`/`no`. Each result lists, under `sources`, which export was recognised, which columns were mapped, and any rows skipped or dates that could be read two ways.

**Volunteer hours** (argument `hours`)

No named exports: other column names are matched by a list of common alternatives.

**Volunteers** (argument `volunteers`)

No named exports: other column names are matched by a list of common alternatives.

Columns named differently? Run `npx fairgive-volunteer-hours inspect <file>` to see how a file is read (column names and shapes only, never values), then name your columns in `fairgive-sources.json` in the root:

```json
{ "files": { "exports/users.csv": { "columns": { "email": "Work E-mail" }, "date_order": "dmy" } } }
```

Where a layout says "checked", its column names were compared with the vendor's documentation on that date. The other layouts were written from knowledge of the export and were not checked. None was tested against a live account. If a real export does not match, the result says which columns were missing; please report it.
<!-- sources:end -->

## Install

Node 20 or newer. No other dependencies.

```bash
npx -y fairgive-volunteer-hours demo
npx -y fairgive-volunteer-hours mcp --root /path/to/your/files
```

Claude Desktop, Cursor and other MCP hosts:

```json
{
  "mcpServers": {
    "fairgive-volunteer-hours": {
      "command": "npx",
      "args": [
        "-y",
        "fairgive-volunteer-hours",
        "mcp",
        "--root",
        "/path/to/your/files"
      ]
    }
  }
}
```

Claude Code: `claude mcp add fairgive-volunteer-hours -- npx -y fairgive-volunteer-hours mcp --root .`, or install the `fairgive-volunteer-hours` plugin from this repository's marketplace.

## Modes and approvals

- **Review** (`--mode review`): reads and reports only.
- **Assist** (default): the policy above. A tool that asks returns an `approval_id`; a person approves it once with `fairgive-volunteer-hours approve <id> --as "Your Name"` (or on the local approvals page, `fairgive-volunteer-hours approvals`), and the same call is repeated.
- **Auto** (`--mode auto --auto <tool,...>`): opt-in per tool, with step caps and a kill switch (`fairgive-volunteer-hours kill`). Paying, sending, posting to a ledger or a live system and accepting a learned fact stay **one named click even in Auto**; an approval is tied to the sha256 of the reviewed draft, so a changed draft needs a new click.

## CLI

```bash
fairgive-volunteer-hours tools                 # every tool, its policy and arguments
fairgive-volunteer-hours sources               # the columns each input is read from
fairgive-volunteer-hours inspect <file>        # how a file would be read (names and shapes, never values)
fairgive-volunteer-hours call volunteers_check '{"hours":"<hours>"}'
fairgive-volunteer-hours eval                  # the private eval cases on the fictional fixtures
fairgive-volunteer-hours demo
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
