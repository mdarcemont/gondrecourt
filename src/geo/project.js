/**
 * Geographic <-> local metres.
 *
 * The world is authored in metres around one origin point (the square in
 * front of the mairie).  Axes follow three.js with y up:
 *   +x = east, -z = north (so +z = south), y = altitude above the origin.
 *
 * Over a village-sized area (< 2 km) a local equirectangular projection is
 * accurate to a few centimetres, which is well below the 1-3 m precision of
 * the source data, so nothing fancier is needed.
 */

const DEG = Math.PI / 180;

/** Metres per degree of latitude and longitude at a given latitude (WGS84). */
export function metresPerDegree(latDeg) {
  const p = latDeg * DEG;
  return {
    lat: 111132.92 - 559.82 * Math.cos(2 * p) + 1.175 * Math.cos(4 * p),
    lon: 111412.84 * Math.cos(p) - 93.5 * Math.cos(3 * p),
  };
}

export function makeProjection({ lat, lon }) {
  const m = metresPerDegree(lat);
  return Object.freeze({
    origin: Object.freeze({ lat, lon }),
    toLocal: (lonDeg, latDeg) => [(lonDeg - lon) * m.lon, (lat - latDeg) * m.lat],
    toGeo: (x, z) => [lon + x / m.lon, lat - z / m.lat],
  });
}
