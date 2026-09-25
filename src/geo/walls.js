/**
 * Colliders for a building you can walk into: one thin rectangle per wall,
 * with gaps where the doors are.  doors: [{ edge, at, width }], `at` is
 * 0..1 along edge i of the (CCW) footprint.
 */
const THICK = 0.3;

function slab(a, b) {
  const len = Math.hypot(b[0] - a[0], b[1] - a[1]);
  if (len < 0.05) return null;
  const n = [((b[1] - a[1]) / len) * (THICK / 2), (-(b[0] - a[0]) / len) * (THICK / 2)];
  return [[a[0] + n[0], a[1] + n[1]], [b[0] + n[0], b[1] + n[1]], [b[0] - n[0], b[1] - n[1]], [a[0] - n[0], a[1] - n[1]]];
}

export function wallColliders(ring, doors) {
  return ring.flatMap((a, i) => {
    const b = ring[(i + 1) % ring.length];
    const len = Math.hypot(b[0] - a[0], b[1] - a[1]);
    const lerp = (t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
    const gaps = doors
      .filter((d) => d.edge === i)
      .map((d) => [d.at - d.width / 2 / len, d.at + d.width / 2 / len])
      .sort((p, q) => p[0] - q[0]);
    const cuts = [0, ...gaps.flat(), 1];
    const pieces = [];
    for (let k = 0; k < cuts.length; k += 2) if (cuts[k + 1] > cuts[k]) pieces.push(slab(lerp(cuts[k]), lerp(cuts[k + 1])));
    return pieces.filter(Boolean);
  });
}
