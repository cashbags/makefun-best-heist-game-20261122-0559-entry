// random.js — tiny seeded random number generator for MIDNIGHT VAULT.
// Every run of the game that needs chance uses one of these streams, so a
// fixed seed always deals the same cards: screenshots and replays are
// reproducible byte for byte.
export function mulberry32(seed) {
  let a = seed >>> 0;
  return function nextRandom() {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Pick an integer in [lo, hi] from a stream.
export function randomInt(rng, lo, hi) {
  return lo + Math.floor(rng() * (hi - lo + 1));
}

// Shuffle a copy of an array with a stream (Fisher-Yates).
export function shuffleWith(rng, items) {
  const out = items.slice();
  for (let i = out.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rng() * (i + 1));
    const tmp = out[i];
    out[i] = out[j];
    out[j] = tmp;
  }
  return out;
}
