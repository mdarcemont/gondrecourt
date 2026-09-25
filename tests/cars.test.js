import { describe, expect, it } from 'vitest';
import { bodyProfile, MODELS, pickModel } from '../src/world/car-models.js';

describe('car models', () => {
  it('every profile stays inside the published length and height', () => {
    MODELS.forEach((m) => {
      bodyProfile(m).forEach(([x, y]) => {
        expect(x).toBeGreaterThanOrEqual(0);
        expect(x).toBeLessThanOrEqual(m.L + 1e-9);
        expect(y).toBeLessThanOrEqual(m.H + 1e-9);
      });
    });
  });

  it('puts both axles inside the body', () => {
    MODELS.forEach((m) => {
      const front = m.L - m.frontOverhang;
      const rear = front - m.wheelbase;
      expect(rear).toBeGreaterThan(m.wheelR * 0.8);
      expect(front).toBeLessThan(m.L - m.wheelR * 0.8);
    });
  });

  it('picks models by weight, covering all of them', () => {
    const seen = new Set();
    for (let i = 0; i < 200; i++) seen.add(pickModel(i / 200).name);
    expect(seen.size).toBe(MODELS.length);
  });
});
