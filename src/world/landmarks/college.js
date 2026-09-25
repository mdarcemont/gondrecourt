/**
 * Collège du Val d'Ornois, Rue du Panorama / Rue de Charlemagne.
 * References: user Street View captures (May 2026).  Long two-storey block
 * (BD TOPO ...0305) of cream render with a stone base, a brown tile roof, a
 * tall square chimney, rows of windows with white roller shutters half down,
 * a small canopy over the side entrance, a green mesh fence, and a flat-
 * roofed grey annex (...0584) by the car park on the Rue de Charlemagne.
 */
import * as THREE from 'three';
import { cel, flat } from '../../engine/toon.js';
import { facadeFacing, onFacade } from './common.js';
import { rollerWindow } from './school-textures.js';

const CREAM = 0xe2d6b4;
export const style = { wall: CREAM, windows: false, roof: 0xa65a45, floors: 2 };

const PANORAMA = [-240, -200];

function windowRow(length, height) {
  const tex = rollerWindow().clone();
  tex.needsUpdate = true;
  tex.repeat.set(Math.max(1, Math.round(length / 2.2)), 1);
  return new THREE.Mesh(new THREE.PlaneGeometry(length, height), flat({ map: tex, transparent: true, alphaTest: 0.4, cache: false }));
}

export function build({ building }) {
  const g = new THREE.Group();
  const storey = (building.eave - building.ground) / 2;
  [facadeFacing(building, PANORAMA), facadeFacing(building, [-300, -200])].forEach((f) => {
    [0, 1].forEach((k) => g.add(onFacade(windowRow(f.length * 0.9, storey * 0.62), f, { along: 0.5, y: building.ground + storey * (k + 0.5), out: 0.05 })));
    g.add(onFacade(new THREE.Mesh(new THREE.PlaneGeometry(f.length, 0.9), flat({ color: 0xc9b98f })), f, { along: 0.5, y: building.ground + 0.45, out: 0.04 }));
  });
  // tall square chimney near the north end
  const [cx, cz] = building.ring.reduce(([sx, sz], p) => [sx + p[0] / building.ring.length, sz + p[1] / building.ring.length], [0, 0]);
  const chimney = new THREE.Mesh(new THREE.BoxGeometry(1.4, 4.5, 1.4), cel({ color: 0xf0ece2 }));
  chimney.position.set(cx + 1, building.ridge + 1.2, cz - 12);
  chimney.castShadow = true;
  g.add(chimney);
  return g;
}
