// Handles the browser-local persistence of player progress and world position.
import { SAVE_KEY } from '../config.js';

const SAVE_VERSION = 2;

/** Reads and validates the saved game value exposed by localStorage. */
export function readSave() {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw);
    if (!data || typeof data !== 'object') return null;
    const cash = Number.isFinite(data.cash) ? Math.max(0, Math.min(9_999_999, Math.floor(data.cash))) : 2450;
    const respect = Number.isFinite(data.respect) ? Math.max(0, Math.min(999, Math.floor(data.respect))) : 0;
    const mission = Number.isFinite(data.mission) ? Math.max(0, Math.min(20, Math.floor(data.mission))) : 0;
    const weapons = Array.isArray(data.weapons) ? data.weapons.slice(0, 4).map(Boolean) : [true, true, false, false];
    while (weapons.length < 4) weapons.push(false);
    weapons[0] = true; weapons[1] = true;
    const garage = data.garage && typeof data.garage === 'object' ? {
      kind: String(data.garage.kind ?? 'coupe'),
      color: Number.isFinite(data.garage.color) ? data.garage.color : 0xd5d3c7,
      health: Number.isFinite(data.garage.health) ? Math.max(0, Math.min(100, data.garage.health)) : 100,
      metalness: Number.isFinite(data.garage.metalness) ? data.garage.metalness : undefined,
      roughness: Number.isFinite(data.garage.roughness) ? data.garage.roughness : undefined,
      paint: typeof data.garage.paint === 'string' ? data.garage.paint : undefined,
    } : null;
    const x = Number.isFinite(data.x) ? Math.max(-700, Math.min(500, data.x)) : 0;
    const z = Number.isFinite(data.z) ? Math.max(-500, Math.min(500, data.z)) : 8;
    const wantedStars = Number.isFinite(stateWanted(data)) ? Math.max(0, Math.min(5, Math.floor(stateWanted(data)))) : undefined;
    const lightingPreset = ['day', 'golden', 'night'].includes(data.lightingPreset) ? data.lightingPreset : undefined;
    return { v: SAVE_VERSION, cash, respect, mission, weapons, garage, x, z, wantedStars, lightingPreset, savedAt: data.savedAt ?? Date.now() };
  } catch (error) {
    console.warn('Port Calida save could not be read.', error);
    return null;
  }
}

function stateWanted(data) {
  return data.wantedStars ?? data.wanted?.stars;
}

/** Writes the current progress and position to browser-local storage. */
export function writeSave(state, position) {
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify({
      v: SAVE_VERSION,
      cash: state.cash, respect: state.respect, mission: state.mission,
      weapons: state.weapons, garage: state.garage ?? null,
      wantedStars: Number.isFinite(state.wantedStars) ? state.wantedStars : undefined,
      lightingPreset: ['day', 'golden', 'night'].includes(state.lightingPreset) ? state.lightingPreset : undefined,
      x: position.x, z: position.z, savedAt: Date.now(),
    }));
    return true;
  } catch (error) {
    console.warn('Port Calida save could not be written.', error);
    return false;
  }
}
