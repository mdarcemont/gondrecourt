import { describe, expect, it } from 'vitest';
import { hexToRgb, hslToRgb, medianRgb, paintRoof, rgbToHsl } from '../src/geo/colour.js';

describe('colour', () => {
  it('round-trips rgb through hsl', () => {
    [[184, 101, 75], [94, 101, 118], [255, 255, 255], [0, 0, 0]].forEach((c) => {
      hslToRgb(rgbToHsl(c)).forEach((v, i) => expect(Math.abs(v - c[i])).toBeLessThanOrEqual(1));
    });
  });

  it('takes a channel-wise median, robust to a shadowed pixel', () => {
    expect(medianRgb([[180, 90, 70], [182, 92, 72], [20, 20, 20]])).toEqual([180, 90, 70]);
    expect(medianRgb([])).toBeNull();
  });

  const palette = { tiles: [0xb8654b, 0xa4604e], greys: [0x5e6576, 0x9aa1aa] };

  it('keeps a hazy red roof clearly red (Le Central, measured 163,130,128)', () => {
    const [r, g] = hexToRgb(paintRoof([163, 130, 128], palette));
    expect(r).toBeGreaterThan(g + 40);
  });

  it('keeps a grey roof grey', () => {
    const [r, g, b] = hexToRgb(paintRoof([85, 88, 95], palette));
    expect(Math.max(r, g, b) - Math.min(r, g, b)).toBeLessThan(30);
  });
});
