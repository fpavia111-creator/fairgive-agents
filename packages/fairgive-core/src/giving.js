// Nonprofit back-office helpers shared by the Fairgive agents. Pure functions, no I/O.
//
// Nothing here is a rule of law or an accounting standard. Thresholds, rates and
// periods are settings the organization changes in its own settings file, and every
// agent says which it used. These helpers only read and compare.
import { foldText, readNumber } from './intl.js';
import { jaroWinkler } from './text.js';

export const round2 = (n) => Math.round((Number(n) + Number.EPSILON) * 100) / 100;
export const round1 = (n) => Math.round((Number(n) + Number.EPSILON) * 10) / 10;
export const round4 = (n) => Math.round((Number(n) + Number.EPSILON) * 10000) / 10000;
export const num = (v) => { if (v === null || v === undefined || v === '') return null; if (typeof v === 'number') return Number.isFinite(v) ? v : null; const n = readNumber(String(v).trim()); return Number.isFinite(n) ? n : null; };
export const sum = (xs) => round2(xs.reduce((s, x) => s + (Number(x) || 0), 0));
export const str = (v) => String(v ?? '').trim();
export const low = (v) => str(v).toLowerCase();
/** part / whole as a percentage with one decimal, or null when whole is 0 or missing. */
export const pct = (part, whole) => { const w = Number(whole); return w ? round1((Number(part) / w) * 100) : null; };

/** Median of the finite numbers in xs, or null. */
export function median(xs) {
  const v = xs.map(Number).filter(Number.isFinite).sort((a, b) => a - b);
  if (!v.length) return null;
  const m = Math.floor(v.length / 2);
  return v.length % 2 ? v[m] : round4((v[m - 1] + v[m]) / 2);
}

/** Group rows by a key function into a Map, keeping order. */
export function groupBy(rows, key) {
  const m = new Map();
  for (const r of rows) { const k = key(r); if (!m.has(k)) m.set(k, []); m.get(k).push(r); }
  return m;
}

/** Sorted plain object from a Map or object, so results never depend on row order. */
export const sortedObject = (o) => Object.fromEntries([...(o instanceof Map ? o.entries() : Object.entries(o))].sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0)));

/** Compare two strings the same way on every machine. */
export const cmp = (a, b) => (String(a) < String(b) ? -1 : String(a) > String(b) ? 1 : 0);

// ------------------------------------------------------------------- names ----

/** Key for matching an item, vendor or location name across files: case, accents and punctuation folded. */
export const nameKey = (s) => foldText(str(s)).replace(/\b(the|and)\b/g, ' ').replace(/\s+/g, ' ').trim();

/** Key for a person's name: "Rivera, Ana" and "Ana Rivera" give the same key. */
export function personKey(s) {
  const t = str(s);
  if (!t) return '';
  const m = /^([^,]+),\s*(.+)$/.exec(t);
  const full = m ? `${m[2]} ${m[1]}` : t;
  return foldText(full).split(' ').filter(Boolean).join(' ');
}

/** "Ana Rivera" from "Rivera, Ana"; other names as written. */
export function displayName(s) {
  const t = str(s);
  const m = /^([^,]+),\s*(.+)$/.exec(t);
  return m ? `${m[2].trim()} ${m[1].trim()}` : t;
}

// ------------------------------------------------------------------- dates ----

const DAY = 86400000;
const toMs = (v) => { const s = str(v); if (!s) return NaN; const iso = /^\d{4}-\d{2}-\d{2}$/.test(s) ? `${s}T00:00:00Z` : /[zZ]|[+-]\d{2}:?\d{2}$/.test(s) ? s : `${s.replace(' ', 'T')}Z`; return Date.parse(iso); };
export const isoDate = (v) => { const t = toMs(v); return Number.isFinite(t) ? new Date(t).toISOString().slice(0, 10) : null; };
export function daysBetween(a, b) { const x = toMs(isoDate(a)), y = toMs(isoDate(b)); return Number.isFinite(x) && Number.isFinite(y) ? Math.round((y - x) / DAY) : null; }
export function hoursBetween(a, b) { const x = toMs(a), y = toMs(b); return Number.isFinite(x) && Number.isFinite(y) ? Math.round(((y - x) / 3600000) * 100) / 100 : null; }
export function addDays(d, n) { const t = toMs(isoDate(d)); return Number.isFinite(t) ? new Date(t + n * DAY).toISOString().slice(0, 10) : null; }
export const inWindow = (d, from, to) => { const x = isoDate(d); return !!x && (!from || x >= isoDate(from)) && (!to || x <= isoDate(to)); };
/** Monday of the week a date falls in (YYYY-MM-DD). */
export function weekStart(d) { const x = isoDate(d); if (!x) return null; const day = new Date(`${x}T00:00:00Z`).getUTCDay(); return addDays(x, -((day + 6) % 7)); }
const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
export const dayName = (d) => { const x = isoDate(d); return x ? DAYS[new Date(`${x}T00:00:00Z`).getUTCDay()] : null; };

/** "$1,234.56" for letters and statements people read. Negative amounts as "-$12.00". */
export function dollars(n, symbol = '$') {
  const v = round2(Number(n) || 0); const s = Math.abs(v).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return `${v < 0 ? '-' : ''}${symbol}${s}`;
}
/** Two amounts equal within a tolerance (default half a cent). */
export const near = (a, b, tol = 0.005) => Math.abs(Number(a) - Number(b)) <= tol + 1e-9;
/** num() with 0 for blanks. */
export const amt = (v) => num(v) ?? 0;

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
  return foldText(String(name || '').toLowerCase().replace(/&/g, ' and ').replace(TITLES, ' ').replace(SUFFIX, ' ')).replace(/\band\b/g, ' ').replace(/\s+/g, ' ').trim();
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

// ------------------------------------------------------------------ status ----

/** Rank used to sort findings and pick an item's status: worst first. */
export const STATUS_RANK = Object.freeze({ flag: 0, review: 1, watch: 2, ok: 3 });
export const worst = (statuses) => statuses.reduce((w, s) => ((STATUS_RANK[s] ?? 3) < (STATUS_RANK[w] ?? 3) ? s : w), 'ok');

/**
 * One pass over items: rows of { [name]: key, count, ...sums } sorted by key.
 * sums: { outputField: (item) => number }. Used by report sections so a file with
 * thousands of vendors is not scanned once per vendor.
 */
export function rollup(items, name, keyFn, sums = {}, { countWhen = null } = {}) {
  const m = new Map();
  for (const i of items) {
    const k = keyFn(i); let e = m.get(k);
    if (!e) { e = { [name]: k, count: 0 }; for (const f of Object.keys(sums)) e[f] = 0; m.set(k, e); }
    if (!countWhen || countWhen(i)) e.count++;
    for (const [f, fn] of Object.entries(sums)) e[f] += Number(fn(i)) || 0;
  }
  return [...m.values()].sort((a, b) => cmp(a[name], b[name])).map((e) => { for (const f of Object.keys(sums)) e[f] = round2(e[f]); return e; });
}
