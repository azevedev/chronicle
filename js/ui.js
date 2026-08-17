/**
 * ui.js — the application controller: DOM rendering, input handling, screens.
 *
 * Rules live in game.js; this file never decides anything about scoring or
 * correctness, it only asks and renders. The split is what lets the rules be
 * tested headlessly.
 */

import {
  t, pick, getLang, setLang, detectLang, LANGS, formatYear, formatSpan,
} from './i18n.js';
import { getFigures, poolByTier, lifespan, countryFor } from './data.js';
import { buildIndex, suggest, getFigure, normalize } from './search.js';
import {
  MODES, MAX_ATTEMPTS, startSession, currentRound, nextRound, submitGuess, skip,
  totalRounds, totalAttempts, isPerfect, hintsFor, potentialScore,
} from './game.js';
import { initMap, plotLife, clearMap } from './map.js';
import * as audio from './audio.js';
import * as store from './storage.js';
import { buildCard, copyCard } from './share.js';
import { dayIndex, dayKey, msUntilNextDay, formatCountdown, dailyPick } from './rng.js';
import { WIKI } from '../data/wiki.js';

const $ = (id) => document.getElementById(id);
const reduced = () => matchMedia('(prefers-reduced-motion: reduce)').matches;

let session = null;
let countdownTimer = null;

/** How long to wait on the hotlinked portrait before giving up on it. */
const PORTRAIT_TIMEOUT_MS = 6000;
let portraitTimer = null;
let activeSuggestions = [];
let suggestionIndex = -1;

/* ─────────────────────────  i18n plumbing  ───────────────────────── */

/** Fill every [data-i18n] node. Called on boot and on every language change. */
function applyI18n(root = document) {
  for (const el of root.querySelectorAll('[data-i18n]')) {
    el.textContent = t(el.dataset.i18n);
  }
  for (const el of root.querySelectorAll('[data-i18n-placeholder]')) {
    el.placeholder = t(el.dataset.i18nPlaceholder);
  }
  // Icon-only controls carry their name in aria-label instead of text.
  for (const el of root.querySelectorAll('[data-i18n-aria]')) {
    el.setAttribute('aria-label', t(el.dataset.i18nAria));
  }
  document.title = `${t('app.title')} — ${t('app.tagline')}`;
}

/**
 * Push the current settings onto every control that shows them. Sound and
 * language each have two buttons — one in the masthead toolbar, one in the
 * play bar — and they must never disagree.
 */
function syncSettingsUI() {
  const sound = audio.isSoundOn();
  const music = audio.isMusicOn();
  const lang = getLang().toUpperCase();

  for (const id of ['btn-sound', 'btn-sound-play']) {
    const el = $(id);
    if (!el) continue;
    el.setAttribute('aria-pressed', String(sound));
    el.classList.toggle('is-off', !sound);
  }
  for (const id of ['btn-lang', 'btn-lang-play']) {
    const el = $(id);
    if (el) el.textContent = lang;
  }

  const musicBtn = $('btn-music');
  musicBtn.setAttribute('aria-pressed', String(music));
  musicBtn.classList.toggle('is-off', !music);
}

function toggleSound() {
  const on = audio.setSound(!audio.isSoundOn());
  syncSettingsUI();
  if (on) audio.play('tick');
}

function toggleMusic() {
  audio.setMusic(!audio.isMusicOn());
  syncSettingsUI();
}

/* ─────────────────────────  screens  ───────────────────────── */

const SCREENS = ['home', 'round', 'verdict', 'summary', 'stats', 'archive'];

/**
 * Screens that constitute play. On these the masthead is withdrawn and the
 * slim play bar takes over, so the map and the guess are the only things
 * asking for attention. The verdict is included so nothing jumps between
 * answering and being told the answer.
 */
const PLAY_SCREENS = new Set(['round', 'verdict']);

function showScreen(name, opts = {}) {
  for (const s of SCREENS) {
    const el = $(`screen-${s}`);
    if (el) el.hidden = s !== name;
  }

  const playing = PLAY_SCREENS.has(name);
  document.body.classList.toggle('is-playing', playing);
  $('playbar').hidden = !playing;

  if (opts.sound !== false) audio.play('page');
  window.scrollTo({ top: 0, behavior: reduced() ? 'auto' : 'smooth' });
}

/* ─────────────────────────  front page  ───────────────────────── */

function renderHome() {
  const today = dayIndex();
  const stats = store.getStats();
  const played = store.getDaily(dayKey(today));

  $('home-streak').textContent = store.currentStreak(today);
  $('home-best-gauntlet').textContent = stats.bestGauntlet.toLocaleString();
  $('home-best-infinite').textContent = stats.bestInfinite.toLocaleString();
  $('roster-count').textContent = getFigures().length;
  $('edition-no').textContent = `№ ${today.toLocaleString()}`;

  // The daily can only be played once; afterwards the button reopens the result.
  const dailyBtn = document.querySelector('[data-play="daily"] span');
  const dailyCard = document.querySelector('.mode-card[data-mode="daily"]');
  if (played) {
    dailyBtn.textContent = t('mode.done');
    dailyCard.classList.add('is-done');
  } else {
    dailyBtn.textContent = t('mode.play');
    dailyCard.classList.remove('is-done');
  }

  startCountdown();
}

function startCountdown() {
  clearInterval(countdownTimer);
  const tick = () => {
    const text = formatCountdown(msUntilNextDay());
    const home = $('home-countdown');
    if (home) home.textContent = text;
    const sum = $('summary-countdown');
    if (sum && !sum.hidden) sum.textContent = t('summary.tomorrow', { time: text });
  };
  tick();
  countdownTimer = setInterval(tick, 1000);
}

/* ─────────────────────────  the round  ───────────────────────── */

function renderRound() {
  const round = currentRound(session);
  const f = round.figure;

  $('round-mode').textContent = t(`summary.${session.mode}`);
  $('round-ordinal').textContent = round.ordinal;
  // "Dispatch 1 of 1" is noise in a single-round mode; the Perpetual Edition
  // has no total at all.
  const total = totalRounds(session);
  $('round-of-wrap').hidden = total === null || total <= 1;
  if (total !== null) $('round-total').textContent = total;
  $('round-score').textContent = session.totalScore.toLocaleString();

  // The two facts the player actually gets.
  showPlace('birth', f, 'born');
  showPlace('death', f, 'died');

  const age = lifespan(f);
  $('rec-age').textContent = age === null ? '' : `${t('round.aged')} ${age}`;

  $('tradition-note').hidden = !f.legendary;

  // Reveal the screen BEFORE plotting. The map sizes its pins and its inset
  // from measured layout, and inside a hidden screen every measurement comes
  // back as zero.
  showScreen('round');
  plotLife(f);

  renderAttempts(round);
  renderHints(round);
  renderTried(round);

  const input = $('guess-input');
  input.value = '';
  input.disabled = false;
  $('btn-submit').disabled = false;
  $('btn-skip').disabled = false;
  hideSuggestions();
  hideNotice();

  // Only take focus on a pointer-driven screen. On a phone, focusing the field
  // throws up the on-screen keyboard the instant the round opens, which covers
  // the map and the dates before the player has read either of them.
  // Tested as "wide AND not touch-primary" rather than "has a fine pointer":
  // some desktop environments report `pointer: none`, and requiring `fine`
  // would silently drop the focus there too.
  const wide = matchMedia('(min-width: 48rem)').matches;
  const touchPrimary = matchMedia('(pointer: coarse)').matches;
  if (wide && !touchPrimary) {
    if (reduced()) input.focus({ preventScroll: true });
    else setTimeout(() => input.focus({ preventScroll: true }), 350);
  }
}

/**
 * Fill one record card: settlement, country, year.
 *
 * Many place strings already carry their country ("Smiljan, Croatia"), and the
 * country now has a line of its own, so the trailing repeat is stripped. Only
 * an exact match is removed: "Ajaccio, Corsica" keeps Corsica and gains France
 * beneath it, which is the more useful pair of facts.
 */
function showPlace(slot, figure, key) {
  const point = figure[key];
  const country = countryFor(figure.id, key);
  const countryName = country ? pick(country) : '';

  let place = pick(point.place);
  if (countryName) {
    const parts = place.split(',');
    if (parts.length > 1 && normalize(parts[parts.length - 1]) === normalize(countryName)) {
      place = parts.slice(0, -1).join(',').trim();
    }
  }

  $(`rec-${slot}-place`).textContent = place;
  $(`rec-${slot}-country`).textContent = countryName;
  $(`rec-${slot}-year`).textContent = formatYear(point.year, { circa: figure.circa });
}

/** Three marks: spent ones blotted, the rest open. */
function renderAttempts(round) {
  const host = $('attempts-marks');
  host.replaceChildren();
  for (let i = 0; i < MAX_ATTEMPTS; i++) {
    const mark = document.createElement('span');
    const spent = i < round.attempt;
    mark.className = `attempts__mark${spent ? ' is-spent' : ''}`;
    mark.textContent = spent ? '▨' : '▢';
    host.appendChild(mark);
  }
  // Show the stake. Choosing between guessing now and taking another hint is
  // the whole decision the game asks for, and it can't be made well if the
  // cost of the hint is invisible.
  const worth = $('attempts-worth');
  const potential = round.done ? 0 : potentialScore(round.figure, round.attempt);
  worth.textContent = potential > 0 ? t('round.worth', { n: potential.toLocaleString() }) : '';
}

function renderHints(round, animateLast = false) {
  const list = $('hints-list');
  const hints = hintsFor(round.figure);
  list.replaceChildren();
  $('hints-empty').hidden = round.hintsShown > 0;

  for (let i = 0; i < round.hintsShown; i++) {
    const h = hints[i];
    const li = document.createElement('li');
    li.className = 'hint';
    if (animateLast && i === round.hintsShown - 1 && !reduced()) li.classList.add('is-new');

    const title = document.createElement('h4');
    title.className = 'hint__title';
    title.textContent = h.title;

    const body = document.createElement('p');
    body.className = 'hint__body';
    body.textContent = h.body;

    li.append(title, body);
    list.appendChild(li);
  }
}

function renderTried(round) {
  const list = $('tried-list');
  list.replaceChildren();
  for (const g of round.guesses) {
    const li = document.createElement('li');
    li.className = g.skipped ? 'tried__item tried__item--skip' : 'tried__item';
    li.textContent = g.skipped ? `— ${t('round.skip')} —` : g.label;
    list.appendChild(li);
  }
}

/* ─────────────────────────  guessing  ───────────────────────── */

function showNotice(message, kind = 'warn') {
  const el = $('guess-notice');
  el.textContent = message;
  el.className = `notice notice--${kind}`;
  el.hidden = false;
}

function hideNotice() {
  $('guess-notice').hidden = true;
}

function hideSuggestions() {
  const list = $('suggestions');
  list.hidden = true;
  list.replaceChildren();
  activeSuggestions = [];
  suggestionIndex = -1;
  $('guess-input').setAttribute('aria-expanded', 'false');
}

function renderSuggestions(query) {
  const list = $('suggestions');
  activeSuggestions = suggest(query);
  suggestionIndex = -1;

  if (!activeSuggestions.length) {
    hideSuggestions();
    return;
  }

  list.replaceChildren();
  activeSuggestions.forEach((item, i) => {
    const li = document.createElement('li');
    li.className = 'combo__option';
    li.id = `sugg-${i}`;
    li.setAttribute('role', 'option');
    li.setAttribute('aria-selected', 'false');
    li.textContent = item.label;
    li.addEventListener('mousedown', (e) => {
      // mousedown, not click: the input's blur would close the list first.
      e.preventDefault();
      commitGuess(item.label);
    });
    list.appendChild(li);
  });

  list.hidden = false;
  $('guess-input').setAttribute('aria-expanded', 'true');
}

function moveSuggestion(delta) {
  if (!activeSuggestions.length) return;
  const options = [...$('suggestions').children];
  if (suggestionIndex >= 0) options[suggestionIndex]?.setAttribute('aria-selected', 'false');
  suggestionIndex = (suggestionIndex + delta + options.length) % options.length;
  const active = options[suggestionIndex];
  active.setAttribute('aria-selected', 'true');
  active.scrollIntoView({ block: 'nearest' });
  $('guess-input').value = activeSuggestions[suggestionIndex].label;
  audio.play('tick');
}

function lockRound() {
  $('guess-input').disabled = true;
  $('btn-submit').disabled = true;
  $('btn-skip').disabled = true;
  hideSuggestions();
}

function commitGuess(text) {
  const value = (text ?? $('guess-input').value).trim();
  if (!value) return;

  const outcome = submitGuess(session, value);
  const round = currentRound(session);

  switch (outcome.type) {
    case 'unknown':
      showNotice(t('round.noMatch'));
      audio.play('wrong', { volume: 0.3 });
      shake($('guess-input'));
      return;

    case 'repeat':
      showNotice(t('round.alreadyTried'));
      audio.play('tick');
      shake($('guess-input'));
      return;

    case 'correct':
      hideNotice();
      lockRound();
      audio.play('ding');
      audio.duck();
      setTimeout(() => audio.play('correct'), 260);
      renderAttempts(round);
      renderTried(round);
      setTimeout(() => showVerdict(round), 900);
      return;

    case 'wrong':
    case 'lost': {
      hideNotice();
      $('guess-input').value = '';
      audio.play('wrong');
      shake($('guess-input'));
      renderAttempts(round);
      renderTried(round);

      if (outcome.type === 'lost') {
        lockRound();
        setTimeout(() => showVerdict(round), 700);
      } else {
        renderHints(round, true);
        setTimeout(() => audio.play('hint'), 260);
        hideSuggestions();
      }
      return;
    }

    default:
      return;
  }
}

function commitSkip() {
  const outcome = skip(session);
  const round = currentRound(session);

  audio.play('crumple');
  renderAttempts(round);
  renderTried(round);
  $('guess-input').value = '';
  hideSuggestions();
  hideNotice();

  if (outcome.type === 'lost') {
    lockRound();
    setTimeout(() => showVerdict(round), 700);
  } else {
    renderHints(round, true);
    setTimeout(() => audio.play('hint'), 220);
  }
}

function shake(el) {
  if (reduced()) return;
  el.classList.remove('is-shaking');
  void el.offsetWidth; // restart the animation
  el.classList.add('is-shaking');
}

/* ─────────────────────────  verdict  ───────────────────────── */

/**
 * Portrait and "read further" link on the verdict sheet.
 *
 * The portrait is the only network request the game makes, so it is treated as
 * a bonus rather than a dependency: it starts hidden, and is only revealed once
 * the image has actually decoded. An offline player, a blocked referrer or a
 * dead Wikimedia URL all end in the same place, which is the sheet as it looked
 * before portraits existed.
 *
 * The link goes to the article in the player's own language when one exists,
 * falling back to English.
 */
function renderWiki(figure) {
  const entry = WIKI[figure.id];
  const link = $('verdict-wiki');
  const fig = $('verdict-portrait');
  const img = $('verdict-portrait-img');
  const credit = $('verdict-portrait-credit');

  fig.hidden = true;
  img.removeAttribute('src');

  if (!entry) {
    link.hidden = true;
    return;
  }

  const title = (getLang() === 'pt' && entry.pt) ? entry.pt : entry.en;
  const host = (getLang() === 'pt' && entry.pt) ? 'pt' : 'en';
  link.href = `https://${host}.wikipedia.org/wiki/${encodeURIComponent(title.replace(/ /g, '_'))}`;
  link.hidden = false;

  if (!entry.img) return;

  img.alt = pick(figure.names);
  // Reveal only once the image is actually there; onerror leaves the sheet
  // portrait-less, which is the offline and blocked-request path too.
  //
  // Note there is no loading="lazy" on this image on purpose: the verdict is
  // still display:none when this runs, so a lazy image would sit un-fetched
  // waiting to approach a viewport it is not in yet, and the portrait would
  // never appear.
  clearTimeout(portraitTimer);
  const settle = (shown) => {
    clearTimeout(portraitTimer);
    fig.hidden = !shown;
  };
  img.onload = () => settle(true);
  img.onerror = () => settle(false);

  // Give up on a slow portrait rather than leaving a request hanging on a
  // third party we do not control. Clearing src cancels the fetch; the verdict
  // simply renders without a picture, exactly as it does offline.
  portraitTimer = setTimeout(() => {
    if (!img.complete || img.naturalWidth === 0) {
      img.removeAttribute('src');
      fig.hidden = true;
    }
  }, PORTRAIT_TIMEOUT_MS);

  img.src = entry.img;
  // A cached image can finish before the handler is attached.
  if (img.complete && img.naturalWidth > 0) settle(true);

  const label = entry.lic
    ? `${t('verdict.portraitCredit')} (${entry.lic})`
    : t('verdict.portraitCredit');
  credit.textContent = label;
  credit.href = entry.file
    ? `https://commons.wikimedia.org/wiki/${encodeURIComponent(entry.file.replace(/ /g, '_'))}`
    : link.href;
}



function showVerdict(round, opts = {}) {
  const f = round.figure;
  const won = round.won;
  // `replay` re-renders an already-visible verdict (after a language change),
  // so the stamp shouldn't slam down a second time and the award shouldn't
  // count up again.
  const replay = opts.replay === true;

  const stamp = $('verdict-stamp');
  stamp.className = `broadside__stamp ${won ? 'is-correct' : 'is-failed'}`;
  $('verdict-stamp-text').textContent = won ? t('verdict.correct') : t('verdict.failed');

  $('verdict-name').textContent = pick(f.names);
  $('verdict-span').textContent = formatSpan(f.born.year, f.died.year, { circa: f.circa });
  $('verdict-deed').textContent = pick(f.deed);
  $('verdict-birth').textContent = `${pick(f.born.place)} · ${formatYear(f.born.year, { circa: f.circa })}`;
  $('verdict-death').textContent = `${pick(f.died.place)} · ${formatYear(f.died.year, { circa: f.circa })}`;

  const age = lifespan(f);
  $('verdict-life').textContent = age === null ? t('round.unknownAge') : `${age} ${t('verdict.years')}`;

  $('verdict-attempts').textContent = won
    ? (round.attempt === 1 ? t('verdict.inAttempt') : t('verdict.inAttempts', { n: round.attempt }))
    : '';

  const award = $('verdict-award');
  award.classList.toggle('is-empty', !won);
  award.querySelector('.award__label').textContent =
    won ? t('verdict.pointsAwarded') : t('verdict.noPoints');
  $('verdict-points').textContent = won ? round.score.toLocaleString() : '—';

  renderWiki(f);

  $('btn-next').textContent = session.over ? t('verdict.finish') : t('verdict.next');

  if (replay) {
    stamp.classList.add('is-stamped');
    $('verdict-points').textContent = won ? round.score.toLocaleString() : '—';
    return;
  }

  showScreen('verdict', { sound: false });

  // The stamp lands a beat after the sheet settles.
  setTimeout(() => {
    audio.play('stamp');
    stamp.classList.add('is-stamped');
  }, reduced() ? 0 : 420);

  if (!won) setTimeout(() => audio.play('gong', { volume: 0.4 }), 800);
  if (won && round.score > 0) countUp($('verdict-points'), round.score);
}

/** Tally the award upward, ticking as it goes. */
function countUp(el, target) {
  if (reduced()) {
    el.textContent = target.toLocaleString();
    return;
  }
  const duration = 700;
  const start = performance.now();
  let lastTick = 0;
  const step = (now) => {
    const k = Math.min(1, (now - start) / duration);
    const eased = 1 - (1 - k) ** 3;
    const value = Math.round(target * eased);
    el.textContent = value.toLocaleString();
    if (now - lastTick > 90 && k < 1) {
      audio.play('tick', { volume: 0.12 });
      lastTick = now;
    }
    if (k < 1) requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
}

function advance() {
  if (session.over) {
    finishSession();
    return;
  }
  const round = nextRound(session);
  if (!round) {
    finishSession();
    return;
  }
  clearMap();
  audio.play('unfurl');
  renderRound();
}

/* ─────────────────────────  session summary  ───────────────────────── */

function finishSession() {
  // Record before rendering, so the streak shown is the updated one.
  if (!session.practice) {
    if (session.mode === 'daily') {
      const r = session.rounds[0];
      store.recordDaily(session.dayKey, session.dayIndex, {
        won: r.won,
        attempts: r.attempt,
        score: r.score,
        figureId: r.figure.id,
      });
    } else if (session.mode === 'gauntlet') {
      store.recordGauntlet(session.totalScore);
    } else if (session.mode === 'infinite') {
      store.recordInfinite(session.solved);
    }
  }
  renderSummary(session);
}

function renderSummary(s) {
  $('summary-mode').textContent =
    (s.practice ? `${t('archive.practice')} · ` : '') + t(`summary.${s.mode}`);
  $('summary-score').textContent = s.totalScore.toLocaleString();
  $('summary-solved').textContent = `${s.solved} / ${s.rounds.length}`;
  $('summary-attempts').textContent = totalAttempts(s);

  const streakWrap = $('summary-streak-wrap');
  const isScoredDaily = s.mode === 'daily' && !s.practice;
  streakWrap.hidden = !isScoredDaily;
  if (isScoredDaily) $('summary-streak').textContent = store.currentStreak(s.dayIndex ?? dayIndex());

  $('summary-perfect').hidden = !isPerfect(s);

  // Per-round breakdown, naming each figure now that the session is over.
  const list = $('summary-rounds');
  list.replaceChildren();
  for (const r of s.rounds) {
    const li = document.createElement('li');
    li.className = `scorelist__row${r.won ? '' : ' is-lost'}`;

    const name = document.createElement('span');
    name.className = 'scorelist__name';
    name.textContent = pick(r.figure.names);

    const marks = document.createElement('span');
    marks.className = 'scorelist__marks';
    marks.textContent = markRow(r);

    const pts = document.createElement('span');
    pts.className = 'scorelist__points';
    pts.textContent = r.won ? `+${r.score.toLocaleString()}` : '—';

    li.append(name, marks, pts);
    list.appendChild(li);
  }

  const cd = $('summary-countdown');
  cd.hidden = !isScoredDaily;
  if (isScoredDaily) cd.textContent = t('summary.tomorrow', { time: formatCountdown(msUntilNextDay()) });

  // Replaying the daily would let a player farm the same figure.
  $('btn-again').hidden = isScoredDaily;
  $('btn-share').hidden = s.practice;

  showScreen('summary', { sound: false });
  audio.play('page');
  if (s.solved > 0) setTimeout(() => audio.play('chime'), 400);
}

function markRow(round) {
  const marks = [];
  const upTo = round.won ? round.attempt - 1 : round.attempt;
  for (let i = 0; i < upTo; i++) marks.push('▨');
  if (round.won) marks.push('✦');
  while (marks.length < MAX_ATTEMPTS) marks.push('▢');
  return marks.join('');
}

/* ─────────────────────────  ledger  ───────────────────────── */

function renderStats() {
  const st = store.getStats();
  const empty = st.played === 0;
  $('stats-empty').hidden = !empty;
  $('stats-tally').hidden = empty;

  $('st-played').textContent = st.played;
  $('st-rate').textContent = st.played ? `${Math.round((st.won / st.played) * 100)}%` : '0%';
  $('st-streak').textContent = store.currentStreak(dayIndex());
  $('st-max').textContent = st.maxStreak;
  $('st-gauntlet').textContent = st.bestGauntlet.toLocaleString();
  $('st-infinite').textContent = st.bestInfinite;

  // Distribution bars, scaled to the most common outcome.
  const dist = $('st-dist');
  dist.replaceChildren();
  const counts = Array.from({ length: MAX_ATTEMPTS }, (_, i) => st.distribution[i + 1] ?? 0);
  const peak = Math.max(1, ...counts);

  counts.forEach((count, i) => {
    const row = document.createElement('div');
    row.className = 'dist__row';

    const label = document.createElement('span');
    label.className = 'dist__label';
    label.textContent = i + 1;

    const track = document.createElement('span');
    track.className = 'dist__track';
    const bar = document.createElement('span');
    bar.className = 'dist__bar';
    bar.style.width = `${Math.max(6, (count / peak) * 100)}%`;
    bar.textContent = count;
    track.appendChild(bar);

    row.append(label, track);
    dist.appendChild(row);
  });

  if (st.lost > 0) {
    const row = document.createElement('div');
    row.className = 'dist__row dist__row--lost';
    const label = document.createElement('span');
    label.className = 'dist__label';
    label.textContent = '†';
    const track = document.createElement('span');
    track.className = 'dist__track';
    const bar = document.createElement('span');
    bar.className = 'dist__bar dist__bar--lost';
    bar.style.width = `${Math.max(6, (st.lost / peak) * 100)}%`;
    bar.textContent = st.lost;
    track.appendChild(bar);
    row.append(label, track);
    dist.appendChild(row);
  }

  showScreen('stats');
}

/* ─────────────────────────  archive  ───────────────────────── */

const ARCHIVE_DAYS = 30;

function renderArchive() {
  const today = dayIndex();
  const list = $('archive-list');
  list.replaceChildren();

  const pool = poolByTier(1);
  let count = 0;

  for (let i = 1; i <= ARCHIVE_DAYS; i++) {
    const idx = today - i;
    const figure = dailyPick(pool, idx);
    if (!figure) continue;
    count += 1;

    const key = dayKey(idx);
    const record = store.getDaily(key);

    const li = document.createElement('li');
    li.className = 'archive__row';

    const date = document.createElement('span');
    date.className = 'archive__date';
    date.textContent = key;

    const status = document.createElement('span');
    const state = record ? (record.won ? 'solved' : 'lost') : 'unplayed';
    status.className = `archive__status is-${state}`;
    status.textContent = t(`archive.${state}`);

    // Past figures are already spent, so naming them here is not a spoiler —
    // but only once the day has actually been played.
    const name = document.createElement('span');
    name.className = 'archive__name';
    name.textContent = record ? pick(figure.names) : '· · ·';

    const btn = document.createElement('button');
    btn.className = 'btn btn--small';
    btn.type = 'button';
    btn.textContent = t('archive.play');
    btn.addEventListener('click', () => playArchive(idx));

    li.append(date, status, name, btn);
    list.appendChild(li);
  }

  $('archive-empty').hidden = count > 0;
  showScreen('archive');
}

function playArchive(idx) {
  session = startSession('daily', { dayIndex: idx, practice: true });
  audio.unlock();
  renderRound();
}

/* ─────────────────────────  session start  ───────────────────────── */

function begin(mode) {
  audio.unlock();

  if (mode === 'daily') {
    const today = dayIndex();
    const played = store.getDaily(dayKey(today));
    if (played) {
      showStoredDaily(played, today);
      return;
    }
  }

  session = startSession(mode);
  audio.play('unfurl');
  renderRound();
}

/**
 * Rebuild a summary for a daily that was already completed, so the player can
 * re-read and re-share the result without replaying it.
 */
function showStoredDaily(record, today) {
  const figure = getFigure(record.figureId) ?? dailyPick(poolByTier(1), today);
  session = {
    mode: 'daily',
    config: MODES.daily,
    figures: [figure],
    index: 0,
    rounds: [{
      figure,
      ordinal: 1,
      attempt: record.attempts,
      guesses: [],
      hintsShown: 0,
      done: true,
      won: record.won,
      score: record.score,
    }],
    totalScore: record.score,
    solved: record.won ? 1 : 0,
    losses: record.won ? 0 : 1,
    over: true,
    practice: false,
    dayKey: dayKey(today),
    dayIndex: today,
  };
  renderSummary(session);
}

/* ─────────────────────────  wiring  ───────────────────────── */

function toggleLanguage() {
  const next = LANGS[(LANGS.indexOf(getLang()) + 1) % LANGS.length];
  setLang(next);
  store.setSetting('lang', next);
  applyI18n();
  syncSettingsUI();
  audio.play('tick');

  // Re-render whatever is on screen. applyI18n only covers the static
  // [data-i18n] labels; everything written by JS — place names, hint bodies,
  // the deed, the score list — has to be rebuilt from the data.
  renderHome();

  if (!$('screen-round').hidden && session) {
    const round = currentRound(session);
    const typed = $('guess-input').value;
    renderRound();
    // renderRound resets the map, input and progress; restore the round.
    renderAttempts(round);
    renderHints(round);
    renderTried(round);
    $('guess-input').value = typed;
    if (round.done) lockRound();
  }
  if (!$('screen-verdict').hidden && session) {
    showVerdict(currentRound(session), { replay: true });
  }
  if (!$('screen-summary').hidden && session) renderSummary(session);
  if (!$('screen-stats').hidden) renderStats();
  if (!$('screen-archive').hidden) renderArchive();
}

function wire() {
  // Mode buttons.
  for (const btn of document.querySelectorAll('[data-play]')) {
    btn.addEventListener('click', () => begin(btn.dataset.play));
  }

  // Guess input.
  const input = $('guess-input');
  input.addEventListener('input', () => {
    hideNotice();
    renderSuggestions(input.value);
    audio.playKey();
  });

  input.addEventListener('keydown', (e) => {
    switch (e.key) {
      case 'ArrowDown': e.preventDefault(); moveSuggestion(1); break;
      case 'ArrowUp': e.preventDefault(); moveSuggestion(-1); break;
      case 'Escape': hideSuggestions(); break;
      case 'Enter':
        e.preventDefault();
        commitGuess(suggestionIndex >= 0 ? activeSuggestions[suggestionIndex].label : undefined);
        break;
      default: break;
    }
  });

  input.addEventListener('blur', () => setTimeout(hideSuggestions, 120));

  $('btn-submit').addEventListener('click', () => commitGuess());
  $('btn-skip').addEventListener('click', commitSkip);
  $('btn-next').addEventListener('click', advance);

  // Summary actions.
  $('btn-again').addEventListener('click', () => begin(session.mode));
  $('btn-summary-home').addEventListener('click', goHome);
  $('btn-share').addEventListener('click', async () => {
    const card = buildCard(session, { streak: store.currentStreak(dayIndex()) });
    const ok = await copyCard(card);
    const btn = $('btn-share');
    btn.textContent = ok ? t('summary.shared') : t('ui.error');
    audio.play(ok ? 'chime' : 'wrong');
    setTimeout(() => { btn.textContent = t('summary.share'); }, 2200);
  });

  // Toolbar.
  $('btn-home').addEventListener('click', goHome);
  $('btn-lang').addEventListener('click', toggleLanguage);
  $('btn-stats').addEventListener('click', renderStats);
  $('btn-archive').addEventListener('click', renderArchive);
  $('btn-stats-back').addEventListener('click', goHome);
  $('btn-archive-back').addEventListener('click', goHome);

  $('btn-sound').addEventListener('click', toggleSound);
  $('btn-music').addEventListener('click', toggleMusic);

  // Play-bar duplicates of the controls that stay useful mid-dispatch.
  $('btn-exit').addEventListener('click', goHome);
  $('btn-lang-play').addEventListener('click', toggleLanguage);
  $('btn-sound-play').addEventListener('click', toggleSound);

  $('btn-reset').addEventListener('click', () => {
    if (!confirm(t('stats.resetConfirm'))) return;
    store.resetAll();
    audio.play('crumple');
    renderStats();
    renderHome();
  });

  // Help dialog.
  const dialog = $('help-dialog');
  $('btn-help').addEventListener('click', () => {
    dialog.showModal();
    audio.play('page');
  });
  $('btn-help-close').addEventListener('click', () => dialog.close());
  dialog.addEventListener('click', (e) => {
    // Click on the backdrop (the dialog element itself) closes it.
    if (e.target === dialog) dialog.close();
  });

  /**
   * Start audio on the player's first real interaction.
   *
   * Browsers refuse to start audio without a user activation, and not every
   * event carries one: a modifier key, a Tab press, a scroll, or anything
   * dispatched programmatically fires the handler while the activation is
   * withheld. The previous version removed its listener on the first event of
   * any kind, so a stray one of those spent the unlock and left the music
   * silent for the rest of the session.
   *
   * This keeps listening until audio has actually started, then unhooks.
   */
  const ACTIVATION_EVENTS = ['pointerdown', 'pointerup', 'click', 'touchend', 'keydown'];

  const kickAudio = () => {
    audio.unlock();
    // unlock() resumes asynchronously, so check on the next turn.
    setTimeout(() => {
      if (!audio.isAudioSettled()) return;
      for (const ev of ACTIVATION_EVENTS) window.removeEventListener(ev, kickAudio);
    }, 250);
  };

  for (const ev of ACTIVATION_EVENTS) window.addEventListener(ev, kickAudio);
}

function goHome() {
  session = null;
  clearMap();
  renderHome();
  showScreen('home');
}

/* ─────────────────────────  boot  ───────────────────────── */

export async function boot() {
  const figures = getFigures();
  buildIndex(figures);

  const saved = store.getSettings();
  setLang(saved.lang ?? detectLang());
  audio.initFromSettings();
  audio.installVisibilityHandling();

  applyI18n();
  syncSettingsUI();

  await initMap($('map-host'));

  wire();
  renderHome();
  showScreen('home', { sound: false });

  // Try immediately. Most browsers will refuse without a gesture, but a player
  // who has allowed autoplay for this origin gets music from the first frame,
  // and the gesture listeners above cover everyone else.
  audio.unlock();

  document.body.classList.remove('is-loading');
  $('boot').hidden = true;
}
