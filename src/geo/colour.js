/**
 * Measured colours -> painted colours.
 *
 * An aerial photo colour is dull, shadowed and hazy.  A painted background
 * wants the same *hue* with a controlled saturation and lightness, pulled
 * part of the way toward the scene's palette so the town still reads as one
 * picture.
 */

export function rgbToHsl([r, g, b]) {
  const [R, G, B] = [r / 255, g / 255, b / 255];
  const max = Math.max(R, G, B);
  const min = Math.min(R, G, B);
  const l = (max + min) / 2;
  if (max === min) return [0, 0, l];
  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  const h = max === R ? ((G - B) / d + (G < B ? 6 : 0)) / 6 : max === G ? ((B - R) / d + 2) / 6 : ((R - G) / d + 4) / 6;
  return [h, s, l];
}

export function hslToRgb([h, s, l]) {
  if (s === 0) return [l, l, l].map((v) => Math.round(v * 255));
  const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
  const p = 2 * l - q;
  const f = (t0) => {
    const t = (t0 + 1) % 1;
    if (t < 1 / 6) return p + (q - p) * 6 * t;
    if (t < 1 / 2) return q;
    if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
    return p;
  };
  return [f(h + 1 / 3), f(h), f(h - 1 / 3)].map((v) => Math.round(v * 255));
}

export const hexToRgb = (n) => [(n >> 16) & 255, (n >> 8) & 255, n & 255];
export const rgbToHex = ([r, g, b]) => (r << 16) | (g << 8) | b;

const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const dist = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);

/** Terracotta tiles read as red-orange hues with some saturation; the rest is slate or zinc. */
export const isTileHue = ([h, s]) => (h < 0.11 || h > 0.93) && s >= 0.08;

/**
 * Stylise a measured roof colour.  The photo is hazy, so first decide the
 * family (tile or slate/zinc) from the hue, then give it a painted
 * saturation and lightness, then pull it toward the nearest palette roof
 * of that family so the town still reads as one picture.
 */
export function paintRoof(measured, { tiles, greys }, pull = 0.35) {
  const hsl = rgbToHsl(measured);
  const [h, s, l] = hsl;
  const tile = isTileHue(hsl);
  const lifted = tile
    ? hslToRgb([h, clamp(s * 1.9, 0.38, 0.62), clamp(l * 0.95, 0.38, 0.55)])
    : hslToRgb([h, Math.min(s, 0.12), clamp(l, 0.36, 0.6)]);
  const family = (tile ? tiles : greys).map(hexToRgb);
  const nearest = family.reduce((best, p) => (dist(p, lifted) < dist(best, lifted) ? p : best));
  return rgbToHex(lifted.map((v, i) => Math.round(v * (1 - pull) + nearest[i] * pull)));
}

/** Channel-wise median of a list of [r, g, b]. */
export function medianRgb(pixels) {
  if (!pixels.length) return null;
  const mid = Math.floor(pixels.length / 2);
  return [0, 1, 2].map((ch) => [...pixels.map((p) => p[ch])].sort((a, b) => a - b)[mid]);
}
