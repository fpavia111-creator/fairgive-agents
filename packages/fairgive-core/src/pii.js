// Personal-data masking. Every Fairgive tool result passes through here before it
// leaves the runtime, so the AI model that called the tool sees stable pseudonyms
// (P-3f2a9c1d) instead of donor, member, volunteer and employee names, and fixed
// placeholders instead of e-mail addresses, phone numbers, street addresses,
// taxpayer ids and bank account numbers. Files the tools write on this machine
// (worklists, letters, statements) keep the real values, because the people doing
// the work need them.
//
// What it is, honestly:
//   - It removes the direct identifiers below from what the model sees. It is not
//     anonymisation: gift amounts, dates, fund codes, record ids and postal codes
//     still reach the model, and together they can point at a person.
//   - It works from column and field names plus a few text patterns (SSN, e-mail,
//     phone). A name typed into a free-text column the agent does not know about can
//     get through.
//
// Pseudonyms are HMAC-SHA256 of the value with a per-installation key
// (<stateDir>/pii.key, created on first use, never returned), so the same person
// gets the same pseudonym in every result, and a pseudonym cannot be reversed
// without the key. Record ids (gift ids, constituent ids) are not masked: they are
// what a person and the model use to talk about a row.

import { createHmac, randomBytes } from 'node:crypto';
import { existsSync, readFileSync, writeFileSync, mkdirSync, chmodSync } from 'node:fs';
import { join, dirname } from 'node:path';

export const PII_MODES = Object.freeze(['mask', 'off']);
export const PII_KEY_FILE = 'pii.key';

/** Keys whose values describe the file's columns (field → header), never personal data. Free-text scrubbing still applies. */
const META_KEYS = new Set(['mapped', 'unmapped', 'missing', 'translated', 'columns', 'recognised_by', 'signature']);
const norm = (k) => String(k).toLowerCase().replace(/[^a-z0-9]/g, '');
const keys = (kind, list) => list.map((k) => [norm(k), kind]);

// Field names (any case or punctuation) → kind.
const KEY_KIND = new Map([
  ...keys('name', ['donor_name', 'donor', 'constituent_name', 'constituent', 'first_name', 'last_name', 'middle_name', 'full_name', 'giver', 'giver_name', 'member_name', 'employee', 'employee_name', 'volunteer', 'volunteer_name', 'honoree', 'honoree_name', 'tribute_name', 'notify_name', 'spouse', 'spouse_name', 'household_name', 'addressee', 'salutation', 'advisor', 'advisor_name', 'recipient_name', 'contact_name', 'person', 'person_name', 'submitter', 'payee_individual', 'officer', 'officer_name', 'contributor', 'contributor_name', 'other_name', 'pair_names']),
  ...keys('dob', ['dob', 'date_of_birth', 'birth_date', 'birthdate', 'birthday']),
  ...keys('tin', ['ssn', 'social_security_number', 'tin', 'taxpayer_id', 'tax_id', 'itin', 'ssn_last4']),
  ...keys('address', ['address', 'street', 'street_address', 'address1', 'address2', 'address_line_1', 'address_line_2', 'mailing_address', 'home_address', 'donor_address']),
  ...keys('phone', ['phone', 'phone_number', 'home_phone', 'mobile_phone', 'mobile', 'cell_phone', 'telephone', 'donor_phone']),
  ...keys('email', ['email', 'email_address', 'donor_email', 'member_email', 'personal_email', 'to_email']),
  ...keys('bank', ['bank_account', 'bank_account_number', 'routing_number', 'iban', 'account_holder']),
]);
const PREFIX = { name: 'P' };
const FIXED = { tin: '[TIN]', address: '[ADDRESS]', phone: '[PHONE]', email: '[EMAIL]', bank: '[BANK]' };
// Minimum length before a registered value is also searched for inside free text.
const MIN_TEXT = { name: 4, dob: 8, tin: 4, bank: 4 };

const TEXT_PATTERNS = [
  [/\b\d{3}-\d{2}-\d{4}\b/g, '[TIN]'],
  [/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/g, '[EMAIL]'],
  [/(?<![\d-])\(?\b\d{3}\)?[-. ]\d{3}[-. ]\d{4}\b/g, '[PHONE]'],
];

// A value that is already a pseudonym or placeholder is left alone (results pass the masker more than once).
const ALREADY = /^(P-[0-9a-f]{8}|\[(TIN|ADDRESS|PHONE|EMAIL|DOB|BANK)\]|\d{4} \(birth year\))$/;

/** Kind of a field name, or null. */
export const piiKindOf = (key) => KEY_KIND.get(norm(key)) || null;

/** Name variants a person's name appears as in text: as given, "First Last" and "Last, First". */
function nameVariants(raw) {
  const s = String(raw).trim(); if (!s) return [];
  const out = new Set([s]);
  const m = /^([^,]+),\s*(.+)$/.exec(s);
  if (m) out.add(`${m[2]} ${m[1]}`.trim());
  else { const p = s.split(/\s+/); if (p.length >= 2) out.add(`${p.at(-1)}, ${p.slice(0, -1).join(' ')}`); }
  return [...out];
}
const nameKey = (s) => String(s).toLowerCase().split(/[^a-z0-9À-￿]+/).filter(Boolean).sort().join(' ');

/** Read or create the per-installation pseudonym key. */
export function loadPiiKey(stateDir) {
  if (!stateDir) return randomBytes(32);
  const f = join(stateDir, PII_KEY_FILE);
  if (existsSync(f)) { const h = readFileSync(f, 'utf8').trim(); if (/^[0-9a-f]{64}$/.test(h)) return Buffer.from(h, 'hex'); throw new Error(`${PII_KEY_FILE} in the state folder is not a 64-character hex key; restore it from backup or delete it (pseudonyms will change)`); }
  mkdirSync(dirname(f), { recursive: true });
  const k = randomBytes(32);
  writeFileSync(f, k.toString('hex') + '\n', { mode: 0o600 });
  try { chmodSync(f, 0o600); } catch { /* Windows */ }
  return k;
}

export class PiiMasker {
  constructor({ mode = 'mask', key = null } = {}) {
    if (!PII_MODES.includes(mode)) throw new Error(`pii mode must be one of ${PII_MODES.join(', ')}`);
    this.mode = mode;
    this.key = key || randomBytes(32);
    this.reset();
  }

  /** Forget the values registered for the last call. */
  reset() { this.seen = new Map(); this.counts = {}; this.index = null; }

  get on() { return this.mode !== 'off'; }

  /** Stable pseudonym for a value of one kind. */
  token(kind, value) {
    const v = kind === 'name' ? nameKey(value) : String(value).trim().toUpperCase();
    return `${PREFIX[kind] || 'ID'}-${createHmac('sha256', this.key).update(`${kind}|${v}`).digest('hex').slice(0, 8)}`;
  }

  /** What the model sees for one value of one kind. */
  maskValue(kind, value) {
    if (value === null || value === undefined || value === '' || !this.on) return value;
    if (Array.isArray(value)) return value.map((v) => this.maskValue(kind, v));
    if (typeof value === 'object') return value;
    const s = String(value);
    if (ALREADY.test(s)) return value;
    this.counts[kind] = (this.counts[kind] || 0) + 1;
    if (FIXED[kind]) { this.register(kind, s); return FIXED[kind]; }
    if (kind === 'dob') { this.register(kind, s); const y = /(\d{4})/.exec(s); return y ? `${y[1]} (birth year)` : '[DOB]'; }
    this.register(kind, s);
    return this.token(kind, s);
  }

  /** Remember a raw value so it is also replaced where it appears inside other text. */
  register(kind, raw) {
    if (!this.on || raw === null || raw === undefined) return;
    const vals = kind === 'name' ? nameVariants(raw) : [String(raw).trim()];
    const rep = FIXED[kind] || (kind === 'dob' ? '[DOB]' : this.token(kind, raw));
    for (const v of vals) if (v.length >= (MIN_TEXT[kind] || 4) && !ALREADY.test(v) && !this.seen.has(v.toLowerCase())) { this.seen.set(v.toLowerCase(), { value: v, rep }); this.index = null; }
  }

  /** Register every personal-data field of plain records (done for every source file a tool reads). */
  registerRecords(rows, fieldKinds = {}) {
    if (!this.on || !Array.isArray(rows)) return;
    const cols = new Map();
    for (const r of rows.slice(0, 1)) if (r && typeof r === 'object') for (const k of Object.keys(r)) { const kind = fieldKinds[k] || piiKindOf(k); if (kind) cols.set(k, kind); }
    for (const [k, kind] of Object.entries(fieldKinds)) if (!cols.has(k)) cols.set(k, kind);
    if (!cols.size) return;
    for (const r of rows) if (r && typeof r === 'object') for (const [k, kind] of cols) if (r[k] !== null && r[k] !== undefined && r[k] !== '' && typeof r[k] !== 'object') this.register(kind, r[k]);
  }

  #buildIndex() {
    const idx = new Map();
    for (const [low, e] of this.seen) {
      const first = (/[a-z0-9À-￿]+/.exec(low) || [low])[0];
      if (!idx.has(first)) idx.set(first, []);
      idx.get(first).push({ low, ...e });
    }
    for (const list of idx.values()) list.sort((a, b) => b.low.length - a.low.length);
    this.index = idx;
  }

  /** Replace registered values and SSN/e-mail/phone patterns inside free text. */
  maskText(s) {
    if (!this.on || typeof s !== 'string' || !s) return s;
    let out = s;
    for (const [re, rep] of TEXT_PATTERNS) out = out.replace(re, () => { this.counts.pattern = (this.counts.pattern || 0) + 1; return rep; });
    if (!this.seen.size) return out;
    if (!this.index) this.#buildIndex();
    const low = out.toLowerCase(); let res = ''; let i = 0;
    const word = /[a-z0-9À-￿]+/g; let m;
    while ((m = word.exec(low))) {
      if (m.index < i) continue;
      const before = m.index === 0 || !/[a-z0-9À-￿]/.test(low[m.index - 1]);
      const cands = before ? this.index.get(m[0]) : null;
      if (cands) {
        const hit = cands.find((c) => low.startsWith(c.low, m.index) && !/[a-z0-9À-￿]/.test(low[m.index + c.low.length] || ' '));
        if (hit) { res += out.slice(i, m.index) + hit.rep; i = m.index + hit.low.length; word.lastIndex = i; this.counts.text = (this.counts.text || 0) + 1; continue; }
      }
    }
    return res + out.slice(i);
  }

  /** Masked deep copy of a tool result: personal-data fields first, then free text everywhere. */
  maskResult(value) {
    if (!this.on) return value;
    const byKey = (v, key, depth) => {
      if (depth > 40) return v;
      const kind = key === null ? null : piiKindOf(key);
      if (Array.isArray(v)) return v.map((x) => (kind && (typeof x !== 'object' || x === null) ? this.maskValue(kind, x) : byKey(x, kind ? null : key, depth + 1)));
      if (v && typeof v === 'object') { const o = {}; for (const [k, x] of Object.entries(v)) o[k] = META_KEYS.has(k) ? x : byKey(x, k, depth + 1); return o; }
      // Counts and flags under a personal-data key (by_check.donor: 3) are not identifiers.
      if (kind && (typeof v === 'boolean' || typeof v === 'number')) return v;
      return kind ? this.maskValue(kind, v) : v;
    };
    const keyed = byKey(value, null, 0);
    const text = (v, depth) => {
      if (depth > 40) return v;
      if (typeof v === 'string') return this.maskText(v);
      if (Array.isArray(v)) return v.map((x) => text(x, depth + 1));
      if (v && typeof v === 'object') { const o = {}; for (const [k, x] of Object.entries(v)) o[this.maskText(k)] = text(x, depth + 1); return o; }
      return v;
    };
    return text(keyed, 0);
  }

  /** Does a value the model passed back (a pseudonym or the raw value) name this raw value? */
  same(raw, given, kind = 'name') {
    const r = String(raw ?? '').trim(), g = String(given ?? '').trim();
    if (!r || !g) return false;
    if (r.toLowerCase() === g.toLowerCase()) return true;
    return this.on && !!PREFIX[kind] && g.toUpperCase().startsWith(`${PREFIX[kind]}-`) && this.token(kind, r).toLowerCase() === g.toLowerCase();
  }

  /** Summary of what was masked in the last result (counts by kind, no values). */
  report() { return { mode: this.mode, masked: { ...this.counts } }; }
}
