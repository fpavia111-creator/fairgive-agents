# Fixtures

Two fictional grants with line budgets, two shared cost pools split between them, and
seven expense lines. Planted: arts salaries over budget by 20% through the staff pool and
supplies over by 12% (line_over_budget), travel over by 5%, inside the 10% flexibility
(line_over_small), occupancy charged to both grants with no budget line (no_budget_line),
second-quarter staff cost allocated to the federal grant before its period starts
(outside_period), wine charged to the federal grant (unallowable_cost), a staff pool split
40/50 (allocation_under_100) and a rent pool split 60/50 (allocation_over_100).
`exports/` holds a Sage Intacct general ledger detail export (project as the grant,
account title as the budget line).
