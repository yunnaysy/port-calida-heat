// Connects the garage location with vehicle storage and restore behavior across play sessions.
import { createVehicle } from '../entities/vehicle.js';

/** Creates garage actions that move one stored vehicle in and out of the world. */
export function createGarage(scene, vehicles, parked, state) {
  let storedVehicle = null;

  function removeStoredVehicle() {
    if (!storedVehicle) return;
    scene.remove(storedVehicle.mesh);
    vehicles.splice(vehicles.indexOf(storedVehicle), 1);
    parked.splice(parked.indexOf(storedVehicle), 1);
    storedVehicle = null;
  }

  return {
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
      vehicles.push(storedVehicle); parked.push(storedVehicle);
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
        health: vehicle.health,
      };
      return true;
    },
  };
}
