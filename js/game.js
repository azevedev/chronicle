/**
 * game.js — session and round state. No DOM, no rendering.
 *
 * A *session* is one run of a mode; a *round* is one figure inside it. The UI
 * layer drives this through `submitGuess` / `skip` / `nextRound` and reads back
 * plain data, which keeps the rules testable in isolation (`tools/check-game.mjs`).
 */

import { getFigures, poolByTier, theHundred } from './data.js';
import { resolve } from './search.js';
import { pick, fieldLabel, letterCount, t } from './i18n.js';
import { dailyPick, dayIndex, dayKey, hash, makeRng, shuffle } from './rng.js';

/**
 * Four attempts, three hints.
 *
 * The first attempt is unhinted — map and dates only. Each miss or skip after
 * that releases one hint, so by the fourth attempt the player has seen all
 * three and is playing for the smallest award. Miss that one and the dispatch
 * closes unscored.
 */
export const MAX_ATTEMPTS = 4;
export const MAX_HINTS = 3;

/** Award by attempt used: full for a first-attempt identification, then less. */
export const AWARD = [1000, 700, 400, 200];

/** Deeper cuts are worth more, so the Gauntlet isn't just a tier-1 lap. */
const TIER_MULTIPLIER = { 1: 1, 2: 1.15, 3: 1.3 };

export const MODES = {
  daily: { rounds: 1, lives: Infinity },
  gauntlet: { rounds: 5, lives: Infinity },
  infinite: { rounds: Infinity, lives: 3 },
};

/**
 * Difficulty — which part of the register a session draws from.
 *
 *   remarkable  the Hundred only: names a reader can be expected to know
 *   overall     the whole register, deeper cuts included
 *
 * It applies to the Gauntlet and the Perpetual Edition. The Daily Dispatch is
 * deliberately exempt: it is one figure for every reader in the world, and a
 * per-reader difficulty would fork it into two dailies with two streaks and two
 * incomparable result cards. It always draws from the Hundred.
 */
export const DIFFICULTIES = ['remarkable', 'overall'];
export const DEFAULT_DIFFICULTY = 'remarkable';

/** Modes the difficulty setting actually changes. */
export const SCALED_MODES = new Set(['gauntlet', 'infinite']);

export const difficultyOf = (session) =>
  (SCALED_MODES.has(session.mode) ? session.difficulty : 'remarkable');

/** Points a round would award if identified on the next attempt. */
export function potentialScore(figure, attempt) {
  const base = AWARD[attempt] ?? 0;
  return Math.round(base * (TIER_MULTIPLIER[figure.tier] ?? 1));
}

/**
 * The third hint: initials and letter counts, both derived from the *localised*
 * name so they stay truthful when the player switches language mid-round.
 */
export function initialsHint(figure) {
  const words = pick(figure.names).split(/\s+/).filter(Boolean);
  const initials = words.map((w) => `${w[0].toUpperCase()}.`).join(' ');
  const counts = words
    .map((w) => letterCount([...w].filter((c) => /\p{L}/u.test(c)).length))
    .join(', ');
  return t('hint.initialsBody', { initials, counts });
}

/** The hint texts for a round, in ladder order. */
export function hintsFor(figure) {
  return [
    { key: 'field', title: t('hint.field'), body: fieldLabel(figure.field) },
    { key: 'deed', title: t('hint.deed'), body: pick(figure.deed) },
    { key: 'initials', title: t('hint.initials'), body: initialsHint(figure) },
  ];
}

function makeRound(figure, ordinal) {
  return {
    figure,
    ordinal,          // 1-based position within the session
    attempt: 0,       // attempts consumed so far
    guesses: [],      // [{ text, figureId, correct, skipped }]
    hintsShown: 0,
    done: false,
    won: false,
    score: 0,
  };
}

/**
 * Split the Hundred into three bands by rank, so Remarkable can ramp the way
 * Overall ramps by tier — from the names everyone knows toward the edge of the
 * Hundred. Without this the Perpetual Edition on Remarkable would open on a
 * coin-flip between Jesus and Chopin.
 */
function hundredBands() {
  const ranked = theHundred();
  const size = Math.ceil(ranked.length / 3);
  return [
    ranked.slice(0, size),
    ranked.slice(size, size * 2),
    ranked.slice(size * 2),
  ];
}

/**
 * Choose the figures for a session.
 *
 * Daily is a pure function of the UTC day so every reader gets the same one.
 * The other modes seed from the clock, but go through the same shuffle so a
 * run never repeats a figure.
 */
function selectFigures(mode, difficulty, opts = {}) {
  if (mode === 'daily') {
    const idx = opts.dayIndex ?? dayIndex();
    const figure = dailyPick(poolByTier(1), idx);
    return figure ? [figure] : [];
  }

  const seed = opts.seed ?? hash(`chronicle-${mode}-${difficulty}-${Date.now()}`);
  const rng = makeRng(seed);

  // Remarkable never leaves the Hundred; Overall ramps across all three tiers.
  const bands = difficulty === 'remarkable'
    ? hundredBands().map((band) => shuffle(band, rng))
    : [1, 2, 3].map((tier) => shuffle(getFigures().filter((f) => f.tier === tier), rng));

  if (mode === 'gauntlet') {
    // Weighted toward the easier band, with a couple drawn from deeper in.
    return shuffle([...bands[0].slice(0, 3), ...bands[1].slice(0, 2)], rng);
  }

  // Infinite: one long queue, easiest band first so difficulty ramps.
  return [...bands[0], ...bands[1], ...bands[2]];
}

export function startSession(mode, opts = {}) {
  const cfg = MODES[mode];
  if (!cfg) throw new Error(`unknown mode: ${mode}`);

  // A mode the setting does not reach is always recorded as Remarkable rather
  // than as whatever the player happened to have selected, so the stored
  // session never claims a difficulty it did not actually play at.
  const difficulty = SCALED_MODES.has(mode)
    ? (DIFFICULTIES.includes(opts.difficulty) ? opts.difficulty : DEFAULT_DIFFICULTY)
    : 'remarkable';

  const figures = selectFigures(mode, difficulty, opts);
  if (!figures.length) throw new Error(`no figures available for mode ${mode}`);

  return {
    mode,
    difficulty,
    config: cfg,
    figures,
    index: 0,
    rounds: [makeRound(figures[0], 1)],
    totalScore: 0,
    solved: 0,
    losses: 0,
    over: false,
    practice: opts.practice === true, // Archive replays are unscored
    dayKey: mode === 'daily' ? dayKey(opts.dayIndex ?? dayIndex()) : null,
    dayIndex: mode === 'daily' ? (opts.dayIndex ?? dayIndex()) : null,
  };
}

export const currentRound = (s) => s.rounds[s.rounds.length - 1];

/** How many rounds this session will run, for "Dispatch 2 of 5". */
export function totalRounds(session) {
  return Number.isFinite(session.config.rounds) ? session.config.rounds : null;
}

/** Close out a round and fold it into the session totals. */
function finish(session, round, won) {
  round.done = true;
  round.won = won;
  round.score = won ? potentialScore(round.figure, round.attempt - 1) : 0;

  session.totalScore += round.score;
  if (won) session.solved += 1;
  else session.losses += 1;

  const roundsDone = session.rounds.length;
  const outOfRounds = Number.isFinite(session.config.rounds)
    ? roundsDone >= session.config.rounds
    : roundsDone >= session.figures.length;
  const outOfLives = session.losses >= session.config.lives;

  session.over = outOfRounds || outOfLives;
  return round;
}

/**
 * Offer a name.
 *
 * Returns an outcome object rather than throwing, because every failure here is
 * a normal gameplay state the UI needs to render:
 *
 *   unknown   — nothing in the register matches (does NOT cost an attempt)
 *   repeat    — already offered this round (does NOT cost an attempt)
 *   correct   — identified
 *   wrong     — a real figure, but the wrong one (costs an attempt)
 */
export function submitGuess(session, text) {
  const round = currentRound(session);
  if (round.done) return { type: 'closed' };

  const match = resolve(text);
  if (!match) return { type: 'unknown', text };

  const { figure: guessed, exact } = match;

  if (round.guesses.some((g) => g.figureId === guessed.id)) {
    return { type: 'repeat', figure: guessed };
  }

  const correct = guessed.id === round.figure.id;
  round.attempt += 1;
  round.guesses.push({
    text,
    figureId: guessed.id,
    label: pick(guessed.names),
    correct,
    skipped: false,
  });

  if (correct) {
    finish(session, round, true);
    return { type: 'correct', figure: guessed, corrected: !exact, round };
  }

  const exhausted = round.attempt >= MAX_ATTEMPTS;
  if (exhausted) {
    finish(session, round, false);
    return { type: 'lost', figure: guessed, round };
  }

  round.hintsShown = Math.min(round.attempt, MAX_HINTS);
  return { type: 'wrong', figure: guessed, round, hint: hintsFor(round.figure)[round.attempt - 1] };
}

/** Give up an attempt for a hint. Costs exactly what a wrong answer costs. */
export function skip(session) {
  const round = currentRound(session);
  if (round.done) return { type: 'closed' };

  round.attempt += 1;
  round.guesses.push({ text: null, figureId: null, label: null, correct: false, skipped: true });

  if (round.attempt >= MAX_ATTEMPTS) {
    finish(session, round, false);
    return { type: 'lost', round };
  }

  round.hintsShown = Math.min(round.attempt, MAX_HINTS);
  return { type: 'skipped', round, hint: hintsFor(round.figure)[round.attempt - 1] };
}

/** Advance to the next figure. Returns null when the session is finished. */
export function nextRound(session) {
  if (session.over) return null;
  session.index += 1;
  const figure = session.figures[session.index];
  if (!figure) {
    session.over = true;
    return null;
  }
  const round = makeRound(figure, session.index + 1);
  session.rounds.push(round);
  return round;
}

/** Attempts spent across the whole session. */
export const totalAttempts = (session) =>
  session.rounds.reduce((sum, r) => sum + r.attempt, 0);

/** True when every round was identified on the first attempt. */
export const isPerfect = (session) =>
  session.rounds.length > 0 && session.rounds.every((r) => r.won && r.attempt === 1);
