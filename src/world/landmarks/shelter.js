/**
 * Open shelters: a roof on stone pillars, no walls (user photos, Oct 2023).
 * Used for the pavilion at the end of the path by La Carpière and for the
 * big lavoir on the Ornain.  The generic box is replaced (`replace` in
 * data/landmarks.json); only the pillars and low walls block the walker.
 */
import * as THREE from 'three';
import { cel } from '../../engine/toon.js';
import { centroid, pointInPolygon } from '../../geo/polygon.js';
import { planHipRoof } from '../../geo/roof.js';
import { createMeshBuffer, triangulate } from '../meshbuffer.js';

const STONE = 0xd9d3c4;
const OLD_TILE = 0x6f5a4c; // mossy old tiles, as in the photos
const PILLAR = 0.45;

const grow = (ring, d) => {
  const [cx, cz] = centroid(ring);
  return ring.map(([x, z]) => {
    const l = Math.hypot(x - cx, z - cz) || 1;
    return [x + ((x - cx) / l) * d, z + ((z - cz) / l) * d];
  });
};
const square = ([x, z], s) => [[x - s, z - s], [x + s, z - s], [x + s, z + s], [x - s, z + s]];

function roofMesh(ring, eave, ridge) {
  const plan = planHipRoof({ ring, eave, ridge });
  const buf = createMeshBuffer();
  plan.faces.forEach((face) => triangulate(face).forEach(([i, j, k]) => {
    const p = [face[i], face[j], face[k]].map(([x, z]) => [x, plan.heightAt([x, z]), z]);
    buf.tri(p[0], p[1], p[2], [[0, 0], [1, 0], [0, 1]], OLD_TILE);
  }));
  const m = new THREE.Mesh(buf.toGeometry(), cel({ color: 0xffffff, vertexColors: true, side: THREE.DoubleSide }));
  m.castShadow = true;
  m.receiveShadow = true;
  return m;
}

function box(w, h, d, colour, x, y, z, rot = 0) {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), cel({ color: colour }));
  m.position.set(x, y, z);
  m.rotation.y = rot;
  m.castShadow = true;
  return m;
}

/**
 * spec: { eaveAbove, ridgeAbove, overhang, pillarsEvery (m, 0 = corners only),
 *         lowWall: true for a 1 m wall on the sides away from the water, basin: true }
 */
export function buildShelter({ building, world, heightAt, addCollider, makeWalkable }, spec) {
  const g = new THREE.Group();
  const ring = building.ring;
  const y0 = Math.min(...ring.map(([x, z]) => heightAt(x, z)));
  const water = world.water.map((w) => w.ring);
  g.add(roofMesh(grow(ring, spec.overhang), y0 + spec.eaveAbove, y0 + spec.ridgeAbove));
  makeWalkable?.(building.id);

  ring.forEach((a, i) => {
    const b = ring[(i + 1) % ring.length];
    const len = Math.hypot(b[0] - a[0], b[1] - a[1]);
    const n = spec.pillarsEvery ? Math.max(1, Math.round(len / spec.pillarsEvery)) : 1;
    for (let k = 0; k < n; k++) {
      const t = k / n;
      const p = [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
      g.add(box(PILLAR, spec.eaveAbove + 0.3, PILLAR, STONE, p[0], y0 + spec.eaveAbove / 2 - 0.15, p[1]));
      addCollider?.(square(p, PILLAR / 2));
    }
    const mid = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
    const out = [mid[0] + ((b[1] - a[1]) / len) * 1.5, mid[1] - ((b[0] - a[0]) / len) * 1.5];
    const wet = water.some((w) => pointInPolygon(out, w));
    if (spec.lowWall && !wet && len > 2) {
      const rot = Math.atan2(b[0] - a[0], b[1] - a[1]);
      g.add(box(0.35, 1.0, len, STONE, mid[0], y0 + 0.5, mid[1], rot));
      const nx = (b[1] - a[1]) / len * 0.2;
      const nz = -(b[0] - a[0]) / len * 0.2;
      addCollider?.([[a[0] - nx, a[1] - nz], [b[0] - nx, b[1] - nz], [b[0] + nx, b[1] + nz], [a[0] + nx, a[1] + nz]]);
    }
  });

  if (spec.basin) {
    // the washing basin: a stone rim round a sheet of still water, inside the shelter
    const inner = grow(ring, -1.4);
    const buf = createMeshBuffer();
    triangulate(inner).forEach(([i, j, k]) => {
      const v = (q) => [inner[q][0], y0 - 0.25, inner[q][1]];
      buf.tri(v(i), v(j), v(k), [[0, 0], [1, 0], [0, 1]], 0x6f8f88);
    });
    g.add(new THREE.Mesh(buf.toGeometry(), cel({ color: 0xffffff, vertexColors: true, side: THREE.DoubleSide })));
    inner.forEach((a, i) => {
      const b = inner[(i + 1) % inner.length];
      const len = Math.hypot(b[0] - a[0], b[1] - a[1]);
      g.add(box(0.4, 0.45, len, STONE, (a[0] + b[0]) / 2, y0 - 0.02, (a[1] + b[1]) / 2, Math.atan2(b[0] - a[0], b[1] - a[1])));
    });
    addCollider?.(inner);
  }
  return g;
}
