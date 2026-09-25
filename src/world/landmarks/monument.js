/**
 * Monument aux morts, Place de l'Hôtel de Ville (OSM node 13351525154).
 * From the user photo: stone pillar with the Cross of Lorraine and a ball
 * finial, a painted poilu in horizon blue in front holding a shield, on a
 * stepped pedestal, in a bed of lavender and grasses.  Faces the square.
 */
import * as THREE from 'three';
import { cel } from '../../engine/toon.js';
import { flowerBall } from '../flowers.js';

export const standalone = true;
export const style = {};

const STONE = 0xcfc8ba;
const STONE_DARK = 0xb9b2a4;
const HORIZON_BLUE = 0x7fa7c9;
const LAVENDER = [0x8e7cc3, 0x9a88cc, 0x7f6fb4];
const GRASS = [0xb9b86a, 0xa8b66a, 0xc9c27a];
const FACING = [0, 0]; // turned toward the middle of the square

const box = (w, h, d, colour, y, z = 0) => {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), cel({ color: colour }));
  m.position.set(0, y, z);
  m.castShadow = true;
  m.receiveShadow = true;
  return m;
};

function poilu() {
  const g = new THREE.Group();
  const blue = cel({ color: HORIZON_BLUE });
  const legs = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.2, 0.85, 8), blue);
  legs.position.y = 0.43;
  const coat = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.26, 0.8, 8), blue);
  coat.position.y = 1.2;
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.12, 10, 8), cel({ color: 0xd9b89a }));
  head.position.y = 1.72;
  const helmet = new THREE.Mesh(new THREE.SphereGeometry(0.15, 10, 6, 0, Math.PI * 2, 0, Math.PI / 2), blue);
  helmet.position.y = 1.76;
  const shield = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 0.04, 16), cel({ color: 0x6a8a5a }));
  shield.rotation.x = Math.PI / 2;
  shield.scale.set(0.8, 1, 1.15);
  shield.position.set(-0.28, 1.05, 0.12);
  const rifle = new THREE.Mesh(new THREE.BoxGeometry(0.05, 1.3, 0.05), cel({ color: 0x5a4a3a }));
  rifle.position.set(0.3, 0.9, 0.05);
  g.add(legs, coat, head, helmet, shield, rifle);
  g.traverse((o) => { o.castShadow = true; });
  return g;
}

function lorraineCross() {
  const g = new THREE.Group();
  const gold = cel({ color: 0xc9a44a });
  const bar = (w, y) => {
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, 0.05, 0.02), gold);
    m.position.y = y;
    return m;
  };
  const post = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.5, 0.02), gold);
  g.add(post, bar(0.2, 0.13), bar(0.3, 0.02));
  return g;
}

function bed(rand) {
  const g = new THREE.Group();
  for (let i = 0; i < 26; i++) {
    const a = rand() * Math.PI * 2;
    const r = 1.4 + rand() * 1.6;
    const lav = rand() > 0.45;
    const ball = flowerBall(0.25 + rand() * 0.2, lav ? LAVENDER : GRASS, rand());
    ball.position.set(Math.cos(a) * r, 0.2, Math.sin(a) * r);
    g.add(ball);
  }
  return g;
}

export function build({ anchor, heightAt }) {
  const [x, z] = anchor;
  const y = heightAt(x, z);
  const g = new THREE.Group();
  g.add(box(1.9, 0.35, 1.9, STONE_DARK, 0.17));
  g.add(box(1.5, 0.3, 1.5, STONE, 0.5));
  g.add(box(1.1, 1.3, 1.1, STONE, 1.3));          // inscribed pedestal
  g.add(box(0.95, 0.12, 0.08, 0x5a564e, 1.5, 0.56)); // the lines of names
  g.add(box(0.95, 0.12, 0.08, 0x5a564e, 1.25, 0.56));
  const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.34, 0.44, 3.0, 4), cel({ color: STONE }));
  shaft.rotation.y = Math.PI / 4;
  shaft.position.y = 3.45;
  shaft.castShadow = true;
  g.add(shaft, box(0.8, 0.18, 0.8, STONE, 5.0));
  const ball = new THREE.Mesh(new THREE.SphereGeometry(0.26, 12, 10), cel({ color: STONE }));
  ball.position.y = 5.35;
  g.add(ball);
  const cross = lorraineCross();
  cross.position.set(0, 4.1, 0.36);
  g.add(cross);
  const soldier = poilu();
  soldier.position.set(0, 1.95, 0.45);
  g.add(soldier);
  let seed = 77;
  g.add(bed(() => ((seed = (seed * 16807) % 2147483647) / 2147483647)));

  g.position.set(x, y, z);
  g.rotation.y = Math.atan2(FACING[0] - x, FACING[1] - z);
  return g;
}
