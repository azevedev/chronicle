#!/usr/bin/env node
/**
 * build-map.mjs — converts Natural Earth 110m GeoJSON (public domain) into a
 * single compact equirectangular SVG committed to assets/map/world.svg.
 *
 * Projection is plain plate carrée so the runtime can place pins with the same
 * two lines of arithmetic (see js/map.js `project`).
 *
 *   x = (lon + 180) / 360 * W
 *   y = (90 - lat) / 180 * H
 *
 * Run:  node tools/build-map.mjs <land.geojson> <countries.geojson> <out.svg>
 */
import { readFileSync, writeFileSync } from 'node:fs';

const W = 2000;
const H = 1000;
const PREC = 1; // ~2 km at the equator; plenty for a hand-engraved look

// Visible window: drop most of Antarctica and the empty high Arctic so the
// map frames like a printed plate instead of a data dump.
const LAT_TOP = 83.5;
const LAT_BOTTOM = -57;

const project = (lon, lat) => [
  ((lon + 180) / 360) * W,
  ((90 - lat) / 180) * H,
];

const fmt = (n) => {
  const r = n.toFixed(PREC);
  return r.replace(/\.0+$/, '').replace(/(\.\d*?)0+$/, '$1');
};

/** One linear ring -> "M x y L x y ... Z", dropping collinear-ish noise. */
function ringToPath(ring) {
  const pts = [];
  for (const [lon, lat] of ring) {
    const [x, y] = project(lon, lat);
    const px = +fmt(x);
    const py = +fmt(y);
    const last = pts[pts.length - 1];
    if (last && last[0] === px && last[1] === py) continue; // dedupe after rounding
    pts.push([px, py]);
  }
  if (pts.length < 3) return '';
  let d = `M${fmt(pts[0][0])} ${fmt(pts[0][1])}`;
  for (let i = 1; i < pts.length; i++) {
    d += `L${fmt(pts[i][0])} ${fmt(pts[i][1])}`;
  }
  return d + 'Z';
}

function geometryToPath(geom) {
  if (!geom) return '';
  const polys =
    geom.type === 'Polygon' ? [geom.coordinates]
    : geom.type === 'MultiPolygon' ? geom.coordinates
    : [];
  let d = '';
  for (const poly of polys) {
    for (const ring of poly) d += ringToPath(ring);
  }
  return d;
}

/** Graticule every `step` degrees, clipped to the visible window. */
function graticule(step = 20) {
  const parts = [];
  for (let lon = -180; lon <= 180; lon += step) {
    const [x] = project(lon, 0);
    const [, y1] = project(0, LAT_TOP);
    const [, y2] = project(0, LAT_BOTTOM);
    parts.push(`M${fmt(x)} ${fmt(y1)}L${fmt(x)} ${fmt(y2)}`);
  }
  for (let lat = -40; lat <= 80; lat += step) {
    const [, y] = project(0, lat);
    parts.push(`M0 ${fmt(y)}L${W} ${fmt(y)}`);
  }
  return parts.join('');
}

const [, , landFile, countriesFile, outFile] = process.argv;
if (!landFile || !countriesFile || !outFile) {
  console.error('usage: build-map.mjs <land.geojson> <countries.geojson> <out.svg>');
  process.exit(1);
}

const land = JSON.parse(readFileSync(landFile, 'utf8'));
const countries = JSON.parse(readFileSync(countriesFile, 'utf8'));

const landPath = land.features.map((f) => geometryToPath(f.geometry)).join('');

// Country outlines are drawn stroke-only over the land fill. Antarctica is
// skipped: it sits outside the visible window and only bloats the file.
const borderPath = countries.features
  .filter((f) => (f.properties.NAME || f.properties.name) !== 'Antarctica')
  .map((f) => geometryToPath(f.geometry))
  .join('');

const [, yTop] = project(0, LAT_TOP);
const [, yBottom] = project(0, LAT_BOTTOM);
const viewH = yBottom - yTop;

const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 ${fmt(yTop)} ${W} ${fmt(viewH)}" preserveAspectRatio="xMidYMid meet" data-proj="equirectangular" data-w="${W}" data-h="${H}" role="img" aria-label="World map">
<g id="graticule"><path d="${graticule(20)}"/></g>
<g id="land"><path d="${landPath}"/></g>
<g id="borders"><path d="${borderPath}"/></g>
</svg>
`;

writeFileSync(outFile, svg);
const kb = (Buffer.byteLength(svg) / 1024).toFixed(1);
console.log(`wrote ${outFile}  ${kb} KB  (viewBox 0 ${fmt(yTop)} ${W} ${fmt(viewH)})`);
