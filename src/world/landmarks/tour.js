/**
 * Tour de Gondrecourt: the round 15th-century tower of the old castle, in
 * the upper town, now the Musée Lorrain du Cheval.
 * References: user photos 2026-09-25 (from the lower town, from the street
 * beside it, Street View Apr 2026) and IGN LiDAR HD, which fixes the height:
 * wall top about 16.5 m and roof tip 22.6 m above the ground at the tower.
 * The footprint (radius) is BD TOPO's; BD TOPO's own roof height (2 m of
 * rise) is wrong for a cone, so it is not used.
 */
import * as THREE from 'three';
import { cel, flat } from '../../engine/toon.js';
import { centroid } from '../../geo/polygon.js';
import { rubbleStone } from '../textures.js';
import { buildTourSurroundings } from './tour-surroundings.js';

export const style = {};

const WALL_ABOVE = 16.5; // LiDAR HD, metres above the terrain at the tower's centre
const TIP_ABOVE = 22.6;
const TILE = 0x7a4a3a;

function flag() {
  const g = new THREE.Group();
  const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 1.8), cel({ color: 0x3a3a40 }));
  pole.position.y = 0.9;
  const cloth = new THREE.Mesh(new THREE.PlaneGeometry(0.9, 0.45), flat({ color: 0xe8d88a, side: THREE.DoubleSide }));
  cloth.position.set(0.47, 1.5, 0);
  g.add(pole, cloth);
  return g;
}

export function build({ building, heightAt }) {
  const [cx, cz] = centroid(building.ring);
  const radius = building.ring.reduce((s, [x, z]) => s + Math.hypot(x - cx, z - cz), 0) / building.ring.length;
  const ground = heightAt(cx, cz);
  const foot = Math.min(...building.ring.map(([x, z]) => heightAt(x, z)), building.ground) - 1.5;
  const top = ground + WALL_ABOVE;
  const tip = ground + TIP_ABOVE;
  const g = new THREE.Group();

  const stone = rubbleStone('grey').clone();
  stone.needsUpdate = true;
  stone.repeat.set((2 * Math.PI * radius) / 2, (top - foot) / 2);
  const wall = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius * 1.04, top - foot, 32, 1, true), cel({ color: 0xffffff, map: stone, cache: false }));
  wall.position.set(cx, (top + foot) / 2, cz);
  // the roof overhangs the wall and flares slightly at the eave, as in the photos
  const cone = new THREE.Mesh(new THREE.ConeGeometry(radius * 1.12, tip - top, 32), cel({ color: TILE }));
  cone.position.set(cx, top + (tip - top) / 2, cz);
  const flare = new THREE.Mesh(new THREE.CylinderGeometry(radius * 1.02, radius * 1.16, 0.35, 32), cel({ color: TILE }));
  flare.position.set(cx, top + 0.05, cz);
  [wall, cone, flare].forEach((m) => { m.castShadow = true; m.receiveShadow = true; });
  g.add(wall, cone, flare);

  const f = flag();
  f.position.set(cx, tip, cz);
  g.add(f);
  // a few small openings: two square windows under the roof, slits lower down
  [[0.4, top - 1.6, 0.5, 0.55], [2.2, top - 1.9, 0.4, 0.45], [1.3, ground + 7.5, 0.18, 0.9], [3.6, ground + 4.5, 0.18, 0.8]].forEach(([a, y, w, h]) => {
    const win = new THREE.Mesh(new THREE.PlaneGeometry(w, h), flat({ color: 0x2f3440 }));
    win.position.set(cx + Math.cos(a) * (radius + 0.03), y, cz + Math.sin(a) * (radius + 0.03));
    win.rotation.y = Math.atan2(Math.cos(a), Math.sin(a));
    g.add(win);
  });
  g.add(buildTourSurroundings({ heightAt }));
  return g;
}
