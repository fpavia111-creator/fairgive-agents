import { readFileSync } from 'node:fs';
import { giveAgent, GL_FIELDS, GL_PROFILES, sourceOf, REFUSE, money } from 'fairgive-core';
import { eventSplit, DEFAULTS } from './logic.js';

const pkg = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'));
const files = {
  sales: { type: 'string', description: 'Ticket and registration sales under --root (Givebutter, Classy, Eventbrite-style or CRM export): order id, event, ticket type, quantity, price per ticket, extra donation' },
  ticket_types: { type: 'string', description: 'Fair market value of what each ticket type gives the buyer under --root: event, ticket type, value per ticket' },
  gl: { type: 'string', description: 'Optional ledger lines under --root with an event column, to compare event revenue and contributions' },
};
const SALE = { order_id: { aliases: ['Order ID', 'Transaction ID', 'Registration ID', 'Order Number'], required: true }, event: { aliases: ['Event', 'Event Name', 'Event Code', 'Campaign Code', 'Campaign'], translate: 'event_name' }, ticket_type: { aliases: ['Ticket Type', 'Ticket', 'Ticket Level', 'Registration Type'] }, qty: { aliases: ['Qty', 'Quantity', 'Tickets', 'Number of Tickets'], type: 'number' }, price: { aliases: ['Price', 'Ticket Price', 'Unit Price', 'Price Per Ticket'], type: 'money', translate: 'unit_price' }, extra_donation: { aliases: ['Extra Donation', 'Additional Donation', 'Donation', 'Add-on Donation'], type: 'money' }, date: { aliases: ['Date', 'Order Date', 'Transaction Date'], type: 'date' }, buyer: { aliases: ['Buyer', 'Name', 'Purchaser', 'Attendee'], personal: true } };
const TYPE = { event: { aliases: ['Event', 'Event Name', 'Event Code'], required: true, translate: 'event_name' }, ticket_type: { aliases: ['Ticket Type', 'Ticket', 'Ticket Level'] }, fmv: { aliases: ['FMV', 'Fair Market Value', 'Value', 'Benefit Value', 'Value Per Ticket'], type: 'money' } };
const GL = { ...GL_FIELDS, event: { aliases: ['Event', 'Event Code', 'Class', 'Campaign', 'Project'], translate: 'event_name' } };
export const DEMO = { title: 'Fairgive Event Revenue', files: { sales: 'sales.csv', ticket_types: 'ticket_types.csv', gl: 'gl.csv', settings: 'settings.json' }, explain: { arg: 'event', value: 'GOLF-26' } };

export const manifest = giveAgent({
  pkg, prefix: 'events',
  description: pkg.description.replace(/^[^:]+:\s*/, ''),
  check: { title: 'Event revenue split', description: 'Splits every ticket into the exchange part (up to the fair market value of what the buyer receives) and the contribution part, adds extra donations to contributions, and totals both by event. Lists ticket types with no fair market value (left unsplit), tickets sold under their value, events with no ledger lines, and events where the ledger\'s exchange or contribution accounts differ from the split.' },
  args: files, required: ['sales', 'ticket_types'],
  sources: { sales: { label: 'Ticket sales', args: ['sales'], fields: SALE }, ticket_types: { label: 'Ticket values', args: ['ticket_types'], fields: TYPE }, gl: sourceOf('Ledger lines', ['gl'], GL, ['entry_id', 'date', 'account', 'account_name', 'event', 'debit', 'credit', 'amount', 'memo'], GL_PROFILES) },
  settings: { defaults: DEFAULTS, schema: { type: 'object', additionalProperties: false, properties: {
    exchange_accounts: { type: 'array', items: { type: 'string' }, description: 'Ledger accounts (or first digits) for special event (exchange) revenue' },
    contribution_accounts: { type: 'array', items: { type: 'string' }, description: 'Ledger accounts (or first digits) for event contributions' },
    tolerance: { type: 'number', minimum: 0, maximum: 100, description: 'Difference ignored (default 0.01)' },
  } } },
  run: ({ rows, settings }) => eventSplit(rows, settings),
  key: { arg: 'event', field: 'event', label: 'event' },
  summary: (o) => `${o.totals.events} event(s): gross ${money(o.totals.gross)}, exchange ${money(o.totals.exchange)}, contribution ${money(o.totals.contribution)}, not split for lack of a value ${money(o.totals.unsplit)}.`,
  report: {
    title: 'Event revenue split', base: 'event-revenue',
    row: (i) => ({ event: i.event ?? '', tickets: i.tickets ?? '', gross: i.gross ?? '', exchange: i.exchange ?? '', contribution: i.contribution ?? '', unsplit: i.unsplit ?? '', gl_exchange: i.gl_exchange ?? '', gl_contribution: i.gl_contribution ?? '' }),
    htmlColumns: ['event', 'gross', 'exchange', 'contribution', 'unsplit', 'gl_exchange', 'gl_contribution'],
    sections: (o) => [{ title: 'By event', rows: o.items.map((i) => ({ event: i.event, exchange: i.exchange, contribution: i.contribution })), columns: ['event', 'exchange', 'contribution'] }],
  },
  refused: [REFUSE.ledger],
  memory: null,
});
