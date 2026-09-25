/**
 * IGN BD TOPO `batiment` features -> building records in local metres.
 *
 * Heights are absolute altitudes (NGF); they are made relative to `base`
 * (the altitude of the world origin) so y = 0 is the square.
 *
 * Material codes come from the DGFiP land files (MAJIC): the first digit is
 * the main material.
 */
import { centroid, ensureCCW, openRing, pointInPolygon, signedArea } from '../../src/geo/polygon.js';

const WALLS = { 1: 'stone', 2: 'stone', 3: 'concrete', 4: 'brick', 5: 'concrete', 6: 'timber' };
const ROOFS = { 1: 'tile', 2: 'slate', 3: 'zinc', 4: 'concrete' };
const code = (s, table) => table[String(s ?? '').charAt(0)] ?? 'unknown';
const round = (v) => Math.round(v * 100) / 100;

function outerRing(geometry, toLocal) {
  const polys = geometry.type === 'MultiPolygon' ? geometry.coordinates : [geometry.coordinates];
  const rings = polys.map((poly) => ensureCCW(openRing(poly[0].map(([lon, lat]) => toLocal(lon, lat)))));
  return rings.reduce((a, b) => (Math.abs(signedArea(b)) > Math.abs(signedArea(a)) ? b : a));
}

export function buildingsFrom(bdtopo, { toLocal, base, groundAt }) {
  return bdtopo.features
    .filter((f) => f.geometry && f.properties.etat_de_l_objet !== 'En projet')
    .map((f) => {
      const p = f.properties;
      const ring = outerRing(f.geometry, toLocal);
      const ground = p.altitude_minimale_sol != null ? p.altitude_minimale_sol - base : groundAt(centroid(ring));
      const eave = p.altitude_minimale_toit != null
        ? p.altitude_minimale_toit - base
        : ground + (p.hauteur ?? (p.nombre_d_etages ?? 2) * 3);
      const ridge = p.altitude_maximale_toit != null ? p.altitude_maximale_toit - base : eave + 2;
      return {
        id: p.cleabs,
        ring: ring.map(([x, z]) => [round(x), round(z)]),
        ground: round(ground),
        eave: round(Math.max(eave, ground + 2)),
        ridge: round(Math.max(ridge, eave)),
        floors: p.nombre_d_etages ?? null,
        usage: p.usage_1 ?? null,
        light: Boolean(p.construction_legere),
        walls: code(p.materiaux_des_murs, WALLS),
        roof: code(p.materiaux_de_la_toiture, ROOFS),
      };
    })
    .filter((b) => b.ring.length >= 3 && Math.abs(signedArea(b.ring)) > 4);
}

/** The building a landmark refers to: containing its point, or the biggest inside its ring. */
export function matchBuilding(target, buildings) {
  if (target.point) {
    const inside = buildings.find((b) => pointInPolygon(target.point, b.ring));
    if (inside) return inside;
    const [x, z] = target.point;
    const near = buildings
      .map((b) => ({ b, d: Math.hypot(centroid(b.ring)[0] - x, centroid(b.ring)[1] - z) }))
      .sort((a, b) => a.d - b.d)[0];
    return near && near.d < 12 ? near.b : null;
  }
  const inside = buildings.filter((b) => pointInPolygon(centroid(b.ring), target.ring));
  return inside.sort((a, b) => Math.abs(signedArea(b.ring)) - Math.abs(signedArea(a.ring)))[0] ?? null;
}
