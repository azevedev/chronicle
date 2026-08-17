/**
 * rng.js — seeded randomness.
 *
 * The Daily Dispatch has to resolve to the same figure for every reader on the
 * planet with no server involved, so selection is a pure function of the UTC
 * date. Everything here is deterministic; nothing calls Math.random().
 */

/** FNV-1a, 32-bit. Small, fast, good enough to spread date strings. */
export function hash(str) {
  let h = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

/** mulberry32 — compact seeded PRNG returning floats in [0, 1). */
export function makeRng(seed) {
  let a = seed >>> 0;
  return function next() {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Fisher–Yates using a seeded source. Returns a new array. */
export function shuffle(items, rng) {
  const out = items.slice();
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

const DAY_MS = 86400000;

/** Days elapsed since 1970-01-01 in UTC — the Daily Dispatch's clock. */
export function dayIndex(date = new Date()) {
  return Math.floor(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()) / DAY_MS);
}

/** 'YYYY-MM-DD' in UTC. Used as the storage key for a day's result. */
export function dayKey(dayIdx = dayIndex()) {
  return new Date(dayIdx * DAY_MS).toISOString().slice(0, 10);
}

/** Milliseconds until the next UTC midnight, for the countdown on the summary. */
export function msUntilNextDay(now = new Date()) {
  return (dayIndex(now) + 1) * DAY_MS - now.getTime();
}

/** Fixed seed for the daily running order. Changing it reshuffles all dailies. */
const DAILY_SEED = 'chronicle-daily-order-v1';

/**
 * Pick the day's figure.
 *
 * One fixed permutation of the pool, indexed by the day. That guarantees
 * exactly N days between any two appearances of a figure, for a pool of N —
 * including across the wrap, which is the part that matters.
 *
 * An earlier version reshuffled the pool once per cycle, so the order stayed
 * fresh. It also meant a figure could land near the end of one cycle and near
 * the start of the next, putting the same person two days apart. A predictable
 * order every N days is a much smaller cost than a repeat inside a week.
 *
 * The pool is sorted by id first, so the daily depends only on *which* figures
 * are in the register, never on the order they happen to be written in.
 */
export function dailyPick(pool, dayIdx = dayIndex()) {
  if (!pool.length) return null;
  const stable = pool.slice().sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
  const order = shuffle(stable, makeRng(hash(DAILY_SEED)));
  const offset = ((dayIdx % order.length) + order.length) % order.length;
  return order[offset];
}

/** Human-readable countdown, e.g. "07h 12m". */
export function formatCountdown(ms) {
  const total = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  if (h > 0) return `${String(h).padStart(2, '0')}h ${String(m).padStart(2, '0')}m`;
  return `${String(m).padStart(2, '0')}m ${String(s).padStart(2, '0')}s`;
}
