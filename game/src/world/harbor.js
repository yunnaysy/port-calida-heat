// Builds the harbor quay, pilings, and cranes that form the industrial waterfront.
import * as THREE from 'three';

function box(group, size, position, color, material = null) {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(...size), material ?? new THREE.MeshStandardMaterial({ color, roughness: .8 }));
  mesh.position.set(...position); mesh.castShadow = true; mesh.receiveShadow = true; group.add(mesh);
  return mesh;
}

/** Adds the harbor's static infrastructure to the scene and returns its root group. */
export function addHarborInfrastructure(scene) {
  const harbor = new THREE.Group();
  const deck = box(harbor, [270, .55, 20], [ -500, .03, 276], 0x353c3b);
  deck.material.roughness = .98;
  box(harbor, [270, .72, 2.5], [-500, .1, 287], 0xcbb593);
  box(harbor, [270, .72, 2.5], [-500, .1, 265], 0xcbb593);
  box(harbor, [270, 1.2, .38], [-500, 1, 286], 0x70827e);
  box(harbor, [270, 1.2, .38], [-500, 1, 266], 0x70827e);
  const marks = new THREE.InstancedMesh(new THREE.BoxGeometry(7, .07, .22), new THREE.MeshBasicMaterial({ color: 0xf2d796 }), 24);
  const matrix = new THREE.Matrix4();
  for (let i = 0; i < 24; i++) {
    matrix.makeTranslation(-625 + i * 10.5, .34, 276); marks.setMatrixAt(i, matrix);
  }
  marks.instanceMatrix.needsUpdate = true; harbor.add(marks);
  const piling = new THREE.Mesh(new THREE.CylinderGeometry(.65, .85, 11, 8), new THREE.MeshStandardMaterial({ color: 0x64726d }));
  for (const x of [-585, -530, -475, -420]) for (const z of [270, 282]) {
    const column = piling.clone(); column.position.set(x, -5.2, z); harbor.add(column);
  }
  for (const x of [-610, -405]) {
    box(harbor, [1.1, 12, 1.1], [x, 6, 276], 0xc1aa87);
    box(harbor, [28, 1, 1], [x + 10, 11.5, 276], 0xc1aa87);
    box(harbor, [21, .5, .5], [x + 9.5, 8, 276], 0xb48e68);
    for (let support = 0; support < 3; support++) {
      const brace = box(harbor, [.45, 8, .45], [x + 4 + support * 5, 5, 276], 0xb48e68);
      brace.rotation.z = -.45;
    }
  }

  const crane = new THREE.Group();
  for (const [x, z] of [[-415, 96], [-370, 194]]) {
    box(crane, [1.1, 19, 1.1], [x, 9.5, z], 0x637b77);
    box(crane, [25, 1, 1], [x + 12, 18.5, z], 0xd7b16f);
    box(crane, [1, 5, 1], [x + 22, 16, z], 0x637b77);
    const cable = new THREE.Mesh(new THREE.CylinderGeometry(.07, .07, 6, 5), new THREE.MeshStandardMaterial({ color: 0x283a3c }));
    cable.position.set(x + 22, 12.5, z); crane.add(cable);
    box(crane, [12, 5, 20], [x + 22, 8.5, z], 0xa35745);
  }
  harbor.add(crane);
  scene.add(harbor);
  return harbor;
}
