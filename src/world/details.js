/**
 * Places the items listed in data/details.json.  Every item is resolved
 * against real data (a road, a building, one of its walls); if a reference
 * does not resolve, the item is skipped with a console warning rather than
 * placed somewhere made up.
 */
import * as THREE from 'three';
import details from '../../data/details.json';
import { facadeFacing, onFacade, streetFacade } from './landmarks/common.js';
import { aBoard, balcony, bench, bollard, cafeSet, hangingSigns, lampPost, planter, pollardTree, postBox, trafficLightPot, wallLamp } from './props.js';
import { shopfront } from './shops.js';
import { carsAlongKerb, carsInLot } from './cars.js';
import { flowerBall, GERANIUMS } from './flowers.js';
import { centroid, pointInPolygon } from '../geo/polygon.js';

const PAVEMENT_OFFSET = 1.3; // metres beyond the carriageway edge

/** The building containing a point, or the nearest one within 12 m. */
function buildingAt([x, z], data) {
  const inside = data.buildings.find((b) => pointInPolygon([x, z], b.ring));
  if (inside) return inside;
  const near = data.buildings
    .map((b) => ({ b, d: Math.hypot(centroid(b.ring)[0] - x, centroid(b.ring)[1] - z) }))
    .sort((a, b) => a.d - b.d)[0];
  return near && near.d < 12 ? near.b : null;
}

function resolveBuilding(ref, data) {
  const landmark = data.landmarks.find((l) => l.id === ref);
  const id = landmark ? landmark.buildingId : ref;
  return data.buildings.find((b) => b.id === id) ?? null;
}

function resolveFacade(spec, building, data) {
  if (spec === 'street') return streetFacade(building, data.roads);
  const m = /^toward:(-?[\d.]+),(-?[\d.]+)$/.exec(spec ?? '');
  return m ? facadeFacing(building, [Number(m[1]), Number(m[2])]) : null;
}

const floorY = (b, floor) => {
  const floors = Math.max(1, b.floors ?? Math.round((b.eave - b.ground) / 3));
  return b.ground + floor * ((b.eave - b.ground) / floors);
};

/** Points along a polyline every `step` metres (or just its two ends), offset to one or both sides. */
function alongRoad(road, { every, at, side, offset = null, range = null }) {
  const segs = road.pts.slice(1).map((b, i) => ({ a: road.pts[i], b }));
  const total = segs.reduce((s, { a, b }) => s + Math.hypot(b[0] - a[0], b[1] - a[1]), 0);
  const stations = (at === 'ends' ? [0.5, total - 0.5] : Array.from({ length: Math.floor(total / every) }, (_, i) => (i + 0.5) * every))
    .filter((d) => !range || (d >= range[0] && d <= range[1]));
  const sides = side === 'both' ? [-1, 1] : side === 'left' ? [-1] : [1];
  return stations.flatMap((d) => {
    let left = d;
    const seg = segs.find(({ a, b }) => {
      const l = Math.hypot(b[0] - a[0], b[1] - a[1]);
      if (left <= l) return true;
      left -= l;
      return false;
    }) ?? segs[segs.length - 1];
    const l = Math.hypot(seg.b[0] - seg.a[0], seg.b[1] - seg.a[1]) || 1;
    const t = Math.min(1, left / l);
    const dir = [(seg.b[0] - seg.a[0]) / l, (seg.b[1] - seg.a[1]) / l];
    const p = [seg.a[0] + (seg.b[0] - seg.a[0]) * t, seg.a[1] + (seg.b[1] - seg.a[1]) * t];
    const off = offset ?? road.width / 2 + PAVEMENT_OFFSET;
    // right of the direction of travel, in (x, z) with -z north
    return sides.map((s) => ({ p: [p[0] - dir[1] * off * s, p[1] + dir[0] * off * s], dir }));
  });
}

const PLACERS = {
  lampPost(item, data, heightAt) {
    const roads = data.roads.filter((r) => r.id === item.road || r.name === item.road);
    return roads.flatMap((road) => alongRoad(road, item)).map(({ p, dir }) => {
      const lamp = lampPost();
      lamp.position.set(p[0], heightAt(p[0], p[1]), p[1]);
      lamp.rotation.y = Math.atan2(dir[0], dir[1]) + Math.PI / 2; // arms across the road
      return lamp;
    });
  },
  wallLamp(item, data, _h, building, facade) {
    return item.along.map((along) => onFacade(wallLamp(), facade, { along, y: floorY(building, item.floor), out: 0 }));
  },
  hangingSigns(item, data, _h, building, facade) {
    return [onFacade(hangingSigns(item.signs), facade, { along: item.along, y: floorY(building, 1) + 0.9, out: 0 })];
  },
  shopfront(item, data, heightAt, building, facade) {
    const floorY = heightAt(facade.mid[0] + facade.n[0] * 1.5, facade.mid[1] + facade.n[1] * 1.5);
    return [shopfront(facade, floorY, item)];
  },
  parkedCars(item, data, heightAt) {
    const rand = seeded(item.seed ?? 1);
    if (item.parking) {
      const lot = data.areas.find((a) => a.id === item.parking);
      return lot ? carsInLot(lot.ring, heightAt, item.share ?? 0.7, rand) : [];
    }
    const roads = data.roads.filter((r) => r.id === item.road || r.name === item.road);
    return roads.flatMap((road) => carsAlongKerb(alongRoad(road, item), heightAt, item.share ?? 0.6, rand));
  },
  bench(item, data, heightAt) {
    return item.points.map(([x, z]) => {
      const b = bench();
      b.position.set(x, heightAt(x, z), z);
      b.rotation.y = Math.atan2((item.facing?.[0] ?? x) - x, (item.facing?.[1] ?? z + 1) - z);
      return b;
    });
  },
  planter(item, data, heightAt) {
    return item.points.map(([x, z], i) => {
      const p = planter();
      if (item.flowers !== false) {
        const ball = flowerBall(0.6, GERANIUMS, (i * 0.37) % 1);
        ball.position.y = 0.72;
        p.add(ball);
      }
      p.position.set(x, heightAt(x, z), z);
      return p;
    });
  },
  /** Any simple prop at listed points: { type: 'prop', prop, points, facing | rot } */
  prop(item, data, heightAt) {
    const make = { pollardTree, cafeSet, bollard, postBox, trafficLightPot, aBoard, bench }[item.prop];
    if (!make) return [];
    return item.points.map(([x, z], i) => {
      const o = make((i * 0.37) % 1);
      o.position.set(x, heightAt(x, z), z);
      o.rotation.y = item.facing ? Math.atan2(item.facing[0] - x, item.facing[1] - z) : (item.rot ?? 0);
      return o;
    });
  },
  balcony(item, data, _h, building, facade) {
    return item.along.map((along) => onFacade(balcony(item.width), facade, { along, y: floorY(building, item.floor), out: 0 }));
  },
};

function seeded(seed) {
  let s = seed * 7919 + 13;
  return () => ((s = (s * 16807) % 2147483647) / 2147483647);
}

export function buildDetails(data, heightAt, items = details.items) {
  const group = new THREE.Group();
  items.forEach((item) => {
    const place = PLACERS[item.type];
    if (!place) return console.warn(`details: unknown type ${item.type}`);
    const building = item.building ? resolveBuilding(item.building, data) : item.atPoint ? buildingAt(item.atPoint, data) : null;
    const facade = building ? resolveFacade(item.facade ?? 'street', building, data) : null;
    if ((item.building || item.atPoint) && (!building || !facade)) return console.warn(`details: ${item.type} on ${item.building ?? item.atPoint} did not resolve`);
    place(item, data, heightAt, building, facade).forEach((o) => group.add(o));
  });
  return group;
}
