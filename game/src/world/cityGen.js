import * as THREE from 'three';
import { createSkyLighting } from './skyLighting.js';
import { addRoadNetwork } from './roads.js';
import { addBuildings } from './buildings.js';
import { addStreetProps } from './props.js';
import { addHarborInfrastructure } from './harbor.js';

export function generateCity(scene, renderer, random, preset = 'golden') {
  const sky = createSkyLighting(scene, renderer, preset);
  const roadNetwork = addRoadNetwork(scene);
  const buildings = addBuildings(scene, random);
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(950, 1100), new THREE.MeshStandardMaterial({ color: 0xc3a77f }));
  ground.rotation.x = -Math.PI / 2; ground.position.y = -.12; ground.receiveShadow = true; scene.add(ground);
  const props = addStreetProps(scene, random);
  const harbor = addHarborInfrastructure(scene);
  sky.setPreset(preset);
  props.userData.waterMaterial.userData.setPreset(preset);
  return { sky, roadNetwork, buildings, props, harbor, ground };
}
