/**
 * Window boxes of geraniums, and flower masses for lamps and planters.
 *
 * Window boxes on ordinary houses are `invented` (typical of a Lorraine
 * village, not checked house by house): a seeded share of the windows that
 * face a street get one, placed exactly under a window of the facade
 * texture so box and window line up.  Landmarks place their own boxes
 * where the photos show them.
 */
import * as THREE from 'three';
import { cel } from '../engine/toon.js';
import { facadeToward } from '../geo/facade.js';
import { centroid, pointSegment } from '../geo/polygon.js';
import { BAY } from './buildings.js';

export const GERANIUMS = [0xd8333a, 0xe0485a, 0xe86a9a, 0xc92d4a];
export const PETUNIAS = [0xe86a9a, 0xf4f0f2, 0xd8333a, 0xc05a9a];
const BOX = [0xb8654b, 0xf1efe8, 0x5f8a6a];
const SHARE = 0.3;
const STREET_REACH = 16;
const SILL = 0.28; // window sill height as a share of the storey, matching windowBay()

const hash = (s) => [...s].reduce((h, ch) => Math.imul(h ^ ch.charCodeAt(0), 16777619) >>> 0, 2166136261) / 4294967296;

function bloomGeometry() {
  const g = new THREE.IcosahedronGeometry(1, 1);
  const pos = g.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    const y = pos.getY(i);
    pos.setY(i, y < 0 ? y * 1.6 : y * 0.7); // trailing below, rounded above
  }
  g.computeVertexNormals();
  return g;
}

/** A batch of window boxes as two instanced meshes. items: {x, y, z, rot, width, colours} */
export function flowerBoxes(items) {
  const group = new THREE.Group();
  if (!items.length) return group;
  const boxes = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 0.18, 0.22), cel({ color: 0xffffff }), items.length);
  const blooms = new THREE.InstancedMesh(bloomGeometry(), cel({ color: 0xffffff, bands: 3 }), items.length);
  const m = new THREE.Matrix4();
  const q = new THREE.Quaternion();
  const up = new THREE.Vector3(0, 1, 0);
  const c = new THREE.Color();
  items.forEach((it, i) => {
    q.setFromAxisAngle(up, it.rot);
    const out = new THREE.Vector3(Math.sin(it.rot), 0, Math.cos(it.rot));
    const at = new THREE.Vector3(it.x, it.y, it.z).addScaledVector(out, 0.14);
    boxes.setMatrixAt(i, m.compose(at, q, new THREE.Vector3(it.width, 1, 1)));
    boxes.setColorAt(i, c.set(it.box ?? BOX[Math.floor(it.seed * BOX.length)]));
    const top = at.clone().add(new THREE.Vector3(0, 0.16, 0)).addScaledVector(out, 0.04);
    blooms.setMatrixAt(i, m.compose(top, q, new THREE.Vector3(it.width * 0.5, 0.15, 0.16)));
    blooms.setColorAt(i, c.set(it.colours[Math.floor(it.seed * 7919) % it.colours.length]));
  });
  [boxes, blooms].forEach((mesh) => {
    mesh.castShadow = true;
    mesh.instanceMatrix.needsUpdate = true;
    mesh.instanceColor.needsUpdate = true;
    group.add(mesh);
  });
  return group;
}

/** Where the rule puts geraniums: street-facing windows of house-like buildings. */
export function windowFlowerSpots(buildings, styles, roads) {
  const streets = roads
    .filter((r) => ['primary', 'secondary', 'tertiary', 'residential', 'living_street'].includes(r.kind))
    .flatMap((r) => r.pts.slice(1).map((b, i) => [r.pts[i], b]));
  return buildings.flatMap((b) => {
    const style = styles.get(b.id);
    if (!style?.windows) return [];
    const c = centroid(b.ring);
    const near = streets.reduce((best, [a, e]) => {
      const hit = pointSegment(c, a, e);
      return hit.dist < best.dist ? { dist: hit.dist, a, e } : best;
    }, { dist: Infinity });
    if (near.dist > STREET_REACH) return [];
    const target = [(near.a[0] + near.e[0]) / 2, (near.a[1] + near.e[1]) / 2];
    const f = facadeToward(b.ring, target, 2.5);
    const floors = Math.max(1, style.floors ?? Math.round((b.eave - b.ground) / 3));
    const floorH = (b.eave - b.ground) / floors;
    const bays = Math.max(1, Math.round(f.length / BAY));
    return Array.from({ length: bays * floors }, (_, i) => ({ k: i % bays, floor: Math.floor(i / bays) }))
      .map(({ k, floor }) => ({ k, floor, seed: hash(`${b.id}:${k}:${floor}`) }))
      .filter(({ floor, seed }) => seed < (floor === 0 ? SHARE * 0.4 : SHARE))
      .map(({ k, floor, seed }) => {
        const t = (k + 0.5) / bays;
        return {
          x: f.a[0] + (f.b[0] - f.a[0]) * t,
          z: f.a[1] + (f.b[1] - f.a[1]) * t,
          y: b.ground + floor * floorH + SILL * floorH - 0.1,
          rot: Math.atan2(f.n[0], f.n[1]),
          width: 0.95,
          seed,
          colours: GERANIUMS,
        };
      });
  });
}

/** A round mass of flowers (hanging basket, planter top). */
export function flowerBall(radius, colours, seed = 0.5) {
  const mesh = new THREE.Mesh(bloomGeometry(), cel({ color: colours[Math.floor(seed * colours.length) % colours.length] }));
  mesh.scale.set(radius, radius * 0.8, radius);
  mesh.castShadow = true;
  return mesh;
}
