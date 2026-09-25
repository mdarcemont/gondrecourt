/**
 * Facade and collision helpers on building footprints (CCW rings).
 */
import { dot, len, norm, sub } from './polygon.js';

/** Outward unit normal of edge i of a CCW ring in (x, z). */
export function edgeNormal(ring, i) {
  const [dx, dz] = norm(sub(ring[(i + 1) % ring.length], ring[i]));
  return [dz, -dx];
}

/**
 * The edge that best faces a target point: its outward normal points at the
 * target and it is long enough to carry a shopfront.  Returns the edge's
 * endpoints, midpoint, normal and length.
 */
export function facadeToward(ring, target, minLength = 3) {
  const edges = ring.map((a, i) => {
    const b = ring[(i + 1) % ring.length];
    const mid = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
    const n = edgeNormal(ring, i);
    const toTarget = norm(sub(target, mid));
    return { a, b, mid, n, length: len(sub(b, a)), score: dot(n, toTarget) };
  });
  const usable = edges.filter((e) => e.length >= minLength);
  const pool = usable.length ? usable : edges;
  return pool.reduce((best, e) => (e.score > best.score ? e : best));
}

/**
 * Push a disc of radius r out of a polygon.  Returns the corrected point,
 * or the same point if the disc does not touch the polygon.
 */
export function pushOut(p, ring, r, inside) {
  const nearest = ring.reduce((best, a, i) => {
    const b = ring[(i + 1) % ring.length];
    const ab = sub(b, a);
    const l2 = dot(ab, ab) || 1;
    const t = Math.max(0, Math.min(1, dot(sub(p, a), ab) / l2));
    const c = [a[0] + ab[0] * t, a[1] + ab[1] * t];
    const d = len(sub(p, c));
    return d < best.d ? { d, c } : best;
  }, { d: Infinity, c: p });

  if (!inside && nearest.d >= r) return p;
  const away = inside ? norm(sub(nearest.c, p)) : norm(sub(p, nearest.c));
  return [nearest.c[0] + away[0] * r, nearest.c[1] + away[1] * r];
}
