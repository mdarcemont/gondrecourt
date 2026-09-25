/**
 * The ville haute: the old town on the plateau round the château (Rue du
 * Pilori, Place de la Halle, Rue Saint-Blaise).  User captures show white
 * or stone render, wooden shutters in brown and red-brown, old iron wall
 * lanterns and stacked firewood.  Every building whose ground stands at
 * least PLATEAU metres above the square gets that style; lanterns and
 * woodpiles are placed by a seeded rule (`type-seen`).
 */
import * as THREE from 'three';
import { cel, flat } from '../engine/toon.js';
import { centroid } from '../geo/polygon.js';
import { streetFacade, onFacade } from './landmarks/common.js';

export const PLATEAU = 12;
const WALLS = [0xece8de, 0xe2d9c6, 0xd6cbb4, 0xefe6d2];
const SHUTTERS = [0x8a5a3a, 0x9a4a3a, 0x7a5a3a, 'roller'];
const IRON = 0x3a3a40;

const hash = (s) => [...s].reduce((h, ch) => Math.imul(h ^ ch.charCodeAt(0), 16777619) >>> 0, 2166136261);
export const isUpperTown = (b) => b.ground >= PLATEAU && b.usage !== 'Annexe';

export function upperTownOverrides(buildings, taken) {
  return Object.fromEntries(buildings.filter((b) => isUpperTown(b) && !taken[b.id]).map((b) => {
    const h = hash(b.id);
    return [b.id, { wall: WALLS[h % WALLS.length], shutter: SHUTTERS[(h >>> 3) % SHUTTERS.length] }];
  }));
}

function lantern() {
  const g = new THREE.Group();
  const arm = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.05, 0.5), cel({ color: IRON }));
  arm.position.z = 0.25;
  const cage = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.11, 0.4, 6), flat({ color: 0xf2ecd4 }));
  cage.position.set(0, -0.22, 0.5);
  const cap = new THREE.Mesh(new THREE.ConeGeometry(0.2, 0.18, 6), cel({ color: IRON }));
  cap.position.set(0, 0.05, 0.5);
  g.add(arm, cage, cap);
  return g;
}

function woodpile(seed) {
  const g = new THREE.Group();
  const logs = new THREE.Mesh(new THREE.BoxGeometry(2.6 + (seed % 3), 1.1, 0.7), cel({ color: 0x9a7a55 }));
  logs.position.y = 0.55;
  const ends = new THREE.Mesh(new THREE.PlaneGeometry(2.6 + (seed % 3), 1.1), cel({ color: 0xc9a47a }));
  ends.position.set(0, 0.55, 0.36);
  g.add(logs, ends);
  return g;
}

export function buildUpperTown(buildings, roads) {
  const g = new THREE.Group();
  buildings.filter(isUpperTown).forEach((b) => {
    const h = hash(b.id);
    const f = streetFacade(b, roads);
    if (!f || f.length < 4) return;
    if (h % 3 === 0) g.add(onFacade(lantern(), f, { along: h % 2 ? 0.1 : 0.9, y: b.ground + 3.0, out: 0 }));
    if (h % 7 === 0) {
      const w = woodpile(h);
      const c = centroid(b.ring);
      w.position.set(f.mid[0] + f.n[0] * 1.2, b.ground, f.mid[1] + f.n[1] * 1.2);
      w.rotation.y = Math.atan2(f.n[0], f.n[1]);
      if (Math.hypot(c[0], c[1]) > 0) g.add(w);
    }
  });
  return g;
}
