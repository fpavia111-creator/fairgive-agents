# fairgive-grant-reports

Builds the reporting calendar for every grant from its schedule and period, and flags reports overdue, due soon, final reports after the period ends and grants with no schedule. Writes a calendar file. Never submits anything to a funder.

Part of **Fairgive**, the nonprofit, foundation, church and association back-office agents by Fair Agents. The software is free (MIT); the paid part is a fixed-price setup on your own files. Every result is computed from your files with plain arithmetic, on your computer; no AI model is called by the tools. It reads files and writes reports and drafts; it never files, sends, pays or changes a live system, and a person on your team decides and acts on every finding.

## What it needs

Exports you already have, saved as files on your computer (CSV, Excel, JSON; see "Columns it reads" and "Exports it reads" below):

- `grants` (required): Grant list: grant code, name, funder, award start and end, owner
- `schedule` (required): Reporting schedule: grant, report name, frequency (quarterly, semiannual, annual, final or once), days after the period end it is due, or the due date for a one-time report
- `submissions`: Optional log of reports sent: grant, report, period end, date sent
- `settings` (optional): a JSON file with your own thresholds and rules; see "Settings" below.

## What it checks

Builds every report period from each grant's schedule (quarterly, semiannual or annual from the award start, a final report after the award end, or a one-time date), matches it to the reports sent, and lists reports overdue, due within the soon window, sent late, and grants with no schedule. Reports due beyond the horizon are left off.

| Finding | Example from the fictional demo data |
|---|---|
| `due_soon` | G-FED Equipment inventory for the period ending 2026-12-01 is due on 2026-12-01, in 13 day(s). |
| `late_submission` | G-FOUND Quarterly update for the period ending 2026-03-31 was sent on 2026-05-15, 15 day(s) after it was due on 2026-04-30. |
| `no_schedule` | G-NEW (Example Community Trust) has no reporting schedule. |
| `overdue` | G-FED Financial report for the period ending 2026-09-30 was due on 2026-10-30 (19 day(s) ago) and is not in the submissions log. |

Each item gets the most serious level of its findings: **flag** (act on it), **review** (data is missing or unclear; a person looks), **watch** (worth knowing) or **ok**. Every finding names the numbers it was worked out from.

## Settings

Put the ones you want to change in a JSON file and pass it as `settings`; anything left out uses the default. The result lists the settings it used under `settings_used`.

| Setting | Default | Meaning |
|---|---|---|
| `as_of` | `null` | Date the check is made at (YYYY-MM-DD); default: today |
| `due_soon_days` | `30` | Reports due within this many days are shown as due soon (default 30) |
| `horizon_days` | `120` | Reports due further out than this are left off the list (default 120) |
| `final_due_days` | `90` | Days after the award end a final report is due when the schedule gives no number (default 90; check each award) |

<!-- generated:start -->

## A demo run

`npx -y fairgive-grant-reports demo` runs the agent on the fictional files in [`fixtures/`](fixtures) in a temporary folder. Captured output:

```text
Fairgive Grant Reports demo (fictional nonprofit data), Auto mode on

▶ Run the check on the exported files
  status: executed  decision: allow
  12 report(s) for 4 grant(s) as of 2026-11-18: 2 overdue, 1 due soon, 1 sent late, 1 grant(s) with no schedule.
    flag    G-FED Financial report 2026-09-30   overdue
    flag    G-FOUND Final report 2026-06-30     overdue
    review  G-NEW no schedule                   no_schedule
    watch   G-FED Equipment inventory 2026-12-  due_soon
    watch   G-FOUND Quarterly update 2026-03-3  late_submission

▶ Explain G-FOUND Final report 2026-06-30
  status: executed  decision: allow
  G-FOUND Final report 2026-06-30: flag. G-FOUND Final report for the period ending 2026-06-30 was due on 2026-09-28 (51 day(s) ago) and is not in the submissions log.

▶ Write the report (CSV worklist and HTML page)
  status: executed  decision: allow
  Grant reporting deadlines written: 12 report(s) for 4 grant(s) as of 2026-11-18: 2 overdue, 1 due soon, 1 sent late, 1 grant(s) with no schedule.

▶ Write a draft (Auto is opted in for drafts here)
  status: executed  decision: allow  (auto)
  reminder G-FED drafted with 2 open marker(s) ([TO CONFIRM: your name and role], [TO CONFIRM funder contact]). Nothing was sent.

▶ Auto: approving the draft stays one named click
  status: needs_approval  decision: ask
  reason: binding_send stays one-click, even in Auto

▶ Same call after the named click (recorded; a person acts on it)
  status: executed  decision: ask  approved by: Morgan Manager (fictional)
  reminder G-FED approved and recorded. Nothing was sent or paid by the agent.

▶ The agent tries funder_portal_submit itself
  status: blocked  decision: block
  reason: Never logs in to or submits anything on a funder, grants or payment-management portal.

Audit log: <demo folder>/.fairgive/audit.jsonl
```

## Tools

| Tool | What it does | Policy |
|---|---|---|
| `grant_reports_check` | Builds every report period from each grant's schedule (quarterly, semiannual or annual from the award start, a final report after the award end, or a one-time date), matches it to the reports sent, and lists reports o… | runs |
| `grant_reports_explain` | Show one report (grant, report name and period end) from grant_reports_check with every finding, the numbers behind it and the setting it was checked against. | runs |
| `grant_reports_write_report` | Write grant-reports.csv (one row per item, with blank owner and decision columns) and grant-reports.html into out_dir (default fairgive-out/grant_reports). | runs |
| `grant_reports_draft_reminder` | Write drafts/reminder-<grant>.md: a reminder to the grant owner listing that grant's overdue and due-soon reports with their dates. | asks first (Auto can be opted in) |
| `grant_reports_request_send` | After one named human click (even in Auto), record that the reviewed reminder draft is approved in reminder-requests.csv. | one named click, even in Auto (`binding_send`) |
| `grant_reports_write_calendar` | Write grant-reports.ics (one all-day event per report not yet sent, with reminders 14 and 3 days before) into out_dir (default fairgive-out/grant_reports), to import into Outlook, Google or Apple calendars. | runs |
| `grant_reports_recall` | Search this agent's own memory of the customer's setup: accepted facts (in use) and facts waiting for a person. | runs |
| `grant_reports_learn` | Propose one fact about the customer's setup for this agent to remember. | runs |
| `grant_reports_accept_learning` | A named person accepts or rejects a fact waiting in this agent's memory. | one named click, even in Auto (`accept_learning`) |
| `grant_reports_retire_memory` | A named person stops an accepted fact from applying. | one named click, even in Auto (`accept_learning`) |
| `funder_portal_submit` | Never logs in to or submits anything on a funder, grants or payment-management portal. | refused |
| `email_send` | Never sends email, letters or messages; a person sends the reviewed draft. | refused |

Any tool name not in this table is blocked, including names a model invents. `refused` tools are listed so a model can see they exist and are refused.

## Columns it reads

Table inputs can be CSV, TSV, semicolon- or pipe-separated text, Excel `.xlsx`, JSON or JSONL. Columns are matched by the agent's own name, then by the English names below, then by their names in German, French, Spanish, Portuguese, Italian, Japanese, Chinese and Korean. Dates become `YYYY-MM-DD`; amounts are read with either decimal mark; weights, distances and dimensions are converted when the column says it holds kilograms, kilometres or centimetres. Every result lists under `sources` how each file was read.

### Grants (`grants`)

| Column | Type | Also read as | For example, in other languages |
|---|---|---|---|
| `grant` (required) | text | Grant, Grant ID, Grant Code, Award, Award Number, Project | Förderprojekt, Subvention, 助成金, 资助项目 |
| `grant_name` | text | Grant Name, Award Name, Project Name, Title, Program Name | - |
| `funder` | text | Funder, Grantor, Funding Agency, Agency, Foundation, Awarding Agency | - |
| `award_start` | date | Start Date, Period Start, Award Start, Project Start, Begin Date | Eintrittsdatum, Date d'entrée, 入社日, 入职日期 |
| `award_end` | date | End Date, Period End, Award End, Project End, Expiration Date | Austrittsdatum, Date de sortie, 退職日, 离职日期 |
| `owner` | text | Owner, Grant Manager, Program Officer, Contact, Responsible | Verantwortlich, Responsable, 担当者, 负责人 |

### Reporting schedule (`schedule`)

| Column | Type | Also read as | For example, in other languages |
|---|---|---|---|
| `grant` (required) | text | Grant, Grant ID, Grant Code, Award | Förderprojekt, Subvention, 助成金, 资助项目 |
| `report` | text | Report, Report Name, Report Type, Deliverable | - |
| `frequency` | text | Frequency, Schedule, Interval | - |
| `due_days_after` | number | Due Days After, Days After Period End, Due In Days, Days Due | Tage, Jours, 日数, 天数 |
| `due_date` | date | Due Date, Due, Deadline | Fälligkeitsdatum, Date d'échéance, 期日, 截止日期 |

### Reports sent (`submissions`)

| Column | Type | Also read as | For example, in other languages |
|---|---|---|---|
| `grant` (required) | text | Grant, Grant ID, Grant Code, Award | Förderprojekt, Subvention, 助成金, 资助项目 |
| `report` | text | Report, Report Name, Report Type, Deliverable | - |
| `period_end` | date | Period End, Period Ending, Reporting Period End, Period | Austrittsdatum, Date de sortie, 退職日, 离职日期 |
| `submitted_date` | date | Submitted Date, Date Sent, Submitted, Sent On, Submission Date | Datum, Date, 日付, 日期 |

### Files from other countries

A German export in Windows-1252 with semicolons, `1.234,56` and `03.11.2026`, or a Japanese one in Shift_JIS with `2026/11/03`, is read the same way as the English file. [`fixtures/intl/`](fixtures/intl) has both versions of the demo data, and the eval cases `intl-de-*` and `intl-ja-*` require the same results as the English case. A weight, distance or dimension column found by its translated name with no unit in it is read as metric and converted, and the result says so. Columns named differently? Run `npx fairgive-grant-reports inspect <file>` (names and shapes only, never values) and name them in `fairgive-sources.json`:

```json
{ "files": { "exports/bills.csv": { "columns": { "invoice_number": "Beleg" }, "date_order": "dmy", "units": { "weight": "kg" } } } }
```

## Memory

fairgive-grant-reports can remember facts about your setup so the next run does not have to be told again. `grant_reports_learn` only proposes a fact; it changes nothing until a named person accepts it with `grant_reports_accept_learning`, which is one click even in Auto. Facts live in one hash-chained file per agent under `.fairgive/memory/`; if the chain does not verify, no fact is used. Credentials, personal identifiers and text that reads like instructions to an AI are refused. Run without memory with `--no-memory`.

| Kind | What an accepted fact changes |
|---|---|
| `note` | nothing (shown by recall only) |

```bash
fairgive-grant-reports memory list
fairgive-grant-reports memory accept MEM-1a2b3c4d5e6f --as "Your Name"
fairgive-grant-reports memory retire MEM-1a2b3c4d5e6f --as "Your Name" --reason "carrier renamed"
```

<!-- sources:start -->
## Exports it reads

Table inputs can be CSV, TSV, semicolon- or pipe-separated text, Excel `.xlsx`, JSON or JSONL. A file already in this agent's own columns is read as it is. The exports below are recognised by their column names and mapped onto those columns; dates become `YYYY-MM-DD`, amounts plain decimals (both decimal marks), and yes/no columns `yes`/`no`. Each result lists, under `sources`, which export was recognised, which columns were mapped, and any rows skipped or dates that could be read two ways.

**Grants** (argument `grants`)

No named exports: other column names are matched by a list of common alternatives.

**Reporting schedule** (argument `schedule`)

No named exports: other column names are matched by a list of common alternatives.

**Reports sent** (argument `submissions`)

No named exports: other column names are matched by a list of common alternatives.

Columns named differently? Run `npx fairgive-grant-reports inspect <file>` to see how a file is read (column names and shapes only, never values), then name your columns in `fairgive-sources.json` in the root:

```json
{ "files": { "exports/users.csv": { "columns": { "email": "Work E-mail" }, "date_order": "dmy" } } }
```

Where a layout says "checked", its column names were compared with the vendor's documentation on that date. The other layouts were written from knowledge of the export and were not checked. None was tested against a live account. If a real export does not match, the result says which columns were missing; please report it.
<!-- sources:end -->

## Install

Node 20 or newer. No other dependencies.

```bash
npx -y fairgive-grant-reports demo
npx -y fairgive-grant-reports mcp --root /path/to/your/files
```

Claude Desktop, Cursor and other MCP hosts:

```json
{
  "mcpServers": {
    "fairgive-grant-reports": {
      "command": "npx",
      "args": [
        "-y",
        "fairgive-grant-reports",
        "mcp",
        "--root",
        "/path/to/your/files"
      ]
    }
  }
}
```

Claude Code: `claude mcp add fairgive-grant-reports -- npx -y fairgive-grant-reports mcp --root .`, or install the `fairgive-grant-reports` plugin from this repository's marketplace.

## Modes and approvals

- **Review** (`--mode review`): reads and reports only.
- **Assist** (default): the policy above. A tool that asks returns an `approval_id`; a person approves it once with `fairgive-grant-reports approve <id> --as "Your Name"` (or on the local approvals page, `fairgive-grant-reports approvals`), and the same call is repeated.
- **Auto** (`--mode auto --auto <tool,...>`): opt-in per tool, with step caps and a kill switch (`fairgive-grant-reports kill`). Paying, sending, posting to a ledger or a live system and accepting a learned fact stay **one named click even in Auto**; an approval is tied to the sha256 of the reviewed draft, so a changed draft needs a new click.

## CLI

```bash
fairgive-grant-reports tools                 # every tool, its policy and arguments
fairgive-grant-reports sources               # the columns each input is read from
fairgive-grant-reports inspect <file>        # how a file would be read (names and shapes, never values)
fairgive-grant-reports call grant_reports_check '{"grants":"<grants>","schedule":"<schedule>"}'
fairgive-grant-reports eval                  # the private eval cases on the fictional fixtures
fairgive-grant-reports demo
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
