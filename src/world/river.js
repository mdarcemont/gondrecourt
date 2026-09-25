/**
 * The Ornain: a still, flat-painted surface at the measured water level and
 * a limestone quay wall along every edge of the water polygon, from the bed
 * up to the bank.  In the lower town the river really does run between
 * vertical stone walls, so this is the honest shape, not a stylisation.
 */
import * as THREE from 'three';
import { PAL } from '../engine/palette.js';
import { cel } from '../engine/toon.js';
import { createMeshBuffer, triangulate } from './meshbuffer.js';
import { railing, ripples } from './textures.js';
import { BED_DEPTH } from '../geo/water.js';

const RAIL_H = 1.0;
export const FLOW_TILE = 9; // metres of water per repeat of the ripple texture

export function buildRiver(water) {
  const surface = createMeshBuffer();
  const quay = createMeshBuffer();

  water.forEach(({ ring, levels, banks }) => {
    triangulate(ring).forEach(([i, j, k]) => {
      const v = (n) => [ring[n][0], levels[n] - 0.05, ring[n][1]];
      const uv = (n) => [ring[n][0] / FLOW_TILE, ring[n][1] / FLOW_TILE];
      surface.tri(v(i), v(j), v(k), [uv(i), uv(j), uv(k)], PAL.water);
    });
    ring.forEach((a, i) => {
      const n = (i + 1) % ring.length;
      const c = ring[n];
      quay.quad(
        [a[0], levels[i] - BED_DEPTH, a[1]], [c[0], levels[n] - BED_DEPTH, c[1]],
        [c[0], banks[n] + 0.15, c[1]], [a[0], banks[i] + 0.15, a[1]],
        [[0, 0], [1, 0], [1, 1], [0, 1]], PAL.quay
      );
    });
  });

  const group = new THREE.Group();
  const waterMat = cel({ color: 0xffffff, vertexColors: true, bands: 2, side: THREE.DoubleSide, cache: false });
  // light streaks as an emissive map, so they brighten the water; life.js scrolls them downstream
  waterMat.emissiveMap = ripples();
  waterMat.emissive.set(0xffffff);
  waterMat.emissiveIntensity = 0.13;
  const water3 = new THREE.Mesh(surface.toGeometry(), waterMat);
  water3.receiveShadow = true;
  const walls = new THREE.Mesh(quay.toGeometry(), cel({ color: 0xffffff, vertexColors: true, side: THREE.DoubleSide }));
  walls.receiveShadow = true;
  walls.castShadow = true;
  group.add(water3, walls);
  group.userData.flow = waterMat.emissiveMap;
  return group;
}

/** A run of railing along a polyline of [x, y, z] points. */
export function railingAlong(points) {
  const buf = createMeshBuffer();
  let u = 0;
  points.slice(1).forEach((b, i) => {
    const a = points[i];
    const run = Math.hypot(b[0] - a[0], b[2] - a[2]);
    buf.quad(a, b, [b[0], b[1] + RAIL_H, b[2]], [a[0], a[1] + RAIL_H, a[2]],
      [[u, 0], [u + run, 0], [u + run, 1], [u, 1]], 0xffffff);
    u += run;
  });
  return new THREE.Mesh(buf.toGeometry(), cel({ color: 0xffffff, map: railing(), alphaTest: 0.5, side: THREE.DoubleSide }));
}
