/**
 * The wide flight of steps from the Place up to the mairie door, with the
 * band of stepped stone cubes on its right (user photo).  Walkable: the
 * step under the walker gives the ground height.
 */
import * as THREE from 'three';
import { PAL } from '../../../engine/palette.js';
import { solid } from '../common.js';

const STEPS = 10;
const RUN = 8;          // metres from the facade to the foot of the steps
const EXTRA_LEFT = 3;   // the flight runs past the facade on the left, as in the photo
const CUBE_BAND = 1.8;  // width of the stepped-cube band on the right

export function buildStairs(f, floorY, baseY, { addSurface }) {
  const g = new THREE.Group();
  const rise = (floorY - baseY) / STEPS;
  const tread = RUN / STEPS;
  const width = f.length + EXTRA_LEFT;
  // as you face the mairie: right = (n.z, -n.x) rotated; left is the other way
  const right = [f.n[1], -f.n[0]];
  const mid = [f.mid[0] - right[0] * (EXTRA_LEFT / 2), f.mid[1] - right[1] * (EXTRA_LEFT / 2)];
  const rot = Math.atan2(f.n[0], f.n[1]);

  for (let i = 0; i < STEPS; i++) {
    const depth = RUN - i * tread;
    const top = baseY + (i + 1) * rise;
    const h = top - (baseY - 0.4);
    const step = new THREE.Mesh(new THREE.BoxGeometry(width, h, depth), solid(0xd9d2c4));
    step.position.set(mid[0] + f.n[0] * (depth / 2), baseY - 0.4 + h / 2, mid[1] + f.n[1] * (depth / 2));
    step.rotation.y = rot;
    step.receiveShadow = true;
    g.add(step);
  }
  // stepped cubes on the right edge
  let seed = 11;
  const rand = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
  for (let i = 0; i < STEPS * 2; i++) {
    for (let j = 0; j < 5; j++) {
      const out = (i + 0.5) * (tread / 2);
      const across = (width / 2) - CUBE_BAND + (j + 0.5) * (CUBE_BAND / 5);
      const top = floorY - Math.floor(out / tread) * rise + (rand() - 0.5) * 0.25;
      const cube = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.34, 0.38), solid(rand() > 0.5 ? 0xcfc6b4 : 0xe4ddcf));
      cube.position.set(mid[0] + f.n[0] * out + right[0] * across, top - 0.12, mid[1] + f.n[1] * out + right[1] * across);
      cube.rotation.y = rot;
      g.add(cube);
    }
  }
  // walkable footprint of the flight
  const corner = (o, a) => [mid[0] + f.n[0] * o + right[0] * a, mid[1] + f.n[1] * o + right[1] * a];
  const ring = [corner(0, -width / 2), corner(RUN, -width / 2), corner(RUN, width / 2), corner(0, width / 2)];
  addSurface?.(ring, (x, z) => {
    const out = (x - mid[0]) * f.n[0] + (z - mid[1]) * f.n[1];
    const k = Math.min(STEPS, Math.max(1, STEPS - Math.floor(out / tread)));
    return baseY + k * rise;
  });
  return g;
}
