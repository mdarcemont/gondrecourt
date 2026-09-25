/**
 * La Carpière, the village hall (salle socio-culturelle), and its park on
 * the Rue du Général Leclerc.  References: seven user Street View captures.
 * The hall is its BD TOPO footprint restyled: white, flat roof (LiDAR: about
 * 5 m), dark top band, orange-framed glazed entrance facing the street.
 */
import * as THREE from 'three';
import { cel, flat } from '../../../engine/toon.js';
import { PAL } from '../../../engine/palette.js';
import { facadeFacing, onFacade } from '../common.js';
import { createMeshBuffer } from '../../meshbuffer.js';
import { bench } from '../../props.js';
import { buildPark } from './park.js';

const WHITE = 0xf1efe9;
const BAND = 0x33343a;
const ORANGE = 0xe0612a;
export const style = { wall: WHITE, roof: 0x55565c, windows: false, eaveAbove: 5.0, ridgeAbove: 5.0 };

const STREET = [-205, -103];

/** The dark cladding band round the top of the walls. */
function band(ring, y0, y1) {
  const buf = createMeshBuffer();
  ring.forEach((a, i) => {
    const b = ring[(i + 1) % ring.length];
    const len = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1;
    const n = [(b[1] - a[1]) / len * 0.04, -(b[0] - a[0]) / len * 0.04];
    buf.quad([a[0] + n[0], y0, a[1] + n[1]], [b[0] + n[0], y0, b[1] + n[1]], [b[0] + n[0], y1, b[1] + n[1]], [a[0] + n[0], y1, a[1] + n[1]],
      [[0, 0], [1, 0], [1, 1], [0, 1]], BAND);
  });
  return new THREE.Mesh(buf.toGeometry(), cel({ color: 0xffffff, vertexColors: true, side: THREE.DoubleSide }));
}

function entrance(f, floorY) {
  const g = new THREE.Group();
  const frame = new THREE.Mesh(new THREE.PlaneGeometry(5.2, 3.0), flat({ color: ORANGE }));
  const glass = new THREE.Mesh(new THREE.PlaneGeometry(4.6, 2.5), flat({ color: PAL.glassDark }));
  glass.position.set(0, -0.25, 0.02);
  g.add(frame, glass);
  [-1.15, 0, 1.15].forEach((x) => {
    const mullion = new THREE.Mesh(new THREE.PlaneGeometry(0.06, 2.5), flat({ color: 0xd8d8d4 }));
    mullion.position.set(x, -0.25, 0.03);
    g.add(mullion);
  });
  return onFacade(g, f, { along: 0.42, y: floorY + 1.5, out: 0.05 });
}

export function build({ building, heightAt, world }) {
  const g = new THREE.Group();
  const f = facadeFacing(building, STREET);
  const floorY = heightAt(f.mid[0] + f.n[0] * 2, f.mid[1] + f.n[1] * 2);
  g.add(band(building.ring, building.ground + 3.9, building.ground + 5.02));
  g.add(entrance(f, floorY));
  // paved forecourt in front of the entrance, with two benches
  const court = new THREE.Mesh(new THREE.BoxGeometry(12, 0.2, 7), cel({ color: 0xdedbd3 }));
  const cp = [f.mid[0] + f.n[0] * 3.6, f.mid[1] + f.n[1] * 3.6];
  court.position.set(cp[0], floorY + 0.02, cp[1]);
  court.rotation.y = Math.atan2(f.n[0], f.n[1]);
  court.receiveShadow = true;
  g.add(court);
  [-3.5, 3.5].forEach((s) => {
    const b = bench();
    const along = [f.b[0] - f.a[0], f.b[1] - f.a[1]].map((v) => v / f.length);
    b.position.set(cp[0] + along[0] * s + f.n[0] * 1.5, floorY + 0.1, cp[1] + along[1] * s + f.n[1] * 1.5);
    b.rotation.y = Math.atan2(-f.n[0], -f.n[1]);
    g.add(b);
  });
  g.add(buildPark({ hall: building, world, heightAt }));
  return g;
}
