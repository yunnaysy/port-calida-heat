// Handles the browser-local persistence of player progress and world position.
import { SAVE_KEY } from '../config.js';

/** Reads and validates the saved game value exposed by localStorage. */
export function readSave() {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (error) {
    console.warn('Port Calida save could not be read.', error);
    return null;
  }
}

/** Writes the current progress and position to browser-local storage. */
export function writeSave(state, position) {
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify({
      cash: state.cash, respect: state.respect, mission: state.mission,
      weapons: state.weapons, garage: state.garage ?? null,
      x: position.x, z: position.z, savedAt: Date.now(),
    }));
    return true;
  } catch (error) {
    console.warn('Port Calida save could not be written.', error);
    return false;
  }
}
