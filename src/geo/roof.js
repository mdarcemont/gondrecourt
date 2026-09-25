/**
 * Roof planning from measured heights.
 *
 * BD TOPO gives every building two roof altitudes: the lowest point of the
 * roof (the eave) and the highest (the ridge).  That is enough for a gable:
 * one ridge line along `ridgeDir`, through the middle of the footprint, with
 * the roof falling linearly to the eave at the two long sides.
 *
 * Height is a linear function of position on each side of the ridge, so the
 * footprint is cut in two along the ridge and each half is one planar face,
 * whatever shape the footprint is.
 */
import { clipHalfPlane, dot, norm, perp, splitAtLine } from './polygon.js';

const MIN_PITCH_DROP = 0.6; // metres; below this the roof is treated as flat
const MIN_HALF_SPAN = 1.5;

export function planRoof({ ring, ridgeDir, eave, ridge }) {
  const n = perp(norm(ridgeDir));
  const offsets = ring.map((p) => dot(p, n));
  const lo = Math.min(...offsets);
  const hi = Math.max(...offsets);
  const mid = (lo + hi) / 2;
  const half = (hi - lo) / 2;
  const drop = ridge - eave;

  if (drop < MIN_PITCH_DROP || half < MIN_HALF_SPAN) {
    const top = Math.max(eave, ridge);
    return { kind: 'flat', outline: ring, faces: [ring], heightAt: () => top };
  }

  const heightAt = (p) => eave + drop * (1 - Math.min(1, Math.abs(dot(p, n) - mid) / half));
  const faces = [
    clipHalfPlane(ring, n, mid),
    clipHalfPlane(ring, [-n[0], -n[1]], -mid),
  ].filter((f) => f.length >= 3);

  return { kind: 'gable', outline: splitAtLine(ring, n, mid), faces, heightAt };
}

/**
 * Hipped roof: every wall stops at the eave, and the roof rises from every
 * edge at the same pitch -- the lower envelope of one inclined plane per
 * edge.  Face i is the part of the footprint where edge i's plane is the
 * lowest, found by clipping against every other edge; exact for convex
 * footprints and a good approximation for mildly concave ones.
 */
export function planHipRoof({ ring, eave, ridge }) {
  const edges = ring.map((a, i) => {
    const b = ring[(i + 1) % ring.length];
    const n = perp(norm([b[0] - a[0], b[1] - a[1]])); // inward on a CCW ring
    return { n, c: dot(a, n) };
  });
  const depth = (e, p) => dot(p, e.n) - e.c;
  const faces = edges.map((ei, i) => ({
    edge: i,
    ring: edges.reduce((poly, ej, j) => {
      if (j === i || poly.length < 3) return poly;
      const N = [ej.n[0] - ei.n[0], ej.n[1] - ei.n[1]];
      if (Math.hypot(N[0], N[1]) < 1e-9) return ei.c >= ej.c ? poly : [];
      return clipHalfPlane(poly, N, ej.c - ei.c);
    }, ring),
  })).filter((f) => f.ring.length >= 3);

  const maxDepth = Math.max(...faces.flatMap((f) => f.ring.map((p) => depth(edges[f.edge], p))));
  const drop = ridge - eave;
  if (drop < MIN_PITCH_DROP || maxDepth < MIN_HALF_SPAN / 2) return planRoof({ ring, ridgeDir: [1, 0], eave, ridge: eave });
  const k = drop / maxDepth;
  const heightAt = (p) => eave + k * Math.max(0, Math.min(...edges.map((e) => depth(e, p))));
  return { kind: 'hip', outline: ring, faces: faces.map((f) => f.ring), heightAt };
}
