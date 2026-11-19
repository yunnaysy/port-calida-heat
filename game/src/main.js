import * as THREE from 'three';
import { createRng } from './rng.js';
import { generateCity } from './world/cityGen.js';
import { createPlayer, animatePlayer } from './entities/player.js';
import { createVehicle, tickVehicle } from './entities/vehicle.js';
import { createPedestrian, tickPedestrian } from './entities/pedestrian.js';
import { createInput } from './input.js';
import { createFollowCamera } from './camera/followCamera.js';
import { createHud } from './ui/hud.js';
import { createMinimap } from './ui/minimap.js';
import { createMenus } from './ui/menus.js';
import { createWanted } from './systems/wanted.js';
import { populateTraffic, tickTraffic } from './systems/traffic.js';
import { createPolice, tickPolice } from './systems/police.js';
import { createCombat } from './systems/combat.js';
import { createParticles } from './systems/particles.js';
import { createAudio } from './systems/audio.js';
import { createMissionSystem } from './systems/missions.js';
import { createEconomy } from './systems/economy.js';
import { createActivities } from './systems/activities.js';
import { createGarage } from './systems/garage.js';
import { readSave, writeSave } from './systems/saveGame.js';
import { stageShot } from './shots.js';
import { EffectComposer } from './rendering/postprocessing.js';

const canvas = document.getElementById('world');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.65));
renderer.setSize(window.innerWidth, window.innerHeight);
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(54, window.innerWidth / window.innerHeight, .1, 2600);
let frameLimit = 0;
const params = new URLSearchParams(location.search);
const requestedShot = params.get('shot');
const shot = ({ marina: 'onfoot', docks: 'mission' })[requestedShot] ?? requestedShot;
const seed = Number(params.get('seed')) || 1;
const random = createRng(seed);
const initialPreset = params.get('preset') ?? 'golden';
document.body.dataset.shot = shot ?? '';
const city = generateCity(scene, renderer, random, initialPreset);
const composer = new EffectComposer(renderer, scene, camera, city.sky.glow);
const player = createPlayer(scene);
player.mesh.position.set(0, 0, 8);
const state = { player, cash: 2450, respect: 0, mission: 0, weapons: [true, true, false, false], garage: null };
const input = createInput();
const hud = createHud();
const minimap = createMinimap(document.getElementById('minimap'), document.getElementById('pause-map'), document.getElementById('title-map'));
const follow = createFollowCamera(camera, canvas);
const audio = createAudio();
const particles = createParticles(scene, random);
const wanted = createWanted();
const traffic = populateTraffic(scene, random);
const police = createPolice(scene, random);
const vehicles = [...traffic];
const parked = [
  createVehicle(scene, { kind: 'coupe', color: 0xd5d3c7, x: -9, z: 6, yaw: .02 }),
  createVehicle(scene, { kind: 'compact', color: 0x78a396, x: 27, z: -28, yaw: 0 }),
  createVehicle(scene, { kind: 'taxi', color: 0xebcc67, x: 32, z: 35, yaw: Math.PI / 2 }),
  createVehicle(scene, { kind: 'suv', color: 0x537078, x: -64, z: 39, yaw: Math.PI }),
  createVehicle(scene, { kind: 'muscle', color: 0xa95a49, x: 69, z: -67, yaw: 0 }),
];
parked.forEach(car => { car.ai = false; car.speed = 0; });
parked[0].missionCar = true;
const titleCar = createVehicle(scene, { kind: 'coupe', color: 0xc52c46, x: -276, z: -16, yaw: 0 });
titleCar.ai = false;
const titleDriver = new THREE.Group();
const driverShirt = new THREE.Mesh(new THREE.BoxGeometry(.52, .68, .38), new THREE.MeshStandardMaterial({ color: 0x28524e, roughness: .8 }));
driverShirt.position.set(1.02, 1.48, .12); titleDriver.add(driverShirt);
const driverHead = new THREE.Mesh(new THREE.SphereGeometry(.24, 10, 8), new THREE.MeshStandardMaterial({ color: 0x986346, roughness: .86 }));
driverHead.position.set(1.12, 2.3, -.02); titleDriver.add(driverHead);
const driverHair = new THREE.Mesh(new THREE.SphereGeometry(.25, 10, 7, 0, Math.PI * 2, 0, Math.PI * .45), new THREE.MeshStandardMaterial({ color: 0x22221e, roughness: .9 }));
driverHair.position.set(1.12, 2.4, -.02); titleDriver.add(driverHair);
titleCar.mesh.add(titleDriver);
const foregroundPalm = new THREE.Group();
const palmTrunk = new THREE.Mesh(new THREE.CylinderGeometry(.34, .58, 12, 8), new THREE.MeshStandardMaterial({ color: 0x725440, roughness: .95 }));
palmTrunk.position.y = 6; palmTrunk.rotation.z = -.12; foregroundPalm.add(palmTrunk);
const palmFronds = new THREE.Mesh(new THREE.SphereGeometry(4.5, 9, 3), new THREE.MeshStandardMaterial({ color: 0x204e38, roughness: .84, side: THREE.DoubleSide }));
palmFronds.scale.set(1.6, .18, 1); palmFronds.position.y = 12.1; foregroundPalm.add(palmFronds);
foregroundPalm.position.set(-292, 0, 12); scene.add(foregroundPalm);
const dustCanvas = document.createElement('canvas');
dustCanvas.width = dustCanvas.height = 32;
const dustContext = dustCanvas.getContext('2d');
const dustGradient = dustContext.createRadialGradient(16, 16, 1, 16, 16, 16);
dustGradient.addColorStop(0, 'rgba(255,215,155,.75)'); dustGradient.addColorStop(1, 'rgba(255,181,119,0)');
dustContext.fillStyle = dustGradient; dustContext.fillRect(0, 0, 32, 32);
const dustTexture = new THREE.CanvasTexture(dustCanvas);
const menuDust = [];
for (let i = 0; i < 20; i++) {
  const mote = new THREE.Sprite(new THREE.SpriteMaterial({
    map: dustTexture, color: i % 3 ? 0xffcb89 : 0x9bd5dc, transparent: true,
    opacity: .14 + random() * .2, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false,
  }));
  mote.position.set(-286 + random() * 22, 1.4 + random() * 7, -145 + random() * 170);
  const scale = .35 + random() * .9; mote.scale.set(scale, scale, 1); scene.add(mote);
  menuDust.push({ mote, baseY: mote.position.y, phase: random() * Math.PI * 2 });
}
vehicles.push(...parked);
const garage = createGarage(scene, vehicles, parked, state);
const waterMaterials = [city.props.userData.waterMaterial];
const people = [];
for (let i = 0; i < 29; i++) {
  const axis = i % 2, lane = Math.floor(random() * 7 - 3) * 92;
  const offset = (random() > .5 ? 1 : -1) * (12 + random() * 3);
  const x = axis ? lane + offset : (random() * 2 - 1) * 380;
  const z = axis ? (random() * 2 - 1) * 380 : lane + offset;
  people.push(createPedestrian(scene, random, x, z));
}
for (const [centerX, centerZ] of [[-92, -4], [0, -4]]) {
  for (let i = 0; i < 10; i++) {
    const side = i % 2 ? -1 : 1;
    people.push(createPedestrian(scene, random, centerX + side * (11 + random() * 3), centerZ - 8 - random() * 66));
  }
}
const gang = [];
for (let i = 0; i < 9; i++) {
  const person = createPedestrian(scene, random, -348 + random() * 28, 132 + random() * 42);
  person.mesh.children[0].material.color.setHex(i % 2 ? 0x8c5141 : 0x583f4a);
  person.gang = true; person.health = 60; gang.push(person); people.push(person);
}
const courier = createPedestrian(scene, random, 243, 145);
courier.mesh.children[0].material.color.setHex(0x9a5945); courier.health = 85; courier.gang = true;
people.push(courier);

function makeMarker(x, z, color = 0xf1bd67, radius = 3.8) {
  const group = new THREE.Group();
  const ring = new THREE.Mesh(new THREE.TorusGeometry(radius, .16, 8, 28), new THREE.MeshBasicMaterial({ color, transparent: true, opacity: .9 }));
  ring.rotation.x = Math.PI / 2; ring.position.y = .3; group.add(ring);
  const beam = new THREE.Mesh(new THREE.CylinderGeometry(.13, .52, 8, 10, 1, true), new THREE.MeshBasicMaterial({ color, transparent: true, opacity: .19, side: THREE.DoubleSide }));
  beam.position.y = 4; group.add(beam);
  const crown = new THREE.Mesh(new THREE.SphereGeometry(.5, 10, 8), new THREE.MeshBasicMaterial({ color }));
  crown.position.y = 8.3; group.add(crown);
  group.position.set(x, 0, z); scene.add(group);
  return group;
}
const missionMarker = makeMarker(-60, -60);
const safeMarker = makeMarker(-60, -60, 0x83d6bb, 2.4);
const armsMarker = makeMarker(-56, -54, 0xff956b, 2.1);
const taxiMarker = makeMarker(28, 36, 0xffd06a, 2.5);
const raceMarker = makeMarker(276, -276, 0xf090bb, 3.2);
const collectibles = [[-406, -72], [182, 276], [310, 226], [-228, -309], [48, 320], [-344, -254]];
const packages = collectibles.map(([x, z]) => {
  const box = new THREE.Mesh(new THREE.BoxGeometry(1.2, 1.2, 1.2), new THREE.MeshStandardMaterial({ color: 0xf4c66e, emissive: 0x9a551b, emissiveIntensity: .65, metalness: .2 }));
  box.position.set(x, .8, z); box.castShadow = true; scene.add(box);
  return { mesh: box, collected: false };
});

const economy = createEconomy(state, message => hud.notify(message));
const activities = createActivities(state, economy, message => hud.notify(message));
let autosave = () => writeSave(state, player.vehicle?.mesh.position ?? player.mesh.position);
const mission = createMissionSystem(state, message => hud.notify(message), message => hud.say(message),
  stars => { if (wanted.stars < stars) wanted.addCrime(stars * 20, 'PCPD raid at the port'); }, () => autosave());
const combat = createCombat(player, wanted, particles, audio, message => hud.notify(message), state.weapons);
const menus = createMenus({
  newGame: startNewGame, continueGame, resume, save: saveAtSafehouse, title: goToTitle,
  respawn, restartMission, volume: value => audio.setVolume(value),
  mix: (channel, value) => audio.setMix(channel, value),
  hover: () => audio.uiTick(), startAudio: () => audio.start(),
  onPause: () => audio.duck(true), onResume: () => audio.duck(false),
  sensitivity: value => follow.setSensitivity(value),
  bindKey: (action, code) => input.bind(action, code),
  quality: value => {
    const settings = { low: [.8, false, 1300], medium: [1, true, 1800], high: [1.25, true, 2300], ultra: [1.55, true, 2600] };
    const [scale, shadows, drawDistance] = settings[value] ?? settings.high;
    renderer.shadowMap.enabled = shadows;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, scale));
    renderer.setSize(window.innerWidth, window.innerHeight);
    composer.setSize(window.innerWidth, window.innerHeight);
    camera.far = drawDistance;
    camera.updateProjectionMatrix();
    composer.setEnabled(value !== 'low');
  },
  shadowQuality: value => {
    const mapSize = { low: 512, medium: 1024, high: 1536 }[value] ?? 1024;
    city.sky.sun.shadow.mapSize.set(mapSize, mapSize);
    city.sky.sun.shadow.needsUpdate = true;
  },
  resolutionScale: value => {
    renderer.setPixelRatio(Math.min((window.devicePixelRatio || 1) * value, 2));
    renderer.setSize(window.innerWidth, window.innerHeight);
    composer.setSize(window.innerWidth, window.innerHeight);
  },
  fpsLimit: value => { frameLimit = Number(value); },
  invertY: value => follow.setInvertY(value),
  timeOfDay: value => {
    const active = city.sky.setPreset(value);
    waterMaterials.forEach(material => {
      material.userData.setPreset(active);
      material.uniforms.uEnvironment.value = scene.userData.reflectionTexture;
    });
  },
});

let screen = 'title', last = performance.now(), clock = 0;
const game = { scene, city, state, player, vehicles, parked, titleCar, foregroundPalm, traffic, people, police, gang, courier, wanted, combat, particles, hud, menus, camera: follow, minimap, mission, waterMaterials };
Object.defineProperty(game, 'screen', { get: () => screen, set: value => { screen = value; } });
game.enterVehicle = enterVehicle;
game.refreshMission = refreshMission;
let hornCooldown = 0, shotEffectTimer = 0, impactCooldown = 0, lowHealthCooldown = 0;
let headlights = false, shootingLock = 0;

function startNewGame() {
  state.cash = 2450; state.respect = 0; state.mission = 0;
  garage.clear();
  state.weapons.splice(0, state.weapons.length, true, true, false, false);
  player.mesh.position.set(0, 0, 8);
  beginGame();
  audio.missionSting();
}

function beginGame() {
  titleCar.mesh.visible = false;
  foregroundPalm.visible = false;
  player.health = 100; player.armour = 35; player.yaw = 0;
  player.onFoot = true; player.vehicle = null; player.mesh.visible = true; wanted.clear();
  follow.state.distance = 13;
  screen = 'play'; menus.hideAll(); audio.start(); audio.duck(false); mission.begin(); hud.notify('MARINA ROW · ONE NIGHT TO CHANGE EVERYTHING');
  refreshMission();
}

function continueGame() {
  const saved = readSave();
  if (!saved) { hud.notify('NO STREET SAVE FOUND · START A NEW GAME'); return; }
  state.cash = saved.cash ?? 2450; state.respect = saved.respect ?? 0; state.mission = saved.mission ?? 0;
  garage.restore(saved.garage);
  state.weapons.splice(0, state.weapons.length, ...(saved.weapons ?? [true, true, false, false]));
  player.mesh.position.set(saved.x ?? 0, 0, saved.z ?? 8);
  beginGame(); refreshMission();
}

function resume() {
  screen = 'play'; menus.hideAll(); last = performance.now(); follow.release();
}

function restartMission() {
  screen = 'play'; menus.hideAll(); last = performance.now(); follow.release();
  if (!mission.completed) mission.begin();
  refreshMission();
  hud.notify(mission.completed ? 'STORY COMPLETE · FREE ROAM CONTINUES' : `JOB ${mission.index + 1} · RESTARTED`);
}

function goToTitle() {
  screen = 'title'; player.mesh.position.set(0, 0, 8); player.yaw = 0;
  titleCar.mesh.visible = true;
  follow.state.distance = 27; follow.state.yaw = -.18;
  if (player.vehicle) { player.vehicle = null; player.onFoot = true; player.mesh.visible = true; }
  follow.release(); menus.showTitle();
}

function saveAtSafehouse() {
  const point = player.vehicle?.mesh.position ?? player.mesh.position;
  if (Math.hypot(point.x + 60, point.z + 60) > 22) {
    hud.notify('SAFEHOUSE SAVE · MARINA ROW, BY THE GARAGE'); return;
  }
  if (player.vehicle) {
    garage.store(player.vehicle);
    player.vehicle = null; player.onFoot = true; player.mesh.visible = true;
    player.mesh.position.set(-54, 0, -60);
    hud.notify(`LANTERN GARAGE · ${state.garage.kind.toUpperCase()} STORED`);
  }
  if (autosave()) { hud.notify('SAFEHOUSE · GAME SAVED'); loadContinueState(); }
}

function respawn() {
  player.health = 100; player.armour = 35; player.mesh.visible = true; player.mesh.position.set(-46, 0, -46);
  if (player.vehicle) player.vehicle = null;
  player.onFoot = true; wanted.clear(); screen = 'play'; menus.hideAll(); hud.notify('ST. AURELIA CLINIC · $250 CARE FEE');
  state.cash = Math.max(0, state.cash - 250);
}

function refreshMission() {
  const [x, z] = mission?.destination ?? [-60, -60];
  missionMarker.position.set(x, 0, z);
}

function enterVehicle(car, silent = false) {
  if (!car || player.vehicle) return;
  player.vehicle = car; player.onFoot = false; player.mesh.visible = false;
  car.ai = false; car.speed = Math.max(car.speed, 0);
  if (!silent) {
    wanted.addCrime(10, 'vehicle theft');
    hud.notify(`${car.kind.toUpperCase()} LIFTED · PCPD ALERT`);
    hud.showRadio(); audio.radio();
    audio.vehicleEntry();
  }
  refreshMission();
}

function leaveVehicle() {
  if (!player.vehicle) return;
  const car = player.vehicle;
  const side = new THREE.Vector3(Math.cos(car.yaw), 0, -Math.sin(car.yaw));
  player.mesh.position.copy(car.mesh.position).addScaledVector(side, 4.5);
  player.yaw = car.yaw; player.vehicle = null; player.onFoot = true; player.mesh.visible = true;
  if (car.health < 25) player.health -= 8;
}

function hitPlayer(damage, armourDamage) {
  if (player.invulnerable > 0) return;
  const absorbed = Math.min(player.armour, armourDamage);
  player.armour -= absorbed; player.health -= Math.max(0, damage - absorbed * .55);
  player.invulnerable = .18;
  if (player.health <= 0) {
    player.health = 0; screen = 'dead'; follow.release();
    document.getElementById('result-title').textContent = 'FLATLINED';
    document.getElementById('result-copy').textContent = 'St. Aurelia Clinic patched you up. The city still wants its money.';
    menus.showDeath();
  }
}

function combatTargets() {
  const targets = people.filter(person => person.health > 0).map(person => ({
    entity: person, isPolice: Boolean(person.police),
    get position() { return person.mesh.position; },
    get health() { return person.health; },
    damage(amount) {
      person.health -= amount; person.flee = 2.5;
      if (person.health <= 0) {
        person.mesh.rotation.x = -1.2; person.mesh.position.y = .1;
        if (person.gang) hud.notify('THREAT DOWN · RESPECT +1');
      }
    },
  }));
  for (const officer of police.officers) if (officer.health > 0) targets.push({
    entity: officer, isPolice: true, get position() { return officer.mesh.position; },
    get health() { return officer.health; }, damage(amount) { officer.health -= amount; officer.flee = 2; },
  });
  return targets;
}

function blockCollision(x, z) {
  const bx = Math.round((x - 46) / 92) * 92 + 46;
  const bz = Math.round((z - 46) / 92) * 92 + 46;
  return Math.abs(x - bx) < 30 && Math.abs(z - bz) < 30;
}

function interact() {
  if (player.vehicle) { leaveVehicle(); return; }
  let nearest = null, nearestDistance = 11;
  for (const car of vehicles) {
    const distance = car.mesh.position.distanceTo(player.mesh.position);
    if (distance < nearestDistance) { nearest = car; nearestDistance = distance; }
  }
  if (nearest) {
    if (nearest.police) wanted.addCrime(20, 'taking a PCPD cruiser');
    if (nearest.ai) {
      const driver = createPedestrian(scene, random, nearest.mesh.position.x + 3, nearest.mesh.position.z);
      driver.flee = 3; people.push(driver);
    }
    enterVehicle(nearest); return;
  }
  if (Math.hypot(player.mesh.position.x + 58, player.mesh.position.z + 55) < 13) {
    const weapon = !combat.owned[3] ? [3, 1100] : !combat.owned[2] ? [2, 720] : null;
    if (weapon) economy.buyWeapon(weapon[0], weapon[1], combat);
    else hud.notify('CALIDA ARMS · CARRY WHAT YOU CAN AFFORD');
  } else hud.notify('NO RIDE IN REACH · FIND A KEY OR TRY FARES');
}

function handleInput(dt) {
  if (input.take('Escape')) {
    if (screen === 'play') { screen = 'paused'; menus.showPause(); follow.release(); }
    else if (screen === 'paused') resume();
  }
  if (screen === 'dead') return;
  if (screen === 'paused' || screen === 'title') { input.clearPressed(); return; }
  if (screen !== 'play') return;
  if (shot === 'chase' && player.vehicle) {
    player.vehicle.mesh.position.x += 31 * dt;
    player.vehicle.mesh.position.z += Math.sin(clock * 2.3) * .55 * dt;
    player.vehicle.speed = 31;
    for (const cruiser of police.cruisers) cruiser.mesh.position.x += 25 * dt;
    shotEffectTimer -= dt;
    if (shotEffectTimer <= 0) {
      const rear = player.vehicle.mesh.position.clone().add(new THREE.Vector3(-3.8, .45, .55));
      particles.smoke(rear);
      particles.smoke(rear.clone().add(new THREE.Vector3(0, .1, -1.2)));
      shotEffectTimer = .09;
    }
    document.getElementById('speed-streaks')?.classList.add('active');
  }
  if (shot === 'signature' && player.vehicle) {
    const car = player.vehicle;
    car.mesh.position.z -= dt * 2.2;
    car.speed = 2.2;
    car.mesh.userData.wheels?.forEach(wheel => { wheel.rotation.x -= dt * .7; });
    input.clearPressed();
    return;
  }
  if (input.takeAction('vehicle')) interact();
  if (input.takeAction('activity')) activities.start(player.vehicle?.mesh.position ?? player.mesh.position, player.vehicle);
  if (input.takeAction('map')) { audio.mapOpen(); screen = 'paused'; menus.showPause(); follow.release(); }
  if (input.take('KeyH')) { if (player.vehicle) audio.horn(); hud.notify('HORN · ' + (player.vehicle ? 'A SHORT, RUDE ANSWER' : 'EMPTY AIR')); }
  if (input.take('KeyL')) {
  headlights = !headlights;
  for (const vehicle of vehicles) if (vehicle.mesh.userData.headlightMaterial) vehicle.mesh.userData.headlightMaterial.emissiveIntensity = headlights ? 3 : .15;
  hud.notify(headlights ? 'HEADLIGHTS ON' : 'HEADLIGHTS OFF');
  }
  if (input.take('KeyR')) combat.reload();
  if (input.take('Digit1')) combat.equip(0);
  if (input.take('Digit2')) combat.equip(1);
  if (input.take('Digit3')) combat.equip(2);
  if (input.take('Digit4')) combat.equip(3);
  if (input.take('Enter')) { audio.start(); audio.radio(); hud.showRadio(); }
  const moving = input.downAction('forward') || input.down('ArrowUp');
  const movingBack = input.downAction('reverse') || input.down('ArrowDown');
  const steering = (input.downAction('right') || input.down('ArrowRight') ? 1 : 0) - (input.downAction('left') || input.down('ArrowLeft') ? 1 : 0);
  if (player.vehicle) {
    const car = player.vehicle;
    const old = car.mesh.position.clone();
    if (moving) car.speed = Math.min(35, car.speed + 18 * dt);
    else if (movingBack) car.speed = Math.max(-12, car.speed - 12 * dt);
    else car.speed *= Math.exp(-1.3 * dt);
    car.yaw += steering * dt * (1.3 + Math.min(Math.abs(car.speed) / 16, 1.5)) * (car.speed < 0 ? -1 : 1);
    tickVehicle(car, dt);
    if (blockCollision(car.mesh.position.x, car.mesh.position.z) || car.mesh.position.x < -630 || car.mesh.position.x > 450 || Math.abs(car.mesh.position.z) > 450) {
      car.mesh.position.copy(old); car.speed *= -.25; car.health -= 3;
      particles.burst(old.clone().add(new THREE.Vector3(0, 1.4, 0)), 0xffa66d, 5);
      if (impactCooldown <= 0) { audio.impact(); impactCooldown = .42; }
    }
    audio.engine(car.speed); player.yaw = car.yaw;
  } else {
    const forward = new THREE.Vector3(-Math.sin(follow.state.yaw), 0, -Math.cos(follow.state.yaw));
    const right = new THREE.Vector3(Math.cos(follow.state.yaw), 0, -Math.sin(follow.state.yaw));
    const movement = new THREE.Vector3();
    if (moving) movement.add(forward);
    if (movingBack) movement.sub(forward);
    if (steering) movement.addScaledVector(right, steering);
    const isMoving = movement.lengthSq() > .01;
    if (isMoving) {
      movement.normalize();
      const speed = input.down('ShiftLeft') || input.down('ShiftRight') ? 12 : 7;
      const old = player.mesh.position.clone();
      player.mesh.position.addScaledVector(movement, speed * dt);
      if (blockCollision(player.mesh.position.x, player.mesh.position.z)) player.mesh.position.copy(old);
      player.yaw = Math.atan2(-movement.x, -movement.z);
    }
    if (input.take('Space') && player.jump <= 0) player.jump = .45;
    animatePlayer(player, dt, isMoving, combat.selected > 0);
  }
  const activePosition = player.vehicle?.mesh.position ?? player.mesh.position;
  if (input.firing && shootingLock <= 0) {
    const direction = new THREE.Vector3(); camera.getWorldDirection(direction);
    const origin = activePosition.clone().add(new THREE.Vector3(0, player.vehicle ? 2 : 1.7, 0));
    const policeNear = police.cruisers.some(car => car.mesh.position.distanceTo(activePosition) < 80);
    combat.fire(direction, origin, combatTargets(), policeNear);
    for (const person of people) if (person.mesh.position.distanceTo(activePosition) < 55) person.flee = 2.5;
    if (!player.vehicle) { player.yaw = Math.atan2(-direction.x, -direction.z); player.mesh.rotation.y = player.yaw; }
    shootingLock = .13;
  }
  if (input.down('KeyQ') && hornCooldown <= 0) { audio.siren(); hornCooldown = .8; }
  input.clearPressed();
}

function getMapBlips() {
  return [
    { x: mission.destination[0], z: mission.destination[1], color: '#ffc965', radius: 5 },
    { x: -60, z: -60, color: '#76d6b3' }, { x: -56, z: -54, color: '#ff9878' },
    { x: 28, z: 36, color: '#f5d276' }, { x: 276, z: -276, color: '#ef9fc5' },
    ...police.cruisers.map(car => ({ x: car.mesh.position.x, z: car.mesh.position.z, color: '#f36b64', radius: 4 })),
    ...gang.filter(person => person.health > 0).map(person => ({ x: person.mesh.position.x, z: person.mesh.position.z, color: '#ff5f56', radius: 4 })),
    ...(minimap.waypoint ? [{ ...minimap.waypoint, color: '#63d6e5', radius: 5 }] : []),
  ];
}

function updateGame(dt) {
  clock += dt; shootingLock = Math.max(0, shootingLock - dt); hornCooldown = Math.max(0, hornCooldown - dt);
  impactCooldown = Math.max(0, impactCooldown - dt); lowHealthCooldown = Math.max(0, lowHealthCooldown - dt);
  if (player.invulnerable > 0) player.invulnerable -= dt;
  handleInput(dt);
  if (screen !== 'play') return;
  if (player.vehicle) player.mesh.position.copy(player.vehicle.mesh.position);
  for (const person of people) tickPedestrian(person, dt, player.mesh.position);
  for (const packageItem of packages) {
    if (!packageItem.collected) {
      packageItem.mesh.rotation.y += dt * 1.6;
      if (packageItem.mesh.position.distanceTo(player.mesh.position) < 3) {
        packageItem.collected = true; packageItem.mesh.visible = false; state.cash += 150; state.respect++;
        hud.notify('HIDDEN PACKAGE FOUND · +$150');
      }
    }
  }
  tickTraffic(traffic, dt, player, wanted, (amount, reason) => wanted.addCrime(amount, reason), audio);
  const position = player.vehicle?.mesh.position ?? player.mesh.position;
  const policeTarget = { position, vehicle: player.vehicle, hit: hitPlayer };
  const policeNearby = police.cruisers.some(car => {
    const delta = car.mesh.position.clone().add(new THREE.Vector3(0, 1.5, 0)).sub(position.clone().add(new THREE.Vector3(0, 1.5, 0)));
    const distance = delta.length();
    if (distance > 110) return false;
    const ray = new THREE.Raycaster(position.clone().add(new THREE.Vector3(0, 1.5, 0)), delta.normalize(), 0, distance);
    return ray.intersectObjects(city.buildings.children, true).length === 0;
  });
  const policeClose = tickPolice(police, dt, policeTarget, wanted, traffic, message => {
    if (shot !== 'chase') hud.notify(message);
  });
  if (shot === 'chase') {
    police.officers.forEach(officer => { officer.mesh.visible = false; });
    hud.clearFeed();
  }
  const policeVisible = policeClose && policeNearby;
  wanted.tick(dt, policeVisible, Boolean(player.vehicle));
  if (wanted.stars >= 4) audio.siren(police.cruisers[0]?.mesh.position, position);
  combat.tick(dt); particles.tick(dt);
  shotEffectTimer -= dt;
  if (shot === 'mission' && shotEffectTimer <= 0) {
    const forward = new THREE.Vector3(-Math.sin(player.yaw), 0, -Math.cos(player.yaw));
    const muzzle = player.mesh.position.clone().addScaledVector(forward, .9).add(new THREE.Vector3(0, 2, 0));
    particles.burst(muzzle, 0xffcf75, 7);
    particles.tracer(muzzle, muzzle.clone().addScaledVector(forward, 20).add(new THREE.Vector3(0, -.4, 0)));
    shotEffectTimer = .42;
  }
  mission.tick(dt, position, player.vehicle, wanted, missionTargetMet());
  if (mission.consumePassed()) { audio.missionComplete(); refreshMission(); autosave(); loadContinueState(); }
  activities.tick(dt, position);
  const target = player.vehicle?.mesh.position ?? player.mesh.position;
  if (player.health < 25 && lowHealthCooldown <= 0) { audio.lowHealth(); lowHealthCooldown = 2.8; }
  hud.setPrompt(contextualPrompt(target));
  missionMarker.position.x = mission.destination[0]; missionMarker.position.z = mission.destination[1];
  missionMarker.rotation.y += dt * .7;
  safeMarker.rotation.y += dt * .5; armsMarker.rotation.y += dt * .6;
  cameraTarget(target, dt);
  if (player.vehicle && player.vehicle.health < 22) {
    if (!player.vehicle.smoke) {
      const smoke = new THREE.Mesh(new THREE.SphereGeometry(.8, 8, 6), new THREE.MeshBasicMaterial({ color: 0x636566, transparent: true, opacity: .42 }));
      scene.add(smoke); player.vehicle.smoke = smoke;
    }
    player.vehicle.smoke.position.set(target.x, 2.8, target.z + 1.5);
    player.vehicle.smoke.scale.setScalar(1 + Math.sin(clock * 5) * .16);
  }
  state.encounterText = shot === 'mission' ? `ENEMIES LEFT: ${gang.filter(person => person.health > 0).length} / 9` : '';
  state.shotTimer = shot === 'chase' ? 'PURSUIT · 00:47' : '';
  minimap.draw({ x: target.x, z: target.z, yaw: player.vehicle?.yaw ?? player.yaw, zoom: shot === 'chase' ? 250 : 182 }, getMapBlips());
  hud.update(state, mission, combat, wanted, dt);
  if (shot) hud.dismissToast();
  city.sky.glow.position.x = -260 + Math.sin(clock * .007) * 30;
}

function contextualPrompt(position) {
  if (player.vehicle) return 'F  ·  EXIT VEHICLE';
  let nearest = null, nearestDistance = 11;
  for (const car of vehicles) {
    const distance = car.mesh.position.distanceTo(position);
    if (distance < nearestDistance) { nearest = car; nearestDistance = distance; }
  }
  if (nearest) return `F  ·  ENTER ${nearest.kind.toUpperCase()}`;
  if (Math.hypot(position.x + 58, position.z + 55) < 14) return 'F  ·  VISIT CALIDA ARMS';
  if (Math.hypot(position.x - 28, position.z - 36) < 20 || Math.hypot(position.x - 276, position.z + 276) < 20) return 'E  ·  START ACTIVITY';
  return '';
}

function missionTargetMet() {
  const position = player.vehicle?.mesh.position ?? player.mesh.position;
  if (state.mission === 2) return courier.health <= 0 || (player.vehicle && Math.hypot(position.x - 244, position.z - 154) < 12);
  if (state.mission === 4) return gang.filter(person => person.health > 0).length === 0;
  if (state.mission === 3 && wanted.stars > 0) return false;
  const [x, z] = mission.destination;
  return Math.hypot(position.x - x, position.z - z) < 14;
}

function cameraTarget(position, dt = 1 / 60) {
  if (shot === 'signature') {
    const drift = Math.sin(clock * .07) * .28;
    camera.position.lerp(new THREE.Vector3(-282 + drift, 3.9, 25), 1 - Math.exp(-dt * 2.4));
    camera.lookAt(-276, 1.15, -100);
    return;
  }
  const focus = position.clone().add(new THREE.Vector3(0, player.vehicle ? 2 : 2.2, 0));
  follow.update(focus, player.vehicle?.yaw ?? player.yaw, dt, Boolean(player.vehicle));
}

function draw() {
  const now = performance.now();
  if (frameLimit > 0 && now - last < 1000 / frameLimit) { requestAnimationFrame(draw); return; }
  const dt = Math.min((now - last) / 1000, .05);
  last = now;
  if (screen === 'play') updateGame(dt);
  else {
    clock += dt; particles.tick(dt);
    for (const car of traffic) {
      car.mesh.position.x += car.routeAxis === 'x' ? car.routeSign * car.cruise * dt : 0;
      car.mesh.position.z += car.routeAxis === 'z' ? car.routeSign * car.cruise * dt : 0;
      if (Math.abs(car.mesh.position.x) > 445) car.mesh.position.x *= -.98;
      if (Math.abs(car.mesh.position.z) > 445) car.mesh.position.z *= -.98;
    }
    const position = player.vehicle?.mesh.position ?? player.mesh.position;
    const cinematicMenu = screen === 'title' && (!shot || shot === 'title' || shot === 'settings');
    if (cinematicMenu) {
      const drift = Math.sin(clock * .09);
      camera.position.lerp(new THREE.Vector3(-282 + drift * 1.2, 4.1 + Math.sin(clock * .06) * .12, 21 + drift * .55), 1 - Math.exp(-dt * 2.2));
      camera.lookAt(-276 + drift * .35, 1.35, -94);
      titleCar.mesh.visible = true;
      titleCar.mesh.position.set(-276 + Math.sin(clock * .12) * 1.2, 0, -18 - Math.sin(clock * .09) * 4);
      titleCar.yaw = Math.sin(clock * .1) * .025;
      titleCar.mesh.rotation.y = titleCar.yaw;
      foregroundPalm.visible = true;
      menuDust.forEach(({ mote, baseY, phase }) => {
        mote.visible = true;
        mote.position.y = baseY + Math.sin(clock * .18 + phase) * .32;
        mote.position.x += Math.sin(clock * .12 + phase) * dt * .025;
      });
    } else {
      titleCar.mesh.visible = false;
      foregroundPalm.visible = shot === 'signature';
      menuDust.forEach(({ mote }) => { mote.visible = shot === 'signature'; });
      cameraTarget(position, dt);
    }
    minimap.draw({ x: position.x, z: position.z, yaw: player.yaw, zoom: shot === 'chase' ? 220 : 182 }, getMapBlips());
    hud.update(state, mission, combat, wanted, dt);
  }
  game.waterMaterials.forEach(material => { material.uniforms.uTime.value = clock; });
  city.props.userData.windUniform.value = clock;
  city.sky.dome.position.copy(camera.position);
  if (screen === 'title' && city.sky.glow.visible) city.sky.glow.position.set(-276, 18, -270);
  else if (shot === 'signature' && city.sky.glow.visible) city.sky.glow.position.set(-276, 17, -270);
  else if (screen === 'play') city.sky.glow.position.x = -260 + Math.sin(clock * .007) * 30;
  if (screen === 'play') titleCar.mesh.visible = false;
  composer.render(camera, shot === 'signature' || screen === 'title', scene.userData.lightingPreset);
  requestAnimationFrame(draw);
}

function loadContinueState() {
  const button = document.querySelector('[data-action="continue"]');
  button.disabled = !readSave();
  button.style.opacity = button.disabled ? '.45' : '1';
}
loadContinueState();
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight; camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  composer.setSize(window.innerWidth, window.innerHeight);
});
if (shot) {
  stageShot(shot, game, initialPreset);
  document.querySelectorAll('.screen').forEach(element => { element.hidden = true; });
  if (shot === 'title') menus.showTitle();
  if (shot === 'settings') menus.showSettings();
  window.__shotReady = false;
  requestAnimationFrame(() => { requestAnimationFrame(() => { window.__shotReady = true; }); });
} else menus.showTitle();
requestAnimationFrame(draw);
