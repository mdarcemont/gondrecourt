/**
 * Bar-Hôtel-Restaurant Le Central, on the corner of the bridge.
 * References: user photos (corner view, terrace, business card) and
 * reference/photos/sv-le-central-river.png, sv-bridge-to-mairie.png.
 */
import * as THREE from 'three';
import { PAL } from '../../../engine/palette.js';
import { flat } from '../../../engine/toon.js';
import { facadeFacing, onFacade, signPanel, solid } from '../common.js';
import { hangingSigns, wallLamp } from '../../props.js';
import { buildAnnex } from './annex.js';

export const style = { wall: PAL.wallWhite, shutter: PAL.shutterTeal, roofShape: 'hip', floors: 3 };

const NE_CORNER = [4.51, -43.74];
const EAST = [20, -41];
const RIVER_SIDE = [17.72, -62.69];

/** 0..1 along a facade for the end nearest a point, stepped in by `inset` metres. */
function alongNear(f, p, inset) {
  const fromA = Math.hypot(f.a[0] - p[0], f.a[1] - p[1]) < Math.hypot(f.b[0] - p[0], f.b[1] - p[1]);
  const t = inset / f.length;
  return fromA ? t : 1 - t;
}

function shopfront(f, floorY) {
  const g = new THREE.Group();
  const add = (mesh, along, y, out = 0.03) => g.add(onFacade(mesh, f, { along, y, out }));
  const plane = (w, h, colour) => new THREE.Mesh(new THREE.PlaneGeometry(w, h), flat({ color: colour }));
  // the door with its two steps, then the big window with its posters
  const doorAt = alongNear(f, NE_CORNER, f.length - 1.1);
  add(plane(1.2, 2.4, PAL.frameWhite), doorAt, floorY + 0.35 + 1.2);
  add(plane(0.95, 2.2, PAL.glassDark), doorAt, floorY + 0.35 + 1.1, 0.05);
  [0, 1].forEach((i) => {
    const step = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.18, 0.4 * (2 - i)), solid(PAL.quay));
    add(step, doorAt, floorY + 0.09 + i * 0.18, 0.2 * (2 - i));
  });
  const winAt = alongNear(f, NE_CORNER, 2.2);
  add(plane(2.9, 2.2, PAL.frameWhite), winAt, floorY + 1.55);
  add(plane(2.6, 1.95, PAL.glassDark), winAt, floorY + 1.55, 0.05);
  add(plane(0.7, 1.0, 0x2350b8), winAt, floorY + 1.4, 0.06); // FDJ poster in the window
  return g;
}

export function build({ building, annexes, world, heightAt, addSurface, addCollider }) {
  const g = new THREE.Group();
  const east = facadeFacing(building, EAST);
  const north = facadeFacing(building, RIVER_SIDE);
  // the ground floor is at street level, not at BD TOPO's lowest ground point (the river bank)
  const floorY = Math.max(building.ground, heightAt(east.mid[0] + east.n[0] * 1.5, east.mid[1] + east.n[1] * 1.5));
  const fascia = floorY + 3.1;

  g.add(shopfront(east, floorY));
  g.add(onFacade(signPanel('BAR-HOTEL-RESTAURANT', 0.34, { maxWidth: east.length * 0.9 }), east, { y: fascia + 0.3 }));
  g.add(onFacade(signPanel('Le Central', 0.55, { font: 'bold 96px Georgia, serif' }), east, { y: fascia - 0.2 }));
  g.add(onFacade(signPanel('BAR - HOTEL - RESTAURANT', 0.42, { maxWidth: north.length * 0.55 }), north,
    { along: alongNear(north, NE_CORNER, north.length * 0.35), y: fascia + 0.35 }));

  // the corner bracket: tabac carotte, Gold, PMU, FDJ
  g.add(onFacade(hangingSigns(['tabac', 'gold', 'pmu', 'fdj']), east, { along: alongNear(east, NE_CORNER, 0.25), y: floorY + 6.2, out: 0 }));
  [0.15, 0.85].forEach((t) => g.add(onFacade(wallLamp(), north, { along: t, y: floorY + 3.9, out: 0 })));

  if (annexes?.[0]) g.add(buildAnnex({ annex: annexes[0], world, floorY, addSurface, addCollider }));
  return g;
}
