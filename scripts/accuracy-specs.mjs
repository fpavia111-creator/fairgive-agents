// What each agent's fictional fixtures plant on purpose, how the clean set is made from them,
// and the one-field mutation cases. Used by scripts/accuracy.mjs.
//
// planted:   { 'item key' | 'item key @ sub': [finding codes] } — everything the fixture notes
//            (fixtures/README.md) say the demo data contains. Any other finding on the demo data
//            is counted as unplanned.
// clean:     edits that remove each planted problem and nothing else, applied to the fixture CSVs
//            and written to fixtures/clean/. The clean set must give zero findings.
//              ['set', file, where, values]   change matching rows
//              ['drop', file, where]          remove matching rows
//              ['dropLast', file, where]      remove the last matching row (a duplicate)
//              ['add', file, row]             add a row
//            A value { replace: [pattern, text] } rewrites the old value with a regular expression.
// mutations: one edit (normally one field in one row) on the clean set, and the finding it must
//            raise: { id, op, expect: ['item key', 'code'] }.
// Item keys are the first field of each result item (masked names are matched by their token).
// The clean sets and mutations were written by the same author as the rules.

export const SPECS = {
  'fairgive-acknowledgements': {
    planted: { 'G-10': ['ack_missing'], 'G-2': ['ack_missing'], 'G-4': ['ack_amount_differs'], 'G-5': ['ack_no_statement'], 'G-6': ['ack_for_refunded_gift'], 'G-3': ['ack_late'], 'G-7': ['ack_due_soon'] },
    clean: [
      ['add', 'letters.csv', { gift_id: 'G-10', letter_date: '2026-08-20', amount: '5000.00', statement: 'yes' }],
      ['add', 'letters.csv', { gift_id: 'G-2', letter_date: '2026-09-05', amount: '1000.00', statement: 'yes' }],
      ['set', 'letters.csv', { gift_id: 'G-3' }, { letter_date: '2026-10-20' }],
      ['set', 'letters.csv', { gift_id: 'G-4' }, { amount: '300.00' }],
      ['set', 'letters.csv', { gift_id: 'G-5' }, { statement: 'yes' }],
      ['drop', 'letters.csv', { gift_id: 'G-6' }],
      ['add', 'letters.csv', { gift_id: 'G-7', letter_date: '2026-11-12', amount: '260.00', statement: 'yes' }],
    ],
    mutations: [
      { id: 'letter-late', op: ['set', 'letters.csv', { gift_id: 'G-1' }, { letter_date: '2026-11-15' }], expect: ['G-1', 'ack_late'] },
      { id: 'letter-amount', op: ['set', 'letters.csv', { gift_id: 'G-1' }, { amount: '50.00' }], expect: ['G-1', 'ack_amount_differs'] },
      { id: 'gift-refunded', op: ['set', 'gifts.csv', { gift_id: 'G-1' }, { status: 'Refunded' }], expect: ['G-1', 'ack_for_refunded_gift'] },
    ],
  },

  'fairgive-board-designated': {
    planted: { 'All designated funds': ['designations_over_unrestricted'], 'RES-CAP': ['spending_without_resolution'], 'RES-NEW': ['designation_without_resolution', 'spending_without_resolution', 'balance_below_zero'], 'RES-SCH': ['undesignation_not_recorded', 'reported_as_donor_restricted'] },
    clean: [
      ['set', 'resolutions.csv', { resolution_id: 'R-2b' }, { amount: '14000' }],
      ['add', 'gl.csv', { entry_id: 'TR-5', date: '2026-05-01', account: '3150', account_name: 'Board designated transfers', fund: 'RES-SCH', debit: '15000.00', credit: '', memo: 'Undesignation R-4' }],
      ['drop', 'gl.csv', { entry_id: 'JE-32' }],
      ['add', 'resolutions.csv', { resolution_id: 'R-5', date: '2026-01-10', fund: 'RES-NEW', action: 'Designate', amount: '20000' }],
      ['add', 'resolutions.csv', { resolution_id: 'R-6', date: '2026-06-01', fund: 'RES-NEW', action: 'Spend', amount: '20000' }],
      ['set', 'gl.csv', { entry_id: 'JE-33' }, { debit: '20000.00' }],
    ],
    mutations: [
      { id: 'spend-over', op: ['set', 'gl.csv', { entry_id: 'JE-31' }, { debit: '16000.00' }], expect: ['RES-CAP', 'spending_without_resolution'] },
      { id: 'reserve-spent', op: ['add', 'gl.csv', { entry_id: 'JE-40', date: '2026-07-01', account: '5500', account_name: 'Building repairs', fund: 'RES-OP', debit: '1000.00', credit: '', memo: 'Repair' }], expect: ['RES-OP', 'spending_without_resolution'] },
    ],
  },

  'fairgive-daf-grants': {
    planted: { 'D-3': ['daf_paid_benefit'], 'D-5': ['daf_ack_says_deductible'], 'D-2': ['daf_hard_credit_to_advisor'], 'D-4': ['daf_applied_to_pledge'], 'D-6': ['daf_sponsor_unknown', 'daf_hard_credit_to_advisor'] },
    clean: [
      ['set', 'gifts.csv', { gift_id: 'D-2' }, { donor_id: 'ORG-3', donor: 'Example Community Foundation' }],
      ['set', 'gifts.csv', { gift_id: 'D-3' }, { benefit_value: '' }],
      ['set', 'gifts.csv', { gift_id: 'D-4' }, { pledge_id: '' }],
      ['set', 'gifts.csv', { gift_id: 'D-5' }, { ack_says_deductible: 'no' }],
      ['set', 'gifts.csv', { gift_id: 'D-6' }, { donor_id: 'ORG-3', donor: 'Example Community Foundation', daf_sponsor: 'Example Community Foundation' }],
    ],
    mutations: [
      { id: 'advisor-credited', op: ['set', 'gifts.csv', { gift_id: 'D-1' }, { donor: 'Maple Hartwell' }], expect: ['D-1', 'daf_hard_credit_to_advisor'] },
      { id: 'tickets-paid', op: ['set', 'gifts.csv', { gift_id: 'D-1' }, { benefit_value: '100.00' }], expect: ['D-1', 'daf_paid_benefit'] },
      { id: 'pledge-paid', op: ['set', 'gifts.csv', { gift_id: 'D-1' }, { pledge_id: 'PL-1' }], expect: ['D-1', 'daf_applied_to_pledge'] },
    ],
  },

  'fairgive-duplicate-donors': {
    planted: { 'C-1': ['same_address', 'same_email', 'same_name'], 'C-3': ['same_name', 'same_phone'], 'C-5': ['same_address', 'similar_name'], 'C-7': ['same_address'] },
    clean: [
      ['drop', 'constituents.csv', { donor_id: 'C-2' }], ['drop', 'gifts.csv', { donor_id: 'C-2' }],
      ['drop', 'constituents.csv', { donor_id: 'C-4' }], ['drop', 'gifts.csv', { donor_id: 'C-4' }],
      ['drop', 'constituents.csv', { donor_id: 'C-6' }],
      ['set', 'constituents.csv', { donor_id: 'C-8' }, { address: '79 Birch Lane' }],
    ],
    mutations: [
      { id: 'email-capitals', op: ['set', 'constituents.csv', { donor_id: 'C-12' }, { email: 'Bram.Halloway@example.org' }], expect: ['C-11', 'same_email'] },
      { id: 'phone-format', op: ['set', 'constituents.csv', { donor_id: 'C-12' }, { phone: '(555) 201-0011' }], expect: ['C-11', 'same_phone'] },
      { id: 'address-abbreviated', op: ['set', 'constituents.csv', { donor_id: 'C-12' }, { address: '21 Maple Dr.', postal: '30307' }], expect: ['C-11', 'same_address'] },
    ],
  },

  'fairgive-endowment-draw': {
    planted: { 'ENDOW-B': ['underwater', 'draw_differs'], 'ENDOW-C': ['insufficient_history'] },
    clean: [
      ['set', 'values.csv', { fund: 'ENDOW-B', date: '2026-06-30' }, { market_value: '204000' }],
      ['set', 'draws.csv', { fund: 'ENDOW-B' }, { amount: '9427.50' }],
      ...[['2023-09-30', '46000'], ['2023-12-31', '47000'], ['2024-03-31', '48000'], ['2024-06-30', '49000'], ['2024-09-30', '50000'], ['2024-12-31', '51000']].map(([date, v]) => ['add', 'values.csv', { fund: 'ENDOW-C', date, market_value: v }]),
      ['add', 'draws.csv', { fund: 'ENDOW-C', fiscal_year: '2027', amount: '2317.50' }],
    ],
    mutations: [
      { id: 'draw-typo', op: ['set', 'draws.csv', { fund: 'ENDOW-A' }, { amount: '5545.00' }], expect: ['ENDOW-A', 'draw_differs'] },
      { id: 'value-drop', op: ['set', 'values.csv', { fund: 'ENDOW-A', date: '2026-06-30' }, { market_value: '95000' }], expect: ['ENDOW-A', 'underwater'] },
    ],
  },

  'fairgive-event-revenue': {
    planted: { 'GOLF-26': ['gl_exchange_differs', 'gl_contribution_differs'], 'GALA-26': ['no_fmv_for_ticket_type', 'ticket_below_fmv', 'event_not_in_gl'] },
    clean: [
      ['set', 'ticket_types.csv', { event: 'GALA-26', ticket_type: 'Sponsor' }, { fmv: '1200.00' }],
      ['set', 'sales.csv', { order_id: 'O-6' }, { price: '250.00' }],
      ['add', 'gl.csv', { entry_id: 'EV-4', date: '2026-04-30', account: '4300', account_name: 'Special events revenue', event: 'GALA-26', debit: '', credit: '2520.00', memo: 'Gala' }],
      ['add', 'gl.csv', { entry_id: 'EV-5', date: '2026-04-30', account: '4310', account_name: 'Special events contributions', event: 'GALA-26', debit: '', credit: '5830.00', memo: 'Gala' }],
      ['set', 'gl.csv', { entry_id: 'EV-1' }, { credit: '1800.00' }],
      ['add', 'gl.csv', { entry_id: 'EV-6', date: '2026-06-30', account: '4310', account_name: 'Special events contributions', event: 'GOLF-26', debit: '', credit: '1600.00', memo: 'Golf outing' }],
    ],
    mutations: [
      { id: 'fmv-up', op: ['set', 'ticket_types.csv', { event: 'RUN-26', ticket_type: 'Runner' }, { fmv: '40.00' }], expect: ['RUN-26', 'ticket_below_fmv'] },
      { id: 'gl-typo', op: ['set', 'gl.csv', { entry_id: 'EV-2' }, { credit: '900.00' }], expect: ['RUN-26', 'gl_exchange_differs'] },
    ],
  },

  'fairgive-expense-reports': {
    planted: { 'R-1': ['meals_over_per_diem'], 'R-2': ['mileage_over_rate', 'receipt_missing'], 'R-3': ['unallowable_on_grant', 'late_submission'], 'R-5': ['duplicate_claim'] },
    clean: [
      ['set', 'lines.csv', { report_id: 'R-1', memo: 'Dinner at conference' }, { amount: '15.00' }],
      ['set', 'lines.csv', { report_id: 'R-2', category: 'Mileage' }, { amount: '70.00' }],
      ['set', 'lines.csv', { report_id: 'R-2', category: 'Supplies' }, { receipt: 'yes' }],
      ['set', 'lines.csv', { report_id: 'R-3' }, { memo: 'Working dinner', submitted_date: '2026-08-10' }],
      ['drop', 'lines.csv', { report_id: 'R-5' }],
    ],
    mutations: [
      { id: 'beer-on-grant', op: ['set', 'lines.csv', { report_id: 'R-3' }, { memo: 'Dinner with beer' }], expect: ['R-3', 'unallowable_on_grant'] },
      { id: 'receipt-lost', op: ['set', 'lines.csv', { report_id: 'R-1', category: 'Lodging' }, { receipt: 'no' }], expect: ['R-1', 'receipt_missing'] },
      { id: 'sent-late', op: ['set', 'lines.csv', { report_id: 'R-4' }, { submitted_date: '2026-12-01' }], expect: ['R-4', 'late_submission'] },
    ],
  },

  'fairgive-form-990-data': {
    planted: { 'Schedule B C-2': ['scheduleb_missing_address'], 'Schedule I Example Arts Studio': ['schedulei_missing_ein'], 'Part VII Board Chair': ['officer_missing_hours'], 'Part VII Treasurer': ['officer_missing_comp'], 'Schedule B C-3': ['scheduleb_noncash_no_description'], 'Schedule M noncash total': ['schedule_m_likely'] },
    clean: [
      ['set', 'gifts.csv', { gift_id: 'G-3' }, { address: '4 Oak Avenue Springfield' }],
      ['set', 'gifts.csv', { gift_id: 'G-4' }, { description: '100 shares of a listed company' }],
      ['set', 'gifts.csv', { gift_id: 'G-6' }, { amount: '12000.00' }],
      ['set', 'officers.csv', { title: 'Board Chair' }, { hours_per_week: '2' }],
      ['set', 'officers.csv', { title: 'Treasurer' }, { compensation: '0' }],
      ['set', 'grants_paid.csv', { grantee: 'Example Arts Studio' }, { ein: '45-6789012' }],
    ],
    mutations: [
      { id: 'address-blank', op: ['set', 'gifts.csv', { gift_id: 'G-6' }, { address: '' }], expect: ['Schedule B C-5', 'scheduleb_missing_address'] },
      { id: 'ein-blank', op: ['set', 'grants_paid.csv', { grantee: 'Example Food Bank' }, { ein: '' }], expect: ['Schedule I Example Food Bank', 'schedulei_missing_ein'] },
      { id: 'hours-blank', op: ['set', 'officers.csv', { title: 'Executive Director' }, { hours_per_week: '' }], expect: ['Part VII Executive Director', 'officer_missing_hours'] },
    ],
  },

  'fairgive-functional-expenses': {
    planted: { '6100': ['allocation_not_100'], '7100': ['expense_without_function'], '7000': ['fundraising_coded_program'] },
    clean: [
      ['set', 'rules.csv', { key: '6100' }, { program: '70' }],
      ['set', 'gl.csv', { entry_id: 'L6' }, { program: 'Development' }],
      ['set', 'gl.csv', { entry_id: 'L7' }, { program: 'Admin' }],
    ],
    mutations: [
      { id: 'rule-typo', op: ['set', 'rules.csv', { key: '6000' }, { management: '25' }], expect: ['6000', 'allocation_not_100'] },
      { id: 'gala-in-program', op: ['set', 'gl.csv', { entry_id: 'L1' }, { memo: 'Gala invitations' }], expect: ['5000', 'fundraising_coded_program'] },
      { id: 'function-blank', op: ['set', 'gl.csv', { entry_id: 'L8' }, { function: '' }], expect: ['7200', 'expense_without_function'] },
    ],
  },

  'fairgive-fund-balances': {
    planted: { 'CAPITAL': ['wrong_net_asset_class'], 'ENDOW': ['perpetual_below_corpus'], 'Interfund': ['interfund_not_zero'], 'YOUTH': ['negative_restricted_balance'], 'MISC': ['no_restriction_code'], 'OLDFUND': ['unknown_fund'] },
    clean: [
      ['set', 'gl.csv', { entry_id: 'OB-4' }, { account: '3200', account_name: 'Net assets with donor restrictions' }],
      ['drop', 'gl.csv', { entry_id: 'JE-16' }],
      ['set', 'gl.csv', { entry_id: 'JE-19', account: '2900' }, { credit: '4000.00' }],
      ['set', 'gl.csv', { entry_id: 'JE-14' }, { debit: '7000.00' }],
      ['set', 'funds.csv', { fund: 'MISC' }, { restriction: 'Without donor restrictions' }],
      ['drop', 'gl.csv', { entry_id: 'JE-18' }],
    ],
    mutations: [
      { id: 'overspend', op: ['set', 'gl.csv', { entry_id: 'JE-14' }, { debit: '7500.00' }], expect: ['YOUTH', 'negative_restricted_balance'] },
      { id: 'interfund-typo', op: ['set', 'gl.csv', { entry_id: 'JE-19', account: '1900' }, { debit: '4100.00' }], expect: ['Interfund', 'interfund_not_zero'] },
      { id: 'endowment-loss', op: ['add', 'gl.csv', { entry_id: 'JE-20', date: '2026-09-30', account: '4900', account_name: 'Investment return', fund: 'ENDOW', debit: '500.00', credit: '', memo: 'Unrealized loss' }], expect: ['ENDOW', 'perpetual_below_corpus'] },
    ],
  },

  'fairgive-gift-coding': {
    planted: { 'CG-2': ['memo_names_restricted_purpose'], 'CG-6': ['memo_names_restricted_purpose', 'appeal_fund_mismatch'], 'CG-4': ['fund_inactive'], 'CG-5': ['unknown_fund'], 'CG-8': ['memo_says_restricted'], 'CG-7': ['appeal_fund_mismatch'] },
    clean: [
      ['set', 'gifts.csv', { gift_id: 'CG-2' }, { fund: 'SCHOL' }],
      ['set', 'gifts.csv', { gift_id: 'CG-6' }, { fund: 'CAPITAL' }],
      ['set', 'gifts.csv', { gift_id: 'CG-4' }, { fund: 'GEN' }],
      ['set', 'gifts.csv', { gift_id: 'CG-5' }, { fund: 'GEN' }],
      ['set', 'gifts.csv', { gift_id: 'CG-7' }, { fund: 'CAPITAL' }],
      ['set', 'gifts.csv', { gift_id: 'CG-8' }, { memo: '' }],
    ],
    mutations: [
      { id: 'note-names-youth', op: ['set', 'gifts.csv', { gift_id: 'CG-1' }, { memo: 'For the after-school program' }], expect: ['CG-1', 'memo_names_restricted_purpose'] },
      { id: 'fund-typo', op: ['set', 'gifts.csv', { gift_id: 'CG-1' }, { fund: 'GENN' }], expect: ['CG-1', 'unknown_fund'] },
      { id: 'capital-appeal', op: ['set', 'gifts.csv', { gift_id: 'CG-1' }, { appeal: 'CAP26' }], expect: ['CG-1', 'appeal_fund_mismatch'] },
    ],
  },

  'fairgive-gift-deposits': {
    planted: { 'Batch B-102': ['batch_total_mismatch'], 'Batch B-103': ['not_deposited'], 'Deposit D-4': ['deposit_not_in_crm'], 'Month 2026-10': ['gl_differs'], 'Gift G-1011': ['in_transit'] },
    clean: [
      ['set', 'deposits.csv', { deposit_id: 'D-2' }, { amount: '575.00' }],
      ['set', 'gl.csv', { entry_id: 'JE-102' }, { credit: '575.00' }],
      ['add', 'deposits.csv', { deposit_id: 'D-2b', date: '2026-10-16', amount: '1020.00', description: 'Deposit checks', batch: 'B-103' }],
      ['add', 'gl.csv', { entry_id: 'JE-107', date: '2026-10-16', account: '4010', account_name: 'Contributions', fund: 'CAPITAL', debit: '', credit: '1000.00', memo: 'Batch B-103' }],
      ['add', 'gl.csv', { entry_id: 'JE-107', date: '2026-10-16', account: '4010', account_name: 'Contributions', fund: 'GEN', debit: '', credit: '20.00', memo: 'Batch B-103' }],
      ['add', 'deposits.csv', { deposit_id: 'D-6', date: '2026-10-31', amount: '125.00', description: 'Card payout', batch: '' }],
      ['add', 'gl.csv', { entry_id: 'JE-108', date: '2026-10-31', account: '4010', account_name: 'Contributions', fund: 'GEN', debit: '', credit: '125.00', memo: 'Card payout' }],
      ['add', 'gifts.csv', { gift_id: 'G-1013', donor_id: 'C-111', donor: 'Ash Morrow', gift_date: '2026-10-25', amount: '250.00', fund: 'GEN', gift_type: 'Cash', method: 'Check', batch: '' }],
    ],
    mutations: [
      { id: 'deposit-short', op: ['set', 'deposits.csv', { deposit_id: 'D-1' }, { amount: '390.00' }], expect: ['Batch B-101', 'batch_total_mismatch'] },
      { id: 'gl-typo', op: ['set', 'gl.csv', { entry_id: 'JE-90' }, { credit: '210.00' }], expect: ['Month 2026-09', 'gl_differs'] },
      { id: 'stray-deposit', op: ['add', 'deposits.csv', { deposit_id: 'D-9', date: '2026-10-26', amount: '45.00', description: 'Mobile deposit', batch: '' }], expect: ['Deposit D-9', 'deposit_not_in_crm'] },
    ],
  },

  'fairgive-giving-statements': {
    planted: { 'GV-2': ['giver_missing_address'], 'GV-3': ['refund_excluded'], 'GV-6': ['gift_no_date'], 'Unattributed': ['unattributed'] },
    clean: [
      ['add', 'givers.csv', { giver_id: 'GV-2', giver: 'Rowan Ellery', address: '4 Oak Avenue Springfield' }],
      ['drop', 'contributions.csv', { gift_id: 'C-6' }],
      ['set', 'contributions.csv', { gift_id: 'C-11' }, { date: '2026-08-08' }],
      ['drop', 'contributions.csv', { gift_id: 'C-10' }],
    ],
    mutations: [
      { id: 'address-blank', op: ['set', 'givers.csv', { giver_id: 'GV-5' }, { address: '' }], expect: ['GV-5', 'giver_missing_address'] },
      { id: 'date-blank', op: ['set', 'contributions.csv', { gift_id: 'C-9' }, { date: '' }], expect: ['GV-5', 'gift_no_date'] },
      { id: 'refunded', op: ['set', 'contributions.csv', { gift_id: 'C-8' }, { status: 'Refunded' }], expect: ['GV-4', 'refund_excluded'] },
    ],
  },

  'fairgive-grant-budgets': {
    planted: { 'G-ARTS / Salaries': ['line_over_budget'], 'G-ARTS / Supplies': ['line_over_budget'], 'G-FED / Salaries': ['outside_period'], 'G-FED / Supplies': ['unallowable_cost'], 'Pool POOL-RENT': ['allocation_over_100'], 'G-ARTS / Occupancy': ['no_budget_line'], 'G-FED / Occupancy': ['no_budget_line'], 'G-ARTS / Travel': ['line_over_small'], 'Pool POOL-STAFF': ['allocation_under_100'] },
    clean: [
      ['set', 'allocations.csv', { pool: 'POOL-STAFF', grant: 'G-FED' }, { pct: '60' }],
      ['set', 'expenses.csv', { entry_id: 'E3' }, { date: '2026-07-31' }],
      ['set', 'budget.csv', { grant: 'G-ARTS', line: 'Salaries' }, { budget_amount: '36000' }],
      ['set', 'expenses.csv', { entry_id: 'E1' }, { amount: '5000.00' }],
      ['set', 'expenses.csv', { entry_id: 'E2' }, { amount: '2000.00' }],
      ['set', 'allocations.csv', { pool: 'POOL-RENT', grant: 'G-ARTS' }, { pct: '50' }],
      ['add', 'budget.csv', { grant: 'G-ARTS', line: 'Occupancy', budget_amount: '5000' }],
      ['add', 'budget.csv', { grant: 'G-FED', line: 'Occupancy', budget_amount: '5000' }],
      ['set', 'expenses.csv', { entry_id: 'E6' }, { memo: 'Classroom supplies' }],
    ],
    mutations: [
      { id: 'pool-typo', op: ['set', 'allocations.csv', { pool: 'POOL-RENT', grant: 'G-FED' }, { pct: '55' }], expect: ['Pool POOL-RENT', 'allocation_over_100'] },
      { id: 'travel-over', op: ['set', 'expenses.csv', { entry_id: 'E2' }, { amount: '2500.00' }], expect: ['G-ARTS / Travel', 'line_over_budget'] },
      { id: 'beer', op: ['set', 'expenses.csv', { entry_id: 'E7' }, { memo: 'Laptops and beer' }], expect: ['G-FED / Equipment', 'unallowable_cost'] },
      { id: 'before-award', op: ['set', 'expenses.csv', { entry_id: 'E7' }, { date: '2026-06-15' }], expect: ['G-FED / Equipment', 'outside_period'] },
    ],
  },

  'fairgive-grant-drawdowns': {
    planted: { 'G-CITY': ['draw_over_award', 'overdrawn'], 'G-FED': ['costs_outside_period', 'stale_unreimbursed', 'draw_available'], 'G-ADV': ['excess_cash'], 'G-STATE': ['pending_too_long'] },
    clean: [
      ['add', 'draws.csv', { draw_id: 'D9', grant: 'G-FED', date: '2026-10-20', amount: '14000.00', status: 'Received' }],
      ['add', 'draws.csv', { draw_id: 'D10', grant: 'G-FED', date: '2026-11-10', amount: '13000.00', status: 'Received' }],
      ['drop', 'expenses.csv', { entry_id: 'E-01' }],
      ['set', 'draws.csv', { draw_id: 'D5' }, { status: 'Received' }],
      ['add', 'expenses.csv', { entry_id: 'E-13', date: '2026-10-31', grant: 'G-ADV', amount: '6000.00', memo: 'October wages' }],
      ['set', 'draws.csv', { draw_id: 'D8' }, { amount: '6000.00' }],
    ],
    mutations: [
      { id: 'draw-over', op: ['set', 'draws.csv', { draw_id: 'D3' }, { amount: '11000.00' }], expect: ['G-STATE', 'overdrawn'] },
      { id: 'cost-early', op: ['set', 'expenses.csv', { entry_id: 'E-11' }, { date: '2025-12-15' }], expect: ['G-CITY', 'costs_outside_period'] },
      { id: 'still-requested', op: ['set', 'draws.csv', { draw_id: 'D4' }, { status: 'Requested' }], expect: ['G-STATE', 'pending_too_long'] },
    ],
  },

  'fairgive-grant-reports': {
    planted: { 'G-FED Financial report 2026-09-30': ['overdue'], 'G-FOUND Final report 2026-06-30': ['overdue'], 'G-NEW no schedule': ['no_schedule'], 'G-FED Equipment inventory 2026-12-01': ['due_soon'], 'G-FOUND Quarterly update 2026-03-31': ['late_submission'] },
    clean: [
      ['add', 'submissions.csv', { grant: 'G-FED', report: 'Financial report', period_end: '2026-09-30', submitted_date: '2026-10-25' }],
      ['add', 'submissions.csv', { grant: 'G-FOUND', report: 'Final report', period_end: '2026-06-30', submitted_date: '2026-09-15' }],
      ['add', 'schedule.csv', { grant: 'G-NEW', report: 'Final report', frequency: 'Final', due_days_after: '60', due_date: '' }],
      ['add', 'submissions.csv', { grant: 'G-FED', report: 'Equipment inventory', period_end: '2026-12-01', submitted_date: '2026-11-15' }],
      ['set', 'submissions.csv', { grant: 'G-FOUND', report: 'Quarterly update', period_end: '2026-03-31' }, { submitted_date: '2026-04-25' }],
    ],
    mutations: [
      { id: 'sent-late', op: ['set', 'submissions.csv', { grant: 'G-ARTS', report: 'Interim narrative' }, { submitted_date: '2026-08-15' }], expect: ['G-ARTS Interim narrative 2026-06-30', 'late_submission'] },
      { id: 'never-sent', op: ['drop', 'submissions.csv', { grant: 'G-FOUND', report: 'Quarterly update', period_end: '2026-06-30' }], expect: ['G-FOUND Quarterly update 2026-06-30', 'overdue'] },
    ],
  },

  'fairgive-in-kind-gifts': {
    planted: { 'K-2': ['no_value'], 'K-7': ['disposed_within_3_years'], 'K-3': ['no_valuation_method'], 'K-4': ['donor_value_only', 'over_appraisal_threshold'], 'K-6': ['services_recognition_check'], 'Month 2026-07': ['gl_differs'] },
    clean: [
      ['set', 'inkind.csv', { gift_id: 'K-2' }, { value: '1200.00', valuation_method: 'Used furniture price guide', valued_by: 'Organization' }],
      ['add', 'gl.csv', { entry_id: 'IK-6', date: '2026-03-31', account: '4500', account_name: 'In-kind contributions', debit: '', credit: '1200.00', memo: 'Furniture' }],
      ['set', 'inkind.csv', { gift_id: 'K-3' }, { valuation_method: 'Wholesale price of the same food' }],
      ['set', 'inkind.csv', { gift_id: 'K-4' }, { valuation_method: 'Qualified appraisal', valued_by: 'Appraiser', appraisal: 'yes' }],
      ['drop', 'inkind.csv', { gift_id: 'K-6' }],
      ['set', 'inkind.csv', { gift_id: 'K-7' }, { disposed_date: '', disposed_amount: '' }],
      ['set', 'gl.csv', { entry_id: 'IK-5' }, { credit: '6000.00' }],
    ],
    mutations: [
      { id: 'gl-typo', op: ['set', 'gl.csv', { entry_id: 'IK-1' }, { credit: '300.00' }], expect: ['Month 2026-02', 'gl_differs'] },
      { id: 'method-blank', op: ['set', 'inkind.csv', { gift_id: 'K-1' }, { valuation_method: '' }], expect: ['K-1', 'no_valuation_method'] },
      { id: 'sold-soon', op: ['set', 'inkind.csv', { gift_id: 'K-1' }, { disposed_date: '2026-09-01', disposed_amount: '1000.00' }], expect: ['K-1', 'disposed_within_3_years'] },
    ],
  },

  'fairgive-indirect-costs': {
    planted: { 'G-FED': ['subaward_over_cap', 'indirect_overcharged', 'rate_expired'], 'G-NEW': ['indirect_undercharged'] },
    clean: [
      ['set', 'expenses.csv', { entry_id: 'X-5' }, { amount: '50000.00' }],
      ['set', 'expenses.csv', { entry_id: 'X-6' }, { amount: '50400.00', date: '2026-06-30' }],
      ['set', 'expenses.csv', { entry_id: 'X-9' }, { amount: '7500.00' }],
    ],
    mutations: [
      { id: 'over-cap', op: ['set', 'expenses.csv', { entry_id: 'X-12' }, { amount: '3700.00' }], expect: ['G-FOUND', 'indirect_overcharged'] },
      { id: 'cost-after-rate', op: ['set', 'expenses.csv', { entry_id: 'X-1' }, { date: '2026-07-15' }], expect: ['G-FED', 'rate_expired'] },
      { id: 'subaward-up', op: ['set', 'expenses.csv', { entry_id: 'X-5' }, { amount: '60000.00' }], expect: ['G-FED', 'subaward_over_cap'] },
    ],
  },

  'fairgive-lapsed-donors': {
    planted: { 'C-2': ['lybunt'], 'C-3': ['lybunt'], 'C-4': ['sybunt'], 'C-5': ['sybunt'], 'C-7': ['downgraded'] },
    clean: [
      ['add', 'gifts.csv', { gift_id: 'G-14', donor_id: 'C-2', donor: 'Rowan Ellery', gift_date: '2026-10-01', amount: '1000.00' }],
      ['add', 'gifts.csv', { gift_id: 'G-15', donor_id: 'C-3', donor: 'Juniper Vance', gift_date: '2026-09-15', amount: '500.00' }],
      ['drop', 'gifts.csv', { gift_id: 'G-6' }],
      ['drop', 'gifts.csv', { gift_id: 'G-7' }],
      ['set', 'gifts.csv', { gift_id: 'G-10' }, { amount: '1000.00' }],
    ],
    mutations: [
      { id: 'no-gift-yet', op: ['drop', 'gifts.csv', { gift_id: 'G-2' }], expect: ['C-1', 'lybunt'] },
      { id: 'smaller-gift', op: ['set', 'gifts.csv', { gift_id: 'G-13' }, { amount: '50.00' }], expect: ['C-9', 'downgraded'] },
    ],
  },

  'fairgive-liquidity': {
    planted: { '1030': ['restricted_marked_available'], '1700': ['no_category'], '1210': ['board_designated_excluded'], '1310': ['receivable_beyond_year'] },
    clean: [
      ['set', 'balances.csv', { account: '1030' }, { available_within_year: 'no' }],
      ['set', 'balances.csv', { account: '1700' }, { category: 'Cash' }],
      ['drop', 'balances.csv', { account: '1210' }],
      ['drop', 'balances.csv', { account: '1310' }],
    ],
    mutations: [
      { id: 'restricted-yes', op: ['set', 'balances.csv', { account: '1020' }, { available_within_year: 'yes' }], expect: ['1020', 'restricted_marked_available'] },
      { id: 'category-blank', op: ['set', 'balances.csv', { account: '1300' }, { category: '' }], expect: ['1300', 'no_category'] },
    ],
  },

  'fairgive-matching-gifts': {
    planted: { 'M-3': ['match_deadline_soon'], 'M-4': ['match_deadline_passed'], 'M-2': ['match_not_claimed'], 'M-5': ['match_received_differs'], 'M-8': ['employer_not_in_list'], 'M-6': ['claim_pending_long'] },
    clean: [
      ['add', 'claims.csv', { gift_id: 'M-3', submitted_date: '2026-11-01', status: 'Submitted', received_amount: '', received_date: '' }],
      ['add', 'claims.csv', { gift_id: 'M-4', submitted_date: '2026-09-30', status: 'Paid', received_amount: '200.00', received_date: '2026-10-30' }],
      ['add', 'claims.csv', { gift_id: 'M-2', submitted_date: '2026-10-15', status: 'Submitted', received_amount: '', received_date: '' }],
      ['set', 'claims.csv', { gift_id: 'M-5' }, { received_amount: '2000.00' }],
      ['set', 'gifts.csv', { gift_id: 'M-8' }, { employer: '' }],
      ['set', 'claims.csv', { gift_id: 'M-6' }, { status: 'Paid', received_amount: '200.00', received_date: '2026-09-01' }],
    ],
    mutations: [
      { id: 'match-short', op: ['set', 'claims.csv', { gift_id: 'M-1' }, { received_amount: '400.00' }], expect: ['M-1', 'match_received_differs'] },
      { id: 'claim-lost', op: ['drop', 'claims.csv', { gift_id: 'M-1' }], expect: ['M-1', 'match_not_claimed'] },
      { id: 'employer-new', op: ['set', 'gifts.csv', { gift_id: 'M-9' }, { employer: 'Example Bakery' }], expect: ['M-9', 'employer_not_in_list'] },
    ],
  },

  'fairgive-memberships': {
    planted: { 'MB-4': ['paid_wrong_amount'], 'MB-5': ['paid_not_extended'], 'MB-3': ['lapsed'], 'MB-6': ['active_without_payment'], 'MB-2': ['expiring_soon'] },
    clean: [
      ['add', 'payments.csv', { member_id: 'MB-2', date: '2026-11-10', amount: '100.00' }],
      ['set', 'members.csv', { member_id: 'MB-2' }, { expires: '2027-12-05' }],
      ['add', 'payments.csv', { member_id: 'MB-3', date: '2026-08-25', amount: '50.00' }],
      ['set', 'members.csv', { member_id: 'MB-3' }, { expires: '2027-09-01' }],
      ['set', 'payments.csv', { member_id: 'MB-4' }, { amount: '500.00' }],
      ['set', 'members.csv', { member_id: 'MB-5' }, { expires: '2027-10-15' }],
      ['add', 'payments.csv', { member_id: 'MB-6', date: '2026-06-30', amount: '50.00' }],
    ],
    mutations: [
      { id: 'wrong-dues', op: ['set', 'payments.csv', { member_id: 'MB-1' }, { amount: '40.00' }], expect: ['MB-1', 'paid_wrong_amount'] },
      { id: 'no-payment', op: ['drop', 'payments.csv', { member_id: 'MB-1' }], expect: ['MB-1', 'active_without_payment'] },
      { id: 'expires-soon', op: ['set', 'members.csv', { member_id: 'MB-1' }, { expires: '2026-12-01' }], expect: ['MB-1', 'expiring_soon'] },
    ],
  },

  'fairgive-payroll-allocation': {
    planted: { 'E-2 2026-Q3': ['charge_differs_from_effort', 'charge_differs_from_effort'], 'E-3 2026-Q3': ['effort_over_100', 'charge_differs_from_effort', 'certification_missing'], 'E-5 2026-Q3': ['charge_differs_from_effort', 'charged_without_effort'], 'E-4 2026-Q3': ['payroll_not_allocated'] },
    clean: [
      ['set', 'charges.csv', { employee_id: 'E-2', code: 'G-FED' }, { amount: '3000.00' }],
      ['set', 'charges.csv', { employee_id: 'E-2', code: 'ADMIN' }, { amount: '9000.00' }],
      ['set', 'effort.csv', { employee_id: 'E-3', code: 'YOUTH' }, { pct: '40' }],
      ['add', 'certifications.csv', { employee_id: 'E-3', period: '2026-Q3', certified_date: '2026-10-15' }],
      ['set', 'charges.csv', { employee_id: 'E-4' }, { amount: '9000.00' }],
      ['drop', 'charges.csv', { employee_id: 'E-5', code: 'G-FED' }],
      ['set', 'charges.csv', { employee_id: 'E-5', code: 'ADMIN' }, { amount: '8000.00' }],
    ],
    mutations: [
      { id: 'effort-typo', op: ['set', 'effort.csv', { employee_id: 'E-1', code: 'G-FED' }, { pct: '70' }], expect: ['E-1 2026-Q3', 'effort_over_100'] },
      { id: 'certification-lost', op: ['drop', 'certifications.csv', { employee_id: 'E-1' }], expect: ['E-1 2026-Q3', 'certification_missing'] },
      { id: 'pay-not-charged', op: ['set', 'charges.csv', { employee_id: 'E-4' }, { amount: '8000.00' }], expect: ['E-4 2026-Q3', 'payroll_not_allocated'] },
    ],
  },

  'fairgive-pledges': {
    planted: { 'PL-2': ['overdue_90'], 'PL-4': ['overpaid'], 'PL-6': ['writeoff_no_approval'], 'PL-1': ['overdue_installment'], 'PL-3': ['paid_still_open'], 'PL-7': ['conditional_booked'], 'PL-5': ['multi_year_not_discounted'] },
    clean: [
      ['add', 'payments.csv', { pledge_id: 'PL-1', date: '2026-11-15', amount: '100.00' }],
      ['add', 'payments.csv', { pledge_id: 'PL-2', date: '2026-07-10', amount: '5000.00' }],
      ['set', 'pledges.csv', { pledge_id: 'PL-2' }, { status: 'Closed' }],
      ['set', 'pledges.csv', { pledge_id: 'PL-3' }, { status: 'Closed' }],
      ['set', 'payments.csv', { pledge_id: 'PL-4' }, { amount: '1000.00' }],
      ['set', 'pledges.csv', { pledge_id: 'PL-5' }, { total: '1000.00', installments: '1', frequency: 'Once', status: 'Closed' }],
      ['set', 'writeoffs.csv', { pledge_id: 'PL-6' }, { approved_by: 'Dana Rivers' }],
      ['drop', 'pledges.csv', { pledge_id: 'PL-7' }],
    ],
    mutations: [
      { id: 'missed-month', op: ['drop', 'payments.csv', { pledge_id: 'PL-1', date: '2026-10-15' }], expect: ['PL-1', 'overdue_installment'] },
      { id: 'overpay', op: ['set', 'payments.csv', { pledge_id: 'PL-4' }, { amount: '1050.00' }], expect: ['PL-4', 'overpaid'] },
      { id: 'no-approver', op: ['set', 'writeoffs.csv', { pledge_id: 'PL-6' }, { approved_by: '' }], expect: ['PL-6', 'writeoff_no_approval'] },
    ],
  },

  'fairgive-processor-fees': {
    planted: { 'T-2': ['fee_over_rate'], 'T-3': ['gift_booked_net'], 'Payout PO-2': ['payout_not_in_bank'], 'T-5': ['not_in_crm'], 'T-7': ['gift_amount_differs'], 'T-6': ['fee_on_refund'] },
    clean: [
      ['set', 'transactions.csv', { txn_id: 'T-2' }, { fee: '4.70', net: '195.30' }],
      ['set', 'deposits.csv', { deposit_id: 'D-1' }, { amount: '443.49' }],
      ['set', 'gifts.csv', { gift_id: 'G-3' }, { amount: '50.00' }],
      ['add', 'gifts.csv', { gift_id: 'G-5', donor: 'Corwin Achebe', gift_date: '2026-10-06', amount: '250.00', method: 'PayPal' }],
      ['set', 'transactions.csv', { txn_id: 'T-5' }, { gift_id: 'G-5' }],
      ['set', 'gifts.csv', { gift_id: 'G-7' }, { amount: '30.00' }],
      ['set', 'transactions.csv', { txn_id: 'T-6' }, { refunded: '0.00' }],
      ['add', 'deposits.csv', { deposit_id: 'D-2', date: '2026-10-13', amount: '342.05', description: 'PAYPAL TRANSFER' }],
    ],
    mutations: [
      { id: 'fee-high', op: ['set', 'transactions.csv', { txn_id: 'T-1' }, { fee: '3.50' }], expect: ['T-1', 'fee_over_rate'] },
      { id: 'booked-net', op: ['set', 'gifts.csv', { gift_id: 'G-1' }, { amount: '97.50' }], expect: ['T-1', 'gift_booked_net'] },
      { id: 'payout-short', op: ['set', 'deposits.csv', { deposit_id: 'D-3' }, { amount: '30.00' }], expect: ['Payout PO-3', 'payout_not_in_bank'] },
    ],
  },

  'fairgive-quid-pro-quo': {
    planted: { 'Q-2': ['disclosure_missing', 'deductible_wrong'], 'Q-4': ['fmv_missing'], 'Q-6': ['benefit_over_payment'], 'Q-3': ['insubstantial_benefit'] },
    clean: [
      ['set', 'payments.csv', { gift_id: 'Q-2' }, { receipt_deductible: '90.00', disclosure: 'yes' }],
      ['set', 'payments.csv', { gift_id: 'Q-3' }, { benefit: '', benefit_value: '' }],
      ['set', 'payments.csv', { gift_id: 'Q-4' }, { benefit_value: '150.00', receipt_deductible: '350.00', disclosure: 'yes' }],
      ['set', 'payments.csv', { gift_id: 'Q-6' }, { benefit_value: '200.00' }],
    ],
    mutations: [
      { id: 'no-disclosure', op: ['set', 'payments.csv', { gift_id: 'Q-1' }, { disclosure: 'no' }], expect: ['Q-1', 'disclosure_missing'] },
      { id: 'deductible-full', op: ['set', 'payments.csv', { gift_id: 'Q-8' }, { receipt_deductible: '300.00' }], expect: ['Q-8', 'deductible_wrong'] },
      { id: 'value-blank', op: ['set', 'payments.csv', { gift_id: 'Q-1' }, { benefit_value: '' }], expect: ['Q-1', 'fmv_missing'] },
    ],
  },

  'fairgive-recurring-gifts': {
    planted: { 'P-3': ['repeated_failures'], 'P-5': ['charge_after_cancel'], 'P-4': ['missed_charge'], 'P-8': ['card_expired'], 'P-2': ['card_expiring'], 'P-6': ['amount_changed'] },
    clean: [
      ['set', 'plans.csv', { plan_id: 'P-2' }, { card_expiry: '11/2028' }],
      ['set', 'plans.csv', { plan_id: 'P-8' }, { card_expiry: '08/2028' }],
      ['set', 'charges.csv', { plan_id: 'P-3', status: 'Failed' }, { status: 'Succeeded' }],
      ...[['T-403', '2026-09-15'], ['T-404', '2026-10-15'], ['T-405', '2026-11-15']].map(([txn_id, date]) => ['add', 'charges.csv', { txn_id, plan_id: 'P-4', date, amount: '100.00', status: 'Succeeded' }]),
      ['drop', 'charges.csv', { txn_id: 'T-503' }],
      ['set', 'charges.csv', { txn_id: 'T-603' }, { amount: '150.00' }],
    ],
    mutations: [
      { id: 'card-soon', op: ['set', 'plans.csv', { plan_id: 'P-1' }, { card_expiry: '12/2026' }], expect: ['P-1', 'card_expiring'] },
      { id: 'two-failures', op: ['set', 'charges.csv', { plan_id: 'P-8' }, { status: 'Failed' }], expect: ['P-8', 'repeated_failures'] },
      { id: 'amount-up', op: ['set', 'charges.csv', { txn_id: 'T-111' }, { amount: '30.00' }], expect: ['P-1', 'amount_changed'] },
    ],
  },

  'fairgive-refunds-chargebacks': {
    planted: { 'RF-2': ['refund_not_reversed_in_crm', 'ack_sent_for_refunded'], 'RF-3': ['refund_over_gift'], 'RF-4': ['dispute_evidence_due'], 'RF-5': ['partial_refund_not_adjusted'], 'RF-6': ['refund_no_gift'] },
    clean: [
      ['set', 'gifts.csv', { gift_id: 'G-2' }, { status: 'Refunded', ack_date: '' }],
      ['set', 'events.csv', { txn_id: 'RF-3' }, { amount: '50.00' }],
      ['set', 'gifts.csv', { gift_id: 'G-3' }, { status: 'Refunded' }],
      ['set', 'events.csv', { txn_id: 'RF-4' }, { evidence_due: '2026-12-15' }],
      ['set', 'gifts.csv', { gift_id: 'G-5' }, { amount: '80.00', status: 'Partially refunded' }],
      ['set', 'events.csv', { txn_id: 'RF-6' }, { gift_id: 'G-8' }],
      ['add', 'gifts.csv', { gift_id: 'G-8', donor: 'Odessa Quill', gift_date: '2026-10-30', amount: '40.00', status: 'Refunded', ack_date: '' }],
    ],
    mutations: [
      { id: 'not-reversed', op: ['set', 'gifts.csv', { gift_id: 'G-6' }, { status: 'Received' }], expect: ['RF-1', 'refund_not_reversed_in_crm'] },
      { id: 'evidence-soon', op: ['set', 'events.csv', { txn_id: 'RF-4' }, { evidence_due: '2026-11-20' }], expect: ['RF-4', 'dispute_evidence_due'] },
      { id: 'refund-too-big', op: ['set', 'events.csv', { txn_id: 'RF-5' }, { amount: '120.00' }], expect: ['RF-5', 'refund_over_gift'] },
    ],
  },

  'fairgive-restriction-releases': {
    planted: { 'MUSIC': ['release_over_spending', 'release_over_balance'], 'SCHOL-2026': ['time_restriction_ended'], 'SCHOL-2027': ['release_before_time'], 'YOUTH': ['release_due'] },
    clean: [
      ['set', 'gl.csv', { entry_id: 'JE-23', fund: 'YOUTH' }, { debit: '5000.00' }],
      ['set', 'gl.csv', { entry_id: 'JE-23', fund: 'GEN' }, { credit: '5000.00' }],
      ['set', 'gl.csv', { entry_id: 'JE-28' }, { debit: '1000.00' }],
      ['add', 'gl.csv', { entry_id: 'JE-30', date: '2026-09-01', account: '3900', account_name: 'Net assets released from restriction', fund: 'SCHOL-2026', debit: '10000.00', credit: '', memo: 'Release on the date' }],
      ['drop', 'gl.csv', { entry_id: 'JE-29' }],
    ],
    mutations: [
      { id: 'over-release', op: ['set', 'gl.csv', { entry_id: 'JE-25' }, { debit: '4500.00' }], expect: ['CAPITAL', 'release_over_spending'] },
      { id: 'spent-unreleased', op: ['add', 'gl.csv', { entry_id: 'JE-31', date: '2026-09-30', account: '5300', account_name: 'Building costs', fund: 'CAPITAL', debit: '1000.00', credit: '', memo: 'Contractor' }], expect: ['CAPITAL', 'release_due'] },
    ],
  },

  'fairgive-single-audit': {
    planted: { 'Total federal spending': ['threshold_met'], 'ALN (no ALN)': ['missing_aln'], 'ALN 93.568': ['pass_through_missing_id'] },
    clean: [
      ['drop', 'expenses.csv', { entry_id: 'E-2' }],
      ['drop', 'expenses.csv', { entry_id: 'E-3' }],
      ['set', 'grants.csv', { grant: 'G-HHS' }, { pass_through_id: 'PT-HHS-2026-03' }],
      ['set', 'grants.csv', { grant: 'G-NOALN' }, { aln: '17.270' }],
    ],
    mutations: [
      { id: 'aln-blank', op: ['set', 'grants.csv', { grant: 'G-USDA' }, { aln: '' }], expect: ['ALN (no ALN)', 'missing_aln'] },
      { id: 'pt-id-blank', op: ['set', 'grants.csv', { grant: 'G-ED2' }, { pass_through_id: '' }], expect: ['ALN 84.287', 'pass_through_missing_id'] },
      { id: 'over-threshold', op: ['set', 'expenses.csv', { entry_id: 'E-6' }, { amount: '520000.00' }], expect: ['Total federal spending', 'threshold_met'] },
    ],
  },

  'fairgive-vendor-tax-forms': {
    planted: { 'V-2': ['needs_1099_no_w9', 'tin_missing', 'address_missing'], 'V-5': ['tin_malformed'], 'V-3': ['attorney_reportable'], 'V-4': ['corporation_exempt'] },
    clean: [
      ['set', 'vendors.csv', { vendor_id: 'V-2' }, { tin: '345-67-8901', w9_on_file: 'yes', address: '7 Lake Road Springfield' }],
      ['set', 'vendors.csv', { vendor_id: 'V-5' }, { tin: '12-3456780' }],
      ['drop', 'vendors.csv', { vendor_id: 'V-3' }], ['drop', 'payments.csv', { vendor_id: 'V-3' }],
      ['drop', 'vendors.csv', { vendor_id: 'V-4' }], ['drop', 'payments.csv', { vendor_id: 'V-4' }],
    ],
    mutations: [
      { id: 'w9-missing', op: ['set', 'vendors.csv', { vendor_id: 'V-1' }, { w9_on_file: 'no' }], expect: ['V-1', 'needs_1099_no_w9'] },
      { id: 'tin-typo', op: ['set', 'vendors.csv', { vendor_id: 'V-7' }, { tin: '45-678901' }], expect: ['V-7', 'tin_malformed'] },
      { id: 'address-blank', op: ['set', 'vendors.csv', { vendor_id: 'V-5' }, { address: '' }], expect: ['V-5', 'address_missing'] },
    ],
  },

  'fairgive-volunteer-hours': {
    planted: { 'V-2': ['background_check_expired'], 'V-3': ['background_check_missing', 'waiver_missing'], 'V-4': ['shift_over_max', 'duplicate_entry', 'future_date'], 'V-5': ['missing_program', 'skilled_service_candidate'] },
    clean: [
      ['set', 'volunteers.csv', { volunteer_id: 'V-2' }, { background_check_date: '2025-05-01' }],
      ['set', 'volunteers.csv', { volunteer_id: 'V-3' }, { background_check_date: '2025-03-01', waiver: 'yes' }],
      ['set', 'hours.csv', { entry_id: 'H-5' }, { hours: '6' }],
      ['drop', 'hours.csv', { entry_id: 'H-7' }],
      ['set', 'hours.csv', { entry_id: 'H-8' }, { date: '2026-11-01' }],
      ['set', 'hours.csv', { entry_id: 'H-9' }, { program: 'Financial literacy', skilled: 'no' }],
    ],
    mutations: [
      { id: 'long-day', op: ['set', 'hours.csv', { entry_id: 'H-1' }, { hours: '13' }], expect: ['V-1', 'shift_over_max'] },
      { id: 'check-old', op: ['set', 'volunteers.csv', { volunteer_id: 'V-1' }, { background_check_date: '2023-01-10' }], expect: ['V-1', 'background_check_expired'] },
      { id: 'double-entry', op: ['add', 'hours.csv', { entry_id: 'H-10', volunteer_id: 'V-1', volunteer: 'Maple Hartwell', date: '2026-10-08', hours: '4', program: 'Youth mentoring', role: 'Youth mentor', skilled: 'no' }], expect: ['V-1', 'duplicate_entry'] },
    ],
  },
};
