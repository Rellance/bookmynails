// Yksikkötestit puhtaille parser-funktioille parseDates ja parseAfterTime.
// Aja: npm test  (node --test)
//
// availability.service.js tuo ketjun kautta config/env.js:n, joka heittää jos
// DATABASE_URL / GROQ_API_KEY puuttuu. Asetetaan dummy-arvot ENNEN importtia,
// jotta testit ovat CI-turvallisia eivätkä vaadi oikeaa .env-tiedostoa.
// (dotenv ei ylikirjoita jo asetettuja muuttujia, joten paikallinen .env toimii silti.)
process.env.DATABASE_URL ??= 'postgres://test:test@localhost:5432/test';
process.env.GROQ_API_KEY ??= 'test-key';

import test from 'node:test';
import assert from 'node:assert/strict';

const { parseDates, parseAfterTime } = await import('./availability.service.js');

const ISO_RE = /^\d{4}-\d{2}-\d{2}$/;

// ── parseDates ────────────────────────────────────────────────────────────────

test('parseDates: tarkka ISO-päivä palautetaan sellaisenaan', () => {
  assert.deepEqual(parseDates('2026-06-24'), ['2026-06-24']);
});

test('parseDates: null → seuraavat 7 päivää ISO-muodossa', () => {
  const result = parseDates(null);
  assert.equal(result.length, 7);
  assert.ok(result.every((d) => ISO_RE.test(d)), 'kaikki YYYY-MM-DD-muodossa');
});

test('parseDates: "huomenna" → yksi ISO-päivä', () => {
  const result = parseDates('huomenna');
  assert.equal(result.length, 1);
  assert.ok(ISO_RE.test(result[0]));
});

test('parseDates: suomalainen viikonpäivä "ensi maanantai" → yksi ISO-päivä', () => {
  const result = parseDates('ensi maanantai');
  assert.equal(result.length, 1);
  assert.ok(ISO_RE.test(result[0]));
});

test('parseDates: tuntematon muoto → tyhjä taulukko', () => {
  assert.deepEqual(parseDates('joskus pian'), []);
});

// ── parseAfterTime ────────────────────────────────────────────────────────────

test('parseAfterTime: null → null (ei aikasuodatusta)', () => {
  assert.equal(parseAfterTime(null), null);
});

test('parseAfterTime: kellonajat "17:00" ja "17.00" → "17:00"', () => {
  assert.equal(parseAfterTime('17:00'), '17:00');
  assert.equal(parseAfterTime('17.00'), '17:00');
});

test('parseAfterTime: "17 jälkeen" ja "after 17" → "17:00"', () => {
  assert.equal(parseAfterTime('17 jälkeen'), '17:00');
  assert.equal(parseAfterTime('after 17'), '17:00');
});

test('parseAfterTime: sanalliset aikavälit (aamu/iltapäivä/ilta)', () => {
  assert.equal(parseAfterTime('aamulla'), '08:00');
  assert.equal(parseAfterTime('iltapäivä'), '12:00');
  assert.equal(parseAfterTime('illalla'), '17:00');
});

test('parseAfterTime: tuntematon muoto → null', () => {
  assert.equal(parseAfterTime('joskus'), null);
});
