/**
 * Water lilies (nénuphars) on the Ornain: clusters of pads, a few in
 * flower, in the slack water along the banks.  Confidence `remembered`:
 * the user says they are there; the exact patches are placed by a seeded
 * rule (every few metres of bank, not under a bridge).
 */
import * as THREE from 'three';
import { cel } from '../engine/toon.js';
import { pointInPolygon } from '../geo/polygon.js';
import { deckHeightAt } from '../geo/bridge.js';

const PAD_GREENS = [0x5f8a4a, 0x6f9a52, 0x7aa25a];
const FLOWERS = [0xf6f3ec, 0xf2c6d6];
const EVERY = 9;        // metres of bank between candidate patches
const CHANCE = 0.55;
const INSET = [0.8, 2.6];

function padGeometry() {
  const g = new THREE.CircleGeometry(1, 14, 0.35, Math.PI * 2 - 0.35); // the notch of a lily pad
  g.rotateX(-Math.PI / 2);
  return g;
}

function patches(w, bridges, rand) {
  const out = [];
  w.ring.forEach((a, i) => {
    const b = w.ring[(i + 1) % w.ring.length];
    const len = Math.hypot(b[0] - a[0], b[1] - a[1]);
    const n = [-(b[1] - a[1]) / (len || 1), (b[0] - a[0]) / (len || 1)]; // inward on a CCW ring
    for (let d = rand() * EVERY; d < len; d += EVERY) {
      if (rand() > CHANCE) continue;
      const inset = INSET[0] + rand() * (INSET[1] - INSET[0]);
      const t = d / len;
      const p = [a[0] + (b[0] - a[0]) * t + n[0] * inset, a[1] + (b[1] - a[1]) * t + n[1] * inset];
      if (!pointInPolygon(p, w.ring) || bridges.some((br) => deckHeightAt(p, br) !== null)) continue;
      out.push({ p, level: w.levels[i] });
    }
  });
  return out;
}

export function buildLilies(water, bridges) {
  let seed = 4242;
  const rand = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
  const pads = [];
  const blooms = [];
  water.forEach((w) => patches(w, bridges, rand).forEach(({ p, level }) => {
    const count = 5 + Math.floor(rand() * 10);
    for (let k = 0; k < count; k++) {
      const a = rand() * Math.PI * 2;
      const r = Math.sqrt(rand()) * 1.4;
      const q = [p[0] + Math.cos(a) * r, p[1] + Math.sin(a) * r];
      if (!w.ring || !pointInPolygon(q, w.ring)) continue;
      const size = 0.14 + rand() * 0.22;
      pads.push({ x: q[0], z: q[1], y: level - 0.03, size, rot: rand() * 6.28, colour: PAD_GREENS[Math.floor(rand() * PAD_GREENS.length)] });
      if (rand() < 0.16) blooms.push({ x: q[0], z: q[1], y: level + 0.02, colour: FLOWERS[Math.floor(rand() * FLOWERS.length)] });
    }
  }));

  const group = new THREE.Group();
  const m = new THREE.Matrix4();
  const q = new THREE.Quaternion();
  const c = new THREE.Color();
  const up = new THREE.Vector3(0, 1, 0);
  const place = (mesh, items, scale) => {
    items.forEach((it, i) => {
      mesh.setMatrixAt(i, m.compose(new THREE.Vector3(it.x, it.y, it.z), q.setFromAxisAngle(up, it.rot ?? 0), scale(it)));
      mesh.setColorAt(i, c.set(it.colour));
    });
    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
    mesh.receiveShadow = true;
    group.add(mesh);
  };
  if (pads.length) {
    place(new THREE.InstancedMesh(padGeometry(), cel({ color: 0xffffff, bands: 2, side: THREE.DoubleSide }), pads.length), pads,
      (it) => new THREE.Vector3(it.size, 1, it.size));
  }
  if (blooms.length) {
    const bloom = new THREE.ConeGeometry(0.07, 0.09, 6);
    place(new THREE.InstancedMesh(bloom, cel({ color: 0xffffff }), blooms.length), blooms, () => new THREE.Vector3(1, 1, 1));
  }
  return group;
}
