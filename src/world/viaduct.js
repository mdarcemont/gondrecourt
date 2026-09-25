/**
 * Stone arches under a high bridge deck: the old railway viaduct (now the
 * Rue du Panorama), which crosses the Ornain valley 11-13 m up and the Rue
 * du Général Leclerc about 4 m up.  Each span is one extruded block: a
 * rectangle with a round-arch opening, so the piers, spandrels and the
 * underside of the arch all come out of one shape.
 */
import * as THREE from 'three';
import { cel } from '../engine/toon.js';

export const MIN_CLEARANCE = 4; // metres; lower bridges are plain decks
const SPAN = 10;
const PIER = 1.6;
const CROWN = 1.1; // masonry between the top of the arch and the deck
const WIDTH = 5.5;
const STONE = 0xcfc6b2;

function spanGeometry(height) {
  const half = SPAN / 2;
  const r = half - PIER / 2;
  const spring = Math.max(0.4, height - CROWN - r);
  const outer = new THREE.Shape();
  outer.moveTo(-half, -1);
  outer.lineTo(half, -1);
  outer.lineTo(half, height);
  outer.lineTo(-half, height);
  outer.closePath();
  const hole = new THREE.Path();
  hole.moveTo(-r, -0.99);
  hole.lineTo(r, -0.99);
  hole.lineTo(r, spring);
  hole.absarc(0, spring, r, 0, Math.PI, false);
  hole.lineTo(-r, -0.99);
  outer.holes.push(hole);
  const g = new THREE.ExtrudeGeometry(outer, { depth: WIDTH, bevelEnabled: false, curveSegments: 10 });
  g.translate(0, 0, -WIDTH / 2);
  return g;
}

/** Arches under a bridge whose deck (per point) stands high above the ground. */
export function buildViaduct(road, groundAt) {
  const group = new THREE.Group();
  const mat = cel({ color: STONE });
  road.pts.slice(1).forEach((b, i) => {
    const a = road.pts[i];
    const len = Math.hypot(b[0] - a[0], b[1] - a[1]);
    const dir = [(b[0] - a[0]) / len, (b[1] - a[1]) / len];
    for (let d = SPAN / 2; d < len; d += SPAN) {
      const t = d / len;
      const p = [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
      const deck = road.deck[i] + (road.deck[i + 1] - road.deck[i]) * t;
      // the lowest ground under this span, so the piers reach it everywhere
      const base = Math.min(...[-0.5, 0, 0.5].map((k) => groundAt(p[0] + dir[0] * k * SPAN, p[1] + dir[1] * k * SPAN)));
      const height = deck - base;
      if (height < MIN_CLEARANCE) continue;
      const block = new THREE.Mesh(spanGeometry(height), mat);
      block.position.set(p[0], base, p[1]);
      block.rotation.y = Math.atan2(dir[0], dir[1]) - Math.PI / 2; // shape x runs along the viaduct
      block.castShadow = true;
      block.receiveShadow = true;
      group.add(block);
    }
  });
  return group;
}

/** True if any point of the deck is high enough above the ground to need arches. */
export const isViaduct = (road, groundAt) =>
  road.bridge && road.deck && road.pts.some((p, i) => road.deck[i] - groundAt(p[0], p[1]) >= MIN_CLEARANCE);
