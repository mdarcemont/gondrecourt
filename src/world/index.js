/**
 * Builds the whole scene from data/world.json and exposes the queries the
 * walker needs: ground height, collision, bounds.
 *
 * Landmarks can register walkable surfaces (the mairie steps, Le Central's
 * terrace) and extra colliders; ordinary ground is the terrain or a bridge deck.
 */
import * as THREE from 'three';
import worldData from '../../data/world.json';
import { makeHeightField } from '../geo/heightfield.js';
import { deckHeightAt } from '../geo/bridge.js';
import { pointInPolygon } from '../geo/polygon.js';
import { pushOut } from '../geo/facade.js';
import { buildTerrain } from './ground.js';
import { buildRoads } from './roads.js';
import { buildRiver } from './river.js';
import { buildBuildings } from './buildings.js';
import { LANDMARKS } from './landmarks/index.js';
import { buildTrees } from './trees.js';
import { buildDetails } from './details.js';
import { createLife } from './life.js';
import { flowerBoxes, windowFlowerSpots } from './flowers.js';
import { buildLilies } from './lilies.js';
import { buildUpperTown, upperTownOverrides } from './villehaute.js';

const CELL = 16; // collision grid cell, metres

function spatialIndex(rings) {
  const cells = new Map();
  const key = (cx, cz) => `${cx},${cz}`;
  rings.forEach((ring, i) => {
    const xs = ring.map((p) => p[0]);
    const zs = ring.map((p) => p[1]);
    for (let cx = Math.floor(Math.min(...xs) / CELL); cx <= Math.floor(Math.max(...xs) / CELL); cx++) {
      for (let cz = Math.floor(Math.min(...zs) / CELL); cz <= Math.floor(Math.max(...zs) / CELL); cz++) {
        const k = key(cx, cz);
        cells.set(k, [...(cells.get(k) ?? []), i]);
      }
    }
  });
  return (x, z) => (cells.get(key(Math.floor(x / CELL), Math.floor(z / CELL))) ?? []).map((i) => rings[i]);
}

function landmarkParts(data) {
  const byId = new Map(data.buildings.map((b) => [b.id, b]));
  return data.landmarks
    .filter((l) => LANDMARKS[l.id] && (l.buildingId || LANDMARKS[l.id].standalone))
    .map((l) => ({
      ...l,
      def: LANDMARKS[l.id],
      building: l.buildingId ? byId.get(l.buildingId) : null,
      annexBuildings: (l.annexes ?? []).map((id) => byId.get(id)),
    }));
}

export function buildWorld(scene, { sky } = {}, data = worldData) {
  const field = { ...makeHeightField(data.terrain), grass: data.terrain.grass };
  const bridges = data.roads.filter((r) => r.bridge);
  const water = data.water.map((w) => w.ring);
  const surfaces = [];
  const extraColliders = [];
  const walkable = new Set();

  const heightAt = (x, z) => {
    const decks = bridges.map((b) => deckHeightAt([x, z], b)).filter((y) => y !== null);
    const raised = surfaces.filter((s) => pointInPolygon([x, z], s.ring)).map((s) => s.heightAt(x, z));
    const found = [...decks, ...raised];
    return found.length ? Math.max(...found) : field.sample(x, z);
  };

  const parts = landmarkParts(data);
  const annexIds = new Set(parts.flatMap((l) => l.annexes ?? []));
  const replaced = new Set([...parts.filter((l) => l.replace).map((l) => l.buildingId), ...annexIds]);
  const landmarkStyles = Object.fromEntries(parts.filter((l) => l.buildingId).map((l) => [l.buildingId, l.def.style ?? {}]));
  const overrides = { ...upperTownOverrides(data.buildings, landmarkStyles), ...landmarkStyles };
  const generic = data.buildings.filter((b) => !replaced.has(b.id));

  const { group: buildings, styles } = buildBuildings(generic, overrides);
  const river = buildRiver(data.water);
  scene.add(buildTerrain(field, data.areas, data.roads), buildRoads(data.roads, field.sample), river, buildings);
  scene.add(buildTrees(data.trees ?? [], field.sample, water));
  scene.add(buildLilies(data.water, bridges));
  // landmarks place their own window boxes where the photos show them
  const ordinary = generic.filter((b) => !landmarkStyles[b.id]);
  scene.add(flowerBoxes(windowFlowerSpots(ordinary, styles, data.roads)));

  const ctx = {
    world: data,
    heightAt,
    addSurface: (ring, fn) => surfaces.push({ ring, heightAt: fn }),
    addCollider: (ring) => extraColliders.push(ring),
    makeWalkable: (id) => walkable.add(id),
  };
  parts.forEach((l) => {
    try {
      scene.add(l.def.build({ ...ctx, building: l.building, annexes: l.annexBuildings, anchor: l.anchor }));
    } catch (err) {
      console.error(`landmark ${l.id} failed to build`, err);
    }
  });
  scene.add(buildDetails(data, heightAt));
  scene.add(buildUpperTown(generic.filter((b) => !landmarkStyles[b.id]), data.roads));

  // annexes (Le Central's terrace) are walkable: their landmark adds what should block
  const nearBuildings = spatialIndex([...data.buildings.filter((b) => !annexIds.has(b.id) && !walkable.has(b.id)).map((b) => b.ring), ...extraColliders]);

  /** Resolve a proposed position [x, z] for a walker of radius r. */
  const collide = (p, r) => {
    const out = nearBuildings(p[0], p[1]).reduce((q, ring) => pushOut(q, ring, r, pointInPolygon(q, ring)), p);
    const wet = water.some((ring) => pointInPolygon(out, ring));
    const onDeck = bridges.some((b) => deckHeightAt(out, b) !== null) || surfaces.some((s) => pointInPolygon(out, s.ring));
    return wet && !onDeck ? null : out;
  };

  const t = data.terrain;
  return {
    data,
    heightAt,
    collide,
    bounds: { x0: t.x0 + 2, x1: t.x0 + t.stepX * (t.cols - 1) - 2, z0: t.z0 + 2, z1: t.z0 + t.stepZ * (t.rows - 1) - 2 },
    landmark: (id) => data.landmarks.find((l) => l.id === id),
    update: createLife(scene, { river, water: data.water, sky }),
    THREE,
  };
}
