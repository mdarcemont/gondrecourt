/**
 * Crédit Agricole Lorraine, at the junction of the Rue Raymond Poincaré and
 * the Rue du Général de Gaulle.  References: three user Street View captures
 * (Apr 2026).  Two storeys of pale roughcast, a hipped tile roof, wide dark
 * windows with pale striped film and "CRÉDIT AGRICOLE / LORRAINE" on them,
 * a small tiled canopy over the entrance with the name sign, a green CA
 * logo panel, and a hedge and a stone trough on the corner.
 */
import * as THREE from 'three';
import { cel, flat } from '../../engine/toon.js';
import { facadeFacing, onFacade, signPanel, solid } from './common.js';
import { stripedGlass } from './shop-textures.js';
import { flowerBall } from '../flowers.js';

const ROUGHCAST = 0xe9dfc8;
export const style = { wall: ROUGHCAST, windows: false, roofShape: 'hip', floors: 2, roof: 0xb0674d };

const JUNCTION = [86, -104];
const HEDGE = [0x4f7a3a, 0x5a8a44, 0x6a2e3a];

function canopy(width) {
  const g = new THREE.Group();
  const roof = new THREE.Mesh(new THREE.ConeGeometry(width * 0.72, 0.9, 4, 1, false, Math.PI / 4), cel({ color: 0xb0674d }));
  roof.scale.set(1, 1, 0.55);
  roof.position.set(0, 0.45, 0.9);
  g.add(roof);
  return g;
}

export function build({ building, heightAt }) {
  const g = new THREE.Group();
  const f = facadeFacing(building, JUNCTION);
  const y = Math.max(building.ground, heightAt(f.mid[0] + f.n[0] * 2, f.mid[1] + f.n[1] * 2));
  const storey = (building.eave - building.ground) / 2;
  const put = (obj, along, yy, out = 0.05) => g.add(onFacade(obj, f, { along, y: yy, out }));

  const glass = cel({ color: 0xffffff, map: stripedGlass(), cache: false });
  [0.62, 0.8].forEach((a) => [0, 1].forEach((k) => put(new THREE.Mesh(new THREE.PlaneGeometry(1.9, storey * 0.62), glass), a, y + storey * (k + 0.5))));
  put(signPanel('CRÉDIT AGRICOLE', 0.18, { color: 0xdfe8e4, font: 'bold 60px Arial, sans-serif' }), 0.8, y + storey * 1.3, 0.07);
  put(signPanel('LORRAINE', 0.18, { color: 0xdfe8e4, font: 'bold 60px Arial, sans-serif' }), 0.62, y + storey * 0.3, 0.07);

  // the entrance: door, canopy, the white name sign
  put(new THREE.Mesh(new THREE.PlaneGeometry(1.4, 2.3), flat({ color: 0x2a4a8a })), 0.25, y + 1.15);
  put(canopy(3.2), 0.25, y + 2.6, 0);
  put(signPanel('CRÉDIT AGRICOLE LORRAINE', 0.42, { color: 0x1f4a7a, bg: 0xf6f6f2, font: 'bold 70px Arial, sans-serif', maxWidth: 3.4 }), 0.25, y + 2.55, 1.35);
  put(new THREE.Mesh(new THREE.PlaneGeometry(0.55, 0.55), flat({ color: 0x1f8a6a })), 0.45, y + storey * 1.5);

  // hedge along the front and a stone trough on the corner
  const out = [f.n[0] * 1.2, f.n[1] * 1.2];
  for (let t = 0.35; t <= 0.95; t += 0.1) {
    const p = [f.a[0] + (f.b[0] - f.a[0]) * t + out[0], f.a[1] + (f.b[1] - f.a[1]) * t + out[1]];
    const bush = flowerBall(0.6, HEDGE, (t * 7) % 1);
    bush.position.set(p[0], heightAt(...p) + 0.45, p[1]);
    g.add(bush);
  }
  const corner = [f.a[0] + f.n[0] * 4, f.a[1] + f.n[1] * 4];
  const trough = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.6, 0.8), solid(0xb9b2a4));
  trough.position.set(corner[0], heightAt(...corner) + 0.3, corner[1]);
  g.add(trough);
  return g;
}
