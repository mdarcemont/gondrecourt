/**
 * The tall limestone house with blue shutters and a slate mansard roof on
 * the west side of the Place (14 D32), from the user's captures.  Heights
 * are BD TOPO's (ridge 15.3 m); the dormers and arched openings are added.
 */
import * as THREE from 'three';
import { cel, flat } from '../../engine/toon.js';
import { facadeFacing, onFacade } from './common.js';

const BLUE = 0x2f5fb0;
export const style = { wall: 0xdcd3bf, shutter: BLUE, roof: 0x5e6576, roofShape: 'hip', floors: 3 };

function arch(w, h, colour) {
  const s = new THREE.Shape();
  s.moveTo(-w / 2, 0);
  s.lineTo(w / 2, 0);
  s.lineTo(w / 2, h - w / 2);
  s.absarc(0, h - w / 2, w / 2, 0, Math.PI, false);
  s.closePath();
  return new THREE.Mesh(new THREE.ShapeGeometry(s, 10), flat({ color: colour }));
}

export function build({ building }) {
  const g = new THREE.Group();
  const f = facadeFacing(building, [10, 3]);
  const n = Math.max(2, Math.round(f.length / 2.6));
  for (let i = 0; i < n; i++) {
    const t = (i + 0.5) / n;
    g.add(onFacade(arch(1.2, 2.5, 0xe6dfcf), f, { along: t, y: building.ground, out: 0.06 }));
    g.add(onFacade(arch(0.95, 2.3, i === 1 ? BLUE : 0x3d4a58), f, { along: t, y: building.ground + 0.05, out: 0.08 }));
    // dormer on the street slope of the roof
    const dormer = new THREE.Group();
    const body = new THREE.Mesh(new THREE.BoxGeometry(1.0, 1.2, 0.9), cel({ color: 0xe6dfcf }));
    const cap = new THREE.Mesh(new THREE.ConeGeometry(0.8, 0.6, 4), cel({ color: 0x5e6576 }));
    cap.rotation.y = Math.PI / 4;
    cap.position.y = 0.9;
    const win = new THREE.Mesh(new THREE.PlaneGeometry(0.6, 0.8), flat({ color: 0x3d4a58 }));
    win.position.z = 0.46;
    dormer.add(body, cap, win);
    g.add(onFacade(dormer, f, { along: t, y: building.eave + 0.7, out: -0.9 }));
  }
  // cornice
  const cornice = new THREE.Mesh(new THREE.BoxGeometry(f.length, 0.3, 0.35), cel({ color: 0xe6dfcf }));
  g.add(onFacade(cornice, f, { along: 0.5, y: building.eave - 0.15, out: 0.15 }));
  return g;
}
