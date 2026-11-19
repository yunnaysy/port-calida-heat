import * as THREE from 'three';
import { CITY, COLORS } from '../config.js';

function makeAsphalt() {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = 512;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#30383b'; ctx.fillRect(0, 0, 512, 512);
  let seed = 811;
  for (let i = 0; i < 14500; i++) {
    seed = (seed * 16807) % 2147483647;
    const x = seed / 2147483647 * 512;
    seed = (seed * 16807) % 2147483647;
    const y = seed / 2147483647 * 512;
    const shade = 27 + seed % 42;
    ctx.fillStyle = `rgba(${shade},${shade + 3},${shade + 4},${.12 + seed % 25 / 100})`;
    ctx.fillRect(x, y, 1 + seed % 3, 1 + seed % 2);
  }
  for (let i = 0; i < 14; i++) {
    const x = (i * 97 + 31) % 512, y = (i * 151 + 67) % 512;
    ctx.fillStyle = 'rgba(11,17,20,.18)';
    ctx.beginPath(); ctx.ellipse(x, y, 18 + i % 23, 3 + i % 7, .12, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = 'rgba(130,131,119,.18)'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(x - 22, y + 3); ctx.lineTo(x - 10, y + 1); ctx.lineTo(x - 7, y + 6); ctx.lineTo(x + 2, y + 7); ctx.stroke();
  }
  const map = new THREE.CanvasTexture(canvas);
  map.colorSpace = THREE.SRGBColorSpace;
  map.wrapS = map.wrapT = THREE.RepeatWrapping;
  map.anisotropy = 4;
  const roughnessMap = new THREE.CanvasTexture(canvas);
  roughnessMap.wrapS = roughnessMap.wrapT = THREE.RepeatWrapping;
  return { map, roughnessMap };
}
const asphalt = makeAsphalt();
const asphaltMaterials = new Map();

function getAsphaltMaterial(width, depth) {
  const key = width < depth ? 'longitudinal' : 'cross';
  if (!asphaltMaterials.has(key)) {
    const map = asphalt.map.clone(), roughnessMap = asphalt.roughnessMap.clone();
    map.repeat.set(width / 18, depth / 18); roughnessMap.repeat.set(width / 18, depth / 18);
    asphaltMaterials.set(key, new THREE.MeshStandardMaterial({ map, roughnessMap, roughness: .91, metalness: .04 }));
  }
  return asphaltMaterials.get(key);
}

function plane(width, depth, color, x, z, y = .018) {
  const isAsphalt = color === COLORS.asphalt;
  const material = isAsphalt
    ? getAsphaltMaterial(width, depth)
    : new THREE.MeshStandardMaterial({ color, roughness: .97 });
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(width, depth), material);
  mesh.rotation.x = -Math.PI / 2; mesh.position.set(x, y, z); mesh.receiveShadow = true;
  return mesh;
}

function instancedStripes(group, width, depth, positions, color) {
  const mesh = new THREE.InstancedMesh(new THREE.PlaneGeometry(width, depth), new THREE.MeshBasicMaterial({ color }), positions.length);
  const matrix = new THREE.Matrix4();
  positions.forEach(([x, z], index) => {
    matrix.makeRotationX(-Math.PI / 2); matrix.setPosition(x, .05, z); mesh.setMatrixAt(index, matrix);
  });
  mesh.instanceMatrix.needsUpdate = true; group.add(mesh);
}

export function addRoadNetwork(scene) {
  const group = new THREE.Group();
  group.add(plane(CITY.half * 2 + 80, CITY.half * 2 + 80, 0x9b866f, 0, 0, -.05));
  const markingsLong = [], markingsCross = [], crosswalkA = [], crosswalkB = [];
  for (let lane = -5; lane <= 5; lane++) {
    const p = lane * CITY.spacing;
    for (let side = -1; side <= 1; side += 2) {
      group.add(plane(3.2, CITY.half * 2 + 80, 0xd7bc90, p + side * 11, 0, .012));
      group.add(plane(CITY.road, CITY.half * 2 + 80, COLORS.asphalt, p, 0, .02));
      group.add(plane(CITY.half * 2 + 80, 3.2, 0xd7bc90, 0, p + side * 11, .012));
      group.add(plane(CITY.half * 2 + 80, CITY.road, COLORS.asphalt, 0, p, .02));
    }
    for (let q = -CITY.half; q <= CITY.half; q += 12) {
      markingsLong.push([p, q]); markingsCross.push([q, p]);
    }
    for (let side = -1; side <= 1; side += 2) for (let stripe = -3; stripe <= 3; stripe++) {
      crosswalkA.push([p + stripe * 1.65, side * 11.7]);
      crosswalkB.push([side * 11.7, p + stripe * 1.65]);
    }
  }
  instancedStripes(group, .24, 5, markingsLong, 0xf0cd82);
  instancedStripes(group, 5, .24, markingsCross, 0xf0cd82);
  instancedStripes(group, 1.05, 7, crosswalkA, 0xf4eee0);
  instancedStripes(group, 7, 1.05, crosswalkB, 0xf4eee0);
  scene.add(group);
  return group;
}
