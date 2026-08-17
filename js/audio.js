/**
 * audio.js — sound effects and the music bed.
 *
 * Two deliberately different mechanisms:
 *
 *   · One-shots go through the Web Audio API. They are short, need to overlap
 *     (three typewriter keys can be in flight at once) and need pitch variation,
 *     which an <audio> element can't give us.
 *
 *   · The music bed is a plain <audio> element with loop=true. Decoding the
 *     106-second theme into an AudioBuffer would cost ~37 MB of resident float
 *     data for no benefit; streaming it costs almost nothing.
 *
 * Nothing loads until the player's first gesture, both because browsers refuse
 * to start an AudioContext before one and because a muted player should never
 * pay to download audio at all. The music file in particular (~850 KB) is only
 * fetched if music is actually switched on.
 */

import { getSettings, setSetting } from './storage.js';

/**
 * Clips that exist as a numbered set rather than a single file. `play('page')`
 * resolves to one of page1..page5; the caller never names a variant.
 *
 * These are the sounds a player hears most: a screen change, a released hint,
 * a keystroke. One sample each and the game starts sounding like a machine
 * rather than a desk covered in paper.
 */
const VARIANTS = { key: 3, page: 5, hint: 3 };

const SINGLE = [
  'ding', 'correct', 'wrong', 'stamp', 'gong', 'chime',
  'rustle', 'crumple', 'unfurl', 'pin', 'tick',
];

const SFX = [
  ...SINGLE,
  ...Object.entries(VARIANTS).flatMap(([base, n]) =>
    Array.from({ length: n }, (_, i) => `${base}${i + 1}`),
  ),
];

/**
 * Per-clip mix, applied on top of the master gain. Set by ear, not by meter.
 * Keyed by BASE name, so every variant of a sound shares one level.
 */
const LEVELS = {
  key: 0.30,
  tick: 0.18, rustle: 0.35, pin: 0.45,
  hint: 0.55, page: 0.5, unfurl: 0.5, crumple: 0.5,
  ding: 0.5, chime: 0.5, stamp: 0.7, wrong: 0.6,
  correct: 0.6, gong: 0.55,
};

const MASTER = 0.9;

/**
 * The music bed sits deliberately low. It plays by default, so it has to be
 * quiet enough that nobody reaches for the toggle in the first ten seconds:
 * half the level the bed was originally mixed at.
 */
const MUSIC_VOLUME = 0.16;

let ctx = null;
let master = null;
const buffers = new Map();
let loading = null;

let music = null;
let musicReady = false;

let soundOn = true;
let musicOn = true;

/** 'ogg' where Vorbis is supported, otherwise 'mp3'. Safari needs the fallback. */
function pickFormat() {
  const probe = document.createElement('audio');
  const ogg = probe.canPlayType('audio/ogg; codecs="vorbis"');
  return ogg === 'probably' || ogg === 'maybe' ? 'ogg' : 'mp3';
}

const FORMAT = pickFormat();
const url = (name) => `assets/audio/${name}.${FORMAT}`;

function ensureContext() {
  if (ctx) return ctx;
  const AC = window.AudioContext || window.webkitAudioContext;
  if (!AC) {
    console.warn('[audio] Web Audio unsupported — running silent');
    return null;
  }
  ctx = new AC();
  master = ctx.createGain();
  master.gain.value = MASTER;
  master.connect(ctx.destination);
  return ctx;
}

async function loadOne(name) {
  const res = await fetch(url(name));
  if (!res.ok) throw new Error(`${res.status} for ${name}`);
  const bytes = await res.arrayBuffer();
  // Safari's older decodeAudioData is callback-only; wrap it either way.
  const buf = await new Promise((resolve, reject) => {
    const p = ctx.decodeAudioData(bytes, resolve, reject);
    if (p && typeof p.then === 'function') p.then(resolve, reject);
  });
  buffers.set(name, buf);
}

/** Fetch and decode every one-shot. Idempotent; failures degrade to silence. */
function preload() {
  if (loading) return loading;
  if (!ensureContext()) return Promise.resolve();
  loading = Promise.all(
    SFX.map((name) =>
      loadOne(name).catch((err) => console.warn(`[audio] could not load ${name}`, err)),
    ),
  );
  return loading;
}

/**
 * Called from the first real user gesture. Browsers start an AudioContext
 * suspended, and only a gesture may resume it.
 */
export async function unlock() {
  if (!soundOn && !musicOn) return;
  if (!ensureContext()) return;
  if (ctx.state === 'suspended') {
    try {
      await ctx.resume();
    } catch {
      /* the next gesture will try again */
    }
  }
  preload();
  if (musicOn) startMusic();
}

/**
 * Choose which variant of a set to play.
 *
 * Never the same one twice running: pure random repeats itself often enough at
 * these set sizes that the variety stops being audible, which defeats the
 * point of having variants at all.
 */
const lastVariant = new Map();

function resolveClip(name) {
  const count = VARIANTS[name];
  if (!count) return name;
  if (count === 1) return `${name}1`;

  const previous = lastVariant.get(name);
  let pick;
  do {
    pick = 1 + Math.floor(Math.random() * count);
  } while (pick === previous);
  lastVariant.set(name, pick);
  return `${name}${pick}`;
}

/** play('stamp') · play('page') · play('key', { rate: 1.08, volume: 0.4 }) */
export function play(name, opts = {}) {
  if (!soundOn || !ctx || ctx.state !== 'running') return;
  const buf = buffers.get(resolveClip(name));
  if (!buf) return; // still loading, or failed — never a hard error

  const src = ctx.createBufferSource();
  src.buffer = buf;
  // A little pitch scatter stops repeated one-shots sounding machine-stamped.
  src.playbackRate.value = opts.rate ?? 1 + (Math.random() - 0.5) * 0.06;

  const gain = ctx.createGain();
  gain.gain.value = (opts.volume ?? LEVELS[name] ?? 0.5) * MASTER;

  src.connect(gain).connect(master);
  src.start(0);
}

/** Typewriter keystroke. Variant choice and pitch scatter both come free. */
export function playKey() {
  play('key', { rate: 0.94 + Math.random() * 0.16 });
}

function ensureMusicElement() {
  if (music) return music;
  music = new Audio();
  music.src = `assets/audio/theme.${FORMAT}`;
  music.loop = true;
  music.preload = 'none';
  music.volume = 0;
  music.addEventListener('canplaythrough', () => {
    musicReady = true;
  });
  music.addEventListener('error', () => {
    console.warn('[audio] music failed to load');
  });
  return music;
}

/** Fade the bed in or out over `ms` rather than cutting it. */
function fadeMusic(to, ms = 900) {
  const el = ensureMusicElement();
  const from = el.volume;
  const start = performance.now();
  const step = (now) => {
    const k = Math.min(1, (now - start) / ms);
    el.volume = Math.max(0, Math.min(1, from + (to - from) * k));
    if (k < 1) requestAnimationFrame(step);
    else if (to === 0) el.pause();
  };
  requestAnimationFrame(step);
}

export function startMusic() {
  const el = ensureMusicElement();
  el.play().then(
    () => fadeMusic(MUSIC_VOLUME),
    () => {
      /* blocked until a gesture; unlock() will retry */
    },
  );
}

export function stopMusic() {
  if (music && !music.paused) fadeMusic(0, 600);
}

/** Duck the bed while a verdict sting plays, then bring it back. */
export function duck(ms = 1400) {
  if (!music || music.paused) return;
  fadeMusic(MUSIC_VOLUME * 0.3, 200);
  setTimeout(() => {
    if (musicOn && music && !music.paused) fadeMusic(MUSIC_VOLUME, 700);
  }, ms);
}

export function setSound(on) {
  soundOn = !!on;
  setSetting('sound', soundOn);
  if (soundOn) unlock();
  return soundOn;
}

export function setMusic(on) {
  musicOn = !!on;
  setSetting('music', musicOn);
  if (musicOn) {
    unlock();
    startMusic();
  } else {
    stopMusic();
  }
  return musicOn;
}

export const isSoundOn = () => soundOn;
export const isMusicOn = () => musicOn;
export const isMusicReady = () => musicReady;

/**
 * Read the player's saved preferences at boot.
 *
 * Both default to on, so `!== false` rather than `=== true`: a player who has
 * never touched the toggles gets sound and music, and one who switched either
 * off keeps it off.
 */
export function initFromSettings() {
  const s = getSettings();
  soundOn = s.sound !== false;
  musicOn = s.music !== false;
}
