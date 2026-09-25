/**
 * What moves: the Ornain's surface drifting downstream, a few ducks, and
 * the clouds.  No people (a deliberate choice, as in Sakura Crossing).
 *
 * Downstream is toward -x here: the Ornain flows from Gondrecourt north-west
 * to Abainville.  The meander is not followed exactly; at painted-background
 * contrast a single drift direction reads correctly.
 */
import * as THREE from 'three';
import { cel } from '../engine/toon.js';
import { wanderStep } from '../geo/wander.js';
import { pointInPolygon } from '../geo/polygon.js';
import { FLOW_TILE } from './river.js';

const FLOW_SPEED = 0.35; // m/s
const DUCKS = 7;
const DUCK_SPEED = 0.25;
const DUCK_AREA = { x: 0, z: -55, r: 70 }; // around the bridge and Le Central

function duckMesh(drake) {
  const g = new THREE.Group();
  const body = new THREE.Mesh(new THREE.SphereGeometry(0.2, 8, 6), cel({ color: drake ? 0xcfc6b8 : 0x9b7b5a }));
  body.scale.set(1, 0.6, 1.5);
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.1, 8, 6), cel({ color: drake ? 0x2f7a4c : 0x8a6a4a }));
  head.position.set(0, 0.17, 0.24);
  const beak = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.03, 0.09), cel({ color: 0xe8b93a }));
  beak.position.set(0, 0.15, 0.35);
  g.add(body, head, beak);
  g.traverse((o) => { o.castShadow = true; });
  return g;
}

/** Water level at a point: that of the nearest polygon vertex. */
const levelNear = (w, x, z) =>
  w.ring.reduce((best, p, i) => {
    const d = Math.hypot(p[0] - x, p[1] - z);
    return d < best.d ? { d, y: w.levels[i] } : best;
  }, { d: Infinity, y: 0 }).y;

function spawnPoints(ring, n, rand) {
  const points = [];
  for (let tries = 0; points.length < n && tries < 5000; tries++) {
    const a = rand() * Math.PI * 2;
    const r = Math.sqrt(rand()) * DUCK_AREA.r;
    const p = [DUCK_AREA.x + Math.cos(a) * r, DUCK_AREA.z + Math.sin(a) * r];
    if (pointInPolygon(p, ring)) points.push(p);
  }
  return points;
}

export function createLife(scene, { river, water, sky }) {
  let seed = 991;
  const rand = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
  const w = water[0];
  const ducks = w
    ? spawnPoints(w.ring, DUCKS, rand).map(([x, z], i) => {
        const mesh = duckMesh(i % 2 === 0);
        scene.add(mesh);
        return { mesh, state: { x, z, heading: rand() * Math.PI * 2 }, phase: rand() * 6.28 };
      })
    : [];

  let t = 0;
  return function update(dt) {
    t += dt;
    if (river.userData.flow) river.userData.flow.offset.x += (FLOW_SPEED * dt) / FLOW_TILE;
    ducks.forEach((d) => {
      d.state = wanderStep(d.state, w.ring, dt, DUCK_SPEED, rand);
      const { x, z, heading } = d.state;
      d.mesh.position.set(x, levelNear(w, x, z) - 0.02 + Math.sin(t * 1.7 + d.phase) * 0.015, z);
      d.mesh.rotation.y = heading;
    });
    if (sky?.clouds) sky.clouds.rotation.y += dt * 0.004;
  };
}
