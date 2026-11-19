import * as THREE from 'three';

const colors = [0xe27e5e, 0x4c7f7b, 0xe2c472, 0x6984a0, 0xd1a28d, 0x704f52];

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
  return { mesh: root, limbs, walkTime: random() * 5, direction: random() * Math.PI * 2, pace: 1.1 + random() * .65, flee: 0, health: 45 };
}

export function tickPedestrian(person, dt, player) {
  const toward = player.clone().sub(person.mesh.position);
  if (person.flee > 0) {
    person.flee -= dt; person.direction = Math.atan2(-toward.x, -toward.z);
  }
  person.mesh.position.x += -Math.sin(person.direction) * person.pace * dt;
  person.mesh.position.z += -Math.cos(person.direction) * person.pace * dt;
  person.mesh.rotation.y = person.direction;
  person.walkTime += dt * person.pace * 5;
  person.limbs?.forEach((limb, index) => {
    limb.rotation.x = Math.sin(person.walkTime + (index % 2) * Math.PI) * .38;
  });
}
