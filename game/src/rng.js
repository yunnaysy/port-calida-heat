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

/** Picks one item by weight; entries are { item, weight } or [item, weight]. */
export function pickWeighted(random, items) {
  let total = 0;
  for (const entry of items) total += Array.isArray(entry) ? entry[1] : (entry.weight ?? 1);
  let roll = random() * (total || 1);
  for (const entry of items) {
    const weight = Array.isArray(entry) ? entry[1] : (entry.weight ?? 1);
    roll -= weight;
    if (roll <= 0) return Array.isArray(entry) ? entry[0] : entry.item;
  }
  const last = items[items.length - 1];
  return Array.isArray(last) ? last[0] : last?.item;
}

/** Returns a shuffled copy of an array using the supplied random function. */
export function shuffle(random, items) {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

/** Returns a random number in [min, max). */
export function range(random, min, max) {
  return min + random() * (max - min);
}

/** Converts an arbitrary string into a stable 32-bit seed. */
export function hashSeed(text = '') {
  let hash = 2166136261 >>> 0;
  for (let i = 0; i < text.length; i++) {
    hash ^= text.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}
