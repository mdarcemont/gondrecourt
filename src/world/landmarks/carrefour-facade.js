/**
 * The tall cream building above Carrefour Contact, with a rounded pediment
 * over three storeys (user photos from the street and from the bridge).
 * Which BD TOPO building carries the pediment is read from the photos
 * against the plan: BATIMENT...1184, the tallest one (9.5 m) between the
 * two car parks.  Checked only by eye.
 */
import * as THREE from 'three';
import { cel, flat } from '../../engine/toon.js';
import { facadeFacing, onFacade } from './common.js';
import { carrefourLogo, fruitMural } from './shop-textures.js';

const CREAM = 0xe6dcc4;
export const style = { wall: CREAM, shutter: 0xffffff, roof: 0xa65a45 };

const RIVER_LOT = [62, -67]; // OSM 371468527, seen from Le Central's bridge
const STORE_LOT = [109, -70];

function pediment(width, height) {
  const shape = new THREE.Shape();
  const r = width * 0.22;
  shape.moveTo(-width / 2, 0);
  shape.lineTo(width / 2, 0);
  shape.lineTo(width / 2, height * 0.45);
  shape.lineTo(r, height * 0.45);
  shape.absarc(0, height * 0.45, r, 0, Math.PI, false);
  shape.lineTo(-width / 2, height * 0.45);
  shape.closePath();
  const g = new THREE.Mesh(new THREE.ShapeGeometry(shape, 14), cel({ color: CREAM, side: THREE.DoubleSide }));
  const oculus = new THREE.Mesh(new THREE.CircleGeometry(r * 0.55, 16, 0, Math.PI), flat({ color: 0xcfc4a8 }));
  oculus.position.set(0, height * 0.45, 0.02);
  const group = new THREE.Group();
  group.add(g, oculus);
  return group;
}

export function build({ building }) {
  const g = new THREE.Group();
  [RIVER_LOT, STORE_LOT].forEach((target, i) => {
    const f = facadeFacing(building, target);
    const width = Math.min(f.length * 0.6, 8);
    g.add(onFacade(pediment(width, 3), f, { along: 0.5, y: building.eave, out: 0.02 }));
    if (i === 0) {
      // the river side carries the big lettering and the mural
      const logo = new THREE.Mesh(new THREE.PlaneGeometry(4.6, 1.4), flat({ map: carrefourLogo(), transparent: true, alphaTest: 0.3, cache: false }));
      g.add(onFacade(logo, f, { along: 0.55, y: building.ground + 3.4, out: 0.06 }));
      const mural = new THREE.Mesh(new THREE.PlaneGeometry(2.0, 2.4), flat({ map: fruitMural(), cache: false }));
      g.add(onFacade(mural, f, { along: 0.2, y: building.ground + 1.4, out: 0.06 }));
    }
  });
  return g;
}
