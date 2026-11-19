// Event revenue split. Each ticket is an exchange up to the fair market value of what the
// buyer receives and a contribution above it; extra donations are contributions. A ticket
// type with no fair market value cannot be split and is left unsplit. When ledger lines
// are given, the exchange and contribution accounts in the settings are compared with the
// split, event by event.
import { str, num, round2, glAmount, finding, statusOf, cmp, nameKey } from 'fairgive-core';

export const DEFAULTS = Object.freeze({ exchange_accounts: [], contribution_accounts: [], tolerance: 0.01 });
const LEVELS = { gl_exchange_differs: 'flag', gl_contribution_differs: 'flag', no_fmv_for_ticket_type: 'review', event_not_in_gl: 'review', ticket_below_fmv: 'watch' };

export function eventSplit({ sales = [], ticket_types: types = [], gl = [] }, s = DEFAULTS) {
  const tol = Number(s.tolerance ?? 0.01);
  const fmv = new Map(); for (const t of types) fmv.set(`${nameKey(t.event)}|${nameKey(t.ticket_type)}`, num(t.fmv));
  const ev = new Map();
  const get = (e) => { const k = nameKey(e); if (!ev.has(k)) ev.set(k, { event: str(e) || '(no event)', gross: 0, exchange: 0, contribution: 0, unsplit: 0, tickets: 0, nofmv: new Map(), below: new Map() }); return ev.get(k); };
  for (const o of sales) {
    const e = get(o.event); const q = num(o.qty) ?? 1; const price = num(o.price) || 0; const extra = num(o.extra_donation) || 0; const type = str(o.ticket_type) || '(no type)';
    const value = fmv.get(`${nameKey(o.event)}|${nameKey(type)}`); const sale = round2(q * price);
    e.gross = round2(e.gross + sale + extra); e.contribution = round2(e.contribution + extra); e.tickets += q;
    if (value === undefined || value === null) { e.unsplit = round2(e.unsplit + sale); e.nofmv.set(type, round2((e.nofmv.get(type) || 0) + sale)); continue; }
    const ex = round2(q * Math.min(price, value)); e.exchange = round2(e.exchange + ex); e.contribution = round2(e.contribution + sale - ex);
    if (price < value - tol) e.below.set(type, (e.below.get(type) || 0) + q);
  }
  const has = (list, a) => (list || []).some((p) => str(p) && str(a).startsWith(str(p)));
  const glEv = new Map(); for (const r of gl) { const k = nameKey(r.event); if (!k) continue; const x = glEv.get(k) || { exchange: 0, contribution: 0 }; if (has(s.exchange_accounts, r.account)) x.exchange = round2(x.exchange - glAmount(r, num)); else if (has(s.contribution_accounts, r.account)) x.contribution = round2(x.contribution - glAmount(r, num)); glEv.set(k, x); }
  const items = [];
  for (const [k, e] of [...ev.entries()].sort((a, b) => cmp(a[0], b[0]))) {
    const f = [];
    for (const [type, amt] of [...e.nofmv.entries()].sort()) f.push(finding('no_fmv_for_ticket_type', `${e.event} ${type}: ${amt} of sales with no fair market value for the ticket, so it cannot be split.`, amt));
    for (const [type, q] of [...e.below.entries()].sort()) f.push(finding('ticket_below_fmv', `${e.event} ${type}: ${q} ticket(s) sold under their fair market value; no part of them is a contribution.`));
    const g = glEv.get(k);
    if (gl.length && !g) f.push(finding('event_not_in_gl', `${e.event} has ${e.gross} of sales and no ledger lines coded to it.`, e.gross));
    if (g && !e.unsplit) {
      if (Math.abs(g.exchange - e.exchange) > tol) f.push(finding('gl_exchange_differs', `${e.event}: the ledger has ${g.exchange} of event (exchange) revenue; the split says ${e.exchange}.`, g.exchange - e.exchange));
      if (Math.abs(g.contribution - e.contribution) > tol) f.push(finding('gl_contribution_differs', `${e.event}: the ledger has ${g.contribution} of contributions; the split says ${e.contribution}.`, g.contribution - e.contribution));
    }
    items.push({ event: e.event, tickets: e.tickets, gross: e.gross, exchange: e.exchange, contribution: e.contribution, unsplit: e.unsplit, gl_exchange: g ? g.exchange : null, gl_contribution: g ? g.contribution : null, status: statusOf(f, LEVELS), findings: f });
  }
  const t = (key) => round2(items.reduce((a, i) => a + i[key], 0));
  return { items, totals: { events: items.length, gross: t('gross'), exchange: t('exchange'), contribution: t('contribution'), unsplit: t('unsplit') }, extra: {} };
}
