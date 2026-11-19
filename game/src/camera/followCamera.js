import * as THREE from 'three';

export function createFollowCamera(camera, canvas) {
  const state = { yaw: 0, pitch: .12, distance: 13, sensitivity: .0024 };
  let locked = false;
  canvas.addEventListener('click', () => { if (!locked && !document.querySelector('.screen:not([hidden])')) canvas.requestPointerLock?.(); });
  document.addEventListener('pointerlockchange', () => { locked = document.pointerLockElement === canvas; });
  document.addEventListener('mousemove', event => {
    if (!locked) return;
    state.yaw -= event.movementX * state.sensitivity;
    state.pitch = THREE.MathUtils.clamp(state.pitch + event.movementY * state.sensitivity, -.25, .6);
  });
  canvas.addEventListener('wheel', event => { state.distance = THREE.MathUtils.clamp(state.distance + event.deltaY * .012, 7, 23); });
  return {
    state,
    camera,
    setSensitivity(value) { state.sensitivity = value; },
    release() { if (locked) document.exitPointerLock(); },
    update(target, heading, dt, inCar, snap = false) {
      const yaw = state.yaw + heading;
      const distance = inCar ? state.distance + 3 : state.distance;
      const desired = new THREE.Vector3(target.x + Math.sin(yaw) * distance, target.y + (inCar ? 5.3 : 4.2) + state.pitch * 8, target.z + Math.cos(yaw) * distance);
      if (snap) camera.position.copy(desired);
      else camera.position.lerp(desired, 1 - Math.exp(-dt * 4.8));
      const look = target.clone().add(new THREE.Vector3(-Math.sin(yaw) * 1.8, inCar ? 1.6 : 1.15, -Math.cos(yaw) * 1.8));
      camera.lookAt(look);
    },
  };
}
