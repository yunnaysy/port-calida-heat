// Builds and animates the city's randomly dressed pedestrian crowd; these actors support
// the foot-level traffic, walking, and flee reactions around player activities.
import * as THREE from 'three';

const colors = [0xe27e5e, 0x4c7f7b, 0xe2c472, 0x6984a0, 0xd1a28d, 0x704f52];

/** Creates a randomized pedestrian mesh and state at the given world position. */
export function createPedestrian(scene, random, x, z) {
  const root = new THREE.Group();
  const shirt = new THREE.MeshStandardMaterial({ color: colors[Math.floor(random() * colors.length)], roughness: .9 });
  const skin = new THREE.MeshStandardMaterial({ color: random() > .5 ? 0x9c654e : 0xd5a783 });
  const pants = new THREE.MeshStandardMaterial({ color: [0x344653, 0x57534c, 0x33483f, 0x554451][Math.floor(random() * 4)] });
  const body = new THREE.Mesh(new THREE.CapsuleGeometry(.36, .68, 3, 7), shirt);
  body.position.y = 1.25; body.castShadow = true; root.add(body);
  const head = new THREE.Mesh(new THREE.SphereGeometry(.34, 9, 8), skin);
  head.position.y = 2.16; head.castShadow = true; root.add(head);
  const hair = new THREE.Mesh(new THREE.SphereGeometry(.35, 9, 7, 0, Math.PI * 2, 0, Math.PI * .45),
    new THREE.MeshStandardMaterial({ color: random() > .5 ? 0x342821 : 0x171b1c }));
  hair.position.y = 2.3; root.add(hair);
  const limbs = [];
  for (const side of [-1, 1]) {
    const leg = new THREE.Mesh(new THREE.CapsuleGeometry(.13, .57, 2, 5), pants);
    leg.position.set(side * .22, .45, 0); leg.castShadow = true; root.add(leg); limbs.push(leg);
    const arm = new THREE.Group();
    arm.position.set(side * .43, 1.55, 0);
    const sleeve = new THREE.Mesh(new THREE.CapsuleGeometry(.12, .39, 2, 5), shirt);
    sleeve.position.y = -.13; arm.add(sleeve);
    const forearm = new THREE.Mesh(new THREE.CapsuleGeometry(.09, .31, 2, 5), skin);
    forearm.position.y = -.45; arm.add(forearm);
    arm.traverse(mesh => { if (mesh.isMesh) mesh.castShadow = true; });
    root.add(arm); limbs.push(arm);
  }
  root.position.set(x, 0, z); scene.add(root);
  const phone = random() < .45;
  const phoneLight = phone ? new THREE.PointLight(0xffd7a0, 0, 6, 2) : null;
  if (phoneLight) { phoneLight.position.set(.35, 1.65, -.25); root.add(phoneLight); }
  return {
    mesh: root, limbs, shirt, pants, phoneLight,
    walkTime: random() * 5, direction: random() * Math.PI * 2, basePace: 1.1 + random() * .65, pace: 1.1 + random() * .65,
    flee: 0, health: 45, linger: random() * 3, glance: 0,
  };
}

/** Advances one pedestrian's walking path and flee-facing animation. */
export function tickPedestrian(person, dt, player, preset = 'golden', wantedStars = 0) {
  const playerPos = player?.isVector3 ? player : player?.position ?? player;
  const toward = playerPos.clone().sub(person.mesh.position);
  const distance = toward.length();
  person.linger = Math.max(0, (person.linger ?? 0) - dt);
  person.glance = Math.max(0, (person.glance ?? 0) - dt);
  if (person.flee > 0) {
    person.flee -= dt;
    const fleeBoost = Math.max(0, wantedStars - 1) * .12;
    person.direction = Math.atan2(-toward.x, -toward.z);
    person.pace = (person.basePace ?? person.pace) * (2.4 + fleeBoost);
  } else {
    const calm = preset === 'night' ? .78 : preset === 'golden' ? .92 : 1;
    person.pace = (person.basePace ?? person.pace) * calm;
    if (wantedStars <= 1 && distance < 18 && distance > 3) {
      if (person.linger <= 0 && Math.random() < .02) person.linger = .9 + Math.random() * 1.1;
      if (person.glance <= 0 && Math.random() < .04) person.glance = .6;
    } else if (person.linger <= 0 && Math.random() < dt * .06) {
      person.direction += (Math.random() - .5) * .9;
    }
  }
  if (person.flee <= 0 && person.linger > 0) {
    person.mesh.rotation.y = Math.atan2(toward.x, toward.z);
  } else {
    if (person.flee <= 0 && person.linger <= 0) {
      person.mesh.position.x += -Math.sin(person.direction) * person.pace * dt;
      person.mesh.position.z += -Math.cos(person.direction) * person.pace * dt;
    }
    person.mesh.rotation.y = person.flee > 0 ? person.direction : (person.glance > 0 ? Math.atan2(toward.x, toward.z) : person.direction);
  }
  const moving = person.flee > 0 || person.linger <= 0;
  if (moving) person.walkTime += dt * person.pace * (person.flee > 0 ? 7 : 5);
  person.limbs?.forEach((limb, index) => {
    limb.rotation.x = moving ? Math.sin(person.walkTime + (index % 2) * Math.PI) * (person.flee > 0 ? .55 : .38) : 0;
  });
  if (person.phoneLight) person.phoneLight.intensity = preset === 'night' && person.flee <= 0 ? .8 : 0;
  if (person.shirt) {
    const night = preset === 'night';
    person.shirt.emissive?.setHex?.(0x000000);
    person.shirt.emissiveIntensity = 0;
    person.pants && (person.pants.emissiveIntensity = 0);
    person.mesh.userData.nightTone = night;
  }
}
