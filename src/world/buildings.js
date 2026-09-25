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
import { createMeshBuffer, triangulate } from './meshbuffer.js';
import { windowBay } from './textures.js';

export const BAY = 3.2; // metres per window bay
const SHUTTERS = [PAL.shutterTeal, PAL.shutterGrey, PAL.shutterGreen, PAL.frameWhite];
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
  plan.outline.forEach((a, i) => {
    const c = plan.outline[(i + 1) % plan.outline.length];
    const edge = Math.hypot(c[0] - a[0], c[1] - a[1]);
    if (edge < 0.05) return;
    const ya = plan.heightAt(a);
    const yc = plan.heightAt(c);
    const bays = Math.max(1, Math.round(edge / BAY));
    buf.quad(
      [a[0], b.ground, a[1]], [c[0], b.ground, c[1]], [c[0], yc, c[1]], [a[0], ya, a[1]],
      [[0, 0], [bays, 0], [bays, v(yc)], [0, v(ya)]],
      style.wall
    );
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
