import * as THREE from 'three';
import { CITY, COLORS } from '../config.js';

function plane(width, depth, color, x, z, y = .018) {
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(width, depth), new THREE.MeshStandardMaterial({ color, roughness: .97 }));
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
