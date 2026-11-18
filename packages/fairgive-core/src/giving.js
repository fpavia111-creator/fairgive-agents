// Nonprofit back-office helpers shared by the Fairgive agents. Pure functions, no I/O.
//
// Nothing here is a rule of law or an accounting standard. Thresholds, rates and
// periods live in each agent's settings file with a default that a person checks;
// every agent says which defaults it used. These helpers only read and compare.
import { readNumber } from './intl.js';
import { normalizeName, jaroWinkler } from './text.js';

// ------------------------------------------------------------------ numbers ----

export const round2 = (n) => Math.round((Number(n) + Number.EPSILON) * 100) / 100;
/** A number from a cell, or null. "$1,200.00", "(45)", "1.234,56" all read. */
export const num = (v) => { if (v === null || v === undefined || v === '') return null; if (typeof v === 'number') return Number.isFinite(v) ? v : null; const n = readNumber(v); return Number.isFinite(n) ? n : null; };
/** num() with 0 for blanks. */
export const amt = (v) => num(v) ?? 0;
export const sum = (xs) => round2(xs.reduce((s, x) => s + (Number(x) || 0), 0));
export const str = (v) => String(v ?? '').trim();
export const low = (v) => str(v).toLowerCase();
/** Two amounts equal within a tolerance (default half a cent). */
export const near = (a, b, tol = 0.005) => Math.abs(Number(a) - Number(b)) <= tol + 1e-9;
/** A percentage with two decimals; 0 when the base is 0 (never NaN or Infinity). */
export const pct = (part, whole) => (Number(whole) ? round2((Number(part) / Number(whole)) * 100) : 0);
/** "$1,234.56" for letters and statements people read. Negative amounts as "-$12.00". */
export function money(n, symbol = '$') {
  const v = round2(Number(n) || 0); const s = Math.abs(v).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return `${v < 0 ? '-' : ''}${symbol}${s}`;
}

// -------------------------------------------------------------------- dates ----

const DAY = 86400000;
const toMs = (v) => { const s = str(v); if (!s) return NaN; const iso = /^\d{4}-\d{2}-\d{2}$/.test(s) ? `${s}T00:00:00Z` : /[zZ]|[+-]\d{2}:?\d{2}$/.test(s) ? s : `${s.replace(' ', 'T')}Z`; return Date.parse(iso); };
export const isoDate = (v) => { const t = toMs(v); return Number.isFinite(t) ? new Date(t).toISOString().slice(0, 10) : null; };
export function daysBetween(a, b) { const x = toMs(a), y = toMs(b); return Number.isFinite(x) && Number.isFinite(y) ? Math.round((y - x) / DAY) : null; }
export function addDays(d, n) { const t = toMs(d); return Number.isFinite(t) ? new Date(t + n * DAY).toISOString().slice(0, 10) : null; }
export const inWindow = (d, from, to) => { const x = isoDate(d); return !!x && (!from || x >= isoDate(from)) && (!to || x <= isoDate(to)); };
/** "2026-11" from a date, or null. */
export const monthOf = (d) => { const x = isoDate(d); return x ? x.slice(0, 7) : null; };
/** Add months to a date, keeping the day where the month has it (Jan 31 + 1 = Feb 28). */
export function addMonths(d, n) {
  const x = isoDate(d); if (!x) return null;
  const [y, m, day] = x.split('-').map(Number); const t = new Date(Date.UTC(y, m - 1 + n, 1));
  const last = new Date(Date.UTC(t.getUTCFullYear(), t.getUTCMonth() + 1, 0)).getUTCDate();
  return new Date(Date.UTC(t.getUTCFullYear(), t.getUTCMonth(), Math.min(day, last))).toISOString().slice(0, 10);
}
/**
 * Fiscal year of a date, named by the calendar year it ends in (a July-June year that
 * ends on 2027-06-30 is FY2027). startMonth 1 = calendar year.
 */
export function fiscalYear(d, startMonth = 1) {
  const x = isoDate(d); if (!x) return null;
  const [y, m] = x.split('-').map(Number);
  return startMonth === 1 ? y : m >= startMonth ? y + 1 : y;
}
/** { start, end } of fiscal year fy (named by the year it ends in). */
export function fiscalRange(fy, startMonth = 1) {
  const s = startMonth === 1 ? `${fy}-01-01` : `${fy - 1}-${String(startMonth).padStart(2, '0')}-01`;
  return { start: s, end: addDays(addMonths(s, 12), -1) };
}

// -------------------------------------------------------------------- people ----

const TITLES = /\b(mr|mrs|ms|miss|mx|dr|rev|reverend|fr|pastor|prof|hon|sir|dame|the)\b\.?/g;
const SUFFIX = /\b(jr|sr|ii|iii|iv|phd|md|esq|cpa)\b\.?/g;
/** A person or household name reduced for matching: no titles, suffixes, punctuation; "&" and "and" alike. */
export function donorKey(name) {
  return normalizeName(String(name || '').toLowerCase().replace(/&/g, ' and ').replace(TITLES, ' ').replace(SUFFIX, ' ')).replace(/\band\b/g, ' ').replace(/\s+/g, ' ').trim();
}
/** Name tokens in order-free form ("Hartwell, Maple" and "Maple Hartwell" match). */
export const nameTokens = (name) => donorKey(String(name || '').replace(',', ' ')).split(' ').filter(Boolean).sort().join(' ');
/** Similarity of two person names, 0..1 (token order and titles ignored). */
export function personSimilarity(a, b) { const x = nameTokens(a), y = nameTokens(b); if (!x || !y) return 0; return x === y ? 1 : jaroWinkler(x, y); }
export const normEmail = (v) => { const s = low(v); return /@/.test(s) ? s.replace(/\+[^@]*@/, '@') : ''; };
export const normPhone = (v) => { const d = str(v).replace(/\D/g, ''); return d.length >= 10 ? d.slice(-10) : ''; };
export const normPostal = (v) => str(v).toUpperCase().replace(/\s+/g, '').slice(0, 5);

// ------------------------------------------------------- restrictions and funds ----

/**
 * Restriction class of a fund or net asset code, in ASU 2016-14 words:
 *   { cls: 'without' | 'with' | null, sub: 'purpose' | 'time' | 'perpetual' | 'board' | null }
 * Reads the old three-class names (unrestricted, temporarily and permanently restricted) too.
 */
export function restrictionOf(v) {
  const s = low(v).replace(/[_-]+/g, ' ');
  if (!s) return { cls: null, sub: null };
  if (/board|designated|quasi/.test(s)) return { cls: 'without', sub: 'board' };
  if (/^(ur|wodr|nr|without|unrestricted|without donor restrictions?|net assets without donor restrictions?|general|operating|none|no)$/.test(s) || /\bunrestricted\b|without donor/.test(s)) return { cls: 'without', sub: null };
  if (/perm|perpetu|endow(ment)? corpus|^pr$|in perpetuity/.test(s)) return { cls: 'with', sub: 'perpetual' };
  if (/time|^tr\b|temporar.*time/.test(s)) return { cls: 'with', sub: 'time' };
  if (/purpose|program|^tr$|temporar|^wdr$|with donor|restricted|^r$/.test(s)) return { cls: 'with', sub: /time/.test(s) ? 'time' : 'purpose' };
  return { cls: null, sub: null };
}
export const RESTRICTION_LABEL = Object.freeze({ without: 'without donor restrictions', with: 'with donor restrictions' });

/** Functional class of an expense: 'program', 'management' (management and general), 'fundraising', or null. */
export function functionOf(v) {
  const s = low(v).replace(/[_-]+/g, ' ');
  if (!s) return null;
  if (/fund ?rais|develop|^fr$|^dev$|donor relations|appeal/.test(s)) return 'fundraising';
  if (/manag|admin|general|^m ?& ?g$|^g ?& ?a$|^mg$|^ga$|overhead|operations support/.test(s)) return 'management';
  if (/program|^prog|^p$|service|mission/.test(s)) return 'program';
  return null;
}

// ---------------------------------------------------------------- matching ----

/** rows grouped by key(row), as a Map in first-seen order. */
export function groupBy(rows, key) {
  const m = new Map();
  for (const r of rows) { const k = key(r); if (!m.has(k)) m.set(k, []); m.get(k).push(r); }
  return m;
}

/**
 * Pair left rows with right rows one to one by amount (within tol) and date (within
 * `days`), nearest date first. The result does not depend on row order: both sides
 * are sorted by date, amount and id before pairing.
 * Returns { pairs: [[l, r, gapDays]], left: [unpaired l], right: [unpaired r] }.
 */
export function pairByAmountDate(left, right, { amount = (x) => x.amount, date = (x) => x.date, id = (x) => x.id, days = 5, tol = 0.005 } = {}) {
  const key = (x) => `${isoDate(date(x)) || '9999-99-99'}|${String(round2(amount(x) || 0)).padStart(14, '0')}|${str(id(x))}`;
  const L = [...left].sort((a, b) => (key(a) < key(b) ? -1 : key(a) > key(b) ? 1 : 0));
  const R = [...right].sort((a, b) => (key(a) < key(b) ? -1 : key(a) > key(b) ? 1 : 0));
  const byCents = new Map();
  for (const r of R) { const c = Math.round(round2(amount(r) || 0) * 100); if (!byCents.has(c)) byCents.set(c, []); byCents.get(c).push(r); }
  const used = new Set(); const pairs = []; const leftOver = [];
  const tolC = Math.round(tol * 100);
  for (const l of L) {
    const c = Math.round(round2(amount(l) || 0) * 100); let best = null; let bestGap = Infinity;
    for (let k = c - tolC; k <= c + tolC; k++) for (const r of byCents.get(k) || []) {
      if (used.has(r)) continue;
      const g = daysBetween(date(l), date(r)); const gap = g === null ? Infinity : Math.abs(g);
      if (gap <= days && gap < bestGap) { best = r; bestGap = gap; }
    }
    if (best) { used.add(best); pairs.push([l, best, bestGap]); } else leftOver.push(l);
  }
  return { pairs, left: leftOver, right: R.filter((r) => !used.has(r)) };
}

/** Sort items by a stable key list so results never depend on the order of the rows. */
export function stableSort(items, ...keys) {
  const k = (x) => keys.map((f) => { const v = typeof f === 'function' ? f(x) : x[f]; return typeof v === 'number' ? String(v.toFixed ? v.toFixed(2) : v).padStart(16, '0') : str(v); }).join('\u0001');
  return [...items].sort((a, b) => { const x = k(a), y = k(b); return x < y ? -1 : x > y ? 1 : 0; });
}

/** Days past due put in buckets: [30, 60, 90] gives 'current', '1-30', '31-60', '61-90', '90+'. */
export function ageBucket(days, buckets = [30, 60, 90]) {
  if (days === null || days === undefined || days <= 0) return 'current';
  let lo = 1;
  for (const b of buckets) { if (days <= b) return `${lo}-${b}`; lo = b + 1; }
  return `${buckets[buckets.length - 1]}+`;
}

/** Yes/no from a cell in English words most CRMs export (blank is null). */
export function yes(v) {
  const s = low(v); if (!s) return null;
  if (/^(y|yes|true|t|1|x|on|sent|received|done|checked|✓|ja|oui|s[ií]|sim|はい|是|예)$/.test(s)) return true;
  if (/^(n|no|false|f|0|off|none|not sent|pending|nein|non|não|nao|いいえ|否|아니요)$/.test(s)) return false;
  return null;
}

/**
 * Findings in a fixed order (by code rank, then detail), so a report does not change
 * when the rows are reordered.
 */
export function orderFindings(findings, order = []) {
  const rank = (c) => { const i = order.indexOf(c); return i < 0 ? order.length : i; };
  return findings.map((x, i) => [x, i]).sort((a, b) => rank(a[0].code) - rank(b[0].code) || (a[0].detail < b[0].detail ? -1 : a[0].detail > b[0].detail ? 1 : a[1] - b[1])).map(([x]) => x);
}

/** Totals by finding code: { code: { count, amount } }. */
export function byFinding(items) {
  const out = {};
  for (const i of items) for (const f of i.findings || []) { const o = out[f.code] = out[f.code] || { count: 0, amount: 0 }; o.count++; o.amount = round2(o.amount + (Number(f.amount) || 0)); }
  return Object.fromEntries(Object.entries(out).sort(([a], [b]) => (a < b ? -1 : 1)));
}

/** Count items by status: { ok: n, review: n, ... } with every listed status present. */
export function byStatus(items, statuses) {
  const out = Object.fromEntries(statuses.map((s) => [s, 0]));
  for (const i of items) out[i.status] = (out[i.status] || 0) + 1;
  return out;
}
