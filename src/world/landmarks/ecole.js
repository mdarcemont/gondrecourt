/**
 * École primaire publique La Petite Meusienne (école maternelle), Rue du
 * Panorama.  References: four user Street View captures (May 2026).
 * Main block (BD TOPO ...0572): two storeys, white, continuous ribbons of
 * windows, low hipped brown roof, tricolour over the door.  The long low
 * building (...0570): white, grey metal barrel roof, three portholes on the
 * street end.  Red school barriers along the pavement.
 */
import * as THREE from 'three';
import { cel, flat } from '../../engine/toon.js';
import { facadeFacing, onFacade } from './common.js';
import { mainFacadeToward } from '../../geo/facade.js';
import { ribbonWindow } from './school-textures.js';

const WHITE = 0xf2f1ec;
const RED = 0xd23a36;
// two storeys under a low roof (photos); BD TOPO's 4.8 m eave is one storey
export const style = { wall: WHITE, windows: false, roofShape: 'hip', roof: 0x8a5a45, floors: 2, eaveAbove: 7.2, ridgeAbove: 9.6 };

const ROAD = [-205, -330];

function ribbon(length, height) {
  const tex = ribbonWindow().clone();
  tex.needsUpdate = true;
  tex.repeat.set(Math.max(1, Math.round(length / 1.5)), 1);
  return new THREE.Mesh(new THREE.PlaneGeometry(length, height), cel({ color: 0xffffff, map: tex, cache: false }));
}

function barriers(a, b, heightAt) {
  const g = new THREE.Group();
  const len = Math.hypot(b[0] - a[0], b[1] - a[1]);
  const rot = Math.atan2(b[0] - a[0], b[1] - a[1]) + Math.PI / 2;
  const mat = cel({ color: RED });
  for (let d = 0; d < len; d += 2) {
    const t = d / len;
    const p = [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
    const y = heightAt(...p);
    const panel = new THREE.Group();
    [0.15, 0.95].forEach((h) => {
      const rail = new THREE.Mesh(new THREE.BoxGeometry(2, 0.06, 0.05), mat);
      rail.position.y = h;
      panel.add(rail);
    });
    [-1, 1].forEach((s) => {
      const post = new THREE.Mesh(new THREE.BoxGeometry(0.06, 1.05, 0.06), mat);
      post.position.set(s, 0.52, 0);
      panel.add(post);
      const x = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.04, 0.04), mat);
      x.rotation.z = s * 0.37;
      x.position.y = 0.55;
      panel.add(x);
    });
    panel.position.set(p[0], y, p[1]);
    panel.rotation.y = rot;
    g.add(panel);
  }
  return g;
}

function flag() {
  const g = new THREE.Group();
  [[0x2b4a9c, -0.25], [0xf6f6f6, 0], [0xd8333a, 0.25]].forEach(([c, x]) => {
    const band = new THREE.Mesh(new THREE.PlaneGeometry(0.25, 0.6), flat({ color: c, side: THREE.DoubleSide }));
    band.position.set(x, 0, 0.3);
    g.add(band);
  });
  g.rotation.x = 0.35;
  return g;
}

export function build({ building, heightAt }) {
  const g = new THREE.Group();
  const f = mainFacadeToward(building.ring, ROAD);
  const y = heightAt(f.mid[0] + f.n[0] * 2, f.mid[1] + f.n[1] * 2);
  const storey = style.eaveAbove / 2;
  [0, 1].forEach((k) => g.add(onFacade(ribbon(f.length * 0.92, storey * 0.5), f, { along: 0.5, y: building.ground + storey * (k + 0.55), out: 0.05 })));
  g.add(onFacade(new THREE.Mesh(new THREE.PlaneGeometry(1.2, 2.3), flat({ color: 0x3d4a58 })), f, { along: 0.66, y: y + 1.15, out: 0.07 }));
  g.add(onFacade(flag(), f, { along: 0.66, y: building.ground + storey + 0.4, out: 0.05 }));

  // the lower white end with three portholes and the letter box, at the south end of the front
  const south = facadeFacing(building, [-200, -365]);
  [-1.3, 0, 1.3].forEach((dx) => {
    const ring = new THREE.Mesh(new THREE.RingGeometry(0.34, 0.45, 20), flat({ color: 0x6a6d72 }));
    const glass = new THREE.Mesh(new THREE.CircleGeometry(0.34, 20), flat({ color: 0x3d4a58 }));
    [ring, glass].forEach((m) => g.add(onFacade(m, south, { along: 0.5 + dx / south.length, y: building.ground + 2.2, out: 0.06 })));
  });
  g.add(onFacade(new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.3, 0.2), cel({ color: 0xe6c030 })), south, { along: 0.15, y: building.ground + 1.6, out: 0.1 }));
  // red barriers along the pavement in front of the school
  const out = [f.n[0] * 5.5, f.n[1] * 5.5];
  g.add(barriers([f.a[0] + out[0], f.a[1] + out[1]], [f.b[0] + out[0], f.b[1] + out[1]], heightAt));
  return g;
}
