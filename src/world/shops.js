/**
 * Ground-floor shopfronts: fascia with lettering, window, door, optional
 * striped awning and a chalkboard on the pavement.  Placed by details.js on
 * a real building's street facade.
 */
import * as THREE from 'three';
import { PAL } from '../engine/palette.js';
import { cel, flat } from '../engine/toon.js';
import { onFacade, signPanel } from './landmarks/common.js';

const stripeCache = new Map();
function stripes(colour) {
  if (stripeCache.has(colour)) return stripeCache.get(colour);
  const cv = document.createElement('canvas');
  cv.width = 128;
  cv.height = 8;
  const c = cv.getContext('2d');
  for (let i = 0; i < 8; i++) {
    c.fillStyle = i % 2 ? '#f4f0e6' : `#${colour.toString(16).padStart(6, '0')}`;
    c.fillRect(i * 16, 0, 16, 8);
  }
  const tex = new THREE.CanvasTexture(cv);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = THREE.RepeatWrapping;
  stripeCache.set(colour, tex);
  return tex;
}

const plane = (w, h, colour) => new THREE.Mesh(new THREE.PlaneGeometry(w, h), flat({ color: colour }));

function awning(width, colour) {
  const tex = stripes(colour).clone();
  tex.needsUpdate = true;
  tex.repeat.set(width / 1.6, 1);
  const g = new THREE.Group();
  const cloth = new THREE.Mesh(new THREE.PlaneGeometry(width, 1.3), cel({ color: 0xffffff, map: tex, side: THREE.DoubleSide, cache: false }));
  cloth.rotation.x = -Math.PI / 2 + 0.55;
  cloth.position.set(0, -0.35, 0.55);
  cloth.castShadow = true;
  const valance = new THREE.Mesh(new THREE.PlaneGeometry(width, 0.25), cel({ color: 0xffffff, map: tex, side: THREE.DoubleSide, cache: false }));
  valance.position.set(0, -0.8, 1.08);
  g.add(cloth, valance);
  return g;
}

function chalkboard(lines) {
  const g = new THREE.Group();
  const board = signPanel(lines, 0.24, { color: 0xf4f4f0, bg: 0x2e3a33, font: 'bold 64px "Comic Sans MS", cursive', maxWidth: 0.55 });
  board.position.y = 0.75;
  board.rotation.x = -0.18;
  const frame = new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.95, 0.05), cel({ color: 0x8a6a4a }));
  frame.position.set(0, 0.5, -0.04);
  frame.rotation.x = -0.18;
  g.add(frame, board);
  return g;
}

/**
 * f: facade (from facadeToward), floorY: pavement height at the shop.
 * spec: { name, sub, colour, text, awning, board }
 */
export function shopfront(f, floorY, spec) {
  const g = new THREE.Group();
  const width = Math.min(f.length * 0.85, 7);
  const add = (obj, along, y, out) => g.add(onFacade(obj, f, { along, y, out }));
  add(plane(width, 0.62, spec.colour), 0.5, floorY + 3.0, 0.04);
  add(signPanel(spec.name, 0.4, { color: spec.text ?? PAL.frameWhite, bg: spec.colour, font: 'bold 84px Georgia, serif', maxWidth: width * 0.9 }), 0.5, floorY + 3.02, 0.06);
  if (spec.sub) add(signPanel(spec.sub, 0.2, { color: spec.colour, bg: PAL.frameWhite, font: 'italic 60px Georgia, serif', maxWidth: width * 0.5 }), 0.3, floorY + 2.45, 0.06);
  const win = Math.min(width * 0.55, 3.2);
  add(plane(win + 0.2, 2.0, spec.colour), 0.38, floorY + 1.3, 0.04);
  add(plane(win, 1.8, PAL.glassDark), 0.38, floorY + 1.3, 0.06);
  add(plane(1.05, 2.3, spec.colour), 0.8, floorY + 1.15, 0.04);
  add(plane(0.85, 2.15, PAL.glassDark), 0.8, floorY + 1.1, 0.06);
  if (spec.awning) add(awning(width, spec.awning), 0.5, floorY + 2.75, 0.02);
  if (spec.board) add(chalkboard(spec.board), 0.95, floorY, 1.3);
  return g;
}
