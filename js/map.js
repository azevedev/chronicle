/**
 * map.js — the engraved world plate, its two pins, and the passage between them.
 *
 * The SVG is plate carrée, so projection is two lines of arithmetic and the
 * runtime never needs a projection library. `data-w` / `data-h` on the root
 * carry the full-globe pixel extent (2000×1000); the viewBox crops that to the
 * inhabited latitudes.
 *
 * Two problems this module exists to solve:
 *
 *  1. The date line. A life running Nagasaki → San Francisco is a short hop
 *     east, but drawn naively the arc sweeps backwards across the entire plate.
 *     `arcBetween` picks the shorter direction and emits a second, shifted copy
 *     of the path so the part leaving one edge reappears at the other.
 *
 *  2. Scale. Mozart was born in Salzburg and died in Vienna — 250 km apart, or
 *     about three pixels of world map. When the pins are close, we raise an
 *     inset detail plate (a convention lifted straight from period atlases)
 *     rather than making the main map zoomable.
 */

import { pick } from './i18n.js';
import { play } from './audio.js';

/** Below this separation in degrees, the pins need an inset to be legible. */
const INSET_THRESHOLD = 14;

/** The latitudes the plate is cropped to — must match tools/build-map.mjs. */
const LAT_TOP_VIS = 83.5;
const LAT_BOTTOM_VIS = -57;

let root = null;      // the <svg> element of the main plate
let W = 2000;
let H = 1000;
let layer = null;     // <g> holding pins and arcs, cleared each round

/** Load and inline the map once. Returns the root <svg>. */
export async function initMap(container) {
  if (root) return root;
  const res = await fetch('assets/map/world.svg');
  if (!res.ok) throw new Error(`map: HTTP ${res.status}`);
  container.innerHTML = await res.text();

  root = container.querySelector('svg');
  root.classList.add('map__svg');
  root.setAttribute('aria-hidden', 'true'); // the place names carry the meaning
  W = Number(root.dataset.w) || 2000;
  H = Number(root.dataset.h) || 1000;

  layer = document.createElementNS('http://www.w3.org/2000/svg', 'g');
  layer.setAttribute('id', 'plot');
  root.appendChild(layer);
  return root;
}

/** lat/lon -> SVG user units. The whole projection. */
export function project(lat, lon) {
  return { x: ((lon + 180) / 360) * W, y: ((90 - lat) / 180) * H };
}

const svgEl = (name, attrs = {}) => {
  const el = document.createElementNS('http://www.w3.org/2000/svg', name);
  for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, v);
  return el;
};

/**
 * Shortest-path arc from a to b, as one or two path strings.
 *
 * The second string is the wrapped copy: when the shorter route crosses the
 * date line, one copy is drawn running off the plate and its twin is shifted a
 * full world-width so it enters from the opposite edge. The viewBox clips both.
 */
export function arcBetween(a, b) {
  const pa = project(a.lat, a.lon);
  let dLon = b.lon - a.lon;
  const wraps = Math.abs(dLon) > 180;
  if (dLon > 180) dLon -= 360;
  if (dLon < -180) dLon += 360;

  const bx = pa.x + (dLon / 360) * W;
  const by = project(b.lat, b.lon).y;

  // Bow the line perpendicular to its run, deeper for longer journeys, so it
  // reads as a drawn passage rather than a ruler line.
  const dx = bx - pa.x;
  const dy = by - pa.y;
  const len = Math.hypot(dx, dy) || 1;
  const lift = Math.min(len * 0.22, 150);
  const cx = (pa.x + bx) / 2 + (dy / len) * lift;
  const cy = (pa.y + by) / 2 - (dx / len) * lift;

  const d = (shift) =>
    `M${pa.x + shift} ${pa.y}Q${cx + shift} ${cy} ${bx + shift} ${by}`;

  if (!wraps) return [d(0)];
  // Draw both copies; whichever end is off-plate is clipped away.
  return [d(0), d(dLon > 0 ? -W : W)];
}

/** Birth mark: an eight-point compass star. */
function birthMark() {
  const g = svgEl('g', { class: 'pin pin--birth' });
  g.appendChild(svgEl('circle', { class: 'pin__halo', r: 13 }));
  g.appendChild(
    svgEl('path', {
      class: 'pin__mark',
      d: 'M0 -11 L2.6 -3.2 L11 0 L2.6 3.2 L0 11 L-2.6 3.2 L-11 0 L-2.6 -3.2 Z',
    }),
  );
  g.appendChild(svgEl('circle', { class: 'pin__dot', r: 2.1 }));
  return g;
}

/** Death mark: a dagger, the obelisk a paper sets beside a name. */
function deathMark() {
  const g = svgEl('g', { class: 'pin pin--death' });
  g.appendChild(svgEl('circle', { class: 'pin__halo', r: 13 }));
  g.appendChild(svgEl('path', { class: 'pin__mark', d: 'M-1.9 -12 H1.9 V-5 H7.4 V-1.6 H1.9 V12 H-1.9 V-1.6 H-7.4 V-5 H-1.9 Z' }));
  return g;
}

/** Clear the plot layer between rounds. */
export function clearMap() {
  if (layer) layer.replaceChildren();
  const inset = document.getElementById('map-inset');
  if (inset) inset.hidden = true;
}

/**
 * Place both pins and the passage between them.
 *
 * `reveal` staggers the animation: birth pin, then the arc drawing itself in,
 * then the death pin. Skipped wholesale when the player prefers reduced motion.
 */
export function plotLife(figure, opts = {}) {
  clearMap();
  const { born, died } = figure;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

  for (const d of arcBetween(born, died)) {
    const path = svgEl('path', { class: 'passage', d });
    layer.appendChild(path);
    if (!reduced) {
      // Dash the whole length, then retract the offset to draw it on.
      const len = path.getTotalLength();
      path.style.strokeDasharray = `${len}`;
      path.style.strokeDashoffset = `${len}`;
      path.style.animation = `draw-passage 1100ms 420ms ease-out forwards`;
    }
  }

  const place = (mark, coords, delay) => {
    const p = project(coords.lat, coords.lon);
    mark.setAttribute('transform', `translate(${p.x} ${p.y})`);
    if (!reduced) {
      mark.style.animation = `pin-drop 520ms ${delay}ms cubic-bezier(.34,1.56,.64,1) backwards`;
    }
    layer.appendChild(mark);
    return p;
  };

  place(birthMark(), born, 120);
  place(deathMark(), died, 1400);

  if (!reduced && opts.sound !== false) {
    setTimeout(() => play('pin'), 200);
    setTimeout(() => play('pin', { rate: 0.9 }), 1480);
  }

  updateInset(figure);
}

/** Angular separation, good enough to decide whether an inset is needed. */
function separation(a, b) {
  const dLon = Math.min(Math.abs(a.lon - b.lon), 360 - Math.abs(a.lon - b.lon));
  return Math.hypot(a.lat - b.lat, dLon);
}

/**
 * The inset detail plate: a circular magnified view, raised only when the two
 * pins sit too close together to tell apart on the world plate.
 *
 * It reuses the main map's geometry through <use> rather than re-inlining
 * 180 KB of path data.
 */
function updateInset(figure) {
  const host = document.getElementById('map-inset');
  if (!host) return;

  const { born, died } = figure;
  if (separation(born, died) > INSET_THRESHOLD) {
    host.hidden = true;
    return;
  }

  const a = project(born.lat, born.lon);
  const b = project(died.lat, died.lon);
  const cx = (a.x + b.x) / 2;
  const cy = (a.y + b.y) / 2;
  // Frame both pins with margin, but never zoom so far that the plate is empty.
  const span = Math.max(Math.abs(a.x - b.x), Math.abs(a.y - b.y), 12) * 3.2;
  const half = Math.max(span / 2, 30);

  // Park the inset in whichever corner is furthest from the pins, so the
  // magnified plate never sits on top of the region it is magnifying. Without
  // this it lands on the pins themselves for anywhere in eastern Asia, which is
  // exactly where it is most often needed.
  const visTop = project(LAT_TOP_VIS, 0).y;
  const visBottom = project(LAT_BOTTOM_VIS, 0).y;
  host.classList.toggle('map-inset--left', cx > W / 2);
  host.classList.toggle('map-inset--bottom', cy < (visTop + visBottom) / 2);

  host.hidden = false;
  host.innerHTML = `
    <svg viewBox="${cx - half} ${cy - half} ${half * 2} ${half * 2}" aria-hidden="true">
      <use href="#land" class="inset__land"/>
      <use href="#borders" class="inset__borders"/>
      <g id="inset-plot"></g>
    </svg>`;

  const plot = host.querySelector('#inset-plot');
  const scale = (half * 2) / 260; // keep marks a constant on-screen size

  for (const d of arcBetween(born, died)) {
    plot.appendChild(svgEl('path', { class: 'passage passage--inset', d, style: `stroke-width:${1.6 * scale}` }));
  }
  for (const [mark, coords] of [[birthMark(), born], [deathMark(), died]]) {
    const p = project(coords.lat, coords.lon);
    mark.setAttribute('transform', `translate(${p.x} ${p.y}) scale(${scale})`);
    plot.appendChild(mark);
  }
}

/** Place label for a pin, localised. */
export function placeName(point) {
  return pick(point.place);
}
