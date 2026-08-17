/**
 * main.js — entry point.
 *
 * Boot is deliberately thin: everything it does is delegate to ui.boot(). The
 * only real work here is turning a boot failure into something the player can
 * read, rather than a blank cream rectangle and a console nobody will open.
 */

import { boot } from './ui.js';
import { t } from './i18n.js';

function showFailure(err) {
  console.error('[chronicle] boot failed', err);

  const bootEl = document.getElementById('boot');
  if (!bootEl) return;

  bootEl.hidden = false;
  bootEl.replaceChildren();
  bootEl.classList.add('boot--error');

  const title = document.createElement('h2');
  title.className = 'boot__title';
  title.textContent = t('ui.error');

  const body = document.createElement('p');
  body.className = 'boot__body';
  body.textContent = t('ui.errorBody');

  const detail = document.createElement('code');
  detail.className = 'boot__detail';
  detail.textContent = String(err?.message ?? err);

  bootEl.append(title, body, detail);
  document.body.classList.remove('is-loading');
}

boot().catch(showFailure);
