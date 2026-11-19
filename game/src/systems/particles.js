import * as THREE from 'three';

export function createParticles(scene, random = Math.random) {
  const effects = [];
  const geometry = new THREE.SphereGeometry(.12, 6, 5);
  const smokeCanvas = document.createElement('canvas');
  smokeCanvas.width = 64; smokeCanvas.height = 64;
  const smokeContext = smokeCanvas.getContext('2d');
  const smokeGradient = smokeContext.createRadialGradient(32, 32, 3, 32, 32, 31);
  smokeGradient.addColorStop(0, 'rgba(255,244,218,.7)'); smokeGradient.addColorStop(.4, 'rgba(203,196,181,.42)');
  smokeGradient.addColorStop(1, 'rgba(153,148,139,0)');
  smokeContext.fillStyle = smokeGradient; smokeContext.fillRect(0, 0, 64, 64);
  const smokeTexture = new THREE.CanvasTexture(smokeCanvas);
  return {
    burst(position, color = 0xffc074, count = 8) {
      for (let i = 0; i < count; i++) {
        const mesh = new THREE.Mesh(geometry, new THREE.MeshBasicMaterial({ color, transparent: true }));
        mesh.position.copy(position); scene.add(mesh);
        effects.push({ mesh, velocity: new THREE.Vector3((random() - .5) * 7, random() * 6, (random() - .5) * 7), life: .35 + random() * .35 });
      }
    },
    tracer(from, to, color = 0xffd489) {
      const direction = to.clone().sub(from);
      const mesh = new THREE.Mesh(new THREE.CylinderGeometry(.035, .035, direction.length(), 5), new THREE.MeshBasicMaterial({ color, transparent: true, opacity: .8 }));
      mesh.position.copy(from).add(to).multiplyScalar(.5);
      mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction.normalize());
      scene.add(mesh); effects.push({ mesh, velocity: new THREE.Vector3(), life: .12 });
    },
    muzzleFlash(position, direction) {
      const mesh = new THREE.Mesh(new THREE.ConeGeometry(.3, .85, 6), new THREE.MeshBasicMaterial({ color: 0xffc15e, transparent: true, opacity: .95 }));
      mesh.position.copy(position);
      mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction.clone().normalize());
      scene.add(mesh); effects.push({ mesh, velocity: new THREE.Vector3(), life: .45 });
    },
    smoke(position) {
      const mesh = new THREE.Sprite(new THREE.SpriteMaterial({ map: smokeTexture, transparent: true, opacity: .55, depthWrite: false }));
      mesh.position.copy(position); mesh.scale.set(2.2, 1.5, 1); scene.add(mesh);
      effects.push({ mesh, velocity: new THREE.Vector3((random() - .5) * 1.4, .45 + random() * .6, (random() - .5) * 1.4), life: .85, expand: true });
    },
    tick(dt) {
      for (let i = effects.length - 1; i >= 0; i--) {
        const effect = effects[i]; effect.life -= dt;
        effect.mesh.position.addScaledVector(effect.velocity, dt);
        effect.velocity.y -= dt * 12;
        if (effect.expand) effect.mesh.scale.addScalar(dt * 1.15);
        else effect.mesh.scale.multiplyScalar(.97);
        if (effect.life <= 0) { scene.remove(effect.mesh); effect.mesh.geometry = geometry; effects.splice(i, 1); }
      }
    },
  };
}
