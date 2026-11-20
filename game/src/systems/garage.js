// Connects the garage location with vehicle storage and restore behavior across play sessions.
import { createVehicle } from '../entities/vehicle.js';

export const RESPRAY_PRESETS = [
  { name: 'hot pink', color: 0xff4fa3, metalness: .3, roughness: .45 },
  { name: 'teal', color: 0x2ad4c9, metalness: .32, roughness: .42 },
  { name: 'chrome cream', color: 0xf4ecd6, metalness: .88, roughness: .18 },
  { name: 'midnight purple', color: 0x4b1f63, metalness: .36, roughness: .4 },
  { name: 'coral', color: 0xff7d5c, metalness: .28, roughness: .46 },
  { name: 'white-gold', color: 0xf7e7b0, metalness: .76, roughness: .22 },
];

/** Creates garage actions that move one stored vehicle in and out of the world. */
export function createGarage(scene, vehicles, parked, state) {
  let storedVehicle = null;
  let sprayIndex = 0;

  function applyColor(vehicle, preset) {
    if (!vehicle || !preset) return;
    const body = vehicle.mesh?.children?.[0];
    const material = body?.material;
    if (!material) return;
    material.color?.setHex?.(preset.color);
    if ('metalness' in material) material.metalness = preset.metalness ?? material.metalness;
    if ('roughness' in material) material.roughness = preset.roughness ?? material.roughness;
    material.needsUpdate = true;
  }

  function removeStoredVehicle() {
    if (!storedVehicle) return;
    scene.remove(storedVehicle.mesh);
    vehicles.splice(vehicles.indexOf(storedVehicle), 1);
    parked.splice(parked.indexOf(storedVehicle), 1);
    storedVehicle = null;
  }

  return {
    presets: RESPRAY_PRESETS,
    clear() {
      removeStoredVehicle();
      state.garage = null;
    },
    restore(data) {
      removeStoredVehicle();
      state.garage = data ?? null;
      if (!data) return;
      storedVehicle = createVehicle(scene, { kind: data.kind, color: data.color, x: -60, z: -60 });
      storedVehicle.health = data.health;
      storedVehicle.ai = false;
      if (data.metalness != null || data.roughness != null) {
        applyColor(storedVehicle, { color: data.color, metalness: data.metalness, roughness: data.roughness });
      }
      vehicles.push(storedVehicle); parked.push(storedVehicle);
    },
    respray(vehicle, nameOrIndex) {
      const target = vehicle ?? storedVehicle;
      if (!target) return null;
      let preset = null;
      if (typeof nameOrIndex === 'number') {
        preset = RESPRAY_PRESETS[((nameOrIndex % RESPRAY_PRESETS.length) + RESPRAY_PRESETS.length) % RESPRAY_PRESETS.length];
        sprayIndex = RESPRAY_PRESETS.indexOf(preset);
      } else if (typeof nameOrIndex === 'string') {
        preset = RESPRAY_PRESETS.find(item => item.name === nameOrIndex) ?? null;
        if (preset) sprayIndex = RESPRAY_PRESETS.indexOf(preset);
      } else {
        sprayIndex = (sprayIndex + 1) % RESPRAY_PRESETS.length;
        preset = RESPRAY_PRESETS[sprayIndex];
      }
      if (!preset) return null;
      applyColor(target, preset);
      if (state.garage && storedVehicle === target) {
        state.garage.color = preset.color;
        state.garage.metalness = preset.metalness;
        state.garage.roughness = preset.roughness;
        state.garage.paint = preset.name;
      }
      target.paint = preset.name;
      return preset;
    },
    store(vehicle) {
      if (!vehicle) return false;
      if (storedVehicle && storedVehicle !== vehicle) removeStoredVehicle();
      storedVehicle = vehicle;
      storedVehicle.mesh.position.set(-60, 0, -60);
      storedVehicle.speed = 0;
      storedVehicle.ai = false;
      state.garage = {
        kind: vehicle.kind,
        color: vehicle.mesh.children[0].material.color.getHex(),
        metalness: vehicle.mesh.children[0].material.metalness,
        roughness: vehicle.mesh.children[0].material.roughness,
        paint: vehicle.paint,
        health: vehicle.health,
      };
      return true;
    },
  };
}
