/**
 * French cars of the 1990s and 2000s, by their published dimensions
 * (length, width, height, wheelbase) and a side profile read off
 * photographs.  Distances are metres; "fromFront" / "fromRear" are along
 * the car.  weight = how common the model is in the car park.
 */
export const MODELS = [
  {
    name: 'Renault Twingo I', weight: 2, L: 3.43, W: 1.63, H: 1.42, wheelbase: 2.35, frontOverhang: 0.62, wheelR: 0.28,
    noseH: 0.72, windscreenFromFront: 0.72, roofFromFront: 1.4, roofFromRear: 0.25, tailH: 1.0, beltH: 0.9,
    bumper: 0x6a6d72, colours: [0x3f8f7a, 0xd8a93a, 0xc8483a, 0x2f4f8a, 0xb8bcc2],
  },
  {
    name: 'Renault Clio II', weight: 3, L: 3.77, W: 1.64, H: 1.42, wheelbase: 2.47, frontOverhang: 0.72, wheelR: 0.29,
    noseH: 0.72, windscreenFromFront: 1.05, roofFromFront: 1.75, roofFromRear: 0.28, tailH: 1.02, beltH: 0.93,
    bumper: null, colours: [0xb8bcc2, 0x6e1f2a, 0x243556, 0xeeeee8, 0x5a5f66],
  },
  {
    name: 'Peugeot 206', weight: 3, L: 3.83, W: 1.65, H: 1.43, wheelbase: 2.44, frontOverhang: 0.8, wheelR: 0.29,
    noseH: 0.68, windscreenFromFront: 1.12, roofFromFront: 1.9, roofFromRear: 0.3, tailH: 1.0, beltH: 0.92,
    bumper: null, colours: [0xb8bcc2, 0xb3262a, 0x2a2a2e, 0x3a5fa0, 0xeeeee8],
  },
  {
    name: 'Peugeot 205', weight: 2, L: 3.7, W: 1.57, H: 1.37, wheelbase: 2.42, frontOverhang: 0.66, wheelR: 0.28,
    noseH: 0.76, windscreenFromFront: 1.2, roofFromFront: 1.72, roofFromRear: 0.32, tailH: 0.98, beltH: 0.9,
    bumper: 0x3a3b3f, colours: [0xeeeee8, 0xb3262a, 0x2f4a3a, 0x5a5f66],
  },
  {
    name: 'Citroën Saxo', weight: 1, L: 3.72, W: 1.6, H: 1.38, wheelbase: 2.38, frontOverhang: 0.72, wheelR: 0.28,
    noseH: 0.72, windscreenFromFront: 1.12, roofFromFront: 1.8, roofFromRear: 0.3, tailH: 1.0, beltH: 0.9,
    bumper: 0x5a5c60, colours: [0xc9b89a, 0x243556, 0xb8bcc2],
  },
  {
    name: 'Peugeot 406', weight: 1, L: 4.56, W: 1.76, H: 1.4, wheelbase: 2.7, frontOverhang: 0.9, wheelR: 0.31,
    noseH: 0.72, windscreenFromFront: 1.4, roofFromFront: 2.12, roofFromRear: 1.3, tailH: 1.03, beltH: 0.96, deck: 0.95,
    bumper: null, colours: [0x5a5f66, 0x2f4a3a, 0x6e1f2a, 0xb8bcc2],
  },
  {
    name: 'Renault Kangoo I', weight: 2, L: 3.99, W: 1.67, H: 1.8, wheelbase: 2.6, frontOverhang: 0.75, wheelR: 0.3,
    noseH: 0.88, windscreenFromFront: 0.95, roofFromFront: 1.55, roofFromRear: 0.06, tailH: 1.72, beltH: 1.02,
    bumper: 0x5a5c60, colours: [0xeeeee8, 0xeeeee8, 0x3a5fa0, 0x2f4a3a],
  },
  {
    name: 'Citroën Xsara Picasso', weight: 1, L: 4.28, W: 1.75, H: 1.64, wheelbase: 2.76, frontOverhang: 0.82, wheelR: 0.3,
    noseH: 0.78, windscreenFromFront: 0.92, roofFromFront: 1.85, roofFromRear: 0.18, tailH: 1.38, beltH: 0.98,
    bumper: null, colours: [0xb8bcc2, 0x3a5fa0, 0xc9b89a],
  },
];

/** Pick a model by weight with a random number in [0, 1). */
export function pickModel(r) {
  const total = MODELS.reduce((s, m) => s + m.weight, 0);
  let x = r * total;
  return MODELS.find((m) => (x -= m.weight) < 0) ?? MODELS[0];
}

/**
 * Side profile of the body as [along, up] points, rear (0) to front (L).
 * Pure: used by the mesh builder and by the tests.
 */
export function bodyProfile(m) {
  const roofRear = m.roofFromRear;
  const roofFront = m.L - m.roofFromFront;
  const screenBase = m.L - m.windscreenFromFront;
  const rear = m.deck
    ? [[0, 0.3], [0, m.tailH - 0.08], [0.06, m.tailH], [m.deck, m.tailH + 0.04]]
    : [[0, 0.3], [0, m.tailH - 0.1], [0.05, m.tailH]];
  return [
    ...rear,
    [roofRear, m.H - 0.04],
    [roofRear + 0.12, m.H],
    [roofFront - 0.12, m.H],
    [roofFront, m.H - 0.05],
    [screenBase, m.beltH + 0.02],
    [m.L - 0.1, m.noseH],
    [m.L, m.noseH - 0.12],
    [m.L, 0.3],
  ];
}
