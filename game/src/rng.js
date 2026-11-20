// Supplies deterministic pseudo-random helpers for repeatable game-world variation.
/** Creates a seeded PRNG function that yields values in the [0, 1) range. */
export function createRng(seed = 1) {
  let state = seed >>> 0;
  return () => {
    state += 0x6d2b79f5;
    let value = state;
    value = Math.imul(value ^ value >>> 15, value | 1);
    value ^= value + Math.imul(value ^ value >>> 7, value | 61);
    return ((value ^ value >>> 14) >>> 0) / 4294967296;
  };
}

/** Picks one item using the supplied random-number function. */
export function pick(random, items) {
  return items[Math.floor(random() * items.length)];
}
