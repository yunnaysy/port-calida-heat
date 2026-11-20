// Creates and advances brief Three.js combat and smoke effects for the game world.
import * as THREE from 'three';

/** Builds reusable particle and tracer effects and the tick loop that removes them. */
export function createParticles(scene, random = Math.random) {
  const effects = [];
  const ambient = [];
  const geometry = new THREE.SphereGeometry(.12, 6, 5);
  const smokeCanvas = document.createElement('canvas');
  smokeCanvas.width = 64; smokeCanvas.height = 64;
  const smokeContext = smokeCanvas.getContext('2d');
  const smokeGradient = smokeContext.createRadialGradient(32, 32, 3, 32, 32, 31);
  smokeGradient.addColorStop(0, 'rgba(255,244,218,.7)'); smokeGradient.addColorStop(.4, 'rgba(203,196,181,.42)');
  smokeGradient.addColorStop(1, 'rgba(153,148,139,0)');
  smokeContext.fillStyle = smokeGradient; smokeContext.fillRect(0, 0, 64, 64);
  const smokeTexture = new THREE.CanvasTexture(smokeCanvas);
  const moteCanvas = document.createElement('canvas');
  moteCanvas.width = moteCanvas.height = 16;
  const moteContext = moteCanvas.getContext('2d');
  const moteGradient = moteContext.createRadialGradient(8, 8, 1, 8, 8, 8);
  moteGradient.addColorStop(0, 'rgba(255,245,220,.95)');
  moteGradient.addColorStop(1, 'rgba(255,245,220,0)');
  moteContext.fillStyle = moteGradient; moteContext.fillRect(0, 0, 16, 16);
  const moteTexture = new THREE.CanvasTexture(moteCanvas);
  const sprayMaterial = new THREE.SpriteMaterial({ map: smokeTexture, color: 0xcfe8e6, transparent: true, opacity: .22, depthWrite: false, blending: THREE.AdditiveBlending });
  const ambientCap = 120;
  let ambientClock = 0;
  function spawnAmbient(type, center) {
    if (ambient.length >= ambientCap) return;
    const sprite = new THREE.Sprite(new THREE.SpriteMaterial({
      map: type === 'spray' ? smokeTexture : moteTexture,
      color: type === 'lamp' ? 0xffd58a : type === 'spray' ? 0xd9f4ef : 0xfff0c2,
      transparent: true,
      opacity: type === 'lamp' ? .55 : type === 'spray' ? .2 : .28,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      toneMapped: false,
    }));
    const radius = type === 'spray' ? 18 : 42;
    sprite.position.set(center.x + (random() - .5) * radius, type === 'spray' ? .4 + random() * 1.2 : 1 + random() * 9, center.z + (random() - .5) * radius);
    const scale = type === 'spray' ? 1.4 + random() * 1.8 : type === 'lamp' ? .18 + random() * .18 : .22 + random() * .28;
    sprite.scale.set(scale, scale, 1);
    scene.add(sprite);
    ambient.push({
      mesh: sprite, type,
      velocity: new THREE.Vector3((random() - .5) * (type === 'spray' ? 2.2 : .8), type === 'spray' ? .25 + random() * .5 : (random() - .5) * .35, (random() - .5) * (type === 'spray' ? 2.2 : .8)),
      life: type === 'spray' ? .9 + random() * .8 : 1.6 + random() * 1.8,
      phase: random() * Math.PI * 2,
    });
  }
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
    marinaSpray(position, count = 4) {
      for (let i = 0; i < count; i++) spawnAmbient('spray', position ?? new THREE.Vector3(-500, 0, 270));
    },
    tickAmbient(dt, preset = 'golden', playerPosition = new THREE.Vector3()) {
      ambientClock += dt;
      const center = playerPosition?.isVector3 ? playerPosition : new THREE.Vector3();
      const spawnBudget = Math.max(0, ambientCap - ambient.length);
      if (spawnBudget > 0 && ambientClock > .08) {
        ambientClock = 0;
        if (preset !== 'night') {
          for (let i = 0; i < 2 && ambient.length < ambientCap; i++) spawnAmbient('pollen', center);
        }
        if (preset === 'night') {
          if (random() < .7) spawnAmbient('lamp', center);
        }
        if (center.x < -360 && center.z > 120 && random() < .35) spawnAmbient('spray', new THREE.Vector3(-500, 0, 276));
      }
      for (let i = ambient.length - 1; i >= 0; i--) {
        const mote = ambient[i]; mote.life -= dt; mote.phase += dt * 2;
        mote.mesh.position.addScaledVector(mote.velocity, dt);
        if (mote.type === 'pollen') {
          mote.mesh.position.x += Math.sin(mote.phase) * dt * .25;
          mote.mesh.material.opacity = Math.min(.32, mote.life * .18);
        } else if (mote.type === 'lamp') {
          mote.mesh.position.y += Math.sin(mote.phase * 3) * dt * .3;
          mote.mesh.material.opacity = .25 + Math.sin(mote.phase * 5) * .18;
        } else {
          mote.mesh.scale.addScalar(dt * .55);
          mote.mesh.material.opacity = Math.max(0, mote.life * .18);
        }
        if (mote.life <= 0 || Math.hypot(mote.mesh.position.x - center.x, mote.mesh.position.z - center.z) > 80) {
          scene.remove(mote.mesh); ambient.splice(i, 1);
        }
      }
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
