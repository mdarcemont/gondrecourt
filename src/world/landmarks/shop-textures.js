/**
 * Painted shop artwork from the user's photos: the Carrefour fruit mural,
 * the Carrefour logo lettering, and Crédit Agricole's striped window film.
 */
import * as THREE from 'three';

const cache = new Map();
function draw(key, w, h, fn, repeat = false) {
  if (cache.has(key)) return cache.get(key);
  const cv = document.createElement('canvas');
  cv.width = w;
  cv.height = h;
  fn(cv.getContext('2d'), w, h);
  const tex = new THREE.CanvasTexture(cv);
  tex.colorSpace = THREE.SRGBColorSpace;
  if (repeat) tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  cache.set(key, tex);
  return tex;
}

/** Two hands holding fruit and vegetables, on white (the mural on the green wall). */
export const fruitMural = () => draw('fruit', 320, 200, (c, w, h) => {
  c.fillStyle = '#f4f1ea';
  c.fillRect(0, 0, w, h);
  c.fillStyle = '#e8b896';
  c.beginPath(); c.ellipse(w * 0.5, h * 0.78, w * 0.4, h * 0.16, 0, 0, Math.PI * 2); c.fill();
  const fruit = [['#d8333a', 0.36, 0.5, 34], ['#e88a2a', 0.5, 0.42, 38], ['#f2c230', 0.62, 0.52, 30], ['#6fa84a', 0.46, 0.6, 30],
    ['#c0282e', 0.58, 0.34, 26], ['#8a3a8a', 0.7, 0.62, 22], ['#4f8a3a', 0.3, 0.64, 24], ['#e05a3a', 0.42, 0.3, 22]];
  fruit.forEach(([col, x, y, r]) => { c.fillStyle = col; c.beginPath(); c.arc(x * w, y * h, r, 0, Math.PI * 2); c.fill(); });
  c.fillStyle = '#3f8f3a';
  c.fillRect(w * 0.49, h * 0.14, 6, 22);
});

/** "Carrefour contact" with the blue-and-red logo, on transparent. */
export const carrefourLogo = () => draw('carrefour', 640, 200, (c, w, h) => {
  c.clearRect(0, 0, w, h);
  c.fillStyle = '#3f8f3a';
  c.font = 'bold 96px Georgia, serif';
  c.textBaseline = 'middle';
  c.fillText('Carrefour', 20, 64);
  c.font = 'bold 70px Georgia, serif';
  c.fillText('contact', 190, 150);
  const lx = 555;
  c.fillStyle = '#2350b8';
  c.beginPath(); c.moveTo(lx - 12, 20); c.lineTo(lx - 70, 64); c.lineTo(lx - 12, 108); c.closePath(); c.fill();
  c.fillStyle = '#d8333a';
  c.beginPath(); c.moveTo(lx + 12, 20); c.lineTo(lx + 70, 64); c.lineTo(lx + 12, 108); c.closePath(); c.fill();
});

/** Dark glazing with pale horizontal stripes (bank windows). 1 unit = one window. */
export const stripedGlass = () => draw('striped', 128, 128, (c, w, h) => {
  c.fillStyle = '#26303a';
  c.fillRect(0, 0, w, h);
  c.fillStyle = 'rgba(214,226,224,0.55)';
  for (let y = 18; y < h - 10; y += 12) c.fillRect(8, y, w - 16 - ((y * 7) % 40), 4);
  c.fillStyle = '#1c2228';
  c.fillRect(0, 0, w, 6); c.fillRect(0, h - 6, w, 6); c.fillRect(0, 0, 6, h); c.fillRect(w - 6, 0, 6, h);
});
