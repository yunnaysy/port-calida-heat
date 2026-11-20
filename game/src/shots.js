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
  concreteCanvas.width = concreteCanvas.height = 512;
  const concreteContext = concreteCanvas.getContext('2d');
  concreteContext.fillStyle = '#777c78'; concreteContext.fillRect(0, 0, 512, 512);
  let seed = 41;
  for (let i = 0; i < 10500; i++) {
    seed = seed * 16807 % 2147483647;
    const x = seed / 2147483647 * 512;
    seed = seed * 16807 % 2147483647;
    const y = seed / 2147483647 * 512;
    const shade = 88 + seed % 62;
    concreteContext.fillStyle = `rgba(${shade},${shade},${shade - 2},.16)`;
    concreteContext.fillRect(x, y, 1 + seed % 3, 1 + seed % 2);
  }
  for (let i = 0; i < 10; i++) {
    const x = 35 + (i * 91) % 440, y = 48 + (i * 137) % 420;
    concreteContext.strokeStyle = 'rgba(30,38,38,.22)'; concreteContext.lineWidth = 2;
    concreteContext.beginPath(); concreteContext.moveTo(x - 22, y); concreteContext.lineTo(x + 24, y); concreteContext.stroke();
    const stain = concreteContext.createRadialGradient(x, y, 2, x, y, 35 + i % 4 * 8);
    stain.addColorStop(0, i % 2 ? 'rgba(18,30,34,.34)' : 'rgba(158,116,76,.24)');
    stain.addColorStop(1, 'rgba(27,34,36,0)');
    concreteContext.fillStyle = stain; concreteContext.fillRect(x - 80, y - 70, 160, 140);
  }
  const concrete = new THREE.CanvasTexture(concreteCanvas);
  concrete.colorSpace = THREE.SRGBColorSpace;
  concrete.wrapS = concrete.wrapT = THREE.RepeatWrapping;
  concrete.repeat.set(2, 3);
  const concreteMaterial = new THREE.MeshStandardMaterial({ map: concrete, color: 0xe7dfca, roughness: .84, metalness: .025 });
  const quay = new THREE.Mesh(new THREE.BoxGeometry(100, .65, 172), concreteMaterial);
  quay.position.set(-365, -.03, 151); quay.receiveShadow = true; scene.add(quay);
  const water = createOceanMaterial(preset, scene.userData.reflectionTexture);
  water.uniforms.uShallow.value.setHex(preset === 'night' ? 0x063655 : 0x075065);
  water.uniforms.uDeep.value.setHex(0x041c31);
  water.uniforms.uGlint.value.setHex(preset === 'day' ? 0x54aeb4 : 0xffa866);
  game.waterMaterials.push(water);
  const sea = new THREE.Mesh(new THREE.PlaneGeometry(86, 190, 48, 92), water);
  sea.rotation.x = -Math.PI / 2; sea.position.set(-458, -.1, 151); scene.add(sea);
  if (preset === 'night') {
    const sodium = new THREE.PointLight(0xffb060, 520, 58, 2);
    const cyan = new THREE.PointLight(0x38c7d9, 190, 42, 2);
    const magenta = new THREE.PointLight(0xf044a5, 190, 42, 2);
    for (const [x, y, z] of [[-402, 10, 112], [-370, 10, 151], [-338, 10, 190], [-370, 10, 105]]) {
      const lamp = sodium.clone();
      lamp.position.set(x, y, z); scene.add(lamp);
    }
    cyan.position.set(-392, 13, 135); scene.add(cyan);
    magenta.position.set(-337, 10, 126); scene.add(magenta);
    for (const [color, position] of [
      [0xffb060, [-402, 14, 112]], [0xffb060, [-370, 14, 151]], [0xffb060, [-338, 14, 190]],
      [0x38c7d9, [-392, 13, 135]], [0xf044a5, [-337, 10, 126]],
    ]) {
      const fixture = new THREE.Mesh(
        new THREE.BoxGeometry(4.5, .28, .32),
        new THREE.MeshBasicMaterial({ color, toneMapped: false }),
      );
      fixture.position.set(...position); scene.add(fixture);
    }
  }
  const bollardMaterial = new THREE.MeshStandardMaterial({ color: 0x3c4747, metalness: .58, roughness: .48 });
  const bollards = new THREE.InstancedMesh(new THREE.CylinderGeometry(.42, .5, 1.5, 10), bollardMaterial, 9);
  const matrix = new THREE.Matrix4();
  for (let i = 0; i < 9; i++) {
    matrix.makeTranslation(-412, .78, 78 + i * 18);
    bollards.setMatrixAt(i, matrix);
  }
  bollards.instanceMatrix.needsUpdate = true; bollards.castShadow = true; scene.add(bollards);

  const ribCanvas = document.createElement('canvas');
  ribCanvas.width = 256; ribCanvas.height = 512;
  const ribContext = ribCanvas.getContext('2d');
  const ribGradient = ribContext.createLinearGradient(0, 0, ribCanvas.width, 0);
  ribGradient.addColorStop(0, '#777b76'); ribGradient.addColorStop(.14, '#d4cdb8');
  ribGradient.addColorStop(.36, '#8e938d'); ribGradient.addColorStop(.65, '#ddd4bd');
  ribGradient.addColorStop(1, '#747873');
  ribContext.fillStyle = ribGradient; ribContext.fillRect(0, 0, ribCanvas.width, ribCanvas.height);
  for (let x = 0; x < 256; x += 12) {
    ribContext.fillStyle = x % 24 ? 'rgba(7,13,16,.68)' : 'rgba(236,211,162,.5)';
    ribContext.fillRect(x, 0, 5, 512);
  }
  for (let y = 35; y < 512; y += 107) {
    ribContext.fillStyle = 'rgba(24,31,34,.38)'; ribContext.fillRect(0, y, 256, 2);
  }
  ribContext.fillStyle = '#17272c'; ribContext.fillRect(17, 410, 115, 48);
  ribContext.strokeStyle = '#d7bd84'; ribContext.lineWidth = 3; ribContext.strokeRect(17, 410, 115, 48);
  ribContext.fillStyle = '#f1dfbd'; ribContext.font = 'bold 16px sans-serif'; ribContext.fillText('SOLANA LINES', 25, 431);
  ribContext.font = '12px sans-serif'; ribContext.fillText('PIER NINE', 25, 448);
  const ribTexture = new THREE.CanvasTexture(ribCanvas);
  ribTexture.colorSpace = THREE.SRGBColorSpace;
  const containerColors = [0x8b423d, 0x1d626b, 0xa27839, 0x445667, 0x7d5140, 0x52654d];
  const containers = [
    [-395, 4, 111, 18, 8, 24, 0], [-395, 12, 111, 18, 8, 24, 1],
    [-405, 4, 124, 18, 8, 23, 2], [-405, 12, 124, 18, 8, 23, 3],
    [-400, 4, 100, 18, 8, 22, 4], [-400, 4, 136, 18, 8, 22, 5],
  ];
  containers.forEach(([x, y, z, width, height, length, colorIndex]) => {
    const material = new THREE.MeshStandardMaterial({ map: ribTexture, color: containerColors[colorIndex], roughness: .58, metalness: .24 });
    const container = new THREE.Mesh(new THREE.BoxGeometry(width, height, length), material);
    container.position.set(x, y, z); container.castShadow = true; container.receiveShadow = true; scene.add(container);
    for (const side of [-1, 1]) {
      const corner = new THREE.Mesh(new THREE.BoxGeometry(.34, height + .16, .34), bollardMaterial);
      corner.position.set(x + side * (width / 2 - .25), y, z - length / 2 + .25); scene.add(corner);
    }
  });

  const craneMetal = new THREE.MeshStandardMaterial({ color: 0x49635f, metalness: .42, roughness: .52 });
  const craneGold = new THREE.MeshStandardMaterial({ color: 0xc59650, metalness: .28, roughness: .54 });
  for (const x of [-408, -372]) {
    const gantry = new THREE.Group();
    for (const z of [105, 198]) {
      const leg = new THREE.Mesh(new THREE.BoxGeometry(2.2, 14, 2.4), craneMetal);
      leg.position.set(x, 7, z); gantry.add(leg);
      const brace = new THREE.Mesh(new THREE.BoxGeometry(1, 11, 1), craneGold);
      brace.position.set(x, 6, z < 150 ? 115 : 188); brace.rotation.x = z < 150 ? -.42 : .42; gantry.add(brace);
      const foot = new THREE.Mesh(new THREE.BoxGeometry(8, .75, 4), craneMetal);
      foot.position.set(x, .38, z); gantry.add(foot);
    }
    const boom = new THREE.Mesh(new THREE.BoxGeometry(3, 1.5, 78), craneGold);
    boom.position.set(x, 14.4, 151); gantry.add(boom);
    const rearBoom = new THREE.Mesh(new THREE.BoxGeometry(2, 1, 24), craneMetal);
    rearBoom.position.set(x + 2.4, 13.7, 151); gantry.add(rearBoom);
    const cable = new THREE.Mesh(new THREE.CylinderGeometry(.06, .06, 9, 6), craneMetal);
    cable.position.set(x, 9.5, 151); gantry.add(cable);
    const trolley = new THREE.Mesh(new THREE.BoxGeometry(4, 2.4, 4), craneMetal);
    trolley.position.set(x, 10, 151); gantry.add(trolley);
    for (let i = -3; i <= 3; i++) {
      const brace = new THREE.Mesh(new THREE.BoxGeometry(1, 4.4, 1), craneGold);
      brace.position.set(x, 12.5, 151 + i * 9); brace.rotation.x = i % 2 ? .55 : -.55; gantry.add(brace);
    }
    scene.add(gantry);
  }
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
    const neon = new THREE.PointLight(new THREE.Color(shop.color), 36, 32, 2);
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
    car.mesh.traverse(object => {
      if (object.isMesh && object.material?.userData.carPaint) object.material.color.setHex(0xc52c35);
    });
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
    car.mesh.traverse(object => {
      if (object.isMesh && object.material?.userData.carPaint) object.material.color.setHex(0xb83c43);
    });
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
    const inletWater = createOceanMaterial(activePreset);
    inletWater.userData.setPreset(activePreset);
    inletWater.uniforms.uEnvironment.value = game.scene.userData.reflectionTexture;
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
    position(-365, 158, 0); player.mesh.rotation.y = player.yaw;
    game.city.buildings.visible = false;
    game.city.props.visible = false;
    game.city.ground.visible = false;
    game.city.roadNetwork.visible = false;
    game.markers.forEach(marker => { marker.visible = false; });
    game.combat.unlock(2); game.combat.equip(2); player.pistol.visible = true;
    game.camera.camera.fov = 64;
    game.camera.camera.updateProjectionMatrix();
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
  } else if (name === 'mission') {
    game.camera.camera?.position.set(-345, 8, 157);
    game.camera.camera?.lookAt(-385, 1.3, 157);
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
