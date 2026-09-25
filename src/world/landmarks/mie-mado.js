/**
 * Boulangerie-pâtisserie La Mie Mado, at the north end of Le Central's
 * bridge, facing the river.  References: two user Street View captures.
 * Grey-white rendered house; the shop is at its river end: yellow fascia
 * "Boulangerie · Festival · Pâtisserie", a blue mosaic band, a dark green
 * board "LA MIE MADO 03-29-92-01-33", a white shopfront, a round hanging
 * sign; garage doors along the rest of the front.
 */
import * as THREE from 'three';
import { flat } from '../../engine/toon.js';
import { facadeFacing, onFacade, signPanel } from './common.js';
import { PAL } from '../../engine/palette.js';

// two storeys (photos); heights are BD TOPO's
export const style = { wall: 0xdcdcd6, shutter: 0xffffff, floors: 2 };

const BRIDGE_NORTH = [17.72, -62.69];

export function build({ building, heightAt }) {
  const g = new THREE.Group();
  const f = facadeFacing(building, BRIDGE_NORTH);
  // the shop is at the end of the front nearest the river (the larger z)
  const riverEnd = f.a[1] > f.b[1] ? 0.14 : 0.86;
  const y = heightAt(f.mid[0] + f.n[0] * 1.5, f.mid[1] + f.n[1] * 1.5);
  const put = (obj, along, yy, out = 0.05) => g.add(onFacade(obj, f, { along, y: yy, out }));
  const plane = (w, h, c) => new THREE.Mesh(new THREE.PlaneGeometry(w, h), flat({ color: c }));

  put(signPanel('Boulangerie  ·  Pâtisserie', 0.55, { color: 0x2a4a2a, bg: 0xe6e04a, font: 'bold 72px Georgia, serif', maxWidth: 3.6 }), riverEnd, y + 3.1, 0.07);
  put(plane(3.7, 0.35, 0x2a3f8a), riverEnd, y + 2.7);
  put(signPanel('LA MIE MADO 03-29-92-01-33', 0.32, { color: 0xffffff, bg: 0x1f3f2a, font: 'bold 64px Georgia, serif', maxWidth: 3.6 }), riverEnd, y + 2.38, 0.08);
  put(plane(3.6, 2.2, PAL.frameWhite), riverEnd, y + 1.1);
  // shop window then door, in metres along the front, converted to fractions of it
  const dirSign = riverEnd < 0.5 ? 1 : -1;
  const at = (m) => riverEnd + (dirSign * m) / f.length;
  put(plane(2.0, 1.4, PAL.glassDark), at(-0.6), y + 1.4, 0.07);
  put(plane(0.8, 2.0, PAL.glassDark), at(1.15), y + 1.05, 0.07);
  // garage doors along the rest of the front
  [0.45, 0.62].forEach((a) => put(plane(2.4, 2.2, 0xeae8e2), riverEnd < 0.5 ? a : 1 - a, y + 1.1));
  // round hanging sign on a bracket at the corner
  const disc = new THREE.Mesh(new THREE.CircleGeometry(0.32, 20), flat({ color: 0x2a2a2a, side: THREE.DoubleSide }));
  disc.rotation.y = Math.PI / 2;
  disc.position.set(0, 0, 0.55);
  const bracket = new THREE.Group();
  bracket.add(disc);
  put(bracket, riverEnd < 0.5 ? 0.02 : 0.98, y + 3.0, 0);
  return g;
}
