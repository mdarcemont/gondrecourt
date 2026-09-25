/**
 * Carrefour Contact, behind its car park off the Rue Raymond Poincaré.
 * References: user Street View captures (Apr 2026) from the street and from
 * Le Central's bridge.  The store is BD TOPO's long hall (BATIMENT...1187),
 * restyled cream; its front on the car park gets the green panel with the
 * fruit mural, the "Carrefour contact" lettering, the arched glazed entrance
 * and the red promotions banner.  The tall building with the rounded
 * pediment above it is a separate landmark (carrefour-facade).
 */
import * as THREE from 'three';
import { cel, flat } from '../../engine/toon.js';
import { PAL } from '../../engine/palette.js';
import { facadeFacing, onFacade, signPanel } from './common.js';
import { carrefourLogo, fruitMural } from './shop-textures.js';

const CREAM = 0xebe3cc;
const GREEN = 0x8fc04a;
export const style = { wall: CREAM, windows: false, roof: 0xa65a45 };

const LOT = [109, -70]; // the car park in front (OSM 964061859)

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

export function build({ building, heightAt }) {
  const g = new THREE.Group();
  const f = facadeFacing(building, LOT);
  const y = heightAt(f.mid[0] + f.n[0] * 2, f.mid[1] + f.n[1] * 2);
  const put = (obj, along, yy, out = 0.05) => g.add(onFacade(obj, f, { along, y: yy, out }));
  const plane = (w, h, mat) => new THREE.Mesh(new THREE.PlaneGeometry(w, h), mat);

  // green panel with the mural, on the left third of the front
  const panelW = Math.min(9, f.length * 0.38);
  put(plane(panelW, 3.6, flat({ color: GREEN })), 0.2, y + 1.8);
  put(plane(4.2, 2.4, flat({ map: fruitMural(), cache: false })), 0.2, y + 2.0, 0.07);
  // lettering and logo over the entrance, the entrance itself, the promo banner
  put(plane(4.4, 1.35, flat({ map: carrefourLogo(), transparent: true, alphaTest: 0.3, cache: false })), 0.52, y + 3.25, 0.07);
  put(new THREE.Mesh(arch(2.6, 2.9), flat({ color: PAL.frameWhite })), 0.52, y, 0.06);
  put(new THREE.Mesh(arch(2.3, 2.7), flat({ color: PAL.glassDark })), 0.52, y + 0.05, 0.08);
  put(signPanel('au contact des bonnes affaires', 0.5, { color: 0xffffff, bg: 0xd8333a, font: 'bold 64px Arial, sans-serif', maxWidth: 3.2 }), 0.72, y + 2.6, 0.07);
  [0.66, 0.72, 0.78].forEach((a) => put(plane(0.8, 1.0, flat({ color: 0xd8333a })), a, y + 1.5, 0.07));
  // the trolley bay sign by the door
  put(plane(0.5, 0.5, flat({ color: 0x2350b8 })), 0.61, y + 2.2, 0.07);
  return g;
}
