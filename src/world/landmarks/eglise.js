/**
 * Église de la Nativité-de-la-Vierge.
 * References: user Street View capture (11 Rue de l'Église, May 2026) and
 * IGN LiDAR HD, which fixes the tower (spire tip 24.2 m above the ground at
 * TOWER) and the nave roof (about 11.5 m).  The nave is the generic
 * building restyled; the west front, tower and windows are added here.
 */
import * as THREE from 'three';
import { cel, flat } from '../../engine/toon.js';
import { PAL } from '../../engine/palette.js';
import { dot, norm, perp } from '../../geo/polygon.js';
import { belfryTexture, clockTexture, lancetTexture, portalTexture, roseTexture } from './eglise-textures.js';

const LIMESTONE = 0xd0cfc8; // pale grey limestone, as in the photo
export const style = { wall: LIMESTONE, roof: 0x857d78, windows: false, eaveAbove: 7.5, ridgeAbove: 11.5 };

const TOWER = [-5.2, 132.5];
const TOWER_SIDE = 6.8;
const TOWER_WALL = 16.5;
const SPIRE_TIP = 24.2;

const at = (u, n, s, t) => [u[0] * s + n[0] * t, u[1] * s + n[1] * t];

function plane(w, h, map, { transparent = false } = {}) {
  return new THREE.Mesh(new THREE.PlaneGeometry(w, h), flat({ map, transparent, alphaTest: transparent ? 0.4 : 0, cache: false }));
}

/** Put a flat object at p, facing direction d (unit, in x/z). */
function facing(obj, p, y, d) {
  obj.position.set(p[0], y, p[1]);
  obj.rotation.y = Math.atan2(d[0], d[1]);
  return obj;
}

function tower(u, n, ground) {
  const g = new THREE.Group();
  const stone = cel({ color: LIMESTONE });
  const body = new THREE.Mesh(new THREE.BoxGeometry(TOWER_SIDE, TOWER_WALL, TOWER_SIDE), stone);
  body.position.set(TOWER[0], ground + TOWER_WALL / 2, TOWER[1]);
  body.rotation.y = Math.atan2(u[0], u[1]);
  body.castShadow = true;
  body.receiveShadow = true;
  const spireH = SPIRE_TIP - TOWER_WALL - 1.2;
  const spire = new THREE.Mesh(new THREE.ConeGeometry((TOWER_SIDE / Math.SQRT2) * 1.08, spireH, 4), cel({ color: PAL.roofSlate }));
  spire.position.set(TOWER[0], ground + TOWER_WALL + spireH / 2, TOWER[1]);
  spire.rotation.y = Math.atan2(u[0], u[1]) + Math.PI / 4;
  spire.castShadow = true;
  g.add(body, spire);
  // cross and weathervane on the tip
  const iron = cel({ color: 0x3a3a40 });
  const rod = new THREE.Mesh(new THREE.BoxGeometry(0.06, 1.2, 0.06), iron);
  rod.position.set(TOWER[0], ground + SPIRE_TIP - 0.6, TOWER[1]);
  const arm = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.05, 0.05), iron);
  arm.position.set(TOWER[0], ground + SPIRE_TIP - 0.3, TOWER[1]);
  arm.rotation.y = Math.atan2(n[0], n[1]);
  g.add(rod, arm);
  // belfry openings on all four faces, the clock on the west face
  const half = TOWER_SIDE / 2 + 0.03;
  [u, [-u[0], -u[1]], n, [-n[0], -n[1]]].forEach((d) => {
    const p = [TOWER[0] + d[0] * half, TOWER[1] + d[1] * half];
    g.add(facing(plane(4.2, 2.6, belfryTexture(), { transparent: true }), p, ground + 14.3, d));
  });
  const west = [TOWER[0] - u[0] * (half + 0.02), TOWER[1] - u[1] * (half + 0.02)];
  g.add(facing(plane(1.2, 1.2, clockTexture(), { transparent: true }), west, ground + 12.0, [-u[0], -u[1]]));
  return g;
}

function westFront(u, n, sMin, mid, ground, ridge) {
  const g = new THREE.Group();
  const out = [-u[0], -u[1]];
  const centre = at(u, n, sMin - 0.06, mid);
  g.add(facing(plane(2.6, 4.4, portalTexture(), { transparent: true }), centre, ground + 2.2, out));
  g.add(facing(plane(1.9, 1.9, roseTexture(), { transparent: true }), centre, ground + 6.9, out));
  const stone = cel({ color: LIMESTONE });
  [-1, 1].forEach((side) => {
    const b = new THREE.Mesh(new THREE.BoxGeometry(0.9, 6.2, 1.1), stone);
    const p = at(u, n, sMin - 0.5, mid + side * 3.4);
    b.position.set(p[0], ground + 3.1, p[1]);
    b.rotation.y = Math.atan2(u[0], u[1]);
    b.castShadow = true;
    g.add(b);
  });
  const cross = new THREE.Group();
  const post = new THREE.Mesh(new THREE.BoxGeometry(0.16, 1.2, 0.16), stone);
  const bar = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.16, 0.7), stone);
  bar.position.y = 0.2;
  cross.add(post, bar);
  const apex = at(u, n, sMin + 0.1, mid);
  cross.position.set(apex[0], ridge + 0.55, apex[1]);
  cross.rotation.y = Math.atan2(u[0], u[1]);
  g.add(cross);
  return g;
}

function sideWindows(u, n, sMin, sMax, lo, hi, ground) {
  const g = new THREE.Group();
  for (let s = sMin + 6; s < sMax - 3; s += 5.5) {
    if (Math.abs(s - dot(TOWER, u)) < TOWER_SIDE / 2 + 1) continue;
    [[hi + 0.06, n], [lo - 0.06, [-n[0], -n[1]]]].forEach(([t, d]) => {
      g.add(facing(plane(1.0, 3.0, lancetTexture(), { transparent: true }), at(u, n, s, t), ground + 4.0, d));
    });
  }
  return g;
}

export function build({ building }) {
  const u = norm(building.ridgeDir);
  const n = perp(u);
  const along = building.ring.map((p) => dot(p, u));
  const across = building.ring.map((p) => dot(p, n));
  const lo = Math.min(...across);
  const hi = Math.max(...across);
  // the west front is the end of the nave furthest along -u (the ridge points east)
  const sMin = Math.min(...along);
  const sMax = Math.max(...along);
  const ground = building.ground;
  const g = new THREE.Group();
  g.add(tower(u, n, ground));
  g.add(westFront(u, n, sMin, (lo + hi) / 2, ground, ground + style.ridgeAbove));
  g.add(sideWindows(u, n, sMin, sMax, lo, hi, ground));
  return g;
}
