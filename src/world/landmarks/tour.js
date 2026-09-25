/**
 * Tour de Gondrecourt: the round 15th-century tower of the old castle, in
 * the upper town.  Built as a true cylinder from its own BD TOPO footprint
 * (mean radius, wall top and roof top as measured).  The generic building
 * for this footprint is suppressed (`replace` in data/landmarks.json).
 *
 * NOT YET CHECKED against a photo: roof shape, openings, stone colour.
 */
import * as THREE from 'three';
import { PAL } from '../../engine/palette.js';
import { cel } from '../../engine/toon.js';
import { centroid } from '../../geo/polygon.js';

export const style = {};

export function build({ building }) {
  const [cx, cz] = centroid(building.ring);
  const radius = building.ring.reduce((s, [x, z]) => s + Math.hypot(x - cx, z - cz), 0) / building.ring.length;
  const foot = building.ground - 2;
  const wallH = building.eave - foot;
  const g = new THREE.Group();

  const wall = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius * 1.03, wallH, 28), cel({ color: PAL.wallStone }));
  wall.position.set(cx, foot + wallH / 2, cz);
  const rise = Math.max(0.6, building.ridge - building.eave);
  const roof = new THREE.Mesh(new THREE.ConeGeometry(radius * 1.08, rise, 28), cel({ color: PAL.roofSlate }));
  roof.position.set(cx, building.eave + rise / 2, cz);
  [wall, roof].forEach((m) => {
    m.castShadow = true;
    m.receiveShadow = true;
  });
  g.add(wall, roof);
  return g;
}
