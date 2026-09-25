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
