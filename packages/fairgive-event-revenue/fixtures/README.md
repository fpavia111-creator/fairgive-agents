# Fixtures

Three fictional events: ticket sales, the fair market value of each ticket type, and the
ledger lines. Names are made up. Planted: a gala sponsor ticket with no fair market value
(no_fmv_for_ticket_type, its 5,000 left unsplit), a gala ticket sold under its value
(ticket_below_fmv), a gala with no ledger lines (event_not_in_gl), and a golf outing booked
entirely as event revenue when 1,600 of it is contribution (gl_exchange_differs,
gl_contribution_differs). The 5K run is booked as the split says.
`exports/` holds a Givebutter ticket export.
