/**
 * Shared helpers for hand-detailed landmarks: finding the right facade and
 * sticking things flat onto it.
 */
import * as THREE from 'three';
import { cel, flat } from '../../engine/toon.js';
import { facadeToward } from '../../geo/facade.js';
import { centroid, pointSegment } from '../../geo/polygon.js';
import { lettering } from '../textures.js';

/** Nearest point on any street centreline to p. */
export function nearestStreetPoint(p, roads, kinds = ['primary', 'secondary', 'tertiary', 'residential']) {
  return roads
    .filter((r) => kinds.includes(r.kind))
    .flatMap((r) => r.pts.slice(1).map((b, i) => ({ a: r.pts[i], b })))
    .map(({ a, b }) => {
      const { dist } = pointSegment(p, a, b);
      const ab = [b[0] - a[0], b[1] - a[1]];
      const l2 = ab[0] ** 2 + ab[1] ** 2 || 1;
      const t = Math.max(0, Math.min(1, ((p[0] - a[0]) * ab[0] + (p[1] - a[1]) * ab[1]) / l2));
      return { dist, q: [a[0] + ab[0] * t, a[1] + ab[1] * t] };
    })
    .reduce((best, h) => (h.dist < best.dist ? h : best), { dist: Infinity, q: p }).q;
}

export const facadeFacing = (building, target) => facadeToward(building.ring, target);
export const streetFacade = (building, roads) =>
  facadeToward(building.ring, nearestStreetPoint(centroid(building.ring), roads));

/**
 * Place an object on a facade.  `along` is 0..1 along the edge from a to b,
 * `y` the height of the object's centre, `out` how far it stands off the wall.
 */
export function onFacade(obj, facade, { along = 0.5, y, out = 0.04 }) {
  const { a, b, n } = facade;
  obj.position.set(
    a[0] + (b[0] - a[0]) * along + n[0] * out,
    y,
    a[1] + (b[1] - a[1]) * along + n[1] * out
  );
  obj.rotation.y = Math.atan2(n[0], n[1]);
  return obj;
}

/** A painted lettering panel `height` metres tall, as wide as the text needs. */
export function signPanel(text, height, opts = {}) {
  const { tex, aspect } = lettering(text, opts);
  const width = opts.maxWidth ? Math.min(height * aspect, opts.maxWidth) : height * aspect;
  const mat = flat({ map: tex, transparent: opts.bg == null, alphaTest: opts.bg == null ? 0.3 : 0, cache: false });
  return new THREE.Mesh(new THREE.PlaneGeometry(width, opts.maxWidth ? height * (width / (height * aspect)) : height), mat);
}

export const solid = (color) => cel({ color });
