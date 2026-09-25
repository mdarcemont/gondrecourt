/**
 * The street side of the tower (user photo from beside it): a small kiosk
 * with a tiled pyramid roof, an old lantern on a post, a low wall with
 * square pillars at the edge of the plateau, an information panel, a bench
 * and a woodpile.  Positions are read off the photo relative to the tower
 * and the Rue Saint-Blaise, so they are approximate.
 */
import * as THREE from 'three';
import { cel, flat } from '../../engine/toon.js';
import { PAL } from '../../engine/palette.js';
import { bench } from '../props.js';

const RENDER = 0xe9e3d3;
const TILE = 0x9a6a4a;
const IRON = 0x5a3e30;

const place = (obj, [x, z], heightAt, rot = 0) => {
  obj.position.set(x, heightAt(x, z), z);
  obj.rotation.y = rot;
  return obj;
};

function kiosk() {
  const g = new THREE.Group();
  const body = new THREE.Mesh(new THREE.BoxGeometry(2.2, 2.1, 2.2), cel({ color: RENDER }));
  body.position.y = 1.05;
  const roof = new THREE.Mesh(new THREE.ConeGeometry(1.95, 1.2, 4), cel({ color: TILE }));
  roof.rotation.y = Math.PI / 4;
  roof.position.y = 2.7;
  const door = new THREE.Mesh(new THREE.PlaneGeometry(0.8, 1.6), flat({ color: 0x4a3a30 }));
  door.position.set(0, 0.8, 1.11);
  const panel = new THREE.Mesh(new THREE.PlaneGeometry(1.0, 0.7), flat({ color: 0x3a5f8a }));
  panel.position.set(1.4, 1.3, 0.6);
  g.add(body, roof, door, panel);
  g.traverse((o) => { o.castShadow = true; });
  return g;
}

function lantern() {
  const g = new THREE.Group();
  const post = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.11, 3.4, 8), cel({ color: IRON }));
  post.position.y = 1.7;
  const lamp = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.13, 0.45, 6), flat({ color: 0xf2ecd4 }));
  lamp.position.y = 3.6;
  const cap = new THREE.Mesh(new THREE.ConeGeometry(0.26, 0.22, 6), cel({ color: IRON }));
  cap.position.y = 3.92;
  g.add(post, lamp, cap);
  return g;
}

function lowWall(a, b, heightAt) {
  const g = new THREE.Group();
  const len = Math.hypot(b[0] - a[0], b[1] - a[1]);
  const rot = Math.atan2(b[0] - a[0], b[1] - a[1]);
  const n = Math.max(1, Math.round(len / 3));
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    const p = [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
    const pillar = new THREE.Mesh(new THREE.BoxGeometry(0.45, 1.2, 0.45), cel({ color: RENDER }));
    pillar.position.set(p[0], heightAt(...p) + 0.6, p[1]);
    g.add(pillar);
  }
  const mid = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
  const wall = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.8, len), cel({ color: RENDER }));
  wall.position.set(mid[0], heightAt(...mid) + 0.4, mid[1]);
  wall.rotation.y = rot;
  g.add(wall);
  g.traverse((o) => { o.castShadow = true; });
  return g;
}

function woodpile() {
  const g = new THREE.Group();
  const wood = cel({ color: 0x8a6a4a });
  for (let i = 0; i < 14; i++) {
    const log = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 1.0, 7), wood);
    log.rotation.x = Math.PI / 2;
    log.position.set((i % 7) * 0.26 - 0.8, 0.12 + Math.floor(i / 7) * 0.22, 0);
    g.add(log);
  }
  return g;
}

// read off the photo against the plan: the tribunal's front is at z = -104..-107,
// the tower stands behind it to the east, the Rue Saint-Blaise runs at z = -109..-111
const SPOTS = {
  kiosk: [211.5, -104.8],
  lantern: [212.8, -101.2],
  board: [213.9, -103.4],
  wall: [[214.5, -99.5], [222.5, -104.5]],
  bench: [205.0, -115.6],
  woodpile: [209.5, -116.4],
};

export function buildTourSurroundings({ heightAt }) {
  const g = new THREE.Group();
  const toStreet = Math.PI; // faces -z, the street
  g.add(place(kiosk(), SPOTS.kiosk, heightAt, toStreet));
  g.add(place(lantern(), SPOTS.lantern, heightAt));
  g.add(lowWall(...SPOTS.wall, heightAt));
  const panel = place(new THREE.Mesh(new THREE.PlaneGeometry(1.1, 0.8), flat({ color: 0x2f4f6a, side: THREE.DoubleSide })), SPOTS.board, heightAt, toStreet);
  panel.position.y += 1.3;
  g.add(panel);
  g.add(place(bench(), SPOTS.bench, heightAt, Math.PI));
  g.add(place(woodpile(), SPOTS.woodpile, heightAt, 0.1));
  return g;
}
