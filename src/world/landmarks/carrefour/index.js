/**
 * Carrefour Contact.  One building (BD TOPO BATIMENT...1187), which LiDAR
 * shows is the tall three-storey block with the rounded pediment (12.7 m,
 * where BD TOPO records 4.3 m).  The store fills its ground floor and has
 * two doors, and you can walk through from one to the other:
 *  - north front, on the car park off the Rue Raymond Poincaré: green panel
 *    with the fruit mural, lettering, arched entrance, red banner;
 *  - west end, on the Rue de la Grande Fontaine by the river: the pediment,
 *    "Carrefour contact" lettering, the green annex with the second door.
 * References: user Street View captures (Apr-May 2026).
 */
import * as THREE from 'three';
import { cel, flat } from '../../../engine/toon.js';
import { PAL } from '../../../engine/palette.js';
import { facadeFacing, onFacade, signPanel } from '../common.js';
import { carrefourLogo, fruitMural } from '../shop-textures.js';
import { wallColliders } from '../../../geo/walls.js';
import { buildInterior } from './interior.js';

const CREAM = 0xe6dcc4;
const GREEN = 0x8fc04a;
export const style = { wall: CREAM, shutter: PAL.shutterTeal, roof: 0xa65a45, floors: 3, eaveAbove: 10.2, ridgeAbove: 12.7 };

const LOT = [109, -70];      // car park in front of the north door (OSM 964061859)
const RIVER_ROAD = [60, -60]; // the Rue de la Grande Fontaine side
const NORTH_DOOR = 0.52;
const WEST_DOOR = 0.62;
const DOOR_W = 2.2;

function arch(width, height) {
  const shape = new THREE.Shape();
  const r = width / 2;
  shape.moveTo(-r, 0);
  shape.lineTo(r, 0);
  shape.lineTo(r, height - r);
  shape.absarc(0, height - r, r, 0, Math.PI, false);
  shape.closePath();
  return new THREE.ShapeGeometry(shape, 12);
}

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
  const g = new THREE.Group();
  g.add(new THREE.Mesh(new THREE.ShapeGeometry(shape, 14), cel({ color: CREAM, side: THREE.DoubleSide })));
  const oculus = new THREE.Mesh(new THREE.CircleGeometry(r * 0.55, 16, 0, Math.PI), flat({ color: 0xcfc4a8 }));
  oculus.position.set(0, height * 0.45, 0.02);
  g.add(oculus);
  return g;
}

const plane = (w, h, mat) => new THREE.Mesh(new THREE.PlaneGeometry(w, h), mat);

function northFront(g, f, y) {
  const put = (obj, along, yy, out = 0.05) => g.add(onFacade(obj, f, { along, y: yy, out }));
  put(plane(Math.min(9, f.length * 0.38), 3.6, flat({ color: GREEN })), 0.2, y + 1.8);
  put(plane(4.2, 2.4, flat({ map: fruitMural(), cache: false })), 0.2, y + 2.0, 0.07);
  put(plane(4.4, 1.35, flat({ map: carrefourLogo(), transparent: true, alphaTest: 0.3, cache: false })), NORTH_DOOR, y + 3.35, 0.07);
  put(new THREE.Mesh(arch(2.6, 2.9), flat({ color: PAL.frameWhite, side: THREE.DoubleSide })), NORTH_DOOR, y, 0.06);
  put(signPanel('au contact des bonnes affaires', 0.5, { color: 0xffffff, bg: 0xd8333a, font: 'bold 64px Arial, sans-serif', maxWidth: 3.2 }), 0.74, y + 2.6, 0.07);
  put(plane(0.5, 0.5, flat({ color: 0x2350b8 })), 0.63, y + 2.2, 0.07);
}

function westFront(g, f, y, eave) {
  const put = (obj, along, yy, out = 0.05) => g.add(onFacade(obj, f, { along, y: yy, out }));
  put(pediment(f.length * 0.9, 3.2), 0.5, eave, 0.02);
  put(plane(4.2, 1.3, flat({ map: carrefourLogo(), transparent: true, alphaTest: 0.3, cache: false })), 0.5, y + 3.4, 0.07);
  // the green annex round the second door, with its posters
  put(plane(3.6, 3.0, flat({ color: GREEN })), WEST_DOOR, y + 1.5, 0.06);
  put(plane(DOOR_W, 2.4, flat({ color: PAL.frameWhite, side: THREE.DoubleSide })), WEST_DOOR, y + 1.2, 0.08);
  put(plane(DOOR_W - 0.3, 2.2, flat({ color: PAL.glassDark, side: THREE.DoubleSide })), WEST_DOOR, y + 1.1, 0.1);
  put(plane(1.0, 1.3, flat({ map: fruitMural(), cache: false })), 0.2, y + 1.6, 0.07);
}

export function build({ building, heightAt, addSurface, addCollider, makeWalkable }) {
  const g = new THREE.Group();
  const north = facadeFacing(building, LOT);
  const west = facadeFacing(building, RIVER_ROAD);
  const y = Math.max(...[north, west].map((f) => heightAt(f.mid[0] + f.n[0] * 2, f.mid[1] + f.n[1] * 2)));
  const eave = building.ground + style.eaveAbove;
  northFront(g, north, y);
  westFront(g, west, y, eave);

  // walk-through: floor, walls with two door gaps, and the shop inside
  const edgeOf = (f) => building.ring.findIndex((p) => p[0] === f.a[0] && p[1] === f.a[1]);
  const doors = [{ edge: edgeOf(north), at: NORTH_DOOR, width: DOOR_W }, { edge: edgeOf(west), at: WEST_DOOR, width: DOOR_W }];
  makeWalkable?.(building.id);
  wallColliders(building.ring, doors).forEach((w) => addCollider?.(w));
  addSurface?.(building.ring, () => y);
  const { group, colliders } = buildInterior(building.ring, y, [north, west]);
  colliders.forEach((c) => addCollider?.(c));
  g.add(group);
  return g;
}
