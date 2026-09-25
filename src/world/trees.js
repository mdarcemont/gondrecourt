/**
 * Every tree the LiDAR found, at its measured position, height and crown
 * width.  Species is not measured, so the shape is a rule: a tree whose
 * crown overhangs the Ornain is drawn as a weeping willow (there is one
 * beside Le Central in the reference photos), everything else as a
 * broadleaf.  Two instanced meshes per shape: one draw call each.
 */
import * as THREE from 'three';
import { cel } from '../engine/toon.js';
import { pointInPolygon } from '../geo/polygon.js';

const LEAVES = [0x6f9a5c, 0x7fa866, 0x5f8a58, 0x8aac6a];
const WILLOW_LEAVES = [0x9cb86a, 0xa9c277];
const TRUNK = 0x7a6454;
const WILLOW_REACH = 3; // metres from the water's edge

const seed = (x, z) => Math.abs(Math.sin(x * 12.9898 + z * 78.233) * 43758.5453) % 1;

function crownGeometry() {
  const g = new THREE.IcosahedronGeometry(1, 1);
  const pos = g.attributes.position;
  // squash the bottom so crowns sit like painted blobs, not balls
  for (let i = 0; i < pos.count; i++) if (pos.getY(i) < 0) pos.setY(i, pos.getY(i) * 0.55);
  g.computeVertexNormals();
  return g;
}

function instanced(geo, mat, items, place) {
  const mesh = new THREE.InstancedMesh(geo, mat, Math.max(1, items.length));
  const m = new THREE.Matrix4();
  const c = new THREE.Color();
  items.forEach((t, i) => {
    const { matrix, colour } = place(t, m);
    mesh.setMatrixAt(i, matrix);
    if (colour !== undefined) mesh.setColorAt(i, c.set(colour));
  });
  mesh.count = items.length;
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  mesh.instanceMatrix.needsUpdate = true;
  if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  return mesh;
}

const nearWater = (t, rings) =>
  rings.some((ring) => [[0, 0], [WILLOW_REACH, 0], [-WILLOW_REACH, 0], [0, WILLOW_REACH], [0, -WILLOW_REACH]]
    .some(([dx, dz]) => pointInPolygon([t.x + dx, t.z + dz], ring)));

export function buildTrees(trees, heightAt, waterRings) {
  const placed = trees.map((t) => ({ ...t, y: heightAt(t.x, t.z), willow: t.h >= 5 && nearWater(t, waterRings), s: seed(t.x, t.z) }));
  const broad = placed.filter((t) => !t.willow);
  const willows = placed.filter((t) => t.willow);
  const pos = new THREE.Vector3();
  const quat = new THREE.Quaternion();
  const scale = new THREE.Vector3();
  const compose = (m, x, y, z, sx, sy, sz, rot = 0) =>
    m.compose(pos.set(x, y, z), quat.setFromAxisAngle(new THREE.Vector3(0, 1, 0), rot), scale.set(sx, sy, sz)).clone();

  const group = new THREE.Group();
  const trunkGeo = new THREE.CylinderGeometry(0.12, 0.18, 1, 6).translate(0, 0.5, 0);
  group.add(instanced(trunkGeo, cel({ color: TRUNK }), placed, (t, m) => ({
    matrix: compose(m, t.x, t.y - 0.3, t.z, 1 + t.h / 25, t.h * 0.62, 1 + t.h / 25),
  })));

  group.add(instanced(crownGeometry(), cel({ color: 0xffffff, bands: 3 }), broad, (t, m) => {
    const r = t.r * 1.2;
    const depth = Math.min(t.h * 0.7, r * 2.4);
    return {
      matrix: compose(m, t.x, t.y + t.h - depth * 0.45, t.z, r, depth * 0.62, r * (0.9 + t.s * 0.2), t.s * 6.28),
      colour: LEAVES[Math.floor(t.s * LEAVES.length)],
    };
  }));

  // a willow is a broad, soft mound whose curtain hangs to within a couple of metres of the water
  const willowParts = willows.flatMap((t) => {
    const w = Math.max(t.r * 1.4, t.h * 0.38);
    return [
      { ...t, cx: 0, cz: 0, y0: t.h * 0.62, sx: w, sy: t.h * 0.42, sz: w * 0.95 },
      { ...t, cx: w * 0.45, cz: -w * 0.2, y0: t.h * 0.42, sx: w * 0.6, sy: t.h * 0.33, sz: w * 0.6 },
      { ...t, cx: -w * 0.4, cz: w * 0.3, y0: t.h * 0.45, sx: w * 0.62, sy: t.h * 0.33, sz: w * 0.58 },
    ];
  });
  group.add(instanced(crownGeometry(), cel({ color: 0xffffff, bands: 3 }), willowParts, (p, m) => ({
    matrix: compose(m, p.x + p.cx, p.y + p.y0, p.z + p.cz, p.sx, p.sy, p.sz, p.s * 6.28),
    colour: WILLOW_LEAVES[Math.floor(p.s * WILLOW_LEAVES.length)],
  })));
  return group;
}
