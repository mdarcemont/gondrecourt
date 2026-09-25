import { describe, expect, it } from 'vitest';
import { deckHeightAt } from '../src/geo/bridge.js';

const bridge = { pts: [[0, 0], [20, 0]], deck: [1, 3], width: 6 };

describe('deckHeightAt', () => {
  it('interpolates the deck along the span', () => {
    expect(deckHeightAt([10, 0], bridge)).toBeCloseTo(2, 9);
  });
  it('includes the pavement margin at the side', () => {
    expect(deckHeightAt([5, 3.5], bridge)).toBeCloseTo(1.5, 9);
  });
  it('is null off the deck', () => {
    expect(deckHeightAt([10, 6], bridge)).toBeNull();
  });
});
