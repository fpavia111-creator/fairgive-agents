import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { REPORT_TEXT, reportText, writeWorklist, LANGS } from '../src/index.js';

const ph = (s) => (s.match(/\{\w+\}/g) || []).sort().join(' ');

test('report text: every phrase has all eight translations and keeps its placeholders', () => {
  for (const [name, cat] of Object.entries(REPORT_TEXT)) for (const [en, list] of Object.entries(cat)) {
    assert.equal(list.length, 8, `${name}: ${en}`);
    for (const s of list) { assert.ok(typeof s === 'string' && s.trim(), `${name}: ${en} has an empty translation`); if (name !== 'columns') assert.equal(ph(s), ph(en), `${name}: ${en} -> ${s}`); assert.doesNotMatch(s, /[<>]/, `${name}: ${en}`); }
  }
});

test('report text: dates and numbers in a heading are carried into the translation', () => {
  const de = reportText('de'), ja = reportText('ja');
  assert.equal(de.title('Pledges receivable as of 2026-11-16'), 'Offene Spendenzusagen, Stand 2026-11-16');
  assert.equal(de.title('Pledges receivable as of 2026-11-16 10:00'), 'Offene Spendenzusagen, Stand 2026-11-16 10:00');
  assert.equal(ja.page('All rows (12)'), '全行（12）');
  assert.equal(de.section('Gifts of 250 or more'), 'Spenden ab 250');
});

test('report text: English is untouched, an unknown phrase or column stays English, a regional tag falls back to its language', () => {
  const en = reportText('en');
  assert.equal(en.english, true); assert.equal(en.title('Volunteer hours'), 'Volunteer hours'); assert.equal(en.column('invoice_number'), 'invoice number');
  const fr = reportText('fr-CA');
  assert.equal(fr.lang, 'fr'); assert.equal(fr.title('A report nobody translated'), 'A report nobody translated'); assert.equal(fr.column('some_new_column'), 'some new column');
  assert.equal(fr.column('donor'), 'Donateur'); assert.equal(fr.column('retention_pct', 'Retention %'), 'Taux de fidélisation %');
  assert.equal(reportText('xx').english, true);
  assert.equal(reportText('constructor').title('toString'), 'toString');
});

test('worklist: the page follows the language, the CSV does not, and a translated page says what is still English', () => {
  const real = (lang) => { const dir = mkdtempSync(join(tmpdir(), 'wl-')); const ctx = { lang, root: dir, outDir: () => dir, writeFile: (d, name, text) => { const f = join(d, name); writeFileSync(f, text); return f; } }; const w = writeWorklist(ctx, 'out', 'x', { title: 'Volunteer hours', rows: [{ donor: 'Ridgeline <b>', amount: 5 }], columns: ['donor', 'amount'], sections: [{ title: 'By donor', rows: [], columns: ['vendor'] }], limits: ['A limit.'] }); return { html: readFileSync(join(dir, 'x.html'), 'utf8'), csv: readFileSync(join(dir, 'x.csv'), 'utf8'), sha: w.output_sha256 }; };
  const en = real('en'), ko = real('ko');
  assert.equal(ko.csv, en.csv);
  assert.match(en.html, /<html lang="en"/); assert.match(en.html, /<h1>Volunteer hours<\/h1>/); assert.match(en.html, /<th[^>]*>donor<\/th>/); assert.doesNotMatch(en.html, /translated by Claude/);
  assert.match(ko.html, /<html lang="ko"/); assert.match(ko.html, /<h1>자원봉사 시간<\/h1>/); assert.match(ko.html, /<h2>기부자별<\/h2>/); assert.match(ko.html, /<th[^>]*>기부자<\/th><th[^>]*>금액<\/th>/); assert.match(ko.html, /<h2>한계<\/h2>/);
  assert.match(ko.html, /Claude가 번역/); assert.match(ko.html, /Ridgeline &lt;b&gt;/); assert.match(ko.html, /A limit\./);
  for (const l of LANGS) assert.match(real(l).html, /<h1>/);
});
