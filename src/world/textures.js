/**
 * Canvas-drawn textures.  Like Sakura Crossing, no image assets: every
 * facade, railing and sign is drawn at start-up, flat and low-frequency.
 */
import * as THREE from 'three';
import { PAL } from '../engine/palette.js';

const hex = (n) => '#' + n.toString(16).padStart(6, '0');
const cache = new Map();

function canvasTexture(key, w, h, draw, { repeat = true, srgb = true } = {}) {
  if (cache.has(key)) return cache.get(key);
  const cv = document.createElement('canvas');
  cv.width = w;
  cv.height = h;
  draw(cv.getContext('2d'), w, h);
  const tex = new THREE.CanvasTexture(cv);
  if (srgb) tex.colorSpace = THREE.SRGBColorSpace;
  if (repeat) tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.anisotropy = 8;
  cache.set(key, tex);
  return tex;
}

/**
 * One window bay: 3.2 m wide x one storey.  Drawn white-on-white so the
 * wall's vertex colour tints it; the shutters are the only saturated part.
 * u runs along the wall (1 unit = one bay), v up the wall (1 unit = one floor).
 */
export function windowBay(shutter = PAL.shutterTeal) {
  return canvasTexture(`bay-${shutter}`, 256, 256, (c, w, h) => {
    c.fillStyle = '#ffffff';
    c.fillRect(0, 0, w, h);
    const ww = w * 0.3;
    const wh = h * 0.5;
    const x = (w - ww) / 2;
    const y = h * 0.2;
    // shutters, opened back against the wall
    c.fillStyle = hex(shutter);
    c.fillRect(x - ww * 0.52, y, ww * 0.48, wh);
    c.fillRect(x + ww * 1.04, y, ww * 0.48, wh);
    c.fillStyle = 'rgba(0,0,0,0.12)';
    for (let i = 1; i < 6; i++) {
      c.fillRect(x - ww * 0.52, y + (wh * i) / 6, ww * 0.48, 2);
      c.fillRect(x + ww * 1.04, y + (wh * i) / 6, ww * 0.48, 2);
    }
    // stone surround, frame and glass
    c.fillStyle = '#f2ede2';
    c.fillRect(x - 6, y - 6, ww + 12, wh + 12);
    c.fillStyle = hex(PAL.frameWhite);
    c.fillRect(x, y, ww, wh);
    c.fillStyle = hex(PAL.glassDark);
    c.fillRect(x + 5, y + 5, ww / 2 - 7, wh - 10);
    c.fillRect(x + ww / 2 + 2, y + 5, ww / 2 - 7, wh - 10);
    // sill
    c.fillStyle = '#e9e2d4';
    c.fillRect(x - 10, y + wh + 4, ww + 20, 7);
  });
}

/** Cast-iron railing: two rails, bars and a hoop, alpha-tested. 1 unit = 1 m. */
export function railing(colour = PAL.railingGreen) {
  return canvasTexture(`railing-${colour}`, 256, 128, (c, w, h) => {
    c.clearRect(0, 0, w, h);
    c.fillStyle = hex(colour);
    c.strokeStyle = hex(colour);
    c.fillRect(0, 4, w, 8);
    c.fillRect(0, h - 22, w, 6);
    for (let x = 8; x < w; x += 32) c.fillRect(x, 4, 5, h - 4);
    c.lineWidth = 4;
    for (let x = 24; x < w; x += 64) {
      c.beginPath();
      c.ellipse(x, h * 0.45, 14, 26, 0, 0, Math.PI * 2);
      c.stroke();
    }
  });
}

/** A painted lettering panel.  Returns the texture and its aspect ratio. */
export function lettering(text, { color = PAL.signGreen, bg = null, font = 'bold 96px Georgia, serif', pad = 24 } = {}) {
  const key = `txt-${text}-${color}-${bg}-${font}`;
  const probe = document.createElement('canvas').getContext('2d');
  probe.font = font;
  const width = Math.ceil(probe.measureText(text).width + pad * 2);
  const height = 140;
  const tex = canvasTexture(key, width, height, (c, w, h) => {
    if (bg !== null) {
      c.fillStyle = hex(bg);
      c.fillRect(0, 0, w, h);
    } else {
      c.clearRect(0, 0, w, h);
    }
    c.font = font;
    c.fillStyle = hex(color);
    c.textBaseline = 'middle';
    c.fillText(text, pad, h / 2 + 4);
  }, { repeat: false });
  return { tex, aspect: width / height };
}

/** Veranda glazing: white mullions on dark glass, 1 unit = 1 m. */
export function glazing() {
  return canvasTexture('glazing', 128, 256, (c, w, h) => {
    c.fillStyle = hex(PAL.veranda);
    c.fillRect(0, 0, w, h);
    c.fillStyle = hex(PAL.glassDark);
    c.fillRect(10, 10, w / 2 - 15, h * 0.62);
    c.fillRect(w / 2 + 5, 10, w / 2 - 15, h * 0.62);
    c.fillRect(10, h * 0.62 + 20, w - 20, h * 0.3);
  });
}

/**
 * The café-tabac signs on Le Central's corner, simplified to flat shapes.
 * Returns the texture and its size in metres.
 */
export function signDisc(kind) {
  const SPEC = {
    tabac: { w: 0.35, h: 0.6, draw: (c, w, h) => {
      c.fillStyle = '#d8333a';
      c.beginPath(); c.moveTo(w / 2, 0); c.lineTo(w, h / 2); c.lineTo(w / 2, h); c.lineTo(0, h / 2); c.fill();
    } },
    gold: { w: 0.5, h: 0.5, draw: (c, w, h) => {
      c.fillStyle = '#e8b93a'; c.beginPath(); c.arc(w / 2, h / 2, w / 2 - 4, 0, Math.PI * 2); c.fill();
      c.fillStyle = '#7a1f22'; c.font = 'bold 60px Georgia, serif'; c.textAlign = 'center'; c.textBaseline = 'middle';
      c.fillText('GOLD', w / 2, h / 2);
    } },
    pmu: { w: 0.62, h: 0.34, draw: (c, w, h) => {
      c.fillStyle = '#1f8a5a'; c.beginPath(); c.ellipse(w / 2, h / 2, w / 2 - 3, h / 2 - 3, 0, 0, Math.PI * 2); c.fill();
      c.fillStyle = '#ffffff'; c.font = 'bold 70px Arial, sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle';
      c.fillText('PMU', w / 2, h / 2 + 3);
    } },
    fdj: { w: 0.5, h: 0.26, draw: (c, w, h) => {
      c.fillStyle = '#2350b8'; c.fillRect(0, 0, w, h);
      c.fillStyle = '#ffffff'; c.font = 'bold 60px Arial, sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle';
      c.fillText('FDJ', w / 2, h / 2 + 2);
    } },
  }[kind];
  if (!SPEC) throw new Error(`unknown sign kind: ${kind}`);
  const px = 400; // pixels per metre
  const tex = canvasTexture(`sign-${kind}`, Math.round(SPEC.w * px), Math.round(SPEC.h * px), SPEC.draw, { repeat: false });
  return { tex, w: SPEC.w, h: SPEC.h };
}

/** Soft broken streaks for moving water: black background, pale dashes (used as an emissive map). */
export function ripples() {
  return canvasTexture('ripples', 256, 256, (c, w, h) => {
    c.fillStyle = '#000000';
    c.fillRect(0, 0, w, h);
    c.fillStyle = '#ffffff';
    let s = 17;
    const rand = () => ((s = (s * 16807) % 2147483647) / 2147483647);
    for (let i = 0; i < 38; i++) {
      const x = rand() * w;
      const y = rand() * h;
      const len = 18 + rand() * 50;
      c.globalAlpha = 0.35 + rand() * 0.5;
      c.fillRect(x, y, len, 2 + rand() * 2);
      if (x + len > w) c.fillRect(x - w, y, len, 3); // wrap so the tile repeats seamlessly
    }
    c.globalAlpha = 1;
  }, { srgb: false });
}

/**
 * Le Central's veranda wall, one storey (v 0..1 = floor to roof), 1 unit of u = 1 m:
 * red-brown lower panel, white frames with small panes, white fascia.
 */
export function verandaWall() {
  return canvasTexture('veranda-wall', 128, 256, (c, w, h) => {
    c.fillStyle = hex(PAL.veranda);
    c.fillRect(0, 0, w, h);
    c.fillStyle = hex(PAL.brickBase);
    c.fillRect(0, h * 0.7, w, h * 0.3);
    c.fillStyle = hex(PAL.glassDark);
    const cols = 3;
    const rows = 4;
    const top = h * 0.12;
    const bottom = h * 0.66;
    for (let i = 0; i < cols; i++) {
      for (let j = 0; j < rows; j++) {
        const pw = w / cols;
        const ph = (bottom - top) / rows;
        c.fillRect(i * pw + 5, top + j * ph + 4, pw - 10, ph - 8);
      }
    }
  });
}

/** A small French flag for the bunting. */
export function tricolour() {
  return canvasTexture('tricolour', 96, 64, (c, w, h) => {
    ['#2b4a9c', '#f6f6f6', '#d8333a'].forEach((col, i) => {
      c.fillStyle = col;
      c.fillRect((i * w) / 3, 0, w / 3 + 1, h);
    });
  }, { repeat: false });
}

/**
 * Rough limestone masonry (the château tower, the park wall): irregular
 * courses of grey-beige blocks with dark joints.  1 unit = 2 m square.
 */
export function rubbleStone(tone = 'grey') {
  const palette = tone === 'grey'
    ? ['#c9c3b6', '#bdb6a8', '#d3cdbf', '#b2ab9d', '#c4bba9']
    : ['#d6c9a8', '#cbbd99', '#ddd1b3', '#c2b38f', '#d0c3a2'];
  return canvasTexture(`rubble-${tone}`, 256, 256, (c, w, h) => {
    c.fillStyle = '#8a8478';
    c.fillRect(0, 0, w, h);
    let s = tone === 'grey' ? 31 : 57;
    const rand = () => ((s = (s * 16807) % 2147483647) / 2147483647);
    for (let y = 0; y < h;) {
      const course = 14 + rand() * 18;
      for (let x = -rand() * 30; x < w;) {
        const len = 22 + rand() * 40;
        c.fillStyle = palette[Math.floor(rand() * palette.length)];
        c.fillRect(x + 1.5, y + 1.5, len - 3, course - 3);
        if (x + len > w) c.fillRect(x - w + 1.5, y + 1.5, len - 3, course - 3);
        x += len;
      }
      y += course;
    }
  });
}
