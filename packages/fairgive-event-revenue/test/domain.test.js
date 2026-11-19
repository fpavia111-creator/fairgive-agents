// Event revenue: exchange up to value, contributions above it, unsplit types, ledger.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { eventSplit, DEFAULTS } from '../src/index.js';

const S = { ...DEFAULTS, exchange_accounts: ['4300'], contribution_accounts: ['4310'] };
const sale = (event, ticket_type, qty, price, extra_donation = 0) => ({ order_id: 'O', event, ticket_type, qty, price, extra_donation });
const type = (event, ticket_type, fmv) => ({ event, ticket_type, fmv });
const ev = (r, e) => r.items.find((i) => i.event === e);

test('a ticket is exchange up to its value and contribution above it; extra donations are contributions', () => {
  const r = eventSplit({ sales: [sale('G', 'Ind', 2, 250, 100)], ticket_types: [type('G', 'Ind', 120)] }, S);
  assert.equal(ev(r, 'G').exchange, 240); assert.equal(ev(r, 'G').contribution, 360);
});

test('a ticket sold under its value is all exchange and watched', () => {
  const r = eventSplit({ sales: [sale('G', 'Ind', 1, 100)], ticket_types: [type('G', 'Ind', 120)] }, S);
  assert.equal(ev(r, 'G').exchange, 100); assert.equal(ev(r, 'G').contribution, 0); assert.equal(ev(r, 'G').findings[0].code, 'ticket_below_fmv');
});

test('a ticket type with no value is left unsplit and needs review', () => {
  const r = eventSplit({ sales: [sale('G', 'Sponsor', 1, 5000)], ticket_types: [type('G', 'Sponsor', '')] }, S);
  assert.equal(ev(r, 'G').unsplit, 5000); assert.equal(ev(r, 'G').findings[0].code, 'no_fmv_for_ticket_type');
});

test('a zero-value sponsorship is all contribution', () => {
  const r = eventSplit({ sales: [sale('G', 'Hole', 4, 250)], ticket_types: [type('G', 'Hole', 0)] }, S);
  assert.equal(ev(r, 'G').contribution, 1000); assert.equal(ev(r, 'G').exchange, 0);
});

test('an event booked all as event revenue differs on both accounts', () => {
  const r = eventSplit({ sales: [sale('G', 'Four', 3, 800)], ticket_types: [type('G', 'Four', 600)], gl: [{ event: 'G', account: '4300', credit: 2400 }] }, S);
  assert.deepEqual(ev(r, 'G').findings.map((f) => f.code), ['gl_exchange_differs', 'gl_contribution_differs']);
});

test('an event with no ledger lines needs review when a ledger is given', () => {
  const r = eventSplit({ sales: [sale('G', 'Ind', 1, 50)], ticket_types: [type('G', 'Ind', 10)], gl: [{ event: 'OTHER', account: '4300', credit: 1 }] }, S);
  assert.equal(ev(r, 'G').findings[0].code, 'event_not_in_gl');
});

test('an event booked as the split says is ok', () => {
  const r = eventSplit({ sales: [sale('R', 'Runner', 40, 35)], ticket_types: [type('R', 'Runner', 25)], gl: [{ event: 'R', account: '4300', credit: 1000 }, { event: 'R', account: '4310', credit: 400 }] }, S);
  assert.equal(ev(r, 'R').status, 'ok');
});
