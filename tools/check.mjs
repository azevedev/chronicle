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
import { setLang, t } from '../js/i18n.js';
import {
  startSession, submitGuess, skip, nextRound, currentRound,
  hintsFor, MAX_ATTEMPTS, MAX_HINTS, DIFFICULTIES,
} from '../js/game.js';
import { dailyPick, dayIndex } from '../js/rng.js';

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

// Every string the new screens reach for must exist in both languages: a gap
// falls back to English silently, which is exactly the kind of thing that ships.
{
  const KEYS = [
    'diff.title', 'diff.remarkable', 'diff.overall', 'diff.remarkable.short',
    'diff.overall.short', 'diff.remarkable.note', 'diff.overall.note', 'diff.applies',
    'hundred.badge', 'hundred.rank', 'mode.daily.note',
    'archive.seen', 'archive.replay', 'archive.withheld',
    'help.lead', 'help.evidence.title', 'help.evidence', 'help.attempts.title',
    'help.attempts', 'help.award.title', 'help.award', 'help.award.attempt',
    'help.award.pays', 'help.award.note', 'help.editions.title', 'help.editions',
    'help.register.title', 'help.register', 'help.begin',
  ];
  for (const lang of ['en', 'pt']) {
    setLang(lang);
    const missing = KEYS.filter((k) => t(k) === k);
    ok(missing.length === 0, `every new key is set in ${lang}`, missing.join(', '));
  }
  // The two placeholder strings must actually interpolate.
  setLang('en');
  ok(!t('diff.overall.note', { n: 305 }).includes('{n}'), 'diff.overall.note interpolates');
  ok(!t('hundred.rank', { n: 7 }).includes('{n}'), 'hundred.rank interpolates');
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
