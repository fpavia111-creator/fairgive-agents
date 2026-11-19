# fairgive-indirect-costs

Rebuilds the indirect cost base (modified total direct costs) per grant from the ledger, leaving out equipment, participant support and subaward amounts over the cap, applies the rate in your settings and compares with the indirect charged.

Part of **Fairgive**, the nonprofit, foundation, church and association back-office agents by Mythos Machines. The software is free (MIT); the paid part is a fixed-price setup on your own files. Every result is computed from your files with plain arithmetic, on your computer; no AI model is called by the tools.

## What it checks

For each grant, rebuilds the indirect cost base: modified total direct costs (leaving out the excluded categories in the settings and each subaward above its first 50,000, or 25,000 for awards that started before 2024-10-01) or total direct costs when the grant says so. Applies the grant's rate, or the de minimis rate by award start (15% from 2024-10-01, 10% before), never above a funder cap, and compares with the indirect charged. Lists negotiated rates that ended before the costs.

| Finding | Example from the fictional demo data |
|---|---|
| `indirect_overcharged` | G-FED: 52000 of indirect charged; 28% of the modified total direct cost base 180000 is 50400. |
| `indirect_undercharged` | G-NEW: 5000 of indirect charged; 15% of the base 50000 allows 7500, so 2500 is not recovered. |
| `rate_expired` | G-FED: the rate ended on 2026-06-30 and costs run to 2026-09-30; check the rate that applies after it. |
| `subaward_over_cap` | G-FED: 30000 of subaward costs above the first 50000 of each subaward is left out of the base. |

Each item gets the most serious level of its findings: **flag** (act on it), **review** (data is missing or unclear; a person looks), **watch** (worth knowing) or **ok**. Every finding names the numbers it was worked out from.

## Settings

Put the ones you want to change in a JSON file and pass it as `settings`; anything left out uses the default. The result lists the settings it used under `settings_used`.

| Setting | Default | Meaning |
|---|---|---|
| `excluded_categories` | `["equipment","capital","rent","participant support","tuition remission","patient care","scholarships"]` | Cost categories left out of the modified total direct cost base |
| `indirect_categories` | `["indirect","f&a","overhead"]` | Categories that hold the indirect cost charged |
| `subaward_cap` | `null` | Part of each subaward counted in the base (default: 50000 for awards from 2024-10-01, 25000 before) |
| `de_minimis` | `null` | De minimis rate (default: 15 for awards from 2024-10-01, 10 before) |
| `tolerance` | `0.01` | Difference ignored (default 0.01) |

<!-- generated:start -->

## A demo run

`npx -y fairgive-indirect-costs demo` runs the agent on the fictional files in [`fixtures/`](fixtures) in a temporary folder. Captured output:

```text
Fairgive Indirect Costs demo (fictional nonprofit data), Auto mode on

▶ Run the check on the exported files
  status: executed  decision: allow
  3 grant(s): base 266,000.00, indirect allowed 61,500.00, charged 60,600.00; overcharged 1,600.00, not recovered 2,500.00.
    flag    G-FED                               subaward_over_cap, indirect_overcharged, rate_expired
    watch   G-NEW                               indirect_undercharged

▶ Explain G-FED
  status: executed  decision: allow
  G-FED: flag. G-FED: 30000 of subaward costs above the first 50000 of each subaward is left out of the base. G-FED: 52000 of indirect charged; 28% of the modified total direct cost base 180000 is 50400. G-FED: the rate ended on 2026-06-30 and costs run to 2026-09-30; check the rate that applies after it.

▶ Write the report (CSV worklist and HTML page)
  status: executed  decision: allow
  Indirect cost recovery written: 3 grant(s): base 266,000.00, indirect allowed 61,500.00, charged 60,600.00; overcharged 1,600.00, not recovered 2,500.00.

▶ The agent tries ledger_post itself
  status: blocked  decision: block
  reason: Never posts journal entries or changes the books; your accountant posts the reviewed entry.

Audit log: <demo folder>/.fairgive/audit.jsonl
```

## Tools

| Tool | What it does | Policy |
|---|---|---|
| `indirect_check` | For each grant, rebuilds the indirect cost base: modified total direct costs (leaving out the excluded categories in the settings and each subaward above its first 50,000, or 25,000 for awards that started before 2024… | runs |
| `indirect_explain` | Show one grant from indirect_check with every finding, the numbers behind it and the setting it was checked against. | runs |
| `indirect_write_report` | Write indirect-costs.csv (one row per item, with blank owner and decision columns) and indirect-costs.html into out_dir (default fairgive-out/indirect). | runs |
| `indirect_recall` | Search this agent's own memory of the customer's setup: accepted facts (in use) and facts waiting for a person. | runs |
| `indirect_learn` | Propose one fact about the customer's setup for this agent to remember. | runs |
| `indirect_accept_learning` | A named person accepts or rejects a fact waiting in this agent's memory. | one named click, even in Auto (`accept_learning`) |
| `indirect_retire_memory` | A named person stops an accepted fact from applying. | one named click, even in Auto (`accept_learning`) |
| `ledger_post` | Never posts journal entries or changes the books; your accountant posts the reviewed entry. | refused |
| `funder_portal_submit` | Never logs in to or submits anything on a funder, grants or payment-management portal. | refused |

Any tool name not in this table is blocked, including names a model invents. `refused` tools are listed so a model can see they exist and are refused.

## Columns it reads

Table inputs can be CSV, TSV, semicolon- or pipe-separated text, Excel `.xlsx`, JSON or JSONL. Columns are matched by the agent's own name, then by the English names below, then by their names in German, French, Spanish, Portuguese, Italian, Japanese, Chinese and Korean. Dates become `YYYY-MM-DD`; amounts are read with either decimal mark; weights, distances and dimensions are converted when the column says it holds kilograms, kilometres or centimetres. Every result lists under `sources` how each file was read.

### Grants and rates (`grants`)

| Column | Type | Also read as | For example, in other languages |
|---|---|---|---|
| `grant` (required) | text | Grant, Grant ID, Grant Code, Award, Project | Förderkennzeichen, N° de subvention, 助成番号, 资助编号 |
| `funder` | text | Funder, Agency, Grantor | - |
| `award_start` | date | Award Start, Start Date, Period Start | Eintrittsdatum, Date d'entrée, 入社日, 入职日期 |
| `rate_type` | text | Rate Type, Indirect Type, Rate Agreement | - |
| `rate` | number | Rate, Indirect Rate, F&A Rate, Rate % | - |
| `base` | text | Base, Rate Base, Indirect Base | - |
| `rate_end` | date | Rate End, Rate Expires, NICRA End, Agreement End | Austrittsdatum, Date de sortie, 退職日, 离职日期 |
| `cap` | number | Cap, Funder Cap, Indirect Cap %, Max Indirect % | - |

### Costs by grant (`expenses`)

| Column | Type | Also read as | For example, in other languages |
|---|---|---|---|
| `entry_id` | text | Entry ID, Journal, Num | - |
| `date` | date | Date, Posting Date | Datum, Date, 日付, 日期 |
| `grant` (required) | text | Grant, Grant ID, Grant Code, Project, Award | Förderkennzeichen, N° de subvention, 助成番号, 资助编号 |
| `category` | text | Category, Cost Category, Object Class, Account Name, Budget Line | Kategorie, Catégorie, 経費科目, 费用类别 |
| `amount` | amount | Amount, Debit, Cost | Betrag, Montant, 金額, 金额 |
| `subaward_id` | text | Subaward ID, Subaward, Subrecipient, Subcontract | - |
| `memo` | text | Memo, Description | Verwendungszweck, Libellé, 摘要, 摘要 |

### Files from other countries

A German export in Windows-1252 with semicolons, `1.234,56` and `03.11.2026`, or a Japanese one in Shift_JIS with `2026/11/03`, is read the same way as the English file. [`fixtures/intl/`](fixtures/intl) has both versions of the demo data, and the eval cases `intl-de-*` and `intl-ja-*` require the same results as the English case. A weight, distance or dimension column found by its translated name with no unit in it is read as metric and converted, and the result says so. Columns named differently? Run `npx fairgive-indirect-costs inspect <file>` (names and shapes only, never values) and name them in `fairgive-sources.json`:

```json
{ "files": { "exports/bills.csv": { "columns": { "invoice_number": "Beleg" }, "date_order": "dmy", "units": { "weight": "kg" } } } }
```

## Memory

fairgive-indirect-costs can remember facts about your setup so the next run does not have to be told again. `indirect_learn` only proposes a fact; it changes nothing until a named person accepts it with `indirect_accept_learning`, which is one click even in Auto. Facts live in one hash-chained file per agent under `.fairgive/memory/`; if the chain does not verify, no fact is used. Credentials, personal identifiers and text that reads like instructions to an AI are refused. Run without memory with `--no-memory`.

| Kind | What an accepted fact changes |
|---|---|
| `note` | nothing (shown by recall only) |

```bash
fairgive-indirect-costs memory list
fairgive-indirect-costs memory accept MEM-1a2b3c4d5e6f --as "Your Name"
fairgive-indirect-costs memory retire MEM-1a2b3c4d5e6f --as "Your Name" --reason "carrier renamed"
```

## Install

Node 20 or newer. No other dependencies.

```bash
npx -y fairgive-indirect-costs demo
npx -y fairgive-indirect-costs mcp --root /path/to/your/files
```

Claude Desktop, Cursor and other MCP hosts:

```json
{
  "mcpServers": {
    "fairgive-indirect-costs": {
      "command": "npx",
      "args": [
        "-y",
        "fairgive-indirect-costs",
        "mcp",
        "--root",
        "/path/to/your/files"
      ]
    }
  }
}
```

Claude Code: `claude mcp add fairgive-indirect-costs -- npx -y fairgive-indirect-costs mcp --root .`, or install the `fairgive-indirect-costs` plugin from this repository's marketplace.

## Modes and approvals

- **Review** (`--mode review`): reads and reports only.
- **Assist** (default): the policy above. A tool that asks returns an `approval_id`; a person approves it once with `fairgive-indirect-costs approve <id> --as "Your Name"` (or on the local approvals page, `fairgive-indirect-costs approvals`), and the same call is repeated.
- **Auto** (`--mode auto --auto <tool,...>`): opt-in per tool, with step caps and a kill switch (`fairgive-indirect-costs kill`). Paying, sending, posting to a ledger or a live system and accepting a learned fact stay **one named click even in Auto**; an approval is tied to the sha256 of the reviewed draft, so a changed draft needs a new click.

## CLI

```bash
fairgive-indirect-costs tools                 # every tool, its policy and arguments
fairgive-indirect-costs sources               # the columns each input is read from
fairgive-indirect-costs inspect <file>        # how a file would be read (names and shapes, never values)
fairgive-indirect-costs call indirect_check '{"grants":"<grants>","expenses":"<expenses>"}'
fairgive-indirect-costs eval                  # the private eval cases on the fictional fixtures
fairgive-indirect-costs demo
```

## Audit log and data

Every call is written to `.fairgive/audit.jsonl` under the root: hash-chained JSON lines, with arguments stored as a hash, signed with an Ed25519 key when you configure one. Everything runs on your machine on files you choose. No network calls, no telemetry, no credentials. The bundled fixtures are fictional.

<!-- generated:end -->

## Limits

- Reads only the files you give it. It does not log in to a donor CRM, giving platform, payment processor, bank, payroll or accounting system, and changes nothing in them.
- Thresholds, rates, dates and policies are settings in your own file, with working defaults; check them against your own policies, funder agreements and current rules before you rely on them.
- Not legal, tax, audit or accounting advice. A person decides what to record, send, file or pay.
- Column names for the named exports were written from knowledge of those systems and not checked against a live account; `inspect` shows how a file was read and `fairgive-sources.json` names columns by hand.
- The bundled fixtures are fictional. Version 0.1.0; nothing has been published yet.
