/**
 * Mairie (Hôtel de Ville), Place de l'Hôtel de Ville.
 * Reference: user photo 2026-09-25 (facade, steps and monument).
 * The facade is one painted canvas; flower boxes, lamps and steps are 3D.
 */
import * as THREE from 'three';
import { cel } from '../../../engine/toon.js';
import { facadeFacing, onFacade } from '../common.js';
import { wallLamp } from '../../props.js';
import { flowerBoxes, PETUNIAS } from '../../flowers.js';
import { BAYS, FLOWER_ROWS, mairieFacadeTexture } from './facade.js';
import { buildStairs } from './stairs.js';

export const style = { wall: 0xdcb487, roofShape: 'hip', floors: 3, windows: false, roof: 0xa65a45 };

const SQUARE = [0, 0];

export function build({ building, heightAt, addSurface }) {
  const g = new THREE.Group();
  const f = facadeFacing(building, SQUARE);
  // the door is at the top of the steps, not at BD TOPO's lowest ground point
  const floorY = heightAt(f.mid[0] + f.n[0] * 0.5, f.mid[1] + f.n[1] * 0.5) + 0.1;
  const baseY = heightAt(f.mid[0] + f.n[0] * 9, f.mid[1] + f.n[1] * 9);
  const height = building.eave - floorY;

  const face = new THREE.Mesh(new THREE.PlaneGeometry(f.length, height), cel({ color: 0xffffff, map: mairieFacadeTexture(f.length, height), cache: false }));
  g.add(onFacade(face, f, { along: 0.5, y: floorY + height / 2, out: 0.05 }));

  // flower boxes: two under the first window on the left, one under every other window
  const spot = (t, row, width, seed) => {
    const x = f.a[0] + (f.b[0] - f.a[0]) * t + f.n[0] * 0.05;
    const z = f.a[1] + (f.b[1] - f.a[1]) * t + f.n[1] * 0.05;
    return { x, z, y: floorY + height * (1 - row) - 0.1, rot: Math.atan2(f.n[0], f.n[1]), width, seed, colours: PETUNIAS, box: 0x3f9a7e };
  };
  // the facade texture runs left -> right as you face it, which is b -> a along the edge
  const along = (x) => 1 - x;
  const boxes = [
    ...BAYS.map((x, i) => spot(along(x), FLOWER_ROWS.first, 1.35, i / 4)),
    spot(along(BAYS[0] + 0.07), FLOWER_ROWS.first, 1.1, 0.9),
    ...BAYS.slice(1).map((x, i) => spot(along(x), FLOWER_ROWS.ground, 1.35, 0.3 + i / 5)),
  ];
  g.add(flowerBoxes(boxes));
  [0.02, 0.98].forEach((x) => g.add(onFacade(wallLamp(), f, { along: along(x), y: floorY + height * 0.42, out: 0.05 })));

  if (floorY - baseY > 0.3) g.add(buildStairs(f, floorY, baseY, { addSurface }));
  return g;
}
