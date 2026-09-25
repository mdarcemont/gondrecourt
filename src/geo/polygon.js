/**
 * 2D polygon helpers on rings of [x, z] points (local metres).
 * A ring is open: the last point is NOT a copy of the first.
 */

export const sub = (a, b) => [a[0] - b[0], a[1] - b[1]];
export const dot = (a, b) => a[0] * b[0] + a[1] * b[1];
export const len = (a) => Math.hypot(a[0], a[1]);
export const norm = (a) => {
  const l = len(a) || 1;
  return [a[0] / l, a[1] / l];
};
/** Perpendicular, rotated +90 degrees. */
export const perp = (a) => [-a[1], a[0]];

/** Drop a closing duplicate and consecutive duplicates. */
export function openRing(points, eps = 1e-6) {
  const out = points.filter((p, i) => {
    const prev = points[(i - 1 + points.length) % points.length];
    return i === 0 ? true : Math.abs(p[0] - prev[0]) > eps || Math.abs(p[1] - prev[1]) > eps;
  });
  const first = out[0];
  const last = out[out.length - 1];
  const closed = out.length > 1 && Math.abs(first[0] - last[0]) <= eps && Math.abs(first[1] - last[1]) <= eps;
  return closed ? out.slice(0, -1) : out;
}

/** Shoelace area; positive when counter-clockwise in (x, z). */
export function signedArea(ring) {
  return ring.reduce((acc, p, i) => {
    const q = ring[(i + 1) % ring.length];
    return acc + (p[0] * q[1] - q[0] * p[1]);
  }, 0) / 2;
}

export const ensureCCW = (ring) => (signedArea(ring) < 0 ? [...ring].reverse() : ring);

export function centroid(ring) {
  const a = signedArea(ring);
  if (Math.abs(a) < 1e-9) {
    const n = ring.length;
    return [ring.reduce((s, p) => s + p[0], 0) / n, ring.reduce((s, p) => s + p[1], 0) / n];
  }
  const [cx, cz] = ring.reduce(([sx, sz], p, i) => {
    const q = ring[(i + 1) % ring.length];
    const f = p[0] * q[1] - q[0] * p[1];
    return [sx + (p[0] + q[0]) * f, sz + (p[1] + q[1]) * f];
  }, [0, 0]);
  return [cx / (6 * a), cz / (6 * a)];
}

/** Even-odd ray cast. */
export function pointInPolygon([x, z], ring) {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, zi] = ring[i];
    const [xj, zj] = ring[j];
    const crosses = (zi > z) !== (zj > z) && x < ((xj - xi) * (z - zi)) / (zj - zi) + xi;
    if (crosses) inside = !inside;
  }
  return inside;
}

/**
 * Sutherland-Hodgman against one half-plane: keeps the part of the ring
 * where dot(p, n) >= offset.
 */
export function clipHalfPlane(ring, n, offset) {
  const side = (p) => dot(p, n) - offset;
  return ring.flatMap((p, i) => {
    const q = ring[(i + 1) % ring.length];
    const sp = side(p);
    const sq = side(q);
    const keep = sp >= 0 ? [p] : [];
    if ((sp >= 0) === (sq >= 0)) return keep;
    const t = sp / (sp - sq);
    return [...keep, [p[0] + (q[0] - p[0]) * t, p[1] + (q[1] - p[1]) * t]];
  });
}

/**
 * Insert a vertex wherever an edge crosses the line dot(p, n) = offset,
 * so a roof ridge lands exactly on the outline.
 */
export function splitAtLine(ring, n, offset, eps = 1e-9) {
  return ring.flatMap((p, i) => {
    const q = ring[(i + 1) % ring.length];
    const sp = dot(p, n) - offset;
    const sq = dot(q, n) - offset;
    if (sp * sq >= 0 || Math.abs(sp) < eps || Math.abs(sq) < eps) return [p];
    const t = sp / (sp - sq);
    return [p, [p[0] + (q[0] - p[0]) * t, p[1] + (q[1] - p[1]) * t]];
  });
}

/** Distance from point to segment, and the segment's unit direction. */
export function pointSegment(p, a, b) {
  const ab = sub(b, a);
  const l2 = dot(ab, ab);
  const t = l2 === 0 ? 0 : Math.max(0, Math.min(1, dot(sub(p, a), ab) / l2));
  const c = [a[0] + ab[0] * t, a[1] + ab[1] * t];
  return { dist: len(sub(p, c)), dir: norm(ab) };
}

/**
 * Direction of the longest side of the minimum-area bounding rectangle.
 * Brute force over the ring's own edges, which is exact for the rectangle
 * (one side of the min-area rectangle is always collinear with a hull edge,
 * and every hull edge is a ring edge).
 */
export function longAxis(ring) {
  const best = ring.reduce((acc, p, i) => {
    const d = sub(ring[(i + 1) % ring.length], p);
    if (len(d) < 1e-6) return acc;
    const u = norm(d);
    const v = perp(u);
    const us = ring.map((q) => dot(q, u));
    const vs = ring.map((q) => dot(q, v));
    const w = Math.max(...us) - Math.min(...us);
    const h = Math.max(...vs) - Math.min(...vs);
    const area = w * h;
    return area < acc.area ? { area, dir: w >= h ? u : v } : acc;
  }, { area: Infinity, dir: [1, 0] });
  return best.dir;
}
