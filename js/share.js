/**
 * share.js — the spoiler-free result card.
 *
 * Wordle's coloured squares don't belong on a broadsheet, so the grid is set in
 * printers' marks instead: a filled block for a spent attempt, a compass star
 * for the identification. The figure's name never appears, and neither does
 * any hint text, so a card can be posted the same day it was played.
 */

import { t, getLang } from './i18n.js';
import { MAX_ATTEMPTS } from './game.js';

const MARK = {
  spent: '▨',   // an attempt burned on a miss or a skip
  found: '✦',   // the attempt that identified the subject
  unused: '▢',  // never needed
};

/** One row of marks per round, e.g. "▨✦▢". */
function row(round) {
  const marks = [];
  const upTo = round.won ? round.attempt - 1 : round.attempt;
  for (let i = 0; i < upTo; i++) marks.push(MARK.spent);
  if (round.won) marks.push(MARK.found);
  while (marks.length < MAX_ATTEMPTS) marks.push(MARK.unused);
  return marks.join('');
}

const DATE_FMT = { en: 'en-GB', pt: 'pt-BR' };

function formatDate(dayKeyStr) {
  if (!dayKeyStr) return '';
  const [y, m, d] = dayKeyStr.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d)).toLocaleDateString(DATE_FMT[getLang()] ?? 'en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  });
}

/** Build the plain-text card for a finished session. */
export function buildCard(session, extra = {}) {
  const lines = [];
  const title = t('app.title').toUpperCase();

  if (session.mode === 'daily') {
    lines.push(`${title} — ${t('summary.daily')}`);
    lines.push(formatDate(session.dayKey));
  } else {
    lines.push(`${title} — ${t(`summary.${session.mode}`)}`);
  }
  lines.push('');

  for (const r of session.rounds) {
    // Numbered only when there is more than one, so the daily card stays clean.
    const label = session.rounds.length > 1 ? `${String(r.ordinal).padStart(2, ' ')}. ` : '';
    lines.push(`${label}${row(r)}`);
  }

  lines.push('');
  lines.push(`${t('summary.totalScore')}: ${session.totalScore.toLocaleString()}`);

  if (session.mode === 'daily' && typeof extra.streak === 'number' && extra.streak > 0) {
    lines.push(`${t('summary.streak')}: ${extra.streak}`);
  }
  if (session.mode === 'infinite') {
    lines.push(`${t('summary.solved')}: ${session.solved}`);
  }

  lines.push('');
  lines.push(shareUrl());

  return lines.join('\n');
}

/** The page's own address, so a shared card links back to the game. */
function shareUrl() {
  const { origin, pathname } = window.location;
  if (origin.startsWith('file:')) return '';
  return `${origin}${pathname}`.replace(/index\.html$/, '');
}

/**
 * Copy to the clipboard, falling back to a hidden textarea + execCommand for
 * browsers that gate the async Clipboard API (older Safari, any non-secure
 * origin — which includes opening the file directly during development).
 */
export async function copyCard(text) {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    /* fall through to the legacy path */
  }

  try {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.setAttribute('readonly', '');
    ta.style.cssText = 'position:fixed;top:-9999px;opacity:0';
    document.body.appendChild(ta);
    ta.select();
    const ok = document.execCommand('copy');
    ta.remove();
    return ok;
  } catch (err) {
    console.warn('[share] copy failed', err);
    return false;
  }
}
