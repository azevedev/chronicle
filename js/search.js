/**
 * search.js — name resolution and autocomplete.
 *
 * The important design decision here: a guess is never fuzzy-compared against
 * the answer. It is first *resolved to a figure in the roster*, and only then
 * is that figure's id compared with the target's.
 *
 * Comparing strings directly would be a correctness bug rather than a nicety.
 * "napoleon i" is within edit distance 2 of "napoleon iii", so a tolerant
 * string match would accept the uncle for the nephew, Pliny the Elder for the
 * Younger, and George H. W. Bush for George W. Bush. Resolving first means a
 * typo can only ever land on one figure, and naming the wrong one is a miss.
 */

import { getLang } from './i18n.js';

/** Casefold, strip diacritics and punctuation, collapse spaces. */
export function normalize(s) {
  return (s ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // combining marks: José -> Jose
    .toLowerCase()
    .replace(/[.'’`_]/g, '')           // St. -> st, O'Keeffe -> okeeffe
    .replace(/[^a-z0-9]+/g, ' ')       // hyphens, commas -> space
    .trim()
    .replace(/\s+/g, ' ');
}

/** Particles that shouldn't stand alone as a surname alias. */
const PARTICLES = new Set([
  'de', 'da', 'do', 'del', 'della', 'di', 'du', 'van', 'von', 'der', 'den',
  'al', 'el', 'ibn', 'bin', 'the', 'of', 'la', 'le', 'ben', 'ap', 'mac', 'mc',
]);

/** Regnal numerals and suffixes we don't want to treat as a surname. */
const SUFFIXES = new Set([
  'i', 'ii', 'iii', 'iv', 'v', 'vi', 'vii', 'viii', 'ix', 'x', 'xi', 'xii',
  'xiii', 'xiv', 'xv', 'xvi', 'xvii', 'xviii', 'jr', 'sr', 'elder', 'younger',
  'great', 'conqueror',
]);

let index = null;      // normalized alias -> Set of figure ids
let byId = null;       // id -> figure
let displayList = null; // [{ id, label, norm }] for autocomplete, per language

/**
 * Build the lookup tables.
 *
 * Aliases come from three places, in descending authority:
 *   1. Both localised names.
 *   2. Hand-written `aka` entries (regnal names, common misspellings).
 *   3. An auto-derived surname — but only kept when it resolves to exactly one
 *      figure. "Einstein" is unambiguous and worth accepting; "Bach" is not,
 *      and gets dropped so it can never silently resolve to the wrong Bach.
 */
export function buildIndex(figures) {
  byId = new Map(figures.map((f) => [f.id, f]));
  index = new Map();

  const add = (alias, id) => {
    const key = normalize(alias);
    if (!key) return;
    if (!index.has(key)) index.set(key, new Set());
    index.get(key).add(id);
  };

  const autoSurnames = new Map(); // key -> Set of ids, kept separate

  for (const f of figures) {
    for (const n of f.names) add(n, f.id);
    for (const a of f.aka ?? []) add(a, f.id);

    // Derive a surname from each localised name.
    for (const n of f.names) {
      const parts = normalize(n).split(' ');
      while (parts.length > 1 && SUFFIXES.has(parts[parts.length - 1])) parts.pop();
      if (parts.length < 2) continue;
      let i = parts.length - 1;
      // Pull in particles: "van gogh", "da vinci", "de gaulle".
      while (i > 0 && PARTICLES.has(parts[i - 1])) i--;
      const surname = parts.slice(i).join(' ');
      if (surname.length < 3 || PARTICLES.has(surname)) continue;
      if (!autoSurnames.has(surname)) autoSurnames.set(surname, new Set());
      autoSurnames.get(surname).add(f.id);
    }
  }

  // Only promote a surname if it is unique and not already a full name.
  for (const [surname, ids] of autoSurnames) {
    if (ids.size === 1 && !index.has(surname)) index.set(surname, ids);
  }

  displayList = null;
  return index;
}

/** Autocomplete source for the current language, rebuilt on language change. */
function list() {
  const lang = getLang();
  if (displayList?.lang === lang) return displayList.items;
  const items = [...byId.values()].map((f) => {
    const label = f.names[lang === 'pt' ? 1 : 0] ?? f.names[0];
    return { id: f.id, label, norm: normalize(label) };
  });
  items.sort((a, b) => a.label.localeCompare(b.label));
  displayList = { lang, items };
  return items;
}

/** Levenshtein with an early bail-out once the budget is blown. */
function editDistance(a, b, max) {
  if (Math.abs(a.length - b.length) > max) return max + 1;
  let prev = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    const curr = [i];
    let best = i;
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      curr[j] = Math.min(prev[j] + 1, curr[j - 1] + 1, prev[j - 1] + cost);
      if (curr[j] < best) best = curr[j];
    }
    if (best > max) return max + 1;
    prev = curr;
  }
  return prev[b.length];
}

/** Typo budget: none for short names, up to two for long ones. */
function budget(len) {
  if (len <= 4) return 0;
  if (len <= 8) return 1;
  return 2;
}

/**
 * Resolve free text to a single figure, or null.
 *
 * Returns `{ figure, exact }`. `exact` is false when a typo was forgiven,
 * which the UI uses to echo back the corrected spelling.
 */
export function resolve(query) {
  const q = normalize(query);
  if (!q || !index) return null;

  const hit = index.get(q);
  if (hit) {
    // An alias shared by several figures is not a resolution.
    if (hit.size !== 1) return null;
    return { figure: byId.get([...hit][0]), exact: true };
  }

  // Typo tolerance, but only when one candidate is clearly the best.
  const max = budget(q.length);
  if (max === 0) return null;

  let best = null;
  let bestDist = max + 1;
  let ambiguous = false;

  for (const [key, ids] of index) {
    if (ids.size !== 1) continue;
    const id = [...ids][0];
    const d = editDistance(q, key, max);
    if (d > max) continue;

    if (d < bestDist) {
      bestDist = d;
      best = id;
      ambiguous = false;
    } else if (d === bestDist && id !== best) {
      // A tie only matters when it points at a *different* person. "aristotel"
      // sits two edits from both "aristotle" and "aristóteles", but those are
      // the same figure, so it resolves cleanly.
      ambiguous = true;
    }
  }

  if (!best || ambiguous) return null;
  return { figure: byId.get(best), exact: false };
}

/** Ranked autocomplete suggestions: prefix matches first, then word-starts, then substrings. */
export function suggest(query, limit = 7) {
  const q = normalize(query);
  if (q.length < 2) return [];

  const prefix = [];
  const wordStart = [];
  const contains = [];

  for (const item of list()) {
    if (item.norm.startsWith(q)) prefix.push(item);
    else if (item.norm.includes(` ${q}`)) wordStart.push(item);
    else if (item.norm.includes(q)) contains.push(item);
    if (prefix.length >= limit) break;
  }

  return [...prefix, ...wordStart, ...contains].slice(0, limit);
}

export const getFigure = (id) => byId?.get(id) ?? null;
export const rosterSize = () => byId?.size ?? 0;
