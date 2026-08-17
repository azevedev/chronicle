/**
 * storage.js — everything the game remembers, in localStorage.
 *
 * All state is local to the browser; nothing is transmitted anywhere. Every
 * read is defensive: a player with storage disabled (Safari private mode,
 * strict cookie settings) still gets a fully playable game, just without
 * persistence between sessions.
 */

const KEY = 'chronicle.v1';

const DEFAULTS = () => ({
  settings: { lang: null, sound: true, music: false },
  daily: {},        // 'YYYY-MM-DD' -> { won, attempts, score, figureId, guesses }
  stats: {
    played: 0,
    won: 0,
    lost: 0,
    streak: 0,
    maxStreak: 0,
    lastDayIndex: null,
    distribution: { 1: 0, 2: 0, 3: 0 }, // attempts used on a win
    bestGauntlet: 0,
    bestInfinite: 0,
  },
});

let memory = null; // in-memory fallback when localStorage is unavailable
let warned = false;

function available() {
  try {
    const probe = '__chronicle_probe__';
    localStorage.setItem(probe, '1');
    localStorage.removeItem(probe);
    return true;
  } catch {
    if (!warned) {
      console.warn('[storage] localStorage unavailable — progress will not persist');
      warned = true;
    }
    return false;
  }
}

/** Deep-ish merge so a saved blob from an older build still loads. */
function merge(base, saved) {
  if (!saved || typeof saved !== 'object') return base;
  const out = { ...base };
  for (const [k, v] of Object.entries(saved)) {
    if (v && typeof v === 'object' && !Array.isArray(v) && base[k] && typeof base[k] === 'object') {
      out[k] = merge(base[k], v);
    } else if (v !== undefined) {
      out[k] = v;
    }
  }
  return out;
}

export function load() {
  if (memory) return memory;
  const base = DEFAULTS();
  if (!available()) {
    memory = base;
    return memory;
  }
  try {
    const raw = localStorage.getItem(KEY);
    memory = raw ? merge(base, JSON.parse(raw)) : base;
  } catch (err) {
    console.warn('[storage] could not parse saved state, starting fresh', err);
    memory = base;
  }
  return memory;
}

export function save() {
  if (!memory || !available()) return;
  try {
    localStorage.setItem(KEY, JSON.stringify(memory));
  } catch (err) {
    console.warn('[storage] could not save', err);
  }
}

/** update(state => { ... }) — mutate then persist. */
export function update(fn) {
  const state = load();
  fn(state);
  save();
  return state;
}

export function getSettings() {
  return load().settings;
}

export function setSetting(key, value) {
  return update((s) => {
    s.settings[key] = value;
  }).settings;
}

export function getStats() {
  return load().stats;
}

export function getDaily(key) {
  return load().daily[key] ?? null;
}

/** Record a finished Daily Dispatch and roll the streak forward. */
export function recordDaily(key, dayIdx, result) {
  return update((s) => {
    if (s.daily[key]) return; // a day is only ever scored once
    s.daily[key] = result;

    const st = s.stats;
    st.played += 1;
    if (result.won) {
      st.won += 1;
      st.distribution[result.attempts] = (st.distribution[result.attempts] ?? 0) + 1;
      // Consecutive only if yesterday was also played and won.
      st.streak = st.lastDayIndex === dayIdx - 1 ? st.streak + 1 : 1;
      st.maxStreak = Math.max(st.maxStreak, st.streak);
    } else {
      st.lost += 1;
      st.streak = 0;
    }
    st.lastDayIndex = dayIdx;
  });
}

export function recordGauntlet(score) {
  return update((s) => {
    s.stats.bestGauntlet = Math.max(s.stats.bestGauntlet, score);
  });
}

export function recordInfinite(solved) {
  return update((s) => {
    s.stats.bestInfinite = Math.max(s.stats.bestInfinite, solved);
  });
}

/**
 * The streak shown on screen. The stored value is only correct up to the last
 * day played — if the player skipped yesterday, the streak is already broken
 * even though nothing has written to storage since.
 */
export function currentStreak(todayIdx) {
  const st = getStats();
  if (st.lastDayIndex === null) return 0;
  const gap = todayIdx - st.lastDayIndex;
  return gap <= 1 ? st.streak : 0;
}

export function resetAll() {
  memory = DEFAULTS();
  if (available()) {
    try {
      localStorage.removeItem(KEY);
    } catch {
      /* nothing more we can do */
    }
  }
  return memory;
}
