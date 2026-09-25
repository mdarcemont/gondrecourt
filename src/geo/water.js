/**
 * The Ornain through the lower town.
 *
 * The national elevation model is "hydro-flattened": over the river it
 * records the water surface, not the bed.  So the terrain samples inside
 * the OSM water polygon *are* the water level, give or take noise.  This
 * module turns that into:
 *   - a local water level (lowest sample within LEVEL_REACH metres, which
 *     follows the river's fall along its length but ignores bank bleed),
 *   - a carved terrain, with the bed BED_DEPTH below the water,
 *   - per-vertex levels and bank heights for the water surface and the
 *     quay walls drawn along the polygon edge.
 */
import { ensureCCW, norm, perp, pointInPolygon, sub } from './polygon.js';

export const LEVEL_REACH = 16;
export const BED_DEPTH = 1.2;
const BANK_PROBE = 2.5;

function gridPoints({ x0, z0, stepX, stepZ, cols, rows }) {
  return Array.from({ length: cols * rows }, (_, i) => [x0 + (i % cols) * stepX, z0 + Math.floor(i / cols) * stepZ]);
}

const lowestNear = (p, samples, reach) =>
  samples.reduce((m, s) => (Math.hypot(s.p[0] - p[0], s.p[1] - p[1]) <= reach && s.h < m ? s.h : m), Infinity);

function outward(ring, i) {
  const prev = ring[(i - 1 + ring.length) % ring.length];
  const next = ring[(i + 1) % ring.length];
  // CCW ring in (x, z): the outside is to the right of the direction of travel
  const [px, pz] = perp(norm(sub(next, prev)));
  return [-px, -pz];
}

export function carveWater(field, rawRings) {
  const rings = rawRings.map(ensureCCW);
  const pts = gridPoints(field);
  const owner = pts.map((p) => rings.findIndex((r) => pointInPolygon(p, r)));

  const samplesByRing = rings.map((_, ri) =>
    pts.flatMap((p, i) => (owner[i] === ri ? [{ p, h: field.heights[i] }] : []))
  );

  const heights = field.heights.map((h, i) => {
    if (owner[i] < 0) return h;
    return lowestNear(pts[i], samplesByRing[owner[i]], LEVEL_REACH) - BED_DEPTH;
  });

  const water = rings.map((ring, ri) => {
    const samples = samplesByRing[ri];
    const fallback = samples.length ? Math.min(...samples.map((s) => s.h)) : null;
    const levels = ring.map((p) => {
      const near = lowestNear(p, samples, LEVEL_REACH * 1.5);
      return Number.isFinite(near) ? near : fallback ?? field.sample(...p) - 0.5;
    });
    const banks = ring.map((p, i) => {
      const [nx, nz] = outward(ring, i);
      const bank = field.sample(p[0] + nx * BANK_PROBE, p[1] + nz * BANK_PROBE);
      return Math.max(bank, levels[i] + 0.3);
    });
    return { ring, levels, banks };
  });

  return { heights, water };
}
