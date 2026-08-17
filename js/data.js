/**
 * data.js — normalises the authored roster into the shape the game uses, and
 * validates it.
 *
 * `data/figures.js` is written for a human to read and edit, so it uses terse
 * positional tuples for the birth/death records. This module expands those into
 * named fields once at boot, and checks every entry: with 300 hand-authored
 * records, a transposed latitude/longitude or a death before a birth is a
 * question of when, not whether. Better to see it in the console than to ship a
 * pin in the Indian Ocean.
 */

import { FIGURES } from '../data/figures.js';
import { FIELDS } from './i18n.js';

/**
 * A place may be a plain string when it reads the same in both languages
 * ("Ajaccio"), or an [en, pt] pair when it doesn't ("Florence" / "Florença").
 * Normalise both to a pair so `pick()` never has to branch.
 */
const pair = (v) => (Array.isArray(v) ? v : [v, v]);

function point([year, place, lat, lon]) {
  return { year, place: pair(place), lat, lon };
}

function normalizeFigure(raw) {
  return {
    id: raw.id,
    tier: raw.tier ?? 2,
    names: pair(raw.name),
    aka: raw.aka ?? [],
    field: raw.field,
    born: point(raw.born),
    died: point(raw.died),
    deed: pair(raw.deed),
    legendary: raw.legendary === true, // dates handed down, not documented
    circa: raw.circa === true,
  };
}

/**
 * Structural checks. Returns a list of human-readable problems; an empty list
 * means the roster is sound. Called at boot in development and by
 * `tools/check-data.mjs` in isolation.
 */
export function validate(figures) {
  const problems = [];
  const seen = new Set();

  for (const f of figures) {
    const at = `${f.id ?? '(no id)'}`;

    if (!f.id) problems.push(`${at}: missing id`);
    else if (seen.has(f.id)) problems.push(`${at}: duplicate id`);
    seen.add(f.id);

    if (!f.names[0] || !f.names[1]) problems.push(`${at}: name needs both languages`);
    if (!f.deed[0] || !f.deed[1]) problems.push(`${at}: deed hint needs both languages`);
    if (!FIELDS[f.field]) problems.push(`${at}: unknown field "${f.field}"`);
    if (![1, 2, 3].includes(f.tier)) problems.push(`${at}: tier must be 1, 2 or 3`);

    for (const [label, p] of [['born', f.born], ['died', f.died]]) {
      if (typeof p.year !== 'number' || !Number.isFinite(p.year)) {
        problems.push(`${at}: ${label} year is not a number`);
      }
      if (typeof p.lat !== 'number' || p.lat < -90 || p.lat > 90) {
        problems.push(`${at}: ${label} latitude ${p.lat} out of range`);
      }
      if (typeof p.lon !== 'number' || p.lon < -180 || p.lon > 180) {
        problems.push(`${at}: ${label} longitude ${p.lon} out of range`);
      }
      if (!p.place[0] || !p.place[1]) problems.push(`${at}: ${label} place needs both languages`);
    }

    const span = f.died.year - f.born.year;
    if (span < 0) problems.push(`${at}: died (${f.died.year}) before born (${f.born.year})`);
    // Nobody in this roster lived past ~100; a larger span means a typo.
    if (span > 105) problems.push(`${at}: implausible lifespan of ${span} years`);
  }

  return problems;
}

let cache = null;

/** The full roster, normalised once. */
export function getFigures() {
  if (cache) return cache;
  cache = FIGURES.map(normalizeFigure);

  const problems = validate(cache);
  if (problems.length) {
    console.error(
      `[data] ${problems.length} problem(s) in the roster:\n` +
        problems.map((p) => `  · ${p}`).join('\n'),
    );
  }
  return cache;
}

/** Figures at or below a difficulty tier. */
export function poolByTier(maxTier) {
  return getFigures().filter((f) => f.tier <= maxTier);
}

/** Lifespan in years, or null when the record is too vague to state one. */
export function lifespan(f) {
  const n = f.died.year - f.born.year;
  return Number.isFinite(n) && n >= 0 ? n : null;
}
