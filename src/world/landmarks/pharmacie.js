/**
 * Pharmacie de l'Ornain.
 * Reference: reference/photos/sv-pharmacie-facade.png, sv-pharmacie-wide.png
 */
import * as THREE from 'three';
import { PAL } from '../../engine/palette.js';
import { flat } from '../../engine/toon.js';
import { onFacade, signPanel, solid, streetFacade } from './common.js';

export const style = { wall: PAL.wallBeige, shutter: PAL.shutterTeal };

function cross(size, color, emissive = false) {
  const mat = emissive ? flat({ color }) : solid(color);
  const g = new THREE.Group();
  g.add(new THREE.Mesh(new THREE.BoxGeometry(size, size / 3, 0.08), mat));
  g.add(new THREE.Mesh(new THREE.BoxGeometry(size / 3, size, 0.08), mat));
  return g;
}

export function build({ building, world }) {
  const g = new THREE.Group();
  const f = streetFacade(building, world.roads);
  const fascia = building.ground + 3.1;
  g.add(onFacade(signPanel("PHARMACIE DE L'ORNAIN", 0.5, { color: PAL.shutterTeal, maxWidth: f.length * 0.55 }), f, { along: 0.55, y: fascia }));
  g.add(onFacade(cross(1.0, PAL.shutterTeal), f, { along: 0.18, y: fascia + 0.1 }));
  // the green LED cross, on a bracket at first-floor height
  const led = cross(0.8, PAL.pharmacyGreen, true);
  led.rotation.y = Math.PI / 2;
  const bracket = new THREE.Group();
  bracket.add(led);
  led.position.z = 0.7;
  const arm = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.08, 0.7), solid(PAL.shutterTeal));
  arm.position.z = 0.35;
  bracket.add(arm);
  g.add(onFacade(bracket, f, { along: 0.42, y: building.ground + 4.4, out: 0 }));
  return g;
}
