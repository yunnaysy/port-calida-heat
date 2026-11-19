import * as THREE from 'three';
import { createVehicle } from './entities/vehicle.js';
import { createOceanMaterial } from './world/props.js';

function addPip(enemy) {
  const pip = new THREE.Group();
  pip.position.y = 3.2;
  const marker = new THREE.Mesh(new THREE.OctahedronGeometry(.28, 0), new THREE.MeshBasicMaterial({ color: 0xff6153 }));
  pip.add(marker);
  const bar = new THREE.Mesh(new THREE.BoxGeometry(1.25, .1, .08), new THREE.MeshBasicMaterial({ color: 0x142326 }));
  bar.position.y = .44; pip.add(bar);
  const fill = new THREE.Mesh(new THREE.BoxGeometry(.95, .08, .1), new THREE.MeshBasicMaterial({ color: 0xffa66c }));
  fill.position.set(-.12, .44, .06); pip.add(fill);
  enemy.mesh.add(pip);
}

function addDockCover(scene, game, preset) {
  const concreteCanvas = document.createElement('canvas');
  concreteCanvas.width = 512; concreteCanvas.height = 512;
  const concreteContext = concreteCanvas.getContext('2d');
  concreteContext.fillStyle = '#918872'; concreteContext.fillRect(0, 0, 512, 512);
  concreteContext.strokeStyle = '#5f5b50'; concreteContext.lineWidth = 5;
  for (let x = 0; x <= 512; x += 128) { concreteContext.beginPath(); concreteContext.moveTo(x, 0); concreteContext.lineTo(x, 512); concreteContext.stroke(); }
  for (let y = 0; y <= 512; y += 128) { concreteContext.beginPath(); concreteContext.moveTo(0, y); concreteContext.lineTo(512, y); concreteContext.stroke(); }
  for (let i = 0; i < 36; i++) {
    const x = (i * 83 + 29) % 512, y = (i * 137 + 61) % 512;
    concreteContext.fillStyle = i % 2 ? 'rgba(37,49,47,.3)' : 'rgba(239,217,169,.23)';
    concreteContext.beginPath(); concreteContext.ellipse(x, y, 4 + i % 11, 3 + i % 7, .3, 0, Math.PI * 2); concreteContext.fill();
  }
  const concrete = new THREE.CanvasTexture(concreteCanvas);
  concrete.colorSpace = THREE.SRGBColorSpace;
  concrete.wrapS = THREE.RepeatWrapping; concrete.wrapT = THREE.RepeatWrapping;
  concrete.repeat.set(2, 3);
  const quay = new THREE.Mesh(new THREE.BoxGeometry(88, .42, 164), new THREE.MeshStandardMaterial({ map: concrete, roughness: .86, metalness: .04 }));
  quay.position.set(-365, .03, 144); quay.receiveShadow = true; scene.add(quay);
  const water = createOceanMaterial(preset);
  game.waterMaterials.push(water);
  const sea = new THREE.Mesh(new THREE.PlaneGeometry(92, 170, 35, 60), water);
  sea.rotation.x = -Math.PI / 2; sea.position.set(-453, .03, 80); scene.add(sea);
  const paint = [0x9c5145, 0x276d73, 0xc18a52, 0x4c5f6b, 0xd6a75b];
  const stacks = [[-390, 4, 128], [-390, 10, 128], [-340, 4, 128], [-340, 10, 128],
    [-399, 4, 98], [-331, 4, 98], [-390, 4, 72], [-340, 4, 72]];
  const labelCanvas = document.createElement('canvas');
  labelCanvas.width = 512; labelCanvas.height = 128;
  const labelContext = labelCanvas.getContext('2d');
  labelContext.fillStyle = '#182a30'; labelContext.fillRect(0, 0, 512, 128);
  labelContext.strokeStyle = '#edc57d'; labelContext.lineWidth = 8; labelContext.strokeRect(9, 9, 494, 110);
  labelContext.fillStyle = '#fff0d2'; labelContext.font = '900 43px sans-serif'; labelContext.textAlign = 'center'; labelContext.textBaseline = 'middle';
  labelContext.fillText('SOLANA LINES  ·  PIER NINE', 256, 64);
  const labelTexture = new THREE.CanvasTexture(labelCanvas);
  labelTexture.colorSpace = THREE.SRGBColorSpace;
  const labelMaterial = new THREE.MeshBasicMaterial({ map: labelTexture, toneMapped: false });
  for (let i = 0; i < stacks.length; i++) {
    const [x, y, z] = stacks[i];
    const container = new THREE.Group();
    const body = new THREE.Mesh(new THREE.BoxGeometry(10, 7.5, 22), new THREE.MeshStandardMaterial({ color: paint[i % paint.length], roughness: .78, metalness: .12 }));
    body.position.set(x, y, z); body.castShadow = true; body.receiveShadow = true; container.add(body);
    for (let rib = -4; rib <= 4; rib++) {
      const crease = new THREE.Mesh(new THREE.BoxGeometry(.16, 7.2, .18), new THREE.MeshStandardMaterial({ color: i % 2 ? 0x8db0a5 : 0xe2bc83, roughness: .8 }));
      crease.position.set(x + rib * 1.15, y, z + 11.08); container.add(crease);
    }
    for (const edge of [-1, 1]) {
      const post = new THREE.Mesh(new THREE.BoxGeometry(.32, 7.6, .32), new THREE.MeshStandardMaterial({ color: 0xd5c29d, metalness: .22 }));
      post.position.set(x + edge * 4.75, y, z + 11.16); container.add(post);
    }
    const label = new THREE.Mesh(new THREE.PlaneGeometry(7.5, 1.8), labelMaterial);
    label.position.set(x, y + 1.8, z + 11.18); container.add(label);
    scene.add(container);
  }
  const crane = new THREE.Group();
  const steel = new THREE.MeshStandardMaterial({ color: 0x516a68, metalness: .35, roughness: .58 });
  for (const x of [-408, -322]) {
    const leg = new THREE.Mesh(new THREE.BoxGeometry(1.8, 17, 1.8), steel); leg.position.set(x, 8.5, 112); crane.add(leg);
    const brace = new THREE.Mesh(new THREE.BoxGeometry(1.2, 15, 1.2), steel); brace.position.set(x < -360 ? -400 : -330, 7.5, 112); brace.rotation.z = x < -360 ? -.42 : .42; crane.add(brace);
  }
  const boom = new THREE.Mesh(new THREE.BoxGeometry(91, 1.7, 2), new THREE.MeshStandardMaterial({ color: 0xd2a158, metalness: .22 }));
  boom.position.set(-365, 14, 112); crane.add(boom);
  const trolley = new THREE.Mesh(new THREE.BoxGeometry(9, 2.2, 7), steel); trolley.position.set(-365, 12, 112); crane.add(trolley);
  const hook = new THREE.Mesh(new THREE.CylinderGeometry(.08, .08, 8, 6), steel); hook.position.set(-365, 7, 112); crane.add(hook);
  const workLamp = new THREE.MeshStandardMaterial({
    color: 0xffd49a, emissive: 0xffad57, emissiveIntensity: preset === 'night' ? 3.2 : .35, toneMapped: false,
  });
  for (const x of [-408, -365, -322]) {
    const bulb = new THREE.Mesh(new THREE.SphereGeometry(.48, 8, 6), workLamp);
    bulb.position.set(x, 15, 112); crane.add(bulb);
    const beam = new THREE.PointLight(0xffad62, preset === 'night' ? 650 : 0, 68, 2);
    beam.position.set(x, 14, 111); crane.add(beam);
  }
  scene.add(crane);
  const ship = new THREE.Group();
  const hullMaterial = new THREE.MeshStandardMaterial({ color: 0x3f6870, roughness: .55, metalness: .2 });
  const hull = new THREE.Mesh(new THREE.BoxGeometry(43, 10, 88), hullMaterial);
  hull.position.y = 2.2; ship.add(hull);
  const stripe = new THREE.Mesh(new THREE.BoxGeometry(43.2, .7, 86), new THREE.MeshStandardMaterial({ color: 0xe7d2ab, roughness: .7 }));
  stripe.position.set(0, 2.5, 0); ship.add(stripe);
  const bow = new THREE.Mesh(new THREE.ConeGeometry(21, 30, 4), hull.material); bow.rotation.x = Math.PI / 2; bow.position.set(0, 2.2, -53); ship.add(bow);
  const deck = new THREE.Mesh(new THREE.BoxGeometry(30, 2, 60), new THREE.MeshStandardMaterial({ color: 0x9b6650, roughness: .82 }));
  deck.position.set(0, 7.5, 2); ship.add(deck);
  const bridge = new THREE.Mesh(new THREE.BoxGeometry(13, 14, 17), new THREE.MeshStandardMaterial({ color: 0xe7d2ab, roughness: .74 }));
  bridge.position.set(0, 15, 30); ship.add(bridge);
  for (let level = 0; level < 2; level++) for (let row = 0; row < 3; row++) {
    const cargo = new THREE.Mesh(new THREE.BoxGeometry(8, 4.5, 11), new THREE.MeshStandardMaterial({ color: paint[(row + level + 1) % paint.length], roughness: .8 }));
    cargo.position.set((row - 1) * 9, 11 + level * 4.8, -12 + row * 14); ship.add(cargo);
  }
  ship.position.set(-426, 0, 56); ship.scale.setScalar(1.2); scene.add(ship);
}

function makeStoreSign(text, color) {
  const canvas = document.createElement('canvas'); canvas.width = 512; canvas.height = 128;
  const context = canvas.getContext('2d');
  context.fillStyle = '#10282a'; context.fillRect(0, 0, 512, 128);
  context.strokeStyle = color; context.lineWidth = 8; context.strokeRect(6, 6, 500, 116);
  context.shadowColor = color; context.shadowBlur = 22;
  context.fillStyle = '#fff0d2'; context.font = '900 49px sans-serif'; context.textAlign = 'center'; context.textBaseline = 'middle';
  context.fillText(text, 256, 64);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

function addMarinaShopfronts(scene) {
  const shops = [
    { x: -300, z: -30, name: 'MARISOL CAFE', color: '#ff9868', face: 1 },
    { x: -252, z: -48, name: 'KEYS PAWN', color: '#f3ce72', face: -1 },
    { x: -300, z: -76, name: 'NEON TIDE CLUB', color: '#78d7cf', face: 1 },
  ];
  for (const shop of shops) {
    const side = shop.face;
    const shell = new THREE.Mesh(new THREE.BoxGeometry(14, 13, 21), new THREE.MeshStandardMaterial({ color: 0xe4c49b, roughness: .88 }));
    shell.position.set(shop.x, 6.5, shop.z); shell.castShadow = true; scene.add(shell);
    const storefront = new THREE.Mesh(new THREE.BoxGeometry(.24, 6.2, 17), new THREE.MeshStandardMaterial({ color: 0x164249, metalness: .12, roughness: .32 }));
    storefront.position.set(shop.x + side * 7.15, 3.2, shop.z); scene.add(storefront);
    for (const zOffset of [-6.4, 0, 6.4]) {
      const mullion = new THREE.Mesh(new THREE.BoxGeometry(.28, 6.3, .24), new THREE.MeshStandardMaterial({ color: 0xf0d4ad, metalness: .25 }));
      mullion.position.set(shop.x + side * 7.3, 3.2, shop.z + zOffset); scene.add(mullion);
    }
    const sign = new THREE.Mesh(new THREE.PlaneGeometry(12.4, 3.1), new THREE.MeshBasicMaterial({ map: makeStoreSign(shop.name, shop.color), toneMapped: false, side: THREE.DoubleSide }));
    sign.position.set(shop.x + side * 7.4, 8.5, shop.z); sign.rotation.y = side > 0 ? Math.PI / 2 : -Math.PI / 2; scene.add(sign);
    const awning = new THREE.Mesh(new THREE.BoxGeometry(3.2, .45, 19), new THREE.MeshStandardMaterial({ color: shop.face > 0 ? 0xc8745c : 0x4d928a, roughness: .75 }));
    awning.position.set(shop.x + side * 8.4, 5.65, shop.z); scene.add(awning);
    for (let stripe = -8; stripe <= 8; stripe += 2) {
      const valance = new THREE.Mesh(new THREE.BoxGeometry(.12, .48, .72), new THREE.MeshStandardMaterial({ color: stripe % 4 ? 0xf3d7ab : 0xe88767 }));
      valance.position.set(shop.x + side * 9.9, 5.35, shop.z + stripe); scene.add(valance);
    }
    const neon = new THREE.PointLight(new THREE.Color(shop.color), 8, 23, 2);
    neon.position.set(shop.x + side * 8.5, 8.1, shop.z); scene.add(neon);
  }
}

function addSignatureDriver(car) {
  const driver = new THREE.Group();
  const shirt = new THREE.MeshStandardMaterial({ color: 0x2d5651, roughness: .82 });
  const skin = new THREE.MeshStandardMaterial({ color: 0x9e6548, roughness: .8 });
  const hair = new THREE.MeshStandardMaterial({ color: 0x25231e, roughness: .9 });
  const torso = new THREE.Mesh(new THREE.BoxGeometry(.54, .7, .4), shirt);
  torso.position.set(1.02, 1.48, .12); driver.add(torso);
  const head = new THREE.Mesh(new THREE.SphereGeometry(.25, 10, 8), skin);
  head.position.set(1.12, 2.3, -.02); driver.add(head);
  const cap = new THREE.Mesh(new THREE.SphereGeometry(.26, 10, 7, 0, Math.PI * 2, 0, Math.PI * .45), hair);
  cap.position.set(1.12, 2.4, -.02); driver.add(cap);
  driver.traverse(object => { if (object.isMesh) object.castShadow = true; });
  car.mesh.add(driver);
}

export function stageShot(name, game, preset = 'golden') {
  name = ({ marina: 'onfoot', docks: 'mission' })[name] ?? name;
  const activePreset = game.city.sky.setPreset(preset);
  game.waterMaterials.forEach(material => {
    material.userData.setPreset(activePreset);
    material.uniforms.uEnvironment.value = game.scene.userData.reflectionTexture;
  });
  const { player } = game;
  const position = (x, z, yaw = 0) => {
    if (player.vehicle) { player.vehicle = null; player.onFoot = true; player.mesh.visible = true; }
    player.mesh.position.set(x, 0, z); player.yaw = yaw;
  };
  game.state.mission = name === 'chase' ? 3 : name === 'mission' ? 4 : name === 'onfoot' ? 1 : 0;
  game.state.encounterText = '';
  game.state.shotTimer = '';
  game.mission.begin();
  if (name === 'signature') {
    const car = game.vehicles.find(vehicle => !vehicle.ai && vehicle.kind === 'coupe');
    game.enterVehicle(car, true);
    car.mesh.position.set(-276, 0, 7); car.yaw = 0; car.mesh.rotation.y = 0; car.speed = 13;
    car.mesh.children[0].material.color.setHex(0xb83f55);
    car.mesh.children[2].visible = false;
    addSignatureDriver(car);
    addMarinaShopfronts(game.scene);
    game.titleCar.mesh.visible = false;
    game.foregroundPalm.position.set(-292, 0, 12);
    game.foregroundPalm.visible = true;
    game.city.sky.glow.position.set(-276, 18, -270);
    game.people.filter(person => !person.gang && !person.police).slice(0, 8).forEach((person, index) => {
      person.mesh.visible = true;
      person.mesh.position.set(-294 + (index % 2) * 36, 0, -40 - Math.floor(index / 2) * 22);
    });
    game.traffic.slice(0, 3).forEach((vehicle, index) => {
      vehicle.mesh.position.set([-276, -282, -270][index], 0, [-62, -112, -174][index]);
      vehicle.ai = true; vehicle.routeAxis = 'z'; vehicle.routeSign = -1;
      vehicle.yaw = 0; vehicle.cruise = 11 + index % 3; vehicle.speed = -vehicle.cruise;
    });
    game.camera.state.distance = 13; game.camera.state.yaw = .34;
    game.hud.clearDialogue(); game.hud.clearFeed();
    game.state.cash = 3260; game.state.respect = 2;
  } else if (name === 'chase') {
    position(-540, 276, -Math.PI / 2);
    const car = game.vehicles.find(vehicle => !vehicle.ai && vehicle.kind === 'coupe');
    game.enterVehicle(car, true);
    car.mesh.position.set(-540, 0, 276); car.yaw = -Math.PI / 2; car.mesh.rotation.y = car.yaw; car.speed = 31;
    const paint = car.mesh.children[0].material;
    car.mesh.children.forEach(part => { if (part.material === paint) part.material.color.setHex(0xb83c43); });
    game.combat.equip(1);
    game.people.forEach(person => { person.mesh.visible = false; });
    game.hud.clearDialogue();
    game.hud.clearFeed();
    for (const [x, z] of [[-552, 269.5], [-552, 282.5], [-570, 276]]) {
      const cruiser = createVehicle(game.police.scene, { kind: 'cruiser', color: 0xe9e5d7, police: true, x, z, yaw: -Math.PI / 2 });
      cruiser.speed = 25; cruiser.shotScale = .45; game.police.cruisers.push(cruiser);
    }
    game.police.cruisers[2].mesh.visible = false;
    game.police.suppressRoadblock = true;
    game.police.freezeCruisers = true;
    game.police.showHelicopter = true;
    game.police.officers.forEach(officer => { officer.mesh.visible = false; });
    game.traffic.slice(0, 6).forEach((vehicle, index) => {
      vehicle.mesh.position.set(-510 + index * 19, 0, 269 + (index % 2) * 13);
      vehicle.ai = true; vehicle.routeAxis = 'x'; vehicle.routeSign = index % 2 ? -1 : 1; vehicle.yaw = vehicle.routeSign > 0 ? -Math.PI / 2 : Math.PI / 2;
    });
    game.wanted.clear(); game.wanted.addCrime(80, 'the causeway run');
    game.state.cash = 8740;     game.state.respect = 4;
    game.state.shotTimer = 'PURSUIT · 00:47';
    game.camera.state.distance = 36; game.camera.state.yaw = 0;
    player.zoom = 90;
  } else if (name === 'onfoot') {
    position(-276, -4, -.35); game.combat.equip(1); player.pistol.visible = true;
    game.camera.state.distance = 13; game.camera.state.yaw = 1.35;
    game.people.filter(person => !person.gang && !person.police).slice(0, 14).forEach((person, index) => {
      person.mesh.visible = true;
      person.mesh.position.set(index % 2 ? -290 : -262, 0, -85 + Math.floor(index / 2) * 13);
    });
    addMarinaShopfronts(game.scene);
    game.traffic.slice(0, 7).forEach((vehicle, index) => {
      vehicle.mesh.position.set(-276 + (index % 2 ? 4.7 : -4.7), 0, -23 - Math.floor(index / 2) * 19);
      vehicle.routeAxis = 'z'; vehicle.routeSign = -1; vehicle.yaw = 0; vehicle.ai = false; vehicle.speed = 0;
    });
    const beacon = new THREE.Group();
    const beam = new THREE.Mesh(new THREE.CylinderGeometry(.18, 1.15, 16, 12, 1, true), new THREE.MeshBasicMaterial({ color: 0xffb93e, transparent: true, opacity: .58, side: THREE.DoubleSide, depthWrite: false, toneMapped: false }));
    beam.position.y = 8; beacon.add(beam);
    const glow = new THREE.PointLight(0xffc968, 20, 32); glow.position.y = 3.8; beacon.add(glow);
    const ring = new THREE.Mesh(new THREE.TorusGeometry(3, .19, 8, 24), new THREE.MeshBasicMaterial({ color: 0xffd17c }));
    ring.rotation.x = Math.PI / 2; ring.position.y = .3; beacon.add(ring);
    const crown = new THREE.Mesh(new THREE.SphereGeometry(.65, 10, 8), new THREE.MeshBasicMaterial({ color: 0xffe6aa }));
    crown.position.y = 20; beacon.add(crown);
    beacon.position.set(-335, 0, -18); game.scene.add(beacon);
    const inletWater = createOceanMaterial(activePreset);
    game.waterMaterials.push(inletWater);
    const inlet = new THREE.Mesh(new THREE.PlaneGeometry(125, 150, 45, 54), inletWater);
    inlet.rotation.x = -Math.PI / 2; inlet.position.set(-466, -.1, -110); game.scene.add(inlet);
    const signCanvas = document.createElement('canvas');
    signCanvas.width = 512; signCanvas.height = 112;
    const signContext = signCanvas.getContext('2d');
    signContext.fillStyle = '#132a2b'; signContext.fillRect(0, 0, 512, 112);
    signContext.strokeStyle = '#f5bd68'; signContext.lineWidth = 8; signContext.strokeRect(5, 5, 502, 102);
    signContext.shadowColor = '#ff9272'; signContext.shadowBlur = 22;
    signContext.fillStyle = '#ffe0a2'; signContext.font = '900 57px sans-serif'; signContext.textAlign = 'center'; signContext.textBaseline = 'middle';
    signContext.fillText('MARÉ MARKET', 256, 57);
    const signTexture = new THREE.CanvasTexture(signCanvas);
    signTexture.colorSpace = THREE.SRGBColorSpace;
    const sign = new THREE.Mesh(new THREE.PlaneGeometry(16, 3.8), new THREE.MeshBasicMaterial({ map: signTexture, toneMapped: false }));
    sign.position.set(-296, 9, -54); sign.rotation.y = Math.PI / 2; game.scene.add(sign);
    game.hud.say('LU VARGA  ·  “Marina Row looks pretty from the water. Keep your eyes on the people.”', 40);
    game.state.cash = 3260; game.state.respect = 2;
  } else if (name === 'mission') {
    position(-365, 157, 0); player.mesh.rotation.y = player.yaw;
    game.city.buildings.visible = false;
    game.combat.unlock(2); game.combat.equip(2); player.pistol.visible = true;
    game.camera.state.distance = 12; game.camera.state.yaw = .65;
    addDockCover(game.scene, game, activePreset);
    game.hud.say('LU VARGA  ·  “Pier Nine. Dex’s boys have the ledger. Leave the dockhands out of it.”', 40);
    game.hud.clearFeed();
    game.state.cash = 6120; game.state.respect = 5;
    game.gang.forEach((enemy, index) => {
      const live = index < 4;
      enemy.health = live ? 60 : 0;
      const positions = [[-374, 121], [-366, 117], [-370, 88], [-362, 84]];
      const [x, z] = live ? positions[index] : index === 4 ? [-350, 91] : [-425 - index * 3, 190 + index * 5];
      enemy.mesh.position.set(x, live ? 0 : .12, z);
      enemy.mesh.visible = live || index === 4;
      if (!live) enemy.mesh.rotation.x = -1.15;
      else { enemy.mesh.rotation.x = 0; addPip(enemy); }
    });
    game.state.encounterText = 'ENEMIES LEFT: 4 / 9';
    document.getElementById('reticle')?.classList.add('hit-confirm');
    const muzzle = new THREE.Vector3(-362, 2, 151);
    game.particles.tracer(muzzle, new THREE.Vector3(-368, 1.4, 115), 0xfff0a2);
    game.particles.muzzleFlash(muzzle, new THREE.Vector3(-.2, .02, -1));
    game.gang.filter(enemy => enemy.health > 0).slice(0, 3).forEach((enemy, index) => {
      const shotFrom = enemy.mesh.position.clone().add(new THREE.Vector3(0, 2.3, 0));
      game.particles.muzzleFlash(shotFrom, new THREE.Vector3(.05, -.02, 1));
      game.particles.tracer(shotFrom, player.mesh.position.clone().add(new THREE.Vector3(0, 1.6, 0)), 0xff624c);
      const flash = new THREE.Mesh(new THREE.SphereGeometry(.55, 8, 6), new THREE.MeshBasicMaterial({ color: 0xffc15e, toneMapped: false }));
      flash.position.copy(shotFrom).add(new THREE.Vector3(0, 0, 1.2)); game.scene.add(flash);
      const spark = new THREE.Mesh(new THREE.OctahedronGeometry(.48, 0), new THREE.MeshBasicMaterial({ color: 0xffe39a, toneMapped: false }));
      spark.position.set(-367 + index, .8, 143 - index * 7); game.scene.add(spark);
      enemy.limbs[3].rotation.x = -.8;
      enemy.limbs[3].rotation.z = -.24;
    });
    const tracer = new THREE.Mesh(new THREE.CylinderGeometry(.055, .055, 25, 6), new THREE.MeshBasicMaterial({ color: 0xff654b, toneMapped: false }));
    tracer.position.set(-377, 2.2, 136); tracer.rotation.x = Math.PI / 2; game.scene.add(tracer);
    for (const z of [146, 126, 106, 86]) {
      const dockMarking = new THREE.Mesh(new THREE.PlaneGeometry(.45, 5), new THREE.MeshBasicMaterial({ color: 0xe8c878 }));
      dockMarking.rotation.x = -Math.PI / 2; dockMarking.position.set(-365, .27, z); game.scene.add(dockMarking);
    }
    game.particles.burst(new THREE.Vector3(-368, 1, 115), 0xffaa61, 13);
    game.particles.burst(muzzle, 0xffaa61, 7);
  } else {
    position(0, 8, 0);
    if (game.titleCar) {
      game.titleCar.mesh.position.set(-276, 0, -16);
      game.titleCar.mesh.visible = true;
      game.foregroundPalm.position.set(-292, 0, 12);
    }
    game.hud.clearDialogue();
    game.menus.showTitle();
  }
  game.refreshMission();
  if (name !== 'title' && name !== 'settings') { game.camera.state.distance = name === 'chase' ? 36 : name === 'onfoot' ? 13 : name === 'mission' ? 12 : name === 'signature' ? 13 : 9; }
  if (name === 'title' || name === 'settings') {
    game.camera.state.distance = 27;
    game.camera.state.yaw = -.18;
  }
  const target = player.vehicle?.mesh.position ?? player.mesh.position;
  if (name === 'title' || name === 'settings') {
    game.camera.camera?.position.set(-263, 4.1, 21);
    game.camera.camera?.lookAt(-276, 1.35, -94);
    game.city.sky.glow.position.set(-276, 18, -270);
  } else if (name === 'signature') {
    game.camera.camera?.position.set(-282, 3.9, 25);
    game.camera.camera?.lookAt(-276, 1.15, -100);
  } else {
    game.camera.update(target.clone().add(new THREE.Vector3(0, player.vehicle ? 2 : 2.2, 0)), player.vehicle?.yaw ?? player.yaw, 1, Boolean(player.vehicle), true);
  }
  game.screen = name === 'title' || name === 'settings' ? 'title' : 'play';
  game.menus.hideAll();
  if (name === 'title') game.menus.showTitle();
  if (name === 'settings') game.menus.showSettings();
  if (name === 'chase') game.hud.notify('PCPD CHANNEL 4 · ALL UNITS, CAUSEWAY');
  game.hud.dismissToast();
}
