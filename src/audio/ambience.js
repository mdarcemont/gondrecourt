/**
 * Ambient sound, synthesised with WebAudio (no audio files):
 *   - the Ornain: filtered noise, louder the closer you are to the water
 *   - birds: short random chirps
 *   - the church bell: strikes the real local hour from the church's position
 *     (and once on the half hour); B rings it on demand
 * Browsers only allow audio after a user gesture, so `start()` is called
 * from the click that takes the pointer.
 */
import { Vector3 } from 'three';
import { pointSegment } from '../geo/polygon.js';

const scratch = new Vector3();

// partials of a church bell relative to its strike note (hum, prime, tierce, quint, nominal...)
const BELL_PARTIALS = [[0.5, 0.6], [1, 1], [1.183, 0.55], [1.506, 0.35], [2, 0.45], [2.514, 0.2], [2.662, 0.15], [3.011, 0.1]];
const BELL_NOTE = 196; // G3
const STRIKE_GAP = 2.4; // seconds between strokes
const RIVER_REACH = 70; // metres at which the river fades out

function noiseBuffer(ctx) {
  const buf = ctx.createBuffer(1, ctx.sampleRate * 3, ctx.sampleRate);
  const d = buf.getChannelData(0);
  let last = 0;
  for (let i = 0; i < d.length; i++) {
    last = (last + 0.02 * (Math.random() * 2 - 1)) / 1.02; // brown-ish noise
    d[i] = last * 3.5;
  }
  return buf;
}

export function createAmbience({ water, church }) {
  let ctx = null;
  let riverGain = null;
  let bellPanner = null;
  let lastStruck = null;
  let nextChirp = 0;
  const edges = water.flatMap((w) => w.ring.map((a, i) => [a, w.ring[(i + 1) % w.ring.length]]));

  function start() {
    if (ctx) return ctx.resume();
    ctx = new AudioContext();
    const src = ctx.createBufferSource();
    src.buffer = noiseBuffer(ctx);
    src.loop = true;
    const lp = ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = 700;
    riverGain = ctx.createGain();
    riverGain.gain.value = 0;
    src.connect(lp).connect(riverGain).connect(ctx.destination);
    src.start();
    bellPanner = new PannerNode(ctx, { panningModel: 'HRTF', distanceModel: 'inverse', refDistance: 40, rolloffFactor: 0.6 });
    bellPanner.positionX.value = church.x;
    bellPanner.positionY.value = church.y;
    bellPanner.positionZ.value = church.z;
    bellPanner.connect(ctx.destination);
    lastStruck = currentStrike();
  }

  function strike(when) {
    BELL_PARTIALS.forEach(([ratio, amp]) => {
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.frequency.value = BELL_NOTE * ratio;
      const decay = 5.5 / Math.sqrt(ratio);
      g.gain.setValueAtTime(0, when);
      g.gain.linearRampToValueAtTime(0.14 * amp, when + 0.005);
      g.gain.exponentialRampToValueAtTime(0.0001, when + decay);
      o.connect(g).connect(bellPanner);
      o.start(when);
      o.stop(when + decay + 0.1);
    });
  }

  const ring = (n) => {
    if (!ctx) return;
    for (let i = 0; i < n; i++) strike(ctx.currentTime + 0.05 + i * STRIKE_GAP);
  };

  function chirp() {
    const t = ctx.currentTime;
    const notes = 2 + Math.floor(Math.random() * 4);
    const base = 2600 + Math.random() * 2200;
    for (let i = 0; i < notes; i++) {
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      const t0 = t + i * (0.09 + Math.random() * 0.05);
      o.frequency.setValueAtTime(base, t0);
      o.frequency.exponentialRampToValueAtTime(base * (1.2 + Math.random() * 0.4), t0 + 0.06);
      g.gain.setValueAtTime(0, t0);
      g.gain.linearRampToValueAtTime(0.02, t0 + 0.01);
      g.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.08);
      o.connect(g).connect(ctx.destination);
      o.start(t0);
      o.stop(t0 + 0.1);
    }
  }

  /** "HH:00" or "HH:30" key of the last quarter that should have struck. */
  function currentStrike(now = new Date()) {
    return now.getMinutes() < 30 ? `${now.getHours()}:00` : `${now.getHours()}:30`;
  }

  function update(listener) {
    if (!ctx || ctx.state !== 'running') return;
    const l = ctx.listener;
    l.positionX.value = listener.position.x;
    l.positionY.value = listener.position.y;
    l.positionZ.value = listener.position.z;
    // the ear faces where the camera looks, so the bell comes from the right side
    const fwd = listener.getWorldDirection(scratch);
    l.forwardX.value = fwd.x;
    l.forwardY.value = fwd.y;
    l.forwardZ.value = fwd.z;
    const d = edges.reduce((m, [a, b]) => Math.min(m, pointSegment([listener.position.x, listener.position.z], a, b).dist), Infinity);
    riverGain.gain.setTargetAtTime(0.22 * Math.max(0, 1 - d / RIVER_REACH) ** 2, ctx.currentTime, 0.3);

    if (ctx.currentTime > nextChirp) {
      chirp();
      nextChirp = ctx.currentTime + 2 + Math.random() * 7;
    }
    const now = new Date();
    const key = currentStrike(now);
    if (key !== lastStruck) {
      lastStruck = key;
      ring(key.endsWith(':30') ? 1 : ((now.getHours() + 11) % 12) + 1);
    }
  }

  return { start, update, ring };
}
