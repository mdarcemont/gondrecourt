/**
 * Inside Carrefour Contact: a tiled floor, a ceiling at 3.2 m with light
 * panels, rows of shelves with coloured goods, a wall of chilled cabinets,
 * and a checkout by the north door.  Invented (no photo of the inside):
 * a small French supermarket of the kind.  Shelves are placed on a grid
 * inside the footprint and kept 2.5 m clear of both doors.
 */
import * as THREE from 'three';
import { cel, flat } from '../../../engine/toon.js';
import { centroid, longAxis, perp, pointInPolygon } from '../../../geo/polygon.js';
import { createMeshBuffer, triangulate } from '../../meshbuffer.js';

const CEILING = 3.2;
const GOODS = [0xd8333a, 0xf2c230, 0x2350b8, 0x3f8f3a, 0xe88a2a, 0xf4f1ea, 0x8a3a8a];
const AISLE = 2.4;
const SHELF = { l: 4.0, w: 0.9, h: 1.7 };

function slab(ring, y, colour) {
  const buf = createMeshBuffer();
  triangulate(ring).forEach(([i, j, k]) => {
    const v = (n) => [ring[n][0], y, ring[n][1]];
    buf.tri(v(i), v(j), v(k), [[0, 0], [1, 0], [0, 1]], colour);
  });
  return new THREE.Mesh(buf.toGeometry(), cel({ color: 0xffffff, vertexColors: true, side: THREE.DoubleSide }));
}

function shelf(rand) {
  const g = new THREE.Group();
  const body = new THREE.Mesh(new THREE.BoxGeometry(SHELF.l, SHELF.h, SHELF.w), cel({ color: 0xe8e6e0 }));
  body.position.y = SHELF.h / 2;
  g.add(body);
  [0.35, 0.8, 1.25].forEach((h) => [-1, 1].forEach((side) => {
    const goods = new THREE.Mesh(new THREE.BoxGeometry(SHELF.l - 0.1, 0.3, 0.08), flat({ color: GOODS[Math.floor(rand() * GOODS.length)] }));
    goods.position.set(0, h, side * (SHELF.w / 2 + 0.01));
    g.add(goods);
  }));
  return g;
}

const rect = (c, u, n, l, w) => [[1, 1], [-1, 1], [-1, -1], [1, -1]].map(([a, b]) =>
  [c[0] + u[0] * a * (l / 2) + n[0] * b * (w / 2), c[1] + u[1] * a * (l / 2) + n[1] * b * (w / 2)]);

export function buildInterior(ring, y, fronts) {
  const g = new THREE.Group();
  const colliders = [];
  g.add(slab(ring, y + 0.03, 0xd9d6cf), slab(ring, y + CEILING, 0xf1efe9));
  let seed = 3;
  const rand = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
  const u = longAxis(ring);
  const n = perp(u);
  const c = centroid(ring);
  const doors = fronts.map((f) => [f.mid[0] - f.n[0] * 1.5, f.mid[1] - f.n[1] * 1.5]);
  const clear = (p) => doors.every((d) => Math.hypot(p[0] - d[0], p[1] - d[1]) > 3.5);

  for (let s = -30; s <= 30; s += SHELF.l + 1.6) {
    for (let t = -12; t <= 12; t += AISLE + SHELF.w) {
      const p = [c[0] + u[0] * s + n[0] * t, c[1] + u[1] * s + n[1] * t];
      const box = rect(p, u, n, SHELF.l + 1.2, SHELF.w + 1.4);
      if (!box.every((q) => pointInPolygon(q, ring)) || !clear(p)) continue;
      const sh = shelf(rand);
      sh.position.set(p[0], y, p[1]);
      sh.rotation.y = Math.atan2(u[0], u[1]) - Math.PI / 2;
      g.add(sh);
      colliders.push(rect(p, u, n, SHELF.l, SHELF.w));
    }
  }
  // ceiling light panels
  for (let s = -24; s <= 24; s += 6) {
    const p = [c[0] + u[0] * s, c[1] + u[1] * s];
    if (!pointInPolygon(p, ring)) continue;
    const light = new THREE.Mesh(new THREE.PlaneGeometry(2.4, 0.5), flat({ color: 0xfbf9ee, side: THREE.DoubleSide }));
    light.rotation.x = Math.PI / 2;
    light.position.set(p[0], y + CEILING - 0.02, p[1]);
    g.add(light);
  }
  // checkout just inside the north door
  const f = fronts[0];
  const along = [(f.b[0] - f.a[0]) / f.length, (f.b[1] - f.a[1]) / f.length];
  const cp = [f.a[0] + (f.b[0] - f.a[0]) * 0.72 - f.n[0] * 2.5, f.a[1] + (f.b[1] - f.a[1]) * 0.72 - f.n[1] * 2.5];
  const till = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.95, 0.8), cel({ color: 0x3f8f3a }));
  till.position.set(cp[0], y + 0.48, cp[1]);
  till.rotation.y = Math.atan2(along[0], along[1]) - Math.PI / 2;
  g.add(till);
  colliders.push(rect(cp, along, [-f.n[0], -f.n[1]], 2.2, 0.8));
  return { group: g, colliders };
}
