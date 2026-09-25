/**
 * Builds one car from its model (car-models.js): the side profile is cut at
 * the belt line into a painted lower body and a glass cabin, with a painted
 * roof on top, then the details that date a French car of the 90s/2000s:
 * plastic bumpers, the black rubbing strip, hubcaps, and old-format plates
 * (white at the front, yellow at the back, ending in 55 for the Meuse).
 * Local frame: length along z (front at +z), width along x, wheels on y = 0.
 */
import * as THREE from 'three';
import { PAL } from '../engine/palette.js';
import { cel, flat } from '../engine/toon.js';
import { clipHalfPlane } from '../geo/polygon.js';
import { bodyProfile } from './car-models.js';

const TYRE = 0x2a2a2e;
const HUBCAP = 0xc8ccd2;
const STRIP = 0x2c2c30;

function extrude(points, width, material, bevel = 0.04) {
  const shape = new THREE.Shape(points.map(([x, y]) => new THREE.Vector2(x, y)));
  const g = new THREE.ExtrudeGeometry(shape, { depth: width, bevelEnabled: true, bevelSize: bevel, bevelThickness: bevel, bevelSegments: 1 });
  g.rotateY(-Math.PI / 2); // profile x (along the car) -> z, extrusion -> x
  g.translate(width / 2, 0, 0);
  const m = new THREE.Mesh(g, material);
  m.castShadow = true;
  m.receiveShadow = true;
  return m;
}

const plateCache = new Map();
function plate(text, yellow) {
  const key = `${text}-${yellow}`;
  if (!plateCache.has(key)) {
    const cv = document.createElement('canvas');
    cv.width = 256;
    cv.height = 56;
    const c = cv.getContext('2d');
    c.fillStyle = yellow ? '#f2c230' : '#f6f6f2';
    c.fillRect(0, 0, 256, 56);
    c.strokeStyle = '#1e1e22';
    c.lineWidth = 3;
    c.strokeRect(2, 2, 252, 52);
    c.fillStyle = '#1e1e22';
    c.font = 'bold 38px "Arial Narrow", Arial, sans-serif';
    c.textAlign = 'center';
    c.textBaseline = 'middle';
    c.fillText(text, 128, 30);
    const tex = new THREE.CanvasTexture(cv);
    tex.colorSpace = THREE.SRGBColorSpace;
    plateCache.set(key, tex);
  }
  return new THREE.Mesh(new THREE.PlaneGeometry(0.52, 0.11), flat({ map: plateCache.get(key), cache: false }));
}

function plateText(rand) {
  const digits = String(1000 + Math.floor(rand() * 8999));
  const letters = String.fromCharCode(65 + Math.floor(rand() * 26), 65 + Math.floor(rand() * 26));
  return `${digits} ${letters} 55`;
}

function wheel(r, side) {
  const g = new THREE.Group();
  const tyre = new THREE.Mesh(new THREE.CylinderGeometry(r, r, 0.2, 16), cel({ color: TYRE }));
  const cap = new THREE.Mesh(new THREE.CylinderGeometry(r * 0.66, r * 0.66, 0.205, 16), cel({ color: HUBCAP }));
  const arch = new THREE.Mesh(new THREE.CircleGeometry(r + 0.07, 16, 0, Math.PI), flat({ color: 0x1c1c20, side: THREE.DoubleSide }));
  arch.rotation.y = side * (Math.PI / 2);
  arch.position.x = -side * 0.09;
  [tyre, cap].forEach((m) => { m.rotation.z = Math.PI / 2; m.castShadow = true; });
  g.add(arch, tyre, cap);
  return g;
}

function box(w, h, d, colour, x, y, z) {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), cel({ color: colour }));
  m.position.set(x, y, z);
  return m;
}

function facingPlane(w, h, colour, x, y, z, back) {
  const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), flat({ color: colour }));
  m.position.set(x, y, z);
  if (back) m.rotation.y = Math.PI;
  return m;
}

export function buildCar(model, colour, rand) {
  const { L, W, H, beltH, wheelR } = model;
  const paint = cel({ color: colour });
  const car = new THREE.Group();
  const profile = bodyProfile(model);
  const lower = clipHalfPlane(profile, [0, -1], -(beltH + 0.02));
  const upper = clipHalfPlane(profile, [0, 1], beltH - 0.02);
  const roof = clipHalfPlane(profile, [0, 1], H - 0.07);
  car.add(extrude(lower, W - 0.08, paint));
  car.add(extrude(upper, W * 0.9, cel({ color: PAL.glassDark }), 0.02));
  const roofMesh = extrude(roof, W * 0.92, paint, 0.02);
  roofMesh.position.y = 0.012;
  car.add(roofMesh);
  car.children.forEach((m) => { m.position.z -= L / 2; });

  // B pillar, half way along the cabin
  const cabinMid = (model.roofFromRear + (L - model.roofFromFront)) / 2 - L / 2;
  car.add(box(W * 0.93, H - beltH, 0.1, colour, 0, (H + beltH) / 2, cabinMid));

  const front = L / 2 - model.frontOverhang;
  const rear = front - model.wheelbase;
  [front, rear].forEach((z) => [-1, 1].forEach((side) => {
    const w = wheel(wheelR, side);
    w.position.set(side * (W / 2 + 0.01), wheelR, z);
    car.add(w);
  }));

  const bumper = model.bumper ?? colour;
  car.add(box(W + 0.02, 0.24, 0.14, bumper, 0, 0.42, L / 2 + 0.03));
  car.add(box(W + 0.02, 0.24, 0.14, bumper, 0, 0.42, -L / 2 - 0.03));
  car.add(box(W + 0.02, 0.07, L * 0.52, STRIP, 0, 0.64, 0.05));
  [-1, 1].forEach((s) => {
    car.add(facingPlane(0.3, 0.13, 0xf2efe0, s * W * 0.32, model.noseH - 0.2, L / 2 + 0.005));
    car.add(facingPlane(0.24, 0.16, 0xc0282e, s * W * 0.36, Math.min(model.tailH, 1.1) - 0.22, -L / 2 - 0.005, true));
    car.add(box(0.1, 0.1, 0.16, bumper === STRIP ? STRIP : colour, s * (W / 2 + 0.07), beltH + 0.1, L / 2 - model.windscreenFromFront + 0.15));
  });
  const text = plateText(rand);
  const pf = plate(text, false);
  pf.position.set(0, 0.42, L / 2 + 0.11);
  const pr = plate(text, true);
  pr.position.set(0, 0.42, -L / 2 - 0.11);
  pr.rotation.y = Math.PI;
  car.add(pf, pr);
  car.userData.model = model.name;
  return car;
}
