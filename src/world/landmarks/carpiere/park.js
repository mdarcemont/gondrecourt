/**
 * The park of La Carpière, between the hall and the Rue du Général Leclerc.
 * Along the street (seen in every user capture): a low limestone wall with a
 * planted strip of lavender and tall grasses at its foot, and tall blue lamp
 * posts.  Inside: rows of stone slabs set in the lawn, a playground, an
 * information panel.  The wall and strip follow the real street centreline;
 * the slabs and playground are placed from the photos (approximate).
 */
import * as THREE from 'three';
import { cel, flat } from '../../../engine/toon.js';
import { rubbleStone } from '../../textures.js';
import { flowerBall } from '../../flowers.js';

const STREET_ID = 371468568; // Rue du Général Leclerc
const WALL_RUN = [-238, -192]; // x range of the park frontage; the car park further east has no wall
const GAPS = [[-222, -214], [-193, -187]]; // car-park entrance, footpath into the park
const SLABS = { centre: [-190, -86], size: [16, 8] };
const PLAYGROUND = [-176, -76];
const BLUE = 0x2f5fb3;
const LAVENDER = [0x8e7cc3, 0x9a88cc];
const GRASSES = [0xb9b477, 0xa8b070, 0x9db36a];

/** Street centreline z at a given x (the street runs west-east), and its direction. */
function streetAt(road, x) {
  const seg = road.pts.slice(1).map((b, i) => [road.pts[i], b]).find(([a, b]) => (x - a[0]) * (x - b[0]) <= 0) ?? [road.pts[0], road.pts[1]];
  const [a, b] = seg;
  const t = (x - a[0]) / ((b[0] - a[0]) || 1);
  return { z: a[1] + (b[1] - a[1]) * t, dir: Math.atan2(b[0] - a[0], b[1] - a[1]) };
}

function wallAndStrip(road, heightAt) {
  const g = new THREE.Group();
  const tex = rubbleStone('warm').clone();
  tex.needsUpdate = true;
  const off = road.width / 2 + 1.9; // kerb, planted strip, then the wall (south of the street is +z)
  const step = 2;
  let seed = 5;
  const rand = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
  for (let x = WALL_RUN[0]; x < WALL_RUN[1]; x += step) {
    const mid = x + step / 2;
    const { z, dir } = streetAt(road, mid);
    if (!GAPS.some(([a, b]) => mid > a && mid < b)) {
      const y = heightAt(mid, z + off);
      const block = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.9, step), cel({ color: 0xffffff, map: tex, cache: false }));
      block.position.set(mid, y + 0.45, z + off);
      block.rotation.y = dir;
      const cap = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.1, step), cel({ color: 0xcfc6b2 }));
      cap.position.set(mid, y + 0.95, z + off);
      cap.rotation.y = dir;
      block.castShadow = true;
      g.add(block, cap);
    }
    // lavender and tall grasses between the kerb and the wall
    const pz = z + road.width / 2 + 0.9;
    const plant = flowerBall(0.35 + rand() * 0.2, rand() > 0.5 ? LAVENDER : GRASSES, rand());
    plant.position.set(mid + (rand() - 0.5), heightAt(mid, pz) + 0.3, pz);
    plant.scale.y *= rand() > 0.5 ? 1.8 : 1.1;
    g.add(plant);
  }
  return g;
}

function blueLamps(road, heightAt) {
  const g = new THREE.Group();
  for (let x = WALL_RUN[0] + 8; x < WALL_RUN[1]; x += 22) {
    const { z } = streetAt(road, x);
    const pz = z + road.width / 2 + 0.6;
    const lamp = new THREE.Group();
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.1, 6.2, 8), cel({ color: BLUE }));
    pole.position.y = 3.1;
    const arm = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.06, 0.9), cel({ color: BLUE }));
    arm.position.set(0, 6.0, -0.45);
    const head = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.16, 0.35, 8), cel({ color: 0x2a2f3a }));
    head.position.set(0, 5.85, -0.9);
    const glass = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.16, 0.12, 8), flat({ color: 0xf2efe0 }));
    glass.position.set(0, 5.62, -0.9);
    lamp.add(pole, arm, head, glass);
    lamp.position.set(x, heightAt(x, pz), pz);
    lamp.traverse((o) => { o.castShadow = true; });
    g.add(lamp);
  }
  return g;
}

function slabs(heightAt) {
  const g = new THREE.Group();
  const [cx, cz] = SLABS.centre;
  const [w, d] = SLABS.size;
  const mat = cel({ color: 0xe2ddd2 });
  for (let x = cx - w / 2; x <= cx + w / 2; x += 1.05) {
    for (let z = cz - d / 2; z <= cz + d / 2; z += 3.4) {
      const s = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.06, 3.0), mat);
      s.position.set(x, heightAt(x, z) + 0.03, z);
      s.receiveShadow = true;
      g.add(s);
    }
  }
  return g;
}

function playground(heightAt) {
  const g = new THREE.Group();
  const [px, pz] = PLAYGROUND;
  const y = heightAt(px, pz);
  const wood = cel({ color: 0xc98a4a });
  // a play tower with a little roof and a slide
  [[-0.8, -0.8], [0.8, -0.8], [-0.8, 0.8], [0.8, 0.8]].forEach(([dx, dz]) => {
    const post = new THREE.Mesh(new THREE.BoxGeometry(0.12, 2.6, 0.12), wood);
    post.position.set(px + dx, y + 1.3, pz + dz);
    g.add(post);
  });
  const deck = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.1, 1.8), wood);
  deck.position.set(px, y + 1.2, pz);
  const roof = new THREE.Mesh(new THREE.ConeGeometry(1.5, 0.9, 4), cel({ color: 0x5f8a4a }));
  roof.rotation.y = Math.PI / 4;
  roof.position.set(px, y + 3.05, pz);
  const slide = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.06, 2.6), cel({ color: 0xe0612a }));
  slide.position.set(px + 2.0, y + 0.62, pz);
  slide.rotation.set(0, Math.PI / 2, -0.46);
  g.add(deck, roof, slide);
  // swings
  const frame = cel({ color: 0xd8a93a });
  [-1.2, 1.2].forEach((dx) => {
    const leg = new THREE.Mesh(new THREE.BoxGeometry(0.1, 2.3, 0.1), frame);
    leg.position.set(px + 5 + dx, y + 1.15, pz - 0.5);
    g.add(leg);
  });
  const bar = new THREE.Mesh(new THREE.BoxGeometry(2.5, 0.1, 0.1), frame);
  bar.position.set(px + 5, y + 2.3, pz - 0.5);
  g.add(bar);
  [-0.5, 0.5].forEach((dx) => {
    const seat = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.05, 0.2), cel({ color: 0xc0282e }));
    seat.position.set(px + 5 + dx, y + 0.5, pz - 0.5);
    g.add(seat);
  });
  // a soft green play surface
  const mat = new THREE.Mesh(new THREE.BoxGeometry(10, 0.05, 5), cel({ color: 0x6f9a52 }));
  mat.position.set(px + 2.5, y + 0.02, pz);
  mat.receiveShadow = true;
  g.add(mat);
  g.traverse((o) => { o.castShadow = true; });
  return g;
}

function infoPanel(heightAt) {
  const g = new THREE.Group();
  const [x, z] = [SLABS.centre[0] - 2, SLABS.centre[1] - SLABS.size[1] / 2 - 1.5];
  const board = new THREE.Mesh(new THREE.PlaneGeometry(1.4, 1.0), flat({ color: 0xc0463a, side: THREE.DoubleSide }));
  board.position.set(x, heightAt(x, z) + 1.4, z);
  [-0.6, 0.6].forEach((dx) => {
    const post = new THREE.Mesh(new THREE.BoxGeometry(0.08, 1.9, 0.08), cel({ color: 0x8a6a4a }));
    post.position.set(x + dx, heightAt(x, z) + 0.95, z);
    g.add(post);
  });
  g.add(board);
  return g;
}

export function buildPark({ world, heightAt }) {
  const g = new THREE.Group();
  const road = world.roads.find((r) => r.id === STREET_ID);
  if (road) g.add(wallAndStrip(road, heightAt), blueLamps(road, heightAt));
  g.add(slabs(heightAt), playground(heightAt), infoPanel(heightAt));
  return g;
}
