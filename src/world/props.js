/**
 * Street furniture and facade props, modelled from the reference photos.
 * Each maker returns a Group with its origin at its base (lamp post) or at
 * its wall fixing (wall lamp, sign bracket, balcony), facing +z.
 */
import * as THREE from 'three';
import { PAL } from '../engine/palette.js';
import { cel, flat } from '../engine/toon.js';
import { railing, signDisc } from './textures.js';

const METAL = PAL.railingGreen;
const mat = (c) => cel({ color: c });

function lantern() {
  const g = new THREE.Group();
  const hood = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.26, 0.16, 10), mat(METAL));
  const glass = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.14, 0.18, 10), flat({ color: 0xf6f1dc }));
  glass.position.y = -0.16;
  g.add(hood, glass);
  return g;
}

/** A curved arm from (0,0,0) out to `reach` along +z, rising then dipping, as a tube. */
function swanArm(reach, rise) {
  const curve = new THREE.CubicBezierCurve3(
    new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, rise, reach * 0.2),
    new THREE.Vector3(0, rise * 1.1, reach * 0.9), new THREE.Vector3(0, rise * 0.55, reach)
  );
  return new THREE.Mesh(new THREE.TubeGeometry(curve, 12, 0.035, 5), mat(METAL));
}

/** Green double-arm ("double crosse") lamp post, 4.6 m. */
export function lampPost() {
  const g = new THREE.Group();
  const H = 4.6;
  const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.09, H, 8), mat(METAL));
  pole.position.y = H / 2;
  const foot = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.16, 0.5, 8), mat(METAL));
  foot.position.y = 0.25;
  g.add(pole, foot);
  [0, Math.PI].forEach((rot) => {
    const arm = new THREE.Group();
    arm.add(swanArm(0.75, 0.45));
    const l = lantern();
    l.position.set(0, 0.2, 0.75);
    arm.add(l);
    arm.position.y = H - 0.2;
    arm.rotation.y = rot;
    g.add(arm);
  });
  g.traverse((o) => { o.castShadow = true; });
  return g;
}

/** Swan-neck lamp fixed to a wall. */
export function wallLamp() {
  const g = new THREE.Group();
  g.add(swanArm(0.7, 0.35));
  const l = lantern();
  l.position.set(0, 0.12, 0.7);
  g.add(l);
  return g;
}

/** A bracket with signs hung one below the other, standing out from the wall. */
export function hangingSigns(kinds) {
  const g = new THREE.Group();
  const bar = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.05, 1.0), mat(METAL));
  bar.position.set(0, 0, 0.5);
  g.add(bar);
  kinds.forEach((kind, i) => {
    const { tex, w, h } = signDisc(kind);
    // two single-sided faces back to back, so the lettering reads correctly from both ways along the street
    const face = flat({ map: tex, transparent: true, alphaTest: 0.4, cache: false });
    [Math.PI / 2, -Math.PI / 2].forEach((rot) => {
      const sign = new THREE.Mesh(new THREE.PlaneGeometry(w, h), face);
      sign.rotation.y = rot;
      sign.position.set(0, -0.35 - i * 0.62, 0.55);
      g.add(sign);
    });
  });
  return g;
}

/** Wrought-iron balcony: a slab and a railing on three sides. */
export function balcony(width, depth = 0.55) {
  const g = new THREE.Group();
  const slab = new THREE.Mesh(new THREE.BoxGeometry(width, 0.12, depth), mat(PAL.quay));
  slab.position.set(0, 0, depth / 2);
  g.add(slab);
  const tex = railing().clone();
  tex.needsUpdate = true;
  tex.repeat.set(width, 1);
  const railMat = cel({ color: 0xffffff, map: tex, alphaTest: 0.5, side: THREE.DoubleSide, cache: false });
  const front = new THREE.Mesh(new THREE.PlaneGeometry(width, 0.95), railMat);
  front.position.set(0, 0.5, depth);
  g.add(front);
  [-1, 1].forEach((s) => {
    const side = new THREE.Mesh(new THREE.PlaneGeometry(depth, 0.95), railMat);
    side.rotation.y = Math.PI / 2;
    side.position.set((s * width) / 2, 0.5, depth / 2);
    g.add(side);
  });
  g.traverse((o) => { o.castShadow = true; });
  return g;
}

/** Park bench: two slats and iron ends. Faces +z. */
export function bench() {
  const g = new THREE.Group();
  const wood = mat(0x8a6a4a);
  const seat = new THREE.Mesh(new THREE.BoxGeometry(1.7, 0.06, 0.42), wood);
  seat.position.y = 0.45;
  const back = new THREE.Mesh(new THREE.BoxGeometry(1.7, 0.36, 0.05), wood);
  back.position.set(0, 0.72, -0.2);
  back.rotation.x = -0.12;
  g.add(seat, back);
  [-0.75, 0.75].forEach((x) => {
    const end = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.45, 0.45), mat(METAL));
    end.position.set(x, 0.23, 0);
    g.add(end);
  });
  g.traverse((o) => { o.castShadow = true; });
  return g;
}

/** Square stone planter; the flowers are added by the caller. */
export function planter() {
  const box = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.6, 1.1), mat(0xd9d2c4));
  box.position.y = 0.3;
  box.castShadow = true;
  const g = new THREE.Group();
  g.add(box);
  return g;
}

/** Pollarded plane tree (knobbly bare-ish crown) on a round iron grate. */
export function pollardTree(seed = 0.5) {
  const g = new THREE.Group();
  const bark = mat(0x8a7a66);
  const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.17, 2.6, 7), bark);
  trunk.position.y = 1.3;
  g.add(trunk);
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2 + seed * 3;
    const br = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.07, 1.4, 5), bark);
    br.position.set(Math.cos(a) * 0.35, 3.1, Math.sin(a) * 0.35);
    br.rotation.set(Math.sin(a) * 0.5, 0, -Math.cos(a) * 0.5);
    g.add(br);
    const leaves = new THREE.Mesh(new THREE.IcosahedronGeometry(0.42, 0), mat(0x8faa5a));
    leaves.position.set(Math.cos(a) * 0.7, 3.8, Math.sin(a) * 0.7);
    g.add(leaves);
  }
  const grate = new THREE.Mesh(new THREE.CylinderGeometry(0.9, 0.9, 0.04, 20), mat(0x3a3a40));
  grate.position.y = 0.02;
  g.add(grate);
  g.traverse((o) => { o.castShadow = true; });
  return g;
}

/** Orange bistro table with two chairs (Chez Michel's terrace). */
export function cafeSet() {
  const g = new THREE.Group();
  const orange = mat(0xe0612a);
  const top = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.04, 0.7), orange);
  top.position.y = 0.74;
  const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.72), mat(0x9aa1aa));
  leg.position.y = 0.36;
  g.add(top, leg);
  [-1, 1].forEach((s) => {
    const seat = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.04, 0.42), orange);
    seat.position.set(s * 0.6, 0.45, 0);
    const back = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.4, 0.42), orange);
    back.position.set(s * 0.82, 0.68, 0);
    const legs = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.43, 0.04), orange);
    legs.position.set(s * 0.6, 0.22, 0);
    g.add(seat, back, legs);
  });
  return g;
}

export function bollard() {
  const b = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.08, 0.9, 8), mat(0x3a3a40));
  b.position.y = 0.45;
  const g = new THREE.Group();
  g.add(b);
  return g;
}

/** Yellow La Poste letter box on a post. */
export function postBox() {
  const g = new THREE.Group();
  const box = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.75, 0.4), mat(0xf2c230));
  box.position.y = 0.9;
  const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.25, 0.5, 12, 1, false, 0, Math.PI), mat(0xf2c230));
  cap.rotation.z = Math.PI / 2;
  cap.position.y = 1.27;
  const post = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.55, 0.16), mat(0x3a3a40));
  post.position.y = 0.27;
  g.add(box, cap, post);
  return g;
}

/** The disused traffic light standing in a round concrete pot. */
export function trafficLightPot() {
  const g = new THREE.Group();
  const pot = new THREE.Mesh(new THREE.CylinderGeometry(0.6, 0.6, 0.9, 16, 1, true), mat(0xbdb8ae));
  pot.position.y = 0.45;
  const earth = new THREE.Mesh(new THREE.CircleGeometry(0.58, 16), mat(0x6a5a44));
  earth.rotation.x = -Math.PI / 2;
  earth.position.y = 0.8;
  const head = new THREE.Mesh(new THREE.BoxGeometry(0.34, 1.0, 0.3), mat(0x2a2a2e));
  head.position.set(0.1, 1.55, 0);
  head.rotation.z = -0.12;
  const back = new THREE.Mesh(new THREE.BoxGeometry(0.36, 1.02, 0.06), mat(0xf2c230));
  back.position.set(0.1, 1.55, -0.17);
  back.rotation.z = -0.12;
  g.add(pot, earth, head, back);
  return g;
}

/** A-frame chalkboard, "RESTO OUVERT". */
export function aBoard() {
  const g = new THREE.Group();
  [-1, 1].forEach((s) => {
    const p = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.9, 0.04), mat(0x2e3a33));
    p.position.set(0, 0.45, s * 0.16);
    p.rotation.x = s * 0.2;
    g.add(p);
  });
  return g;
}
