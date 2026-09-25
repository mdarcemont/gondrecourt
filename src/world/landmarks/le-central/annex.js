/**
 * Le Central's one-storey annex on the river bank (its own BD TOPO
 * footprint): the glazed veranda at the west end, the terrace at the east
 * end under a white-framed awning, black wrought-iron railing over the
 * Ornain, concrete posts down into the water, tricolour bunting, and the
 * lamp post hung with geraniums at the corner.
 *
 * Where the veranda stops and the terrace starts (SPLIT_X) is read off the
 * user's terrace photo, not measured: about two thirds veranda.
 */
import * as THREE from 'three';
import { PAL } from '../../../engine/palette.js';
import { cel, flat } from '../../../engine/toon.js';
import { clipHalfPlane, pointInPolygon } from '../../../geo/polygon.js';
import { facadeToward } from '../../../geo/facade.js';
import { createMeshBuffer, triangulate } from '../../meshbuffer.js';
import { tricolour, verandaWall } from '../../textures.js';
import { railingAlong } from '../../river.js';
import { lampPost } from '../../props.js';
import { flowerBall, GERANIUMS } from '../../flowers.js';
import { onFacade, signPanel, solid } from '../common.js';

const SPLIT_X = -6.5;
const VERANDA_H = 3.0;
const DECK = 0.25;
const IRON = 0x2c2c33;
const CORNER_TO_BRIDGE = [[5.11, -43.78], [7.16, -42.6], [11.0, -41.9]];
const LAMP_AT = [6.6, -41.2];
// the paved apron in front of the café, from its wall to the railing and the bridge (user photo, corner view)
const APRON = [[2.96, -38.98], [4.51, -43.74], [5.11, -43.78], [7.16, -42.6], [11.0, -41.9], [9.6, -36.8]];

const edgesOf = (ring) => ring.map((a, i) => [a, ring[(i + 1) % ring.length]]);
const faceOf = (a, b, water) => {
  const mid = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
  const len = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1;
  const n = [(b[1] - a[1]) / len, -(b[0] - a[0]) / len];
  return { a, b, mid, n, length: len, wet: water.some((w) => pointInPolygon([mid[0] + n[0] * 1.2, mid[1] + n[1] * 1.2], w)) };
};

function slab(ring, top, thick, colour) {
  const buf = createMeshBuffer();
  triangulate(ring).forEach(([i, j, k]) => {
    const v = (n) => [ring[n][0], top, ring[n][1]];
    buf.tri(v(i), v(j), v(k), [[0, 0], [1, 0], [0, 1]], colour);
  });
  edgesOf(ring).forEach(([a, b]) => buf.quad([a[0], top - thick, a[1]], [b[0], top - thick, b[1]], [b[0], top, b[1]], [a[0], top, a[1]],
    [[0, 0], [1, 0], [1, 1], [0, 1]], colour));
  const m = new THREE.Mesh(buf.toGeometry(), cel({ color: 0xffffff, vertexColors: true, side: THREE.DoubleSide }));
  m.castShadow = true;
  m.receiveShadow = true;
  return m;
}

function verandaWalls(ring, floorY) {
  const buf = createMeshBuffer();
  edgesOf(ring).forEach(([a, b]) => {
    const len = Math.hypot(b[0] - a[0], b[1] - a[1]);
    buf.quad([a[0], floorY, a[1]], [b[0], floorY, b[1]], [b[0], floorY + VERANDA_H, b[1]], [a[0], floorY + VERANDA_H, a[1]],
      [[0, 0], [len, 0], [len, 1], [0, 1]], 0xffffff);
  });
  const m = new THREE.Mesh(buf.toGeometry(), cel({ color: 0xffffff, map: verandaWall(), side: THREE.DoubleSide, cache: false }));
  m.castShadow = true;
  return m;
}

function posts(faces, floorY, waterY) {
  const g = new THREE.Group();
  const h = floorY - DECK - (waterY - 1.2);
  faces.filter((f) => f.wet).forEach((f) => {
    const n = Math.max(1, Math.round(f.length / 2.5));
    for (let i = 0; i <= n; i++) {
      const t = i / n;
      const p = new THREE.Mesh(new THREE.BoxGeometry(0.3, h, 0.3), solid(PAL.wallConcrete));
      p.position.set(f.a[0] + (f.b[0] - f.a[0]) * t - f.n[0] * 0.2, floorY - DECK - h / 2, f.a[1] + (f.b[1] - f.a[1]) * t - f.n[1] * 0.2);
      g.add(p);
    }
  });
  return g;
}

function bunting(points) {
  const g = new THREE.Group();
  const mat = flat({ map: tricolour(), side: THREE.DoubleSide, cache: false });
  points.slice(1).forEach((b, i) => {
    const a = points[i];
    const len = Math.hypot(b[0] - a[0], b[2] - a[2]);
    const rot = Math.atan2(b[0] - a[0], b[2] - a[2]) + Math.PI / 2;
    for (let d = 0.3; d < len; d += 0.55) {
      const t = d / len;
      const flag = new THREE.Mesh(new THREE.PlaneGeometry(0.3, 0.2), mat);
      flag.position.set(a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t + 0.86, a[2] + (b[2] - a[2]) * t);
      flag.rotation.y = rot;
      g.add(flag);
    }
  });
  return g;
}

function awning(face, floorY) {
  const g = new THREE.Group();
  const width = Math.min(4.2, face.length * 0.9);
  const reach = 3.2;
  const canvas = new THREE.Mesh(new THREE.PlaneGeometry(width, reach), cel({ color: 0xeeeae2, side: THREE.DoubleSide }));
  canvas.rotation.x = -Math.PI / 2 + 0.16; // falls away from the wall
  canvas.position.set(0, floorY + 2.62, reach / 2);
  canvas.castShadow = true;
  g.add(canvas);
  [-1, 1].forEach((s) => {
    const post = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 2.35), solid(PAL.frameWhite));
    post.position.set((s * width) / 2, floorY + 1.18, reach);
    g.add(post);
  });
  return onFacade(g, face, { along: 0.5, y: 0, out: 0 });
}

function tables(ring, floorY) {
  const g = new THREE.Group();
  const xs = ring.map((p) => p[0]);
  const zs = ring.map((p) => p[1]);
  const spots = [];
  for (let x = Math.min(...xs) + 1; x < Math.max(...xs) - 0.8 && spots.length < 3; x += 1.9) {
    for (let z = Math.min(...zs) + 1; z < Math.max(...zs) - 0.8 && spots.length < 3; z += 1.9) {
      const ok = [[0, 0], [0.9, 0], [-0.9, 0], [0, 0.9], [0, -0.9]].every(([dx, dz]) => pointInPolygon([x + dx, z + dz], ring));
      if (ok) spots.push([x, z]);
    }
  }
  spots.forEach(([x, z], i) => {
    const top = new THREE.Mesh(new THREE.CylinderGeometry(0.38, 0.38, 0.04, 16), solid(0x8a6a4a));
    top.position.set(x, floorY + 0.74, z);
    const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.2, 0.72, 8), solid(0x9aa1aa));
    stem.position.set(x, floorY + 0.36, z);
    g.add(top, stem);
    [0, Math.PI].forEach((a) => {
      const chair = new THREE.Group();
      const seat = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.05, 0.42), solid(0x8a6a4a));
      seat.position.y = 0.45;
      const back = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.45, 0.04), solid(0x8a6a4a));
      back.position.set(0, 0.7, -0.2);
      const legs = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.44, 0.4), solid(0xb8bec6));
      legs.scale.set(1, 1, 1);
      legs.position.y = 0.22;
      legs.visible = false; // legs read as a box; the seat and back carry the chair
      chair.add(seat, back, legs);
      chair.position.set(x + Math.sin(a + i) * 0.65, floorY, z + Math.cos(a + i) * 0.65);
      chair.rotation.y = a + i + Math.PI;
      g.add(chair);
    });
  });
  return g;
}

function flowerLamp(x, y, z) {
  const g = lampPost();
  g.position.set(x, y, z);
  [-0.75, 0.75].forEach((dx, i) => {
    const ball = flowerBall(0.42, GERANIUMS, 0.2 + i * 0.3);
    ball.position.set(dx, 3.55, 0);
    g.add(ball);
  });
  const collar = flowerBall(0.5, GERANIUMS, 0.7);
  collar.position.set(0, 2.4, 0);
  g.add(collar);
  return g;
}

export function buildAnnex({ annex, world, floorY, addSurface, addCollider }) {
  const g = new THREE.Group();
  const waterRings = world.water.map((w) => w.ring);
  const waterY = Math.min(...world.water[0].levels);
  const veranda = clipHalfPlane(annex.ring, [-1, 0], -SPLIT_X);
  const terrace = clipHalfPlane(annex.ring, [1, 0], SPLIT_X);

  g.add(slab(annex.ring, floorY, DECK, PAL.pavement));
  addSurface?.(annex.ring, () => floorY);
  g.add(posts(edgesOf(annex.ring).map(([a, b]) => faceOf(a, b, waterRings)), floorY, waterY));
  if (veranda.length >= 3) {
    addCollider?.(veranda);
    g.add(verandaWalls(veranda, floorY));
    g.add(slab(veranda, floorY + VERANDA_H + 0.18, 0.22, PAL.veranda));
    const front = facadeToward(veranda, [SPLIT_X + 10, -50], 1.5);
    g.add(awning(front, floorY));
    g.add(onFacade(signPanel('RESTAURATION RAPIDE', 0.34, { color: 0xc0282e, bg: PAL.frameWhite, font: 'bold 80px Arial, sans-serif', maxWidth: front.length * 0.95 }), front, { y: floorY + VERANDA_H - 0.2, out: 0.05 }));
    g.add(onFacade(signPanel('PIZZAS  KEBAB', 0.22, { color: 0xc0282e, bg: PAL.frameWhite, font: 'bold 80px Arial, sans-serif', maxWidth: front.length * 0.6 }), front, { y: floorY + VERANDA_H - 0.5, out: 0.05 }));
  }
  if (terrace.length >= 3) {
    g.add(tables(terrace, floorY));
    edgesOf(terrace).map(([a, b]) => faceOf(a, b, waterRings)).filter((f) => f.wet).forEach((f) => {
      const run = [[f.a[0], floorY, f.a[1]], [f.b[0], floorY, f.b[1]]];
      const rail = railingAlong(run);
      rail.material = rail.material.clone();
      rail.material.color.set(IRON);
      g.add(rail, bunting(run));
    });
  }
  // along the water from the café's corner to the bridge: the railing with the flags
  const street = CORNER_TO_BRIDGE.map(([x, z]) => [x, floorY, z]);
  g.add(railingAlong(street), bunting(street));
  g.add(slab(APRON, floorY + 0.02, 1.6, PAL.pavement));
  addSurface?.(APRON, () => floorY + 0.02);
  g.add(flowerLamp(LAMP_AT[0], floorY, LAMP_AT[1]));
  return g;
}
