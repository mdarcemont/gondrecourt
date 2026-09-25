/**
 * Every building in the area, from its real footprint and measured heights.
 *
 * Walls go from below the lowest ground point (so nothing floats on a
 * slope) up to the roof line; roofs are gables planned from the measured
 * eave and ridge altitudes (see src/geo/roof.js).  House-like walls carry a
 * repeating window-bay texture scaled to the building's real floor count.
 */
import * as THREE from 'three';
import { PAL, RENDER_WALLS } from '../engine/palette.js';
import { cel } from '../engine/toon.js';
import { planHipRoof, planRoof } from '../geo/roof.js';
import { paintRoof } from '../geo/colour.js';
import { centroid } from '../geo/polygon.js';
import { createMeshBuffer, triangulate } from './meshbuffer.js';
import { windowBay } from './textures.js';

export const BAY = 3.2; // metres per window bay
// from the reference photos: teal and grey-green are commonest, then roller shutters, blue, brown-red
const SHUTTERS = [PAL.shutterTeal, PAL.shutterTeal, PAL.shutterGrey, PAL.shutterGreen, 'roller', 'roller', 0x2f5fb0, 0x8a3a2a, 0x7a5a3a];
const WINDOWED = new Set(['Résidentiel', 'Commercial et services', 'Indifférencié', null]);

/** Small deterministic hash of a building id, so colours never reshuffle. */
function seedOf(id) {
  return [...id].reduce((h, ch) => (Math.imul(h ^ ch.charCodeAt(0), 16777619) >>> 0), 2166136261);
}

function wallColour(b, seed) {
  if (b.walls === 'brick') return PAL.wallBrick;
  if (b.walls === 'timber') return PAL.wallTimber;
  if (b.walls === 'concrete') return b.usage === 'Résidentiel' ? RENDER_WALLS[seed % RENDER_WALLS.length] : PAL.wallConcrete;
  if (b.usage === 'Annexe' || b.usage === 'Agricole') return PAL.wallStone;
  return RENDER_WALLS[seed % RENDER_WALLS.length];
}

const ROOF_PALETTE = { tiles: [PAL.roofTile, PAL.roofTileOld], greys: [PAL.roofSlate, PAL.roofZinc] };

/** Measured from the orthophoto when possible; otherwise from the material code. */
function roofColour(b, seed) {
  if (b.roofRgb) return paintRoof(b.roofRgb, ROOF_PALETTE);
  if (b.roof === 'slate') return PAL.roofSlate;
  if (b.roof === 'zinc') return PAL.roofZinc;
  if (b.roof === 'concrete') return PAL.roofConcrete;
  return seed % 3 === 0 ? PAL.roofTileOld : PAL.roofTile;
}

export function styleOf(b, override = {}) {
  const seed = seedOf(b.id);
  const tall = b.eave - b.ground >= 3.5;
  return {
    wall: override.wall ?? wallColour(b, seed),
    roof: override.roof ?? roofColour(b, seed),
    shutter: override.shutter ?? SHUTTERS[(seed >>> 3) % SHUTTERS.length],
    windows: override.windows ?? (tall && !b.light && WINDOWED.has(b.usage)),
    roofShape: override.roofShape ?? 'gable',
    floors: override.floors ?? b.floors,
    // metres above the building's ground, when a better measurement exists (LiDAR, photo)
    eaveAbove: override.eaveAbove ?? null,
    ridgeAbove: override.ridgeAbove ?? null,
    doors: override.doors ?? [],
  };
}

/**
 * Walls from the buried foot up to the roof line.  The window pattern starts
 * at the building's ground level; the part below it (foundations, and on the
 * river side the whole drop to the water) is plain stone in `under`.
 */
function addWalls(buf, under, b, plan, style) {
  const floors = Math.max(1, b.floors ?? Math.round((b.eave - b.ground) / 3));
  const floorH = (b.eave - b.ground) / floors;
  const foot = b.ground - 2;
  const v = (y) => (y - b.ground) / floorH;
  const doors = style.doors ?? [];
  plan.outline.forEach((a, i) => {
    const c = plan.outline[(i + 1) % plan.outline.length];
    const edge = Math.hypot(c[0] - a[0], c[1] - a[1]);
    if (edge < 0.05) return;
    const bays = Math.max(1, Math.round(edge / BAY));
    const at = (t) => [a[0] + (c[0] - a[0]) * t, a[1] + (c[1] - a[1]) * t];
    // wall piece between fractions t0..t1 of the edge, from yLow up to the roof line
    const piece = (t0, t1, yLow) => {
      const p0 = at(t0);
      const p1 = at(t1);
      const y0 = plan.heightAt(p0);
      const y1 = plan.heightAt(p1);
      buf.quad([p0[0], yLow, p0[1]], [p1[0], yLow, p1[1]], [p1[0], y1, p1[1]], [p0[0], y0, p0[1]],
        [[bays * t0, v(yLow)], [bays * t1, v(yLow)], [bays * t1, v(y1)], [bays * t0, v(y0)]], style.wall);
    };
    // doors are matched by their edge's first corner, so they survive the ridge split of the outline
    const gaps = doors
      .filter((d) => Math.abs(d.from[0] - a[0]) < 1e-6 && Math.abs(d.from[1] - a[1]) < 1e-6)
      .map((d) => ({ t0: d.at - d.width / 2 / edge, t1: d.at + d.width / 2 / edge, top: d.top }))
      .sort((p, q) => p.t0 - q.t0);
    let t = 0;
    gaps.forEach((g) => {
      piece(t, g.t0, b.ground);
      piece(g.t0, g.t1, g.top);
      t = g.t1;
    });
    piece(t, 1, b.ground);
    under.quad(
      [a[0], foot, a[1]], [c[0], foot, c[1]], [c[0], b.ground, c[1]], [a[0], b.ground, a[1]],
      [[0, 0], [1, 0], [1, 1], [0, 1]],
      PAL.quay
    );
  });
}

function addRoof(buf, plan, colour) {
  plan.faces.forEach((face) => {
    triangulate(face).forEach(([i, j, k]) => {
      const p = [face[i], face[j], face[k]].map(([x, z]) => [x, plan.heightAt([x, z]), z]);
      buf.tri(p[0], p[1], p[2], [[0, 0], [1, 0], [0, 1]], colour);
    });
  });
}

/** One or two chimney stacks on the ridge of house-like buildings (seeded). */
function chimneys(buildings, plans) {
  const spots = buildings.flatMap((b) => {
    const seed = seedOf(b.id);
    if (seed % 5 === 0) return [];
    const c = centroid(b.ring);
    const u = b.ridgeDir;
    const extent = Math.max(...b.ring.map((p) => Math.abs((p[0] - c[0]) * u[0] + (p[1] - c[1]) * u[1])));
    const offsets = seed % 3 === 0 ? [-0.55, 0.55] : [((seed >>> 4) % 2 ? 1 : -1) * 0.5];
    return offsets.map((k) => {
      const p = [c[0] + u[0] * extent * k, c[1] + u[1] * extent * k];
      return { p, y: plans.get(b.id).heightAt(p) };
    });
  });
  const mesh = new THREE.InstancedMesh(new THREE.BoxGeometry(0.55, 1.6, 0.7), cel({ color: 0xd8cfbf }), Math.max(1, spots.length));
  const m = new THREE.Matrix4();
  spots.forEach(({ p, y }, i) => mesh.setMatrixAt(i, m.makeTranslation(p[0], y + 0.45, p[1])));
  mesh.count = spots.length;
  mesh.castShadow = true;
  return mesh;
}

/**
 * overrides: { [buildingId]: { wall, roof, shutter, windows, roofShape, floors } } from landmarks.
 * Returns the group plus the roof plans, which landmarks and collision reuse.
 */
export function buildBuildings(buildings, overrides = {}) {
  const plain = createMeshBuffer();
  const roofs = createMeshBuffer();
  const byShutter = new Map();
  const plans = new Map();

  const styles = new Map();
  buildings.forEach((b0) => {
    const style = styleOf(b0, overrides[b0.id]);
    const b = {
      ...b0,
      floors: style.floors,
      eave: style.eaveAbove !== null ? b0.ground + style.eaveAbove : b0.eave,
      ridge: style.ridgeAbove !== null ? b0.ground + style.ridgeAbove : b0.ridge,
    };
    const plan = style.roofShape === 'hip' ? planHipRoof(b) : planRoof(b);
    plans.set(b.id, plan);
    styles.set(b.id, style);
    if (style.windows) {
      if (!byShutter.has(style.shutter)) byShutter.set(style.shutter, createMeshBuffer());
      addWalls(byShutter.get(style.shutter), plain, b, plan, style);
    } else {
      addWalls(plain, plain, b, plan, style);
    }
    addRoof(roofs, plan, style.roof);
  });

  const group = new THREE.Group();
  group.add(chimneys(buildings.filter((b) => plans.get(b.id)?.kind !== 'flat' && styles.get(b.id)?.windows), plans));
  const mesh = (buf, material) => {
    if (buf.empty) return;
    const m = new THREE.Mesh(buf.toGeometry(), material);
    m.castShadow = true;
    m.receiveShadow = true;
    group.add(m);
  };
  const side = THREE.DoubleSide;
  mesh(plain, cel({ color: 0xffffff, vertexColors: true, side }));
  mesh(roofs, cel({ color: 0xffffff, vertexColors: true, side, bands: 3 }));
  byShutter.forEach((buf, shutter) =>
    mesh(buf, cel({ color: 0xffffff, vertexColors: true, side, map: windowBay(shutter) }))
  );
  return { group, plans, styles };
}
