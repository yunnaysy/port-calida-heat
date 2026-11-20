import * as THREE from 'three';

export function createFollowCamera(camera, canvas, touchEnabled = false) {
  const state = { yaw: 0, pitch: .12, distance: 13, sensitivity: .0024, invertY: false };
  let locked = false;
  function applyLook(dx, dy) {
    state.yaw -= dx * state.sensitivity;
    state.pitch = THREE.MathUtils.clamp(state.pitch + dy * state.sensitivity * (state.invertY ? -1 : 1), -.25, .6);
  }
  canvas.addEventListener('click', () => {
    if (touchEnabled || locked || document.querySelector('.screen:not([hidden])')) return;
    try {
      const request = canvas.requestPointerLock?.();
      request?.catch?.(() => {});
    } catch (error) {
      console.warn('Port Calida Heat: pointer lock unavailable.', error);
    }
  });
  document.addEventListener('pointerlockchange', () => { locked = document.pointerLockElement === canvas; });
  document.addEventListener('mousemove', event => {
    if (!locked) return;
    applyLook(event.movementX, event.movementY);
  });
  canvas.addEventListener('wheel', event => { state.distance = THREE.MathUtils.clamp(state.distance + event.deltaY * .012, 7, 23); });
  return {
    state,
    camera,
    setSensitivity(value) { state.sensitivity = value; },
    setInvertY(value) { state.invertY = value; },
    applyLook,
    release() {
      if (touchEnabled || !locked) return;
      try { document.exitPointerLock?.(); }
      catch (error) { console.warn('Port Calida Heat: pointer lock release unavailable.', error); }
    },
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
