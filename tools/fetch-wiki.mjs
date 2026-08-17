#!/usr/bin/env node
/**
 * fetch-wiki.mjs — resolve each figure to its Wikipedia article and portrait.
 *
 * Writes data/wiki.js with, per figure: the English and Portuguese article
 * titles, a direct thumbnail URL on upload.wikimedia.org, and the credit line
 * its licence requires.
 *
 * On the runtime tradeoff: the portrait is hotlinked, so the verdict screen is
 * the one place the game reaches the network. Everything else stays local, and
 * js/ui.js treats the image as strictly optional — if it fails to load, or the
 * player is offline, the sheet renders without it and the round is unaffected.
 *
 * Resolving at build time rather than calling the API in the browser means one
 * image request per verdict instead of an API round-trip plus an image, and no
 * API dependency in the shipped game.
 *
 * Attribution is captured because it is owed: a public-domain portrait needs
 * none, but the CC-BY and CC-BY-SA ones do, and the game displays them.
 *
 * Run:  node tools/fetch-wiki.mjs
 */
import { writeFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { FIGURES } from '../data/figures.js';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const OUT = resolve(ROOT, 'data/wiki.js');

const UA = 'chronicle-game-assetbot/1.0 (article + portrait resolution for an offline history game)';
const EN = 'https://en.wikipedia.org/w/api.php';
const COMMONS = 'https://commons.wikimedia.org/w/api.php';

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const chunk = (a, n) => { const o = []; for (let i = 0; i < a.length; i += n) o.push(a.slice(i, i + n)); return o; };
const strip = (h) => (h ?? '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();

/** Wikimedia rate-limits hard; back off and retry rather than losing rows. */
async function api(base, params) {
  const url = `${base}?${new URLSearchParams({ format: 'json', formatversion: '2', ...params })}`;
  let lastErr;
  for (let attempt = 0; attempt < 6; attempt++) {
    try {
      const res = await fetch(url, { headers: { 'User-Agent': UA } });
      if (res.ok) return res.json();
      lastErr = new Error(`${res.status} ${res.statusText}`);
    } catch (err) {
      lastErr = err;
    }
    await sleep(1200 * (attempt + 1));
  }
  throw lastErr;
}

/* ── 1. articles, interwiki, and a portrait thumbnail ─────────────────── */

const rows = new Map();      // figure id -> row
const needSearch = [];

async function lookup(titles) {
  return api(EN, {
    action: 'query',
    titles: titles.join('|'),
    redirects: '1',
    prop: 'pageimages|langlinks',
    lllang: 'pt',
    lllimit: '500',
    piprop: 'thumbnail|name',
    pithumbsize: '480',
  });
}

function absorb(data, wanted) {
  const q = data.query ?? {};
  const back = new Map();
  for (const n of q.normalized ?? []) back.set(n.to, n.from);
  for (const r of q.redirects ?? []) back.set(r.to, r.from);

  const found = new Map();
  for (const p of q.pages ?? []) {
    if (p.missing) continue;
    const asked = back.get(p.title) ?? p.title;
    found.set(asked, {
      en: p.title,
      pt: p.langlinks?.[0]?.title ?? null,
      thumb: p.thumbnail?.source ?? null,
      file: p.pageimage ? `File:${p.pageimage}` : null,
    });
    found.set(p.title, found.get(asked));
  }
  return wanted.map((w) => found.get(w) ?? null);
}

console.log(`resolving ${FIGURES.length} figures…`);
for (const batch of chunk(FIGURES, 30)) {
  const titles = batch.map((f) => f.name[0]);
  const got = absorb(await lookup(titles), titles);
  batch.forEach((f, i) => (got[i] ? rows.set(f.id, got[i]) : needSearch.push(f)));
  process.stdout.write('.');
  await sleep(350);
}
console.log();

if (needSearch.length) {
  console.log(`searching for ${needSearch.length} stragglers…`);
  for (const f of needSearch) {
    const d = await api(EN, { action: 'query', list: 'search', srsearch: f.name[0], srlimit: '1', srnamespace: '0' });
    const title = d.query?.search?.[0]?.title;
    if (!title) { console.log(`  no article: ${f.id}`); continue; }
    const [row] = absorb(await lookup([title]), [title]);
    if (row) { rows.set(f.id, row); console.log(`  ${f.id} -> ${row.en}`); }
    await sleep(350);
  }
}

/* ── 2. attribution for the portraits we will display ─────────────────── */

const files = [...new Set([...rows.values()].map((r) => r.file).filter(Boolean))];
const credit = new Map();

console.log(`\nfetching credits for ${files.length} portraits…`);
for (const batch of chunk(files, 20)) {
  try {
    const d = await api(COMMONS, { action: 'query', titles: batch.join('|'), prop: 'imageinfo', iiprop: 'extmetadata' });
    for (const p of d.query?.pages ?? []) {
      if (p.missing) continue;
      const em = p.imageinfo?.[0]?.extmetadata ?? {};
      credit.set(p.title, {
        licence: strip(em.LicenseShortName?.value) || null,
        artist: strip(em.Artist?.value)?.slice(0, 90) || null,
      });
    }
  } catch (err) {
    console.warn('  credit batch failed:', err.message);
  }
  process.stdout.write('.');
  await sleep(800);
}
console.log();

/* ── 3. write ─────────────────────────────────────────────────────────── */

const body = [...rows.entries()]
  .sort(([a], [b]) => (a < b ? -1 : 1))
  .map(([id, r]) => {
    const c = r.file ? credit.get(r.file) : null;
    const bits = [`en: ${JSON.stringify(r.en)}`];
    if (r.pt) bits.push(`pt: ${JSON.stringify(r.pt)}`);
    if (r.thumb) bits.push(`img: ${JSON.stringify(r.thumb)}`);
    if (r.file) bits.push(`file: ${JSON.stringify(r.file)}`);
    if (c?.licence) bits.push(`lic: ${JSON.stringify(c.licence)}`);
    if (c?.artist) bits.push(`by: ${JSON.stringify(c.artist)}`);
    return `  '${id}': { ${bits.join(', ')} },`;
  })
  .join('\n');

writeFileSync(
  OUT,
  `/**
 * wiki.js — GENERATED by tools/fetch-wiki.mjs. Do not edit by hand.
 *
 * Per figure:
 *   en, pt  Wikipedia article titles, used to build a "read further" link
 *   img     portrait thumbnail on upload.wikimedia.org, hotlinked at runtime
 *   file    the Commons file page, linked as the portrait's credit
 *   lic     licence short name, shown beside the portrait
 *   by      author, where the licence requires naming one
 *
 * The portrait is the only thing in the game fetched from the network, and it
 * is optional: js/ui.js hides it if it fails to load, so an offline player
 * still gets the full verdict.
 */

export const WIKI = {
${body}
};
`,
);

const withImg = [...rows.values()].filter((r) => r.thumb).length;
console.log(`\nwrote ${OUT}`);
console.log(`  articles: ${rows.size} / ${FIGURES.length}`);
console.log(`  portuguese articles: ${[...rows.values()].filter((r) => r.pt).length}`);
console.log(`  portraits: ${withImg}`);
console.log(`  credits resolved: ${credit.size}`);
