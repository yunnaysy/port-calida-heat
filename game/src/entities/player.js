// Defines the player's on-foot character mesh and walking, aiming, and jump animation.
import * as THREE from 'three';

/** Builds the player's visible character and returns it with its shared animation state. */
export function createPlayer(scene) {
  const root = new THREE.Group();
  const shirt = new THREE.MeshStandardMaterial({ color: 0x2d5651, roughness: .85 });
  const skin = new THREE.MeshStandardMaterial({ color: 0x9e6548, roughness: .8 });
  const trousers = new THREE.MeshStandardMaterial({ color: 0x273b3b });
  const torso = new THREE.Mesh(new THREE.CapsuleGeometry(.57, .82, 4, 8), shirt);
  torso.position.y = 1.52; torso.castShadow = true; root.add(torso);
  const head = new THREE.Mesh(new THREE.SphereGeometry(.45, 12, 10), skin);
  head.position.y = 2.65; head.castShadow = true; root.add(head);
  const hair = new THREE.Mesh(new THREE.SphereGeometry(.47, 12, 8, 0, Math.PI * 2, 0, Math.PI * .43), new THREE.MeshStandardMaterial({ color: 0x25231e }));
  hair.position.y = 2.84; root.add(hair);
  const limbs = [];
  for (const side of [-1, 1]) {
    const leg = new THREE.Mesh(new THREE.CapsuleGeometry(.2, .78, 3, 6), trousers);
    leg.position.set(side * .3, .56, 0); leg.castShadow = true; root.add(leg); limbs.push(leg);
    const arm = new THREE.Group();
    arm.position.set(side * .62, 1.72, -.02);
    const sleeve = new THREE.Mesh(new THREE.CapsuleGeometry(.18, .42, 3, 6), shirt);
    sleeve.position.y = -.16; arm.add(sleeve);
    const forearm = new THREE.Mesh(new THREE.CapsuleGeometry(.14, .39, 3, 6), skin);
    forearm.position.y = -.53; arm.add(forearm);
    const hand = new THREE.Mesh(new THREE.SphereGeometry(.15, 8, 7), skin);
    hand.position.y = -.78; arm.add(hand);
    arm.traverse(mesh => { if (mesh.isMesh) mesh.castShadow = true; });
    root.add(arm); limbs.push(arm);
  }
  const facing = new THREE.Group(); facing.position.set(.76, 1.8, -.3);
  const weapon = new THREE.Group();
  const pistol = new THREE.Mesh(new THREE.BoxGeometry(.16, .13, .52), new THREE.MeshStandardMaterial({ color: 0x283338, metalness: .58, roughness: .34 }));
  pistol.position.z = -.3; weapon.add(pistol);
  const grip = new THREE.Mesh(new THREE.BoxGeometry(.12, .25, .16), pistol.material);
  grip.position.set(0, -.16, -.08); weapon.add(grip);
  weapon.visible = false; facing.add(weapon); root.add(facing);
  root.position.set(0, 0, 7); scene.add(root);
  return { mesh: root, limbs, pistol: weapon, facing, health: 100, armour: 35, yaw: 0, onFoot: true, walkTime: 0, jump: 0, invulnerable: 0 };
}

/** Updates the player's walking limbs, pistol visibility, and jump pose. */
export function animatePlayer(player, dt, moving, aiming) {
  player.mesh.rotation.y = player.yaw;
  player.walkTime += dt * (moving ? 11 : 2);
  player.limbs.forEach((limb, index) => {
    limb.rotation.x = moving ? Math.sin(player.walkTime + (index % 2) * Math.PI) * .48 : 0;
    if (aiming && index === 3) { limb.rotation.x = -.72; limb.rotation.z = -.25; }
  });
  player.pistol.visible = aiming;
  player.mesh.position.y = player.jump > 0 ? Math.sin((.45 - player.jump) * Math.PI / .45) * 1.3 : 0;
  player.jump = Math.max(0, player.jump - dt);
}
