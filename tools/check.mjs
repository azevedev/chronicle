#!/usr/bin/env node
/**
 * check.mjs — headless test of the roster and the rules.
 *
 * The game logic deliberately has no DOM dependencies at module scope, so the
 * whole rules layer can be exercised in Node. Run before committing:
 *
 *   node tools/check.mjs
 *
 * Exits non-zero on failure, so it can gate a commit hook or CI.
 */

import { getFigures, validate, theHundred, HUNDRED } from '../js/data.js';
import { buildIndex, resolve, suggest, normalize } from '../js/search.js';
import { setLang, t, keysFor } from '../js/i18n.js';
import {
  startSession, submitGuess, skip, nextRound, currentRound,
  hintsFor, MAX_ATTEMPTS, MAX_HINTS, DIFFICULTIES,
  revealCause, causeFor, potentialScore, CAUSE_PENALTY,
} from '../js/game.js';
import { dailyPick, dayIndex } from '../js/rng.js';
import { readFileSync } from 'node:fs';

let failures = 0;
let checks = 0;

function ok(cond, label, detail = '') {
  checks += 1;
  if (cond) return true;
  failures += 1;
  console.error(`  FAIL  ${label}${detail ? `\n        ${detail}` : ''}`);
  return false;
}

function section(name) {
  console.log(`\n── ${name} ${'─'.repeat(Math.max(0, 58 - name.length))}`);
}

// setLang touches document.documentElement; stub just enough for Node.
globalThis.document = { documentElement: {} };

/* ─────────────────────────  roster integrity  ───────────────────────── */

section('roster');

const figures = getFigures();
console.log(`  ${figures.length} figures loaded`);

const problems = validate(figures);
ok(problems.length === 0, 'roster validates', problems.slice(0, 12).join('\n        '));

const tiers = { 1: 0, 2: 0, 3: 0 };
for (const f of figures) tiers[f.tier] += 1;
console.log(`  tiers — 1: ${tiers[1]}   2: ${tiers[2]}   3: ${tiers[3]}`);
ok(tiers[1] >= 1, 'tier 1 pool is non-empty');

/* ─────────────────────────  the Hundred  ───────────────────────── */

section('the Hundred');

const hundred = theHundred();
ok(hundred.length === HUNDRED, `the Hundred has exactly ${HUNDRED} figures`, `got ${hundred.length}`);
ok(tiers[1] === HUNDRED, 'the tier-1 pool is exactly the Hundred', `tier 1 holds ${tiers[1]}`);

// Ranks run 1..HUNDRED with no gap and no repeat. validate() already refuses a
// roster that breaks this; asserting it here names the failure plainly.
ok(
  hundred.every((f, i) => f.rank === i + 1),
  'ranks run 1 upward without gaps',
  hundred.map((f, i) => (f.rank === i + 1 ? null : `${f.id} at ${f.rank}, expected ${i + 1}`))
    .filter(Boolean).join('; '),
);

// A ranked figure that is not tier 1 (or the reverse) would let the daily and
// the Remarkable difficulty draw from two different sets of people.
{
  const mismatch = figures.filter((f) => (f.rank !== null) !== (f.tier === 1));
  ok(mismatch.length === 0, 'rank and tier 1 agree on every figure',
    mismatch.map((f) => `${f.id}: rank ${f.rank}, tier ${f.tier}`).join('; '));
}

console.log(`  best known: ${hundred.slice(0, 3).map((f) => f.names[0]).join(', ')}`);
console.log(`  hundredth:  ${hundred[hundred.length - 1].names[0]}`);

// Duplicate detection across BOTH languages, which a naive id check misses.
const nameSeen = new Map();
for (const f of figures) {
  for (const n of f.names) {
    const key = normalize(n);
    if (nameSeen.has(key) && nameSeen.get(key) !== f.id) {
      ok(false, 'duplicate name across figures', `"${n}" used by ${nameSeen.get(key)} and ${f.id}`);
    }
    nameSeen.set(key, f.id);
  }
}

// Every pin must fall inside the map's visible window. assets/map/world.svg is
// cropped to the inhabited latitudes, so a pin outside that range renders
// nowhere at all — the player would be shown one pin instead of two.
const LAT_TOP = 83.5;
const LAT_BOTTOM = -57;
for (const f of figures) {
  for (const [label, p] of [['born', f.born], ['died', f.died]]) {
    if (p.lat > LAT_TOP || p.lat < LAT_BOTTOM) {
      ok(false, 'pin outside the visible map', `${f.id} ${label} at latitude ${p.lat}`);
    }
  }
}

// A deed hint that names the figure gives the answer away for free.
//
// Compared token by token rather than by substring: "annexe" contains "anne"
// and "primeira" contains "meir", and neither is a leak. The possessive form
// is still caught, so "Gogh's" would not slip through.
for (const f of figures) {
  for (let i = 0; i < 2; i++) {
    const tokens = new Set(normalize(f.deed[i]).split(' '));
    const words = normalize(f.names[i]).split(' ').filter((w) => w.length > 3);
    for (const w of words) {
      if (tokens.has(w) || tokens.has(`${w}s`)) {
        ok(false, 'deed hint leaks the name', `${f.id} (${i === 0 ? 'en' : 'pt'}): "${w}"`);
      }
    }
  }
}

// The cause of death is a paid clue, so it is held to the deed's rule: it must
// not hand over the name it is a clue to.
for (const f of figures) {
  for (let i = 0; i < 2; i++) {
    const tokens = new Set(normalize(f.end[i]).split(' '));
    const words = normalize(f.names[i]).split(' ').filter((w) => w.length > 3);
    for (const w of words) {
      if (tokens.has(w) || tokens.has(`${w}s`)) {
        ok(false, 'cause of death leaks the name', `${f.id} (${i === 0 ? 'en' : 'pt'}): "${w}"`);
      }
    }
  }
}

// A cause every figure carries, in both languages, and long enough to be a
// sentence rather than a placeholder somebody meant to come back to.
for (const f of figures) {
  for (let i = 0; i < 2; i++) {
    const text = f.end[i] ?? '';
    if (text.length < 25) {
      ok(false, 'cause of death is too short to be a clue', `${f.id} (${i === 0 ? 'en' : 'pt'}): "${text}"`);
    }
  }
}

// An age stated in a cause of death must agree with the one the record card
// works out for itself, or the two halves of the same screen contradict each
// other. Written out in words rather than digits — the register is set in a
// period voice — so the words have to be read back before they can be compared.
{
  const EN = {
    twelve: 12, thirteen: 13, fourteen: 14, fifteen: 15, sixteen: 16, seventeen: 17,
    eighteen: 18, nineteen: 19, twenty: 20, thirty: 30, forty: 40, fifty: 50,
    sixty: 60, seventy: 70, eighty: 80, ninety: 90, hundred: 100,
    one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9,
  };
  const PT = {
    doze: 12, treze: 13, quatorze: 14, catorze: 14, quinze: 15, dezesseis: 16,
    dezessete: 17, dezoito: 18, dezenove: 19, vinte: 20, trinta: 30, quarenta: 40,
    cinquenta: 50, sessenta: 60, setenta: 70, oitenta: 80, noventa: 90, cem: 100,
    um: 1, dois: 2, tres: 3, quatro: 4, cinco: 5, seis: 6, sete: 7, oito: 8, nove: 9,
  };

  // Only the forms that actually mean "this person's age at death" are matched.
  // A bare "de trinta anos" is as likely to be thirty years of travel or a
  // thirteen-year-old daughter, and neither is a claim about the figure.
  const forms = [
    { lang: 'en', table: EN, join: '-', re: (w) =>
      new RegExp(`\\b(?:at|aged|past)\\s+(about\\s+|nearly\\s+|almost\\s+)?((?:${w})(?:-(?:${w}))?)\\b`, 'gi') },
    { lang: 'pt', table: PT, join: ' e ', re: (w) =>
      new RegExp(`\\b(?:aos|com)\\s+(cerca\\s+de\\s+)?((?:${w})(?:\\s+e\\s+(?:${w}))?)\\s+anos\\b`, 'gi') },
  ];

  const flat = (t) => t.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();

  for (const f of figures) {
    const span = f.died.year - f.born.year;
    for (const [i, form] of forms.entries()) {
      const words = Object.keys(form.table).join('|');
      for (const m of f.end[i].matchAll(form.re(words))) {
        const parts = flat(m[2]).split(form.join).map((w) => w.trim()).filter(Boolean);
        if (!parts.every((w) => w in form.table)) continue;
        const stated = parts.reduce((n, w) => n + form.table[w], 0);
        // The single words below twelve are here only to compound ("twenty-one").
        // Alone after "at" they are a clock, not an age: nobody in this register
        // died at five, and two of them died at five past nine.
        if (stated < 12) continue;
        // A year-only span is inexact by a year either way, and a hedged age
        // ("nearly ninety") is inexact on purpose.
        const slack = m[1] ? 3 : 1;
        if (Math.abs(stated - span) > slack) {
          ok(false, 'cause of death states an age the record contradicts',
            `${f.id} (${form.lang}): "${m[0].trim()}" against a span of ${span}`);
        }
      }
    }
  }
}

/* ─────────────────────────  name resolution  ───────────────────────── */

section('resolution');

buildIndex(figures);

const byId = new Map(figures.map((f) => [f.id, f]));

// Every figure must resolve from its own full name, in both languages.
for (const f of figures) {
  for (const [i, n] of f.names.entries()) {
    setLang(i === 0 ? 'en' : 'pt');
    const r = resolve(n);
    if (!ok(r?.figure.id === f.id, `resolves own name: ${n}`, `got ${r?.figure.id ?? 'null'}`)) break;
  }
}
setLang('en');

// Accent- and case-insensitivity.
ok(resolve('julio cesar')?.figure.id === 'julius-caesar', 'accent-insensitive (julio cesar)');
ok(resolve('JULIUS CAESAR')?.figure.id === 'julius-caesar', 'case-insensitive');
ok(resolve('  cleopatra vii  ')?.figure.id === 'cleopatra', 'trims whitespace');

// Typo tolerance on a long name.
ok(resolve('arquimedez')?.figure.id === 'archimedes', 'forgives a typo (arquimedez)');
ok(resolve('aristotel')?.figure.id === 'aristotle', 'forgives a truncation (aristotel)');

// Nonsense must not resolve to anything.
ok(resolve('qqqqqqzzzz') === null, 'rejects nonsense');
ok(resolve('') === null, 'rejects empty input');

// Suggestions.
const sugg = suggest('cleo');
ok(sugg.some((s) => s.id === 'cleopatra'), 'suggests on prefix');
ok(suggest('a').length === 0, 'no suggestions under two characters');

/* ─────────────────────────  the rules  ───────────────────────── */

section('rules');

const target = byId.get('socrates');

// First-attempt identification pays full, and closes the round.
{
  const s = startSession('infinite', { seed: 1 });
  const r = currentRound(s);
  const out = submitGuess(s, r.figure.names[0]);
  ok(out.type === 'correct', 'correct guess reports correct');
  ok(r.done && r.won, 'round closes on a correct guess');
  ok(r.score > 0, 'a first-attempt win scores');
  ok(s.totalScore === r.score, 'session total picks up the round score');
}

// An unrecognised name must NOT burn an attempt.
{
  const s = startSession('infinite', { seed: 2 });
  const r = currentRound(s);
  const before = r.attempt;
  const out = submitGuess(s, 'zzzz nonsense qqqq');
  ok(out.type === 'unknown', 'unknown name reports unknown');
  ok(r.attempt === before, 'unknown name does not cost an attempt');
}

// Repeating a name must not burn an attempt either.
{
  const s = startSession('infinite', { seed: 3 });
  const r = currentRound(s);
  const wrong = figures.find((f) => f.id !== r.figure.id);
  submitGuess(s, wrong.names[0]);
  const after = r.attempt;
  const out = submitGuess(s, wrong.names[0]);
  ok(out.type === 'repeat', 'repeated name reports repeat');
  ok(r.attempt === after, 'repeated name does not cost an attempt');
}

// Spending every attempt on a wrong name closes the round as a loss.
{
  const s = startSession('infinite', { seed: 4 });
  const r = currentRound(s);
  const wrongs = figures.filter((f) => f.id !== r.figure.id).slice(0, MAX_ATTEMPTS);
  let last;
  for (const w of wrongs) last = submitGuess(s, w.names[0]);
  ok(last.type === 'lost', 'the final miss reports lost');
  ok(r.done && !r.won, 'round closes as a loss');
  ok(r.score === 0, 'a lost round scores nothing');
}

// Later attempts are worth strictly less.
{
  const a = startSession('infinite', { seed: 5 });
  const ra = currentRound(a);
  submitGuess(a, ra.figure.names[0]);

  const b = startSession('infinite', { seed: 5 });
  const rb = currentRound(b);
  submitGuess(b, figures.find((f) => f.id !== rb.figure.id).names[0]);
  submitGuess(b, rb.figure.names[0]);

  ok(rb.score < ra.score, 'second-attempt win scores less than first', `${rb.score} vs ${ra.score}`);
}

// Skipping costs an attempt and releases a hint.
{
  const s = startSession('infinite', { seed: 6 });
  const r = currentRound(s);
  const out = skip(s);
  ok(out.type === 'skipped', 'skip reports skipped');
  ok(r.attempt === 1, 'skip costs one attempt');
  ok(r.hintsShown === 1, 'skip releases exactly one hint');
  ok(Boolean(out.hint?.body), 'the released hint has text');
}

// Skipping every attempt loses the round — and not one attempt sooner.
{
  const s = startSession('infinite', { seed: 7 });
  const round = currentRound(s);
  let out;
  for (let i = 1; i <= MAX_ATTEMPTS; i++) {
    out = skip(s);
    if (i < MAX_ATTEMPTS) {
      ok(out.type === 'skipped', `skip ${i} of ${MAX_ATTEMPTS} does not end the round`);
    }
  }
  ok(out.type === 'lost', `skipping all ${MAX_ATTEMPTS} attempts loses the round`);
  ok(round.done && !round.won, 'the round closes as a loss');
}

// Buying the cause of death: costs points, costs no attempt, releases no hint.
{
  const s = startSession('infinite', { seed: 61 });
  const round = currentRound(s);
  const before = potentialScore(round.figure, 0);

  const out = revealCause(s);
  ok(out.type === 'cause', 'revealing the cause reports a purchase');
  ok(Boolean(out.cause?.body), 'the purchased clue has text');
  ok(out.cause.body === causeFor(round.figure).body, 'the clue is this figure\'s cause of death');
  ok(round.causeShown === true, 'the round records the purchase');
  ok(round.attempt === 0, 'buying the cause costs no attempt');
  ok(round.hintsShown === 0, 'buying the cause releases no hint from the ladder');

  const after = potentialScore(round.figure, 0, true);
  ok(after < before, 'the round is worth less once the cause is bought', `${after} vs ${before}`);
  ok(
    after === Math.round(before * (1 - CAUSE_PENALTY)),
    `the cause costs exactly ${Math.round(CAUSE_PENALTY * 100)}% of the award`,
    `${before} -> ${after}`,
  );

  // Idempotent, so the UI can leave the button wired without double-charging.
  const again = revealCause(s);
  ok(again.type === 'already', 'buying the cause twice is reported, not repeated');
  ok(potentialScore(round.figure, 0, round.causeShown) === after, 'the price is charged once');
}

// The purchase is reflected in what the round actually pays out.
{
  const paid = startSession('infinite', { seed: 62 });
  const rPaid = currentRound(paid);
  revealCause(paid);
  submitGuess(paid, rPaid.figure.names[0]);

  const free = startSession('infinite', { seed: 62 });
  const rFree = currentRound(free);
  submitGuess(free, rFree.figure.names[0]);

  ok(rPaid.figure.id === rFree.figure.id, 'the same seed gives the same figure');
  ok(rPaid.won && rFree.won, 'both rounds were identified');
  ok(rPaid.score < rFree.score, 'the bought clue is deducted from the award',
    `${rPaid.score} vs ${rFree.score}`);
  ok(rPaid.score === Math.round(rFree.score * (1 - CAUSE_PENALTY)),
    'the deduction is the stated fraction', `${rFree.score} -> ${rPaid.score}`);
  ok(paid.totalScore === rPaid.score, 'the session total takes the reduced award');
}

// A closed round sells nothing.
{
  const s = startSession('infinite', { seed: 63 });
  const round = currentRound(s);
  submitGuess(s, round.figure.names[0]);
  const out = revealCause(s);
  ok(out.type === 'closed', 'the cause cannot be bought after the round closes');
  ok(round.causeShown === false, 'a closed round records no purchase');
}

// The hint ladder: one hint per spent attempt, capped at the number that exist.
// With four attempts and three hints, the last attempt is played fully hinted.
{
  const s = startSession('infinite', { seed: 8 });
  const round = currentRound(s);
  ok(hintsFor(round.figure).length === MAX_HINTS, `there are exactly ${MAX_HINTS} hints`);

  for (let i = 1; i < MAX_ATTEMPTS; i++) {
    skip(s);
    ok(
      round.hintsShown === Math.min(i, MAX_HINTS),
      `after ${i} spent attempt(s), ${Math.min(i, MAX_HINTS)} hint(s) shown`,
      `got ${round.hintsShown}`,
    );
  }
  ok(round.hintsShown === MAX_HINTS, 'all hints are out before the final attempt');
  ok(!round.done, 'a final attempt remains once every hint has been released');
}

// A win on the very last attempt still scores something.
{
  const s = startSession('infinite', { seed: 9 });
  const round = currentRound(s);
  for (let i = 0; i < MAX_ATTEMPTS - 1; i++) skip(s);
  const out = submitGuess(s, round.figure.names[0]);
  ok(out.type === 'correct', 'the last attempt can still be won');
  ok(round.score > 0, 'a last-attempt win scores above zero', `got ${round.score}`);
  ok(round.attempt === MAX_ATTEMPTS, 'the win consumed the final attempt');
}

// Awards decrease strictly, attempt by attempt.
{
  const scores = [];
  for (let spend = 0; spend < MAX_ATTEMPTS; spend++) {
    const s = startSession('infinite', { seed: 21 });
    const round = currentRound(s);
    for (let i = 0; i < spend; i++) skip(s);
    submitGuess(s, round.figure.names[0]);
    scores.push(round.score);
  }
  const descending = scores.every((v, i) => i === 0 || v < scores[i - 1]);
  ok(descending, 'each attempt is worth strictly less than the last', scores.join(' > '));
  ok(scores[scores.length - 1] > 0, 'even the last attempt pays');
}

/* ─────────────────────────  modes  ───────────────────────── */

section('modes');

// Gauntlet runs exactly five rounds, then ends.
{
  const s = startSession('gauntlet', { seed: 11 });
  let rounds = 0;
  while (!s.over && rounds < 20) {
    rounds += 1;
    submitGuess(s, currentRound(s).figure.names[0]);
    if (!s.over) nextRound(s);
  }
  ok(rounds === 5, 'gauntlet is five rounds', `ran ${rounds}`);
  ok(s.over, 'gauntlet ends after its last round');

  const ids = s.rounds.map((r) => r.figure.id);
  ok(new Set(ids).size === ids.length, 'gauntlet never repeats a figure');
}

// Infinite ends on the third lost figure, not before.
{
  const s = startSession('infinite', { seed: 12 });
  let lost = 0;
  let guard = 0;
  while (!s.over && guard++ < 60) {
    const r = currentRound(s);
    const wrongs = figures.filter((f) => f.id !== r.figure.id).slice(0, MAX_ATTEMPTS);
    for (const w of wrongs) submitGuess(s, w.names[0]);
    lost += 1;
    if (!s.over) nextRound(s);
  }
  ok(lost === 3, 'infinite ends after three lost figures', `ended after ${lost}`);
}

/* ─────────────────────────  difficulty  ───────────────────────── */

section('difficulty');

// Remarkable must never leave the Hundred, in either scored mode. Checked over
// a long Perpetual queue rather than a single draw, since that mode eventually
// serves its whole pool.
for (const mode of ['gauntlet', 'infinite']) {
  const s = startSession(mode, { difficulty: 'remarkable', seed: 31 });
  const stray = s.figures.find((f) => f.rank === null);
  ok(!stray, `${mode} on Remarkable draws only from the Hundred`, stray?.id ?? '');
  ok(s.figures.length <= HUNDRED, `${mode} on Remarkable cannot exceed the Hundred`);
}

// Overall must actually reach past the Hundred, or the setting does nothing.
{
  const s = startSession('infinite', { difficulty: 'overall', seed: 32 });
  ok(s.figures.some((f) => f.rank === null), 'the Perpetual Edition on Overall reaches beyond the Hundred');
  ok(s.figures.length === figures.length, 'the Perpetual Edition on Overall serves the whole register');
}

// Both modes ramp: the opening figure comes from the easier end of the pool.
for (const difficulty of DIFFICULTIES) {
  const s = startSession('infinite', { difficulty, seed: 33 });
  const first = s.figures[0];
  const easiest = difficulty === 'remarkable'
    ? first.rank !== null && first.rank <= Math.ceil(HUNDRED / 3)
    : first.tier === 1;
  ok(easiest, `the Perpetual Edition on ${difficulty} opens from its easiest band`,
    `${first.id} (tier ${first.tier}, rank ${first.rank})`);
}

// The daily ignores the setting entirely — it is one figure for every reader.
{
  const a = startSession('daily', { difficulty: 'remarkable' });
  const b = startSession('daily', { difficulty: 'overall' });
  ok(a.figures[0].id === b.figures[0].id, 'the daily is the same figure at either difficulty');
  ok(a.difficulty === 'remarkable' && b.difficulty === 'remarkable',
    'the daily records itself as Remarkable whatever was selected');
}

// An absent or bogus difficulty must fall back rather than throw or draw empty.
{
  const s = startSession('gauntlet', { seed: 34 });
  ok(DIFFICULTIES.includes(s.difficulty), 'a session with no difficulty takes the default');
  const junk = startSession('gauntlet', { difficulty: 'nonsense', seed: 34 });
  ok(DIFFICULTIES.includes(junk.difficulty), 'an unknown difficulty falls back to the default');
}

/* ─────────────────────────  copy  ───────────────────────── */

section('copy');

// The two languages must define exactly the same keys. A key present in one
// only falls back to English silently, which is how a half-translated screen
// ships without anyone noticing.
{
  const en = new Set(keysFor('en'));
  const pt = new Set(keysFor('pt'));
  const missingPt = [...en].filter((k) => !pt.has(k));
  const extraPt = [...pt].filter((k) => !en.has(k));
  ok(missingPt.length === 0, 'every English key is translated', missingPt.join(', '));
  ok(extraPt.length === 0, 'no Portuguese key without an English original', extraPt.join(', '));
  ok(en.size > 100, 'the string table is loaded', `${en.size} keys`);

  // No key may be left empty in either language: an empty label renders as a
  // blank button rather than as an obvious gap.
  for (const lang of ['en', 'pt']) {
    setLang(lang);
    const blank = [...en].filter((k) => !String(t(k)).trim());
    ok(blank.length === 0, `no blank string in ${lang}`, blank.join(', '));
  }

  // Every key the markup asks for must exist, so a data-i18n typo fails here
  // rather than printing the raw key onto the page.
  const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
  const referenced = [...html.matchAll(/data-i18n(?:-aria|-placeholder)?="([^"]+)"/g)]
    .map((m) => m[1]);
  const unknown = [...new Set(referenced)].filter((k) => !en.has(k));
  ok(unknown.length === 0, 'every data-i18n key in the markup exists', unknown.join(', '));

  // Placeholders must actually interpolate, in both languages.
  for (const lang of ['en', 'pt']) {
    setLang(lang);
    const filled = [
      t('diff.overall.note', { n: 305 }),
      t('hundred.rank', { n: 7 }),
      t('help.register', { n: 305 }),
      t('verdict.inAttempts', { n: 2, max: MAX_ATTEMPTS }),
      t('round.worth', { n: 700 }),
      t('summary.tomorrow', { time: '07h 12m' }),
      t('hint.initialsBody', { initials: 'A. E.', counts: '6 letters' }),
    ].join(' ');
    ok(!/\{[a-z]+\}/i.test(filled), `every placeholder interpolates in ${lang}`, filled);
  }
  setLang('en');
}

/* ─────────────────────────  the daily  ───────────────────────── */

section('daily');

const pool = figures.filter((f) => f.tier <= 1);
const today = dayIndex();

ok(dailyPick(pool, today)?.id === dailyPick(pool, today)?.id, 'daily is deterministic for a day');
ok(dailyPick(pool, today)?.id !== undefined, 'daily resolves to a figure');

// No repeat within a full cycle of the pool.
{
  const seen = new Set();
  let collision = null;
  for (let i = 0; i < pool.length; i++) {
    const pickId = dailyPick(pool, today + i)?.id;
    if (seen.has(pickId)) { collision = pickId; break; }
    seen.add(pickId);
  }
  ok(collision === null, `no repeat within ${pool.length} days`, collision ? `repeated ${collision}` : '');
}

// Daily draws only from tier 1, so the shared puzzle is always fair.
{
  let offTier = null;
  for (let i = 0; i < Math.min(pool.length, 400); i++) {
    const f = dailyPick(pool, today + i);
    if (f && f.tier !== 1) { offTier = f.id; break; }
  }
  ok(offTier === null, 'daily only ever draws tier 1', offTier ?? '');
}

/* ─────────────────────────  report  ───────────────────────── */

console.log(`\n${'═'.repeat(62)}`);
if (failures === 0) {
  console.log(`  ALL PASS — ${checks} checks, ${figures.length} figures`);
} else {
  console.log(`  ${failures} FAILURE(S) out of ${checks} checks`);
}
console.log(`${'═'.repeat(62)}\n`);

process.exit(failures === 0 ? 0 : 1);
