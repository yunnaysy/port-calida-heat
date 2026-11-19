import * as THREE from 'three';
import { createVehicle, tickVehicle } from '../entities/vehicle.js';
import { createPedestrian } from '../entities/pedestrian.js';

export function createPolice(scene, random) {
  return { cruisers: [], officers: [], helicopter: null, roadblock: null, random, scene, time: 0 };
}

export function tickPolice(police, dt, target, wanted, traffic, notify) {
  police.time += dt;
  const stars = wanted.stars;
  const desired = stars ? Math.min(5, Math.max(1, Math.ceil(stars / 1.4))) : 0;
  while (police.cruisers.length < desired) {
    const angle = police.random() * Math.PI * 2;
    const cruiser = createVehicle(police.scene, {
      kind: 'cruiser', color: 0xe9e5d7, police: true,
      x: target.position.x + Math.cos(angle) * 85, z: target.position.z + Math.sin(angle) * 85,
      yaw: Math.atan2(-Math.cos(angle), -Math.sin(angle)),
    });
    cruiser.health = 140; cruiser.speed = 0; police.cruisers.push(cruiser);
  }
  while (police.cruisers.length > desired) {
    const cruiser = police.cruisers.pop(); police.scene.remove(cruiser.mesh);
  }
  if (stars >= 3 && !police.roadblock && !police.suppressRoadblock) {
    const yaw = target.vehicle?.yaw ?? 0;
    const forward = new THREE.Vector3(-Math.sin(yaw), 0, -Math.cos(yaw));
    const position = target.position.clone().addScaledVector(forward, 52);
    const barrier = new THREE.Group();
    barrier.position.copy(position); barrier.rotation.y = yaw;
    for (const z of [-5, 5]) {
      const rail = new THREE.Mesh(new THREE.BoxGeometry(15, 1.25, .48), new THREE.MeshStandardMaterial({ color: 0xf2a34e, roughness: .64 }));
      rail.position.set(0, 1, z); barrier.add(rail);
      for (let x = -6; x <= 6; x += 3) {
        const stripe = new THREE.Mesh(new THREE.BoxGeometry(1.35, 1.27, .52), new THREE.MeshBasicMaterial({ color: x % 2 ? 0xf6e6c6 : 0x293d42 }));
        stripe.position.set(x, 1, z); barrier.add(stripe);
      }
    }
    police.scene.add(barrier); police.roadblock = barrier;
  }
  if (stars < 3 && police.roadblock) { police.scene.remove(police.roadblock); police.roadblock = null; }
  if (stars >= 4 && !police.helicopter) {
    const bodyMaterial = new THREE.MeshStandardMaterial({ color: 0x405a5a, metalness: .28, roughness: .5 });
    const rotor = new THREE.Group();
    for (let i = 0; i < 2; i++) {
      const blade = new THREE.Mesh(new THREE.BoxGeometry(10, .12, .32), new THREE.MeshStandardMaterial({ color: 0x26373a }));
      blade.rotation.y = i * Math.PI / 2; rotor.add(blade);
    }
    const body = new THREE.Mesh(new THREE.CapsuleGeometry(1.05, 3.8, 4, 8), new THREE.MeshStandardMaterial({ color: 0x52686a, roughness: .48 }));
    body.rotation.z = Math.PI / 2; body.position.y = 5;
    const tailBoom = new THREE.Mesh(new THREE.CylinderGeometry(.13, .32, 6.6, 8), bodyMaterial);
    tailBoom.rotation.z = Math.PI / 2; tailBoom.position.set(3.9, 5, 0);
    const tailFin = new THREE.Mesh(new THREE.BoxGeometry(.24, 2.8, .35), bodyMaterial);
    tailFin.position.set(7.05, 5.2, 0);
    const tailRotor = new THREE.Mesh(new THREE.BoxGeometry(.14, 2.5, .15), new THREE.MeshStandardMaterial({ color: 0xe9b56b }));
    tailRotor.position.set(7.15, 5.3, 0);
    const cabin = new THREE.Mesh(new THREE.BoxGeometry(2.4, 1.8, 2.15), new THREE.MeshStandardMaterial({ color: 0x72a4a4, metalness: .12, roughness: .16, emissive: 0x173b40, emissiveIntensity: .22 }));
    cabin.position.set(-1.1, 5.05, 0);
    const windowMaterial = new THREE.MeshBasicMaterial({ color: 0x8dd3d3, transparent: true, opacity: .76, side: THREE.DoubleSide, toneMapped: false });
    for (const side of [-1, 1]) {
      const sideWindow = new THREE.Mesh(new THREE.PlaneGeometry(1.12, 1.02), windowMaterial);
      sideWindow.position.set(0, 0, side * 1.09); sideWindow.rotation.y = side * Math.PI / 2; cabin.add(sideWindow);
    }
    const skids = new THREE.Group();
    const skidMetal = new THREE.MeshStandardMaterial({ color: 0x26383a, metalness: .55, roughness: .4 });
    for (const side of [-1, 1]) {
      const rail = new THREE.Mesh(new THREE.CylinderGeometry(.09, .09, 6.4, 7), skidMetal);
      rail.rotation.z = Math.PI / 2; rail.position.set(-.15, 2.25, side * 1.25); skids.add(rail);
      for (const x of [-1.75, 1.35]) {
        const strut = new THREE.Mesh(new THREE.CylinderGeometry(.075, .075, 2.8, 6), skidMetal);
        strut.position.set(x, 3.45, side * 1.25); skids.add(strut);
      }
    }
    const rotorDisc = new THREE.Mesh(new THREE.CircleGeometry(5.2, 32), new THREE.MeshBasicMaterial({ color: 0xc3d2c2, transparent: true, opacity: .14, side: THREE.DoubleSide, depthWrite: false }));
    rotorDisc.rotation.x = -Math.PI / 2; rotorDisc.position.y = 6.22;
    const beam = new THREE.Mesh(new THREE.CylinderGeometry(.25, 4.8, 29, 16, 1, true), new THREE.MeshBasicMaterial({ color: 0xffe6a4, transparent: true, opacity: .14, side: THREE.DoubleSide, depthWrite: false, toneMapped: false }));
    beam.position.set(-.8, -12.5, 0);
    const searchlight = new THREE.SpotLight(0xffe9ad, 150, 125, Math.PI / 7, .6, 1.2);
    searchlight.position.set(-.8, 4.7, 0); searchlight.target.position.set(-.8, -32, 0);
    const helicopter = new THREE.Group();
    helicopter.add(body, tailBoom, tailFin, tailRotor, cabin, rotor, rotorDisc, skids, beam, searchlight, searchlight.target);
    rotor.position.y = 6.15; helicopter.userData.rotor = rotor; helicopter.userData.rotorDisc = rotorDisc;
    helicopter.userData.tailRotor = tailRotor; helicopter.userData.searchlightTarget = searchlight.target;
    const navLight = new THREE.PointLight(0xff563e, 22, 18); navLight.position.set(-1.6, 5.4, 1.2); helicopter.add(navLight);
    police.scene.add(helicopter); police.helicopter = helicopter;
  }
  if (stars < 4 && police.helicopter) { police.scene.remove(police.helicopter); police.helicopter = null; }
  if (police.helicopter) {
    const heli = police.helicopter;
    const yaw = target.vehicle?.yaw ?? 0;
    const staged = police.showHelicopter;
    heli.position.set(target.position.x - Math.sin(yaw) * (staged ? 28 : 8) + Math.sin(police.time * .18) * 3, staged ? 25 : 29,
      target.position.z - Math.cos(yaw) * 8 + Math.cos(police.time * .18) * 3);
    heli.scale.setScalar(staged ? 1.35 : 1);
    if (staged) heli.userData.searchlightTarget.position.set(-26, -28, 0);
    heli.userData.rotor.rotation.y += dt * 30;
    heli.userData.tailRotor.rotation.x += dt * 24;
    heli.userData.rotorDisc.rotation.z += dt * 18;
  }
  if (stars >= 2 && police.officers.length < stars - 1) {
    while (police.officers.length < stars - 1) {
      const officer = createPedestrian(police.scene, police.random, target.position.x - 6 - police.officers.length * 3, target.position.z + (police.officers.length % 2 ? 4 : -4));
      officer.mesh.children[0].material.color.setHex(0x263e52); officer.police = true; police.officers.push(officer);
    }
    notify('PCPD FOOT UNIT · SUSPECT ON SIGHT');
  }
  for (const cruiser of police.cruisers) {
    if (police.freezeCruisers) { tickVehicle(cruiser, dt); continue; }
    const toward = target.position.clone().sub(cruiser.mesh.position);
    const distance = toward.length();
    const desiredYaw = Math.atan2(-toward.x, -toward.z);
    let delta = desiredYaw - cruiser.yaw;
    delta = Math.atan2(Math.sin(delta), Math.cos(delta));
    cruiser.yaw += THREE.MathUtils.clamp(delta, -dt * 1.65, dt * 1.65);
    const approach = cruiser.shotScale ?? 1;
    cruiser.speed = THREE.MathUtils.clamp(cruiser.speed + dt * 13 * approach, 0, stars >= 4 ? 25 : 20);
    cruiser.mesh.position.addScaledVector(new THREE.Vector3(-Math.sin(cruiser.yaw), 0, -Math.cos(cruiser.yaw)), cruiser.speed * dt * approach);
    cruiser.mesh.rotation.y = cruiser.yaw;
    tickVehicle(cruiser, dt);
    if (distance < 7 && police.random() < dt * 1.3) {
      target.hit(8, 4);
      if (target.vehicle) target.vehicle.health -= 9;
    }
    for (const vehicle of traffic) if (vehicle.mesh.position.distanceTo(cruiser.mesh.position) < 4) vehicle.speed = -5;
  }
  for (const officer of police.officers) {
    officer.flee = 0;
    if (stars >= 2 && officer.mesh.position.distanceTo(target.position) < 28 && police.random() < dt * .7) target.hit(6, 8);
  }
  if (stars < 2) {
    for (const officer of police.officers) police.scene.remove(officer.mesh);
    police.officers.length = 0;
  }
  const near = police.cruisers.some(car => car.mesh.position.distanceTo(target.position) < 100);
  return near;
}
