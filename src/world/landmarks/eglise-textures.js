/**
 * Canvas drawings for the church: portal, rose window, lancets, belfry
 * openings, clock.  Transparent outside the shapes, so they sit on the wall.
 */
import * as THREE from 'three';

const cache = new Map();
function draw(key, w, h, fn) {
  if (cache.has(key)) return cache.get(key);
  const cv = document.createElement('canvas');
  cv.width = w;
  cv.height = h;
  const c = cv.getContext('2d');
  fn(c, w, h);
  const tex = new THREE.CanvasTexture(cv);
  tex.colorSpace = THREE.SRGBColorSpace;
  cache.set(key, tex);
  return tex;
}

/** Pointed (gothic) arch path: straight sides up to `spring`, then two arcs meeting at the top. */
function arch(c, x0, x1, top, bottom, spring) {
  const w = x1 - x0;
  c.beginPath();
  c.moveTo(x0, bottom);
  c.lineTo(x0, spring);
  c.quadraticCurveTo(x0, top + (spring - top) * 0.15, (x0 + x1) / 2, top);
  c.quadraticCurveTo(x1, top + (spring - top) * 0.15, x1, spring);
  c.lineTo(x1, bottom);
  c.closePath();
  return w;
}

export const portalTexture = () => draw('portal', 260, 440, (c, w, h) => {
  c.fillStyle = '#c9bfa9';
  arch(c, 0, w, 0, h, h * 0.42);
  c.fill();
  c.fillStyle = '#b3a891';
  arch(c, 26, w - 26, 34, h, h * 0.46);
  c.fill();
  c.fillStyle = '#8a3a30';
  arch(c, 52, w - 52, 80, h, h * 0.5);
  c.fill();
  c.fillStyle = '#6e2e27';
  c.fillRect(w / 2 - 2, h * 0.5, 4, h * 0.5);
});

export const roseTexture = () => draw('rose', 256, 256, (c, w) => {
  const r = w / 2;
  c.fillStyle = '#c9bfa9';
  c.beginPath(); c.arc(r, r, r - 2, 0, Math.PI * 2); c.fill();
  c.fillStyle = '#3d4a58';
  c.beginPath(); c.arc(r, r, r * 0.8, 0, Math.PI * 2); c.fill();
  c.strokeStyle = '#c9bfa9';
  c.lineWidth = 10;
  for (let k = 0; k < 8; k++) {
    const a = (k * Math.PI) / 4;
    c.beginPath(); c.moveTo(r, r); c.lineTo(r + Math.cos(a) * r * 0.8, r + Math.sin(a) * r * 0.8); c.stroke();
  }
  c.beginPath(); c.arc(r, r, r * 0.28, 0, Math.PI * 2); c.stroke();
});

export const lancetTexture = () => draw('lancet', 100, 300, (c, w, h) => {
  c.fillStyle = '#c9bfa9';
  arch(c, 0, w, 0, h, h * 0.25);
  c.fill();
  c.fillStyle = '#3d4a58';
  arch(c, 16, w - 16, 20, h - 12, h * 0.28);
  c.fill();
});

export const belfryTexture = () => draw('belfry', 420, 260, (c, w, h) => {
  [0.22, 0.5, 0.78].forEach((x) => {
    const cx = x * w;
    c.fillStyle = '#c9bfa9';
    arch(c, cx - 44, cx + 44, 0, h, h * 0.35);
    c.fill();
    c.fillStyle = '#2f3440';
    arch(c, cx - 32, cx + 32, 14, h - 6, h * 0.4);
    c.fill();
    c.fillStyle = '#6b6258';
    for (let y = h * 0.42; y < h - 10; y += 22) c.fillRect(cx - 32, y, 64, 8); // louvres
  });
});

export const clockTexture = () => draw('clock', 200, 200, (c, w) => {
  const r = w / 2;
  c.fillStyle = '#f4f1e8';
  c.beginPath(); c.arc(r, r, r - 4, 0, Math.PI * 2); c.fill();
  c.strokeStyle = '#2a2a30';
  c.lineWidth = 8;
  c.beginPath(); c.arc(r, r, r - 8, 0, Math.PI * 2); c.stroke();
  c.lineWidth = 7;
  c.beginPath(); c.moveTo(r, r); c.lineTo(r, r * 0.35); c.stroke();
  c.beginPath(); c.moveTo(r, r); c.lineTo(r * 1.45, r * 1.15); c.stroke();
});
