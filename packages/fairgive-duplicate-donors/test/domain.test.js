// Duplicate donors: e-mail, phone, name, address, similar names, households, shared e-mails.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { duplicates, addressKey, DEFAULTS } from '../src/index.js';

const c = (donor_id, donor, email = '', phone = '', address = '', postal = '') => ({ donor_id, donor, email, phone, address, postal });

test('the same e-mail with capitals and a +tag links two records', () => {
  const r = duplicates({ constituents: [c('A', 'Pat Example', 'pat@example.org'), c('B', 'P Example', 'Pat+news@Example.org')] }, DEFAULTS);
  assert.equal(r.items.length, 1); assert.equal(r.items[0].rules, 'same_email'); assert.equal(r.items[0].status, 'flag');
});

test('a phone in another format and a last-first name link two records', () => {
  const r = duplicates({ constituents: [c('A', 'Rowan Ellery', '', '555-201-0003'), c('B', 'Ellery, Rowan', '', '(555) 201-0003')] }, DEFAULTS);
  assert.equal(r.items[0].rules, 'same_name same_phone');
});

test('a misspelt name in the same postal code needs review', () => {
  const r = duplicates({ constituents: [c('A', 'Juniper Vance', '', '', '', '30303'), c('B', 'Juniper Vane', '', '', '', '30303')] }, DEFAULTS);
  assert.equal(r.items[0].findings[0].code, 'similar_name'); assert.equal(r.items[0].status, 'review');
  const apart = duplicates({ constituents: [c('A', 'Juniper Vance', '', '', '', '30303'), c('B', 'Juniper Vane', '', '', '', '99999')] }, DEFAULTS);
  assert.equal(apart.items.length, 0);
});

test('two people at one address are a household to watch, not a duplicate', () => {
  const r = duplicates({ constituents: [c('A', 'Tamsin Okafor', '', '', '77 Birch Lane', '30304'), c('B', 'Dayo Okafor', '', '', '77 Birch Ln.', '30304')] }, DEFAULTS);
  assert.equal(r.items[0].kind, 'household'); assert.equal(r.items[0].status, 'watch'); assert.equal(r.totals.extra_records, 0);
});

test('a shared office e-mail in the settings does not link records', () => {
  const r = duplicates({ constituents: [c('A', 'Corwin Achebe', 'office@example.org'), c('B', 'Liesel Marchetti', 'office@example.org')] }, { ...DEFAULTS, shared_emails: ['office@example.org'] });
  assert.equal(r.items.length, 0);
});

test('three records linked in a chain are one group with the oldest record to keep', () => {
  const r = duplicates({ constituents: [{ ...c('B', 'Pat Example', 'pat@example.org'), created: '2024-01-01' }, { ...c('A', 'Pat Example', '', '555-111-2222'), created: '2019-01-01' }, { ...c('C', 'Patricia Example', 'pat@example.org', '555-111-2222'), created: '2025-01-01' }] }, DEFAULTS);
  assert.equal(r.items.length, 1); assert.equal(r.items[0].record_count, 3); assert.equal(r.items[0].keep_suggestion, 'A');
});

test('street words are shortened before addresses are compared', () => {
  assert.equal(addressKey('12 Elm Street, Apt 4'), addressKey('12 Elm St. 4'));
});
