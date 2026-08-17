#!/usr/bin/env node
/**
 * derive-countries.mjs — works out which modern country each pin falls in, and
 * writes data/countries.js.
 *
 * The register stores a settlement and a coordinate, not a country. Rather than
 * hand-authoring 610 more bilingual strings (and getting some of them wrong),
 * the country is derived from the same Natural Earth dataset the map is drawn
 * from, using its NAME_EN and NAME_PT fields. That keeps the label and the pin
 * agreeing with each other by construction.
 *
 * Two deliberate imprecisions, both visible in the output:
 *
 *  · This is the *modern* country. A figure born in Pi-Ramesses is labelled
 *    Egypt, which is what the map underneath actually shows. The game already
 *    prints the historical place name beside it.
 *
 *  · 110m geometry is coarse. A coastal or small-island pin can land just
 *    outside its own country's simplified outline, so a near-miss inside
 *    FALLBACK_DEGREES is snapped to the closest country. Anything further out
 *    (mid-ocean deaths, for instance) is left null and simply shows no country.
 *
 * Run:  node tools/derive-countries.mjs <countries.geojson>
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { FIGURES } from '../data/figures.js';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const OUT = resolve(ROOT, 'data/countries.js');

/** How far off a polygon a pin may sit and still be attributed, in degrees. */
const FALLBACK_DEGREES = 1.6;

const geoFile = process.argv[2];
if (!geoFile) {
  console.error('usage: derive-countries.mjs <ne_110m_admin_0_countries.geojson>');
  process.exit(1);
}

const geo = JSON.parse(readFileSync(geoFile, 'utf8'));

/** Ray casting across one ring. */
function inRing(lon, lat, ring) {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = ring[i];
    const [xj, yj] = ring[j];
    const straddles = yi > lat !== yj > lat;
    if (straddles && lon < ((xj - xi) * (lat - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}

/** A polygon is [outer, ...holes]. */
function inPolygon(lon, lat, poly) {
  if (!inRing(lon, lat, poly[0])) return false;
  for (let h = 1; h < poly.length; h++) if (inRing(lon, lat, poly[h])) return false;
  return true;
}

function inFeature(lon, lat, geom) {
  if (!geom) return false;
  if (geom.type === 'Polygon') return inPolygon(lon, lat, geom.coordinates);
  if (geom.type === 'MultiPolygon') return geom.coordinates.some((p) => inPolygon(lon, lat, p));
  return false;
}

/** Smallest distance in degrees from the point to any vertex of the feature. */
function distanceTo(lon, lat, geom) {
  let best = Infinity;
  const scan = (ring) => {
    for (const [x, y] of ring) {
      const d = Math.hypot(x - lon, y - lat);
      if (d < best) best = d;
    }
  };
  const polys =
    geom.type === 'Polygon' ? [geom.coordinates]
    : geom.type === 'MultiPolygon' ? geom.coordinates
    : [];
  for (const poly of polys) for (const ring of poly) scan(ring);
  return best;
}

/**
 * Natural Earth is a cartographic dataset, not a style guide. Its English runs
 * to full formal titles, and its NAME_PT is European Portuguese, which this
 * game is not written in. Normalise both to what a reader expects on a label.
 */
const RENAME_EN = {
  "People's Republic of China": 'China',
  'United States of America': 'United States',
  'Democratic Republic of the Congo': 'DR Congo',
};

const RENAME_PT = {
  // European spellings -> Brazilian.
  'Polónia': 'Polônia',
  'Roménia': 'Romênia',
  'Macedónia do Norte': 'Macedônia do Norte',
  'Irão': 'Irã',
  'Vietname': 'Vietnã',
  'Chéquia': 'Tchéquia',
  // Formal titles nobody says out loud.
  'República da Irlanda': 'Irlanda',
  'República Democrática do Congo': 'RD Congo',
};

const names = (f) => {
  const en = f.properties.NAME_EN || f.properties.NAME;
  const pt = f.properties.NAME_PT || en;
  return [RENAME_EN[en] ?? en, RENAME_PT[pt] ?? pt];
};

function locate(lat, lon) {
  for (const f of geo.features) {
    if (inFeature(lon, lat, f.geometry)) return { names: names(f), exact: true };
  }
  // Near-miss: coastlines and small islands are heavily simplified at 110m.
  let best = null;
  let bestDist = FALLBACK_DEGREES;
  for (const f of geo.features) {
    const d = distanceTo(lon, lat, f.geometry);
    if (d < bestDist) {
      bestDist = d;
      best = f;
    }
  }
  return best ? { names: names(best), exact: false, distance: bestDist } : null;
}

const out = {};
const unresolved = [];
let snapped = 0;

for (const fig of FIGURES) {
  const entry = {};
  for (const [key, tuple] of [['born', fig.born], ['died', fig.died]]) {
    const [, , lat, lon] = tuple;
    const hit = locate(lat, lon);
    if (!hit) {
      unresolved.push(`${fig.id} ${key} (${lat}, ${lon})`);
      continue;
    }
    if (!hit.exact) snapped += 1;
    entry[key] = hit.names;
  }
  if (Object.keys(entry).length) out[fig.id] = entry;
}

const body = Object.entries(out)
  .map(([id, e]) => {
    const parts = [];
    if (e.born) parts.push(`born: ${JSON.stringify(e.born)}`);
    if (e.died) parts.push(`died: ${JSON.stringify(e.died)}`);
    return `  '${id}': { ${parts.join(', ')} },`;
  })
  .join('\n');

writeFileSync(
  OUT,
  `/**
 * countries.js — GENERATED by tools/derive-countries.mjs. Do not edit by hand.
 *
 * Modern country for each pin, resolved from Natural Earth 110m geometry and
 * its NAME_EN / NAME_PT fields. Keyed by figure id; each entry holds
 * [English, Portuguese]. A missing key means the pin is at sea or too far from
 * any coastline to attribute, and the UI simply shows no country for it.
 */

export const COUNTRIES = {
${body}
};
`,
);

console.log(`wrote ${OUT}`);
console.log(`  figures with at least one country: ${Object.keys(out).length} / ${FIGURES.length}`);
console.log(`  pins snapped to a nearby coast:    ${snapped}`);
console.log(`  pins left unattributed:            ${unresolved.length}`);
for (const u of unresolved) console.log(`      ${u}`);
