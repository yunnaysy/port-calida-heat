import * as THREE from 'three';
import { createVehicleModel } from './vehicleModels.js';

export function createVehicle(scene, options = {}) {
  const model = createVehicleModel(options.kind ?? 'coupe', options.color ?? 0xc36c4f);
  model.position.set(options.x ?? 0, 0, options.z ?? 0);
  model.rotation.y = options.yaw ?? 0;
  scene.add(model);
  return {
    mesh: model, kind: options.kind ?? 'coupe', speed: 0, yaw: options.yaw ?? 0,
    ai: options.ai ?? false, police: options.police ?? false,
    health: 100, maxHealth: 100, routeAxis: options.routeAxis ?? 'z',
    routeSign: options.routeSign ?? 1, sirenPhase: 0, smoke: null,
  };
}

export function vehicleForward(yaw) {
  return new THREE.Vector3(-Math.sin(yaw), 0, -Math.cos(yaw));
}

export function placeVehicle(vehicle, x, z, yaw = vehicle.yaw) {
  vehicle.mesh.position.set(x, 0, z);
  vehicle.mesh.rotation.y = yaw;
  vehicle.yaw = yaw;
}

export function tickVehicle(vehicle, dt) {
  if (!vehicle.ai) {
    vehicle.mesh.position.addScaledVector(vehicleForward(vehicle.yaw), vehicle.speed * dt);
  }
  vehicle.mesh.rotation.y = vehicle.yaw;
  vehicle.sirenPhase += dt * 13;
  if (vehicle.police) {
    const pulse = Math.sin(vehicle.sirenPhase) > 0;
    vehicle.mesh.children.forEach(child => {
      if (child.userData.sirenColor) child.intensity = pulse === (child.userData.sirenColor === 0xe83939) ? 23 : 2;
      if (child.material?.color?.getHex() === 0x237de7 || child.material?.color?.getHex() === 0xe83939) {
        child.visible = pulse === (child.material.color.getHex() === 0xe83939);
      }
    });
  }
}
