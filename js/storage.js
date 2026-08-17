/**
 * storage.js — everything the game remembers, in localStorage.
 *
 * All state is local to the browser; nothing is transmitted anywhere. Every
 * read is defensive: a player with storage disabled (Safari private mode,
 * strict cookie settings) still gets a fully playable game, just without
 * persistence between sessions.
 */

const KEY = 'chronicle.v1';

/** Bump when a saved blob needs adjusting rather than just merging. */
const SCHEMA = 3;

const DEFAULTS = () => ({
  version: SCHEMA,
  settings: {
    lang: null,
    sound: true,
    music: true,
    difficulty: 'overall', // applies to the Gauntlet and the Perpetual Edition
  },
  // Set once the how-to-play sheet has been shown unprompted, so it opens on a
  // reader's first visit and never again.
  tutorialSeen: false,
  daily: {},        // 'YYYY-MM-DD' -> { won, attempts, score, figureId, guesses }
  // Back numbers whose figure the reader has already been shown — either by
  // playing the day for real, or by reading it in the Archive. The Archive
  // names those and keeps them silent otherwise, so it never spoils a day the
  // reader has not reached yet.
  //   'YYYY-MM-DD' -> { figureId, won: bool|null, practice: bool }
  seen: {},
  stats: {
    played: 0,
    won: 0,
    lost: 0,
    streak: 0,
    maxStreak: 0,
    lastDayIndex: null,
    distribution: { 1: 0, 2: 0, 3: 0, 4: 0 }, // attempts used on a win
    // Bests are kept per difficulty: a Gauntlet on Remarkable and one on
    // Overall are not the same feat, and folding them into one number would
    // quietly retire the harder score.
    best: {
      gauntlet: { remarkable: 0, overall: 0 },
      infinite: { remarkable: 0, overall: 0 },
    },
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

/**
 * Bring an older saved blob up to date.
 *
 * v1 -> v2: music used to default to OFF, so almost every v1 save carries
 * `music: false` as the old default rather than as a decision anyone made.
 * Merging alone would leave every returning player silent forever, with no
 * clue why. The new default is adopted once and the save is stamped, so a
 * player who then switches music off keeps it off.
 *
 * v2 -> v3: bests became per-difficulty. Everything played before the setting
 * existed was played against the whole register, so it carries over to Overall
 * rather than being split or discarded. Returning readers also keep the
 * tutorial closed — they have plainly already found their way around.
 */
function migrate(state, savedVersion) {
  if (!savedVersion || savedVersion < 2) {
    state.settings.music = true;
  }
  if (!savedVersion || savedVersion < 3) {
    const st = state.stats;
    st.best.gauntlet.overall = Math.max(st.best.gauntlet.overall, st.bestGauntlet ?? 0);
    st.best.infinite.overall = Math.max(st.best.infinite.overall, st.bestInfinite ?? 0);
    delete st.bestGauntlet;
    delete st.bestInfinite;
    if (st.played > 0) state.tutorialSeen = true;
  }
  state.version = SCHEMA;
  return state;
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
    if (raw) {
      const saved = JSON.parse(raw);
      // Pass the RAW version: the merged copy already carries the new
      // default from DEFAULTS, so checking it would always look up to date.
      memory = migrate(merge(base, saved), saved.version);
      // Persist the migration so it only ever happens once.
      if (saved.version !== SCHEMA) save();
    } else {
      memory = base;
    }
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

/** True the first time it is called on a fresh browser; false ever after. */
export function claimFirstVisit() {
  if (load().tutorialSeen) return false;
  update((s) => {
    s.tutorialSeen = true;
  });
  return true;
}

export function getSeen(key) {
  return load().seen[key] ?? null;
}

/** Every back number the reader has been shown, newest key last. */
export function allSeen() {
  return load().seen;
}

/**
 * Note that a day's figure has been revealed to this reader.
 *
 * A real play is the stronger claim, so it overwrites a previous practice read;
 * a practice read never downgrades a real one.
 */
export function markSeen(key, figureId, { won = null, practice = false } = {}) {
  return update((s) => {
    const prior = s.seen[key];
    if (prior && !prior.practice && practice) return;
    s.seen[key] = { figureId, won, practice };
  });
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

export function recordGauntlet(difficulty, score) {
  return update((s) => {
    const best = s.stats.best.gauntlet;
    best[difficulty] = Math.max(best[difficulty] ?? 0, score);
  });
}

export function recordInfinite(difficulty, solved) {
  return update((s) => {
    const best = s.stats.best.infinite;
    best[difficulty] = Math.max(best[difficulty] ?? 0, solved);
  });
}

/** Best score for one mode at one difficulty. */
export function bestFor(mode, difficulty) {
  return getStats().best?.[mode]?.[difficulty] ?? 0;
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
