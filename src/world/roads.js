/**
 * Roads as ribbons draped on the terrain; bridges as flat decks with
 * stone sides and the green cast-iron railings seen along the Ornain.
 */
import * as THREE from 'three';
import { PAL } from '../engine/palette.js';
import { cel } from '../engine/toon.js';
import { createMeshBuffer } from './meshbuffer.js';
import { railing } from './textures.js';
import { buildViaduct, isViaduct } from './viaduct.js';

const STEP = 2; // resample spacing, metres
const LIFT = 0.12;
const FOOT = new Set(['footway', 'path', 'steps', 'cycleway', 'pedestrian']);
const PAVED = new Set(['primary', 'secondary', 'tertiary', 'residential', 'unclassified', 'living_street']);
const PAVEMENT_EXTRA = 3.2; // both pavements together, metres

/** Resample a polyline every STEP metres, carrying the deck height along. */
function resample(pts, deck) {
  return pts.slice(1).flatMap((b, i) => {
    const a = pts[i];
    const n = Math.max(1, Math.ceil(Math.hypot(b[0] - a[0], b[1] - a[1]) / STEP));
    return Array.from({ length: n + (i === pts.length - 2 ? 1 : 0) }, (_, k) => {
      const t = k / n;
      return {
        p: [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t],
        y: deck ? deck[i] + (deck[i + 1] - deck[i]) * t : null,
      };
    });
  });
}

function sideOffsets(samples) {
  return samples.map((s, i) => {
    const a = samples[Math.max(0, i - 1)].p;
    const b = samples[Math.min(samples.length - 1, i + 1)].p;
    const l = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1;
    return [-(b[1] - a[1]) / l, (b[0] - a[0]) / l];
  });
}

function ribbon(buf, samples, width, lift, heightAt, colour) {
  const sides = sideOffsets(samples);
  const edge = (i, s) => {
    const { p, y } = samples[i];
    const q = [p[0] + sides[i][0] * s * width / 2, p[1] + sides[i][1] * s * width / 2];
    return [q[0], (y ?? heightAt(q[0], q[1])) + lift, q[1]];
  };
  samples.slice(1).forEach((_, k) => {
    const i = k;
    const j = k + 1;
    buf.quad(edge(i, -1), edge(j, -1), edge(j, 1), edge(i, 1), [[0, 0], [1, 0], [1, 1], [0, 1]], colour);
  });
  return edge;
}

function bridgeSides(deckBuf, railBuf, samples, width) {
  const sides = sideOffsets(samples);
  [-1, 1].forEach((s) => {
    samples.slice(1).forEach((_, k) => {
      const at = (i, dy) => {
        const { p, y } = samples[i];
        const w = (width / 2 + PAVEMENT_EXTRA / 2) * s;
        return [p[0] + sides[i][0] * w, y + LIFT + dy, p[1] + sides[i][1] * w];
      };
      const run = Math.hypot(samples[k + 1].p[0] - samples[k].p[0], samples[k + 1].p[1] - samples[k].p[1]);
      deckBuf.quad(at(k, -0.9), at(k + 1, -0.9), at(k + 1, 0), at(k, 0), [[0, 0], [1, 0], [1, 1], [0, 1]], PAL.quay);
      railBuf.quad(at(k, 0), at(k + 1, 0), at(k + 1, 1.05), at(k, 1.05), [[0, 0], [run, 0], [run, 1], [0, 1]], 0xffffff);
    });
  });
}

export function buildRoads(roads, heightAt) {
  const pavement = createMeshBuffer();
  const asphalt = createMeshBuffer();
  const sides = createMeshBuffer();
  const rails = createMeshBuffer();

  roads.forEach((r) => {
    const samples = resample(r.pts, r.deck);
    if (samples.length < 2) return;
    if (FOOT.has(r.kind)) {
      ribbon(pavement, samples, r.width, LIFT + 0.02, heightAt, PAL.pavement);
      return;
    }
    const paved = PAVED.has(r.kind);
    if (paved || r.bridge) ribbon(pavement, samples, r.width + PAVEMENT_EXTRA, LIFT, heightAt, PAL.pavement);
    ribbon(asphalt, samples, r.width, LIFT + 0.04, heightAt, PAL.road);
    if (r.bridge) bridgeSides(sides, rails, samples, r.width);
  });
  const viaducts = roads.filter((r) => isViaduct(r, heightAt)).map((r) => buildViaduct(r, heightAt));

  const group = new THREE.Group();
  const add = (buf, mat, order) => {
    if (buf.empty) return;
    const m = new THREE.Mesh(buf.toGeometry(), mat);
    m.receiveShadow = true;
    m.renderOrder = order;
    group.add(m);
  };
  const decal = (extra) => ({ polygonOffset: true, polygonOffsetFactor: -2 - extra, polygonOffsetUnits: -2 - extra });
  add(pavement, Object.assign(cel({ color: 0xffffff, vertexColors: true, cache: false, side: THREE.DoubleSide }), decal(0)), 1);
  add(asphalt, Object.assign(cel({ color: 0xffffff, vertexColors: true, cache: false, side: THREE.DoubleSide }), decal(2)), 2);
  add(sides, cel({ color: 0xffffff, vertexColors: true, side: THREE.DoubleSide }), 0);
  add(rails, cel({ color: 0xffffff, map: railing(), alphaTest: 0.5, side: THREE.DoubleSide }), 0);
  viaducts.forEach((v) => group.add(v));
  return group;
}
