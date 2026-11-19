import * as THREE from 'three';

export function createOceanMaterial(preset = 'golden', reflectionTexture = null) {
  const palettes = {
    day: [0x087f9d, 0x04344d, 0x81d8e3],
    golden: [0x075f7b, 0x031d34, 0xffbd72],
    night: [0x064264, 0x020d20, 0x5297d5],
  };
  const colors = palettes[preset] ?? palettes.golden;
  const material = new THREE.ShaderMaterial({
    uniforms: {
      uTime: { value: 0 },
      uShallow: { value: new THREE.Color(colors[0]) },
      uDeep: { value: new THREE.Color(colors[1]) },
      uGlint: { value: new THREE.Color(colors[2]) },
      uEnvironment: { value: reflectionTexture },
    },
    vertexShader: `
      uniform float uTime;
      varying vec3 vWorldPosition;
      varying vec3 vWorldNormal;
      varying float vWave;
      void main() {
        vec3 p = position;
        float phase = uTime * 0.72;
        float waveA = sin(p.x * 0.075 + phase) * 0.22;
        float waveB = cos(p.y * 0.052 - phase * 1.31) * 0.15;
        p.z += waveA + waveB;
        vec3 localNormal = normalize(vec3(
          -cos(p.x * 0.075 + phase) * 0.0165,
          sin(p.y * 0.052 - phase * 1.31) * 0.0078,
          1.0
        ));
        vec4 worldPosition = modelMatrix * vec4(p, 1.0);
        vWorldPosition = worldPosition.xyz;
        vWorldNormal = normalize(mat3(modelMatrix) * localNormal);
        vWave = waveA + waveB;
        gl_Position = projectionMatrix * viewMatrix * worldPosition;
      }
    `,
    fragmentShader: `
      uniform vec3 uShallow;
      uniform vec3 uDeep;
      uniform vec3 uGlint;
      uniform sampler2D uEnvironment;
      uniform float uTime;
      varying vec3 vWorldPosition;
      varying vec3 vWorldNormal;
      varying float vWave;
      void main() {
        float depth = 1.0 - smoothstep(-575.0, -410.0, vWorldPosition.x);
        vec3 water = mix(uShallow, uDeep, depth);
        vec3 viewDirection = normalize(cameraPosition - vWorldPosition);
        float fresnel = pow(1.0 - max(dot(normalize(vWorldNormal), viewDirection), 0.0), 2.3);
        vec3 reflected = reflect(-viewDirection, normalize(vWorldNormal));
        vec2 environmentUv = vec2(atan(reflected.z, reflected.x) / 6.2831853 + .5,
          asin(clamp(reflected.y, -.99, .99)) / 3.1415926 + .5);
        vec3 reflection = pow(texture2D(uEnvironment, environmentUv).rgb, vec3(2.2));
        float ripple = sin(vWorldPosition.x * 0.12 + vWorldPosition.z * 0.08 + uTime * 1.2) * 0.022;
        float sunGlint = pow(max(0.0, sin(vWorldPosition.x * 0.027 + vWorldPosition.z * 0.018 + uTime * 0.36)), 15.0);
        vec3 color = water + vec3(ripple + vWave * 0.035);
        color = mix(color, reflection + uGlint * .22, fresnel * .66 + sunGlint * .14);
        gl_FragColor = vec4(color, 1.0);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }
    `,
    side: THREE.DoubleSide,
  });
  material.userData.setPreset = name => {
    const palette = palettes[name] ?? palettes.golden;
    material.uniforms.uShallow.value.setHex(palette[0]);
    material.uniforms.uDeep.value.setHex(palette[1]);
    material.uniforms.uGlint.value.setHex(palette[2]);
  };
  return material;
}

const matrixAt = (position, rotation = new THREE.Euler(), scale = new THREE.Vector3(1, 1, 1)) => new THREE.Matrix4().compose(position, new THREE.Quaternion().setFromEuler(rotation), scale);
function palmLeafGeometry() {
  const centers = [[0, 0], [1, -.18], [2, -.55], [3, -1.2], [4, -2.05], [5, -3.2], [6, -4.7]];
  const widths = [.12, .38, .44, .39, .31, .18, .015], vertices = [], indices = [];
  centers.forEach(([x, y], index) => vertices.push(x, y, -widths[index], x, y, widths[index]));
  for (let i = 0; i < centers.length - 1; i++) {
    const a = i * 2;
    indices.push(a, a + 1, a + 2, a + 1, a + 3, a + 2);
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
  geometry.setIndex(indices); geometry.computeVertexNormals();
  return geometry;
}
const addBatch = (group, geometry, material, matrices, shadows = true) => {
  const mesh = new THREE.InstancedMesh(geometry, material, matrices.length);
  matrices.forEach((matrix, index) => mesh.setMatrixAt(index, matrix));
  mesh.instanceMatrix.needsUpdate = true; mesh.castShadow = shadows; mesh.receiveShadow = true; group.add(mesh);
};

function addPalmInstances(group, x, z, random, trunks, fronds) {
  const tilt = (random() - .5) * .17;
  const scale = .72 + random() * .72;
  trunks.push(matrixAt(new THREE.Vector3(x, 4 * scale, z), new THREE.Euler(0, 0, tilt), new THREE.Vector3(scale, scale, scale)));
  for (let i = 0; i < 7; i++) {
    const angle = i * Math.PI * 2 / 7;
    fronds.push(matrixAt(
      new THREE.Vector3(x, 7.7 * scale, z),
      new THREE.Euler(0, angle, (random() - .5) * .1),
      new THREE.Vector3(scale, scale, scale),
    ));
  }
}

function addLampInstances(x, z, posts, arms, bulbs) {
  posts.push(matrixAt(new THREE.Vector3(x, 4, z)));
  arms.push(matrixAt(new THREE.Vector3(x + 1, 7.7, z)));
  bulbs.push(matrixAt(new THREE.Vector3(x + 2.1, 7.45, z)));
}

export function addStreetProps(scene, random) {
  const props = new THREE.Group();
  const trunks = [], fronds = [], lampPosts = [], lampArms = [], lampBulbs = [];
  const benches = [], hydrants = [], busShelters = [];
  for (let x = -4; x <= 4; x++) for (let z = -4; z <= 4; z++) {
    const bx = x * 92, bz = z * 92;
    if (random() > .25) addPalmInstances(props, bx + 13, bz + 12, random, trunks, fronds);
    if (random() > .32) addPalmInstances(props, bx - 13, bz - 13, random, trunks, fronds);
    if ((x + z) % 2 === 0) addLampInstances(bx + 14, bz - 13, lampPosts, lampArms, lampBulbs);
    if ((x * 3 + z) % 3 === 0) {
      benches.push(matrixAt(new THREE.Vector3(bx + 22, .72, bz + 8), new THREE.Euler(0, Math.PI / 2, 0)));
      hydrants.push(matrixAt(new THREE.Vector3(bx - 22, .55, bz - 7)));
    }
    if ((x + z) % 7 === 0) busShelters.push(matrixAt(new THREE.Vector3(bx + 20, 0, bz - 18)));
  }
  for (let z = -420; z <= 420; z += 45) addPalmInstances(props, -398, z, random, trunks, fronds);
  addBatch(props, new THREE.CylinderGeometry(.33, .58, 8, 7), new THREE.MeshStandardMaterial({ color: 0x8a6547, roughness: 1 }), trunks);
  const palmMaterial = new THREE.MeshStandardMaterial({ color: 0x286344, roughness: .9, side: THREE.DoubleSide });
  const windUniform = { value: 0 };
  palmMaterial.onBeforeCompile = shader => {
    shader.uniforms.uWindTime = windUniform;
    shader.vertexShader = shader.vertexShader.replace(
      '#include <common>',
      '#include <common>\nuniform float uWindTime;',
    ).replace(
      '#include <begin_vertex>',
      '#include <begin_vertex>\n#ifdef USE_INSTANCING\ntransformed.x += sin(uWindTime + instanceMatrix[3].x * .024 + instanceMatrix[3].z * .019) * abs(position.y) * .026;\n#endif',
    );
  };
  palmMaterial.customProgramCacheKey = () => 'palm-wind-v1';
  addBatch(props, palmLeafGeometry(), palmMaterial, fronds);
  props.userData.windUniform = windUniform;
  const metal = new THREE.MeshStandardMaterial({ color: 0x344c4b, metalness: .5, roughness: .5 });
  addBatch(props, new THREE.CylinderGeometry(.11, .18, 8, 7), metal, lampPosts);
  addBatch(props, new THREE.BoxGeometry(2.4, .14, .14), metal, lampArms);
  addBatch(props, new THREE.SphereGeometry(.35, 8, 6), new THREE.MeshBasicMaterial({ color: 0xffc56e }), lampBulbs, false);
  const wood = new THREE.MeshStandardMaterial({ color: 0x805b43, roughness: .88 });
  addBatch(props, new THREE.BoxGeometry(3.2, .22, .48), wood, benches);
  const benchLegs = [];
  benches.forEach(matrix => {
    const position = new THREE.Vector3().setFromMatrixPosition(matrix);
    const rotation = new THREE.Euler().setFromRotationMatrix(matrix);
    for (const side of [-1, 1]) benchLegs.push(matrixAt(position.clone().add(new THREE.Vector3(side * 1.15, -.38, 0)), rotation));
  });
  addBatch(props, new THREE.BoxGeometry(.2, .75, .2), metal, benchLegs);
  const red = new THREE.MeshStandardMaterial({ color: 0xb75242, roughness: .6 });
  addBatch(props, new THREE.CylinderGeometry(.32, .38, 1.05, 8), red, hydrants);
  const shelters = new THREE.Group();
  for (const matrix of busShelters) {
    const stand = new THREE.Group(); stand.applyMatrix4(matrix);
    const glass = new THREE.MeshStandardMaterial({ color: 0x88c0bb, roughness: .2, transparent: true, opacity: .48 });
    for (const side of [-1, 1]) {
      const panel = new THREE.Mesh(new THREE.BoxGeometry(.12, 2.8, 5), glass);
      panel.position.set(side * 2.2, 1.5, 0); stand.add(panel);
    }
    const roof = new THREE.Mesh(new THREE.BoxGeometry(5, .25, 6), metal); roof.position.y = 3; stand.add(roof);
    const seat = new THREE.Mesh(new THREE.BoxGeometry(3.2, .2, .42), wood); seat.position.set(0, .85, 1.5); stand.add(seat);
    shelters.add(stand);
  }
  props.add(shelters);

  const seaMaterial = createOceanMaterial(scene.userData.lightingPreset, scene.userData.reflectionTexture);
  const sea = new THREE.Mesh(new THREE.PlaneGeometry(330, 1120, 100, 160), seaMaterial);
  sea.rotation.x = -Math.PI / 2; sea.position.set(-535, -.22, 0); sea.userData.waterMaterial = seaMaterial;
  props.userData.waterMaterial = seaMaterial; props.add(sea);
  const beach = new THREE.Mesh(new THREE.PlaneGeometry(100, 1120), new THREE.MeshStandardMaterial({ color: 0xe7c99a, roughness: 1 }));
  beach.rotation.x = -Math.PI / 2; beach.position.set(-430, -.01, 0); props.add(beach);
  const umbrellas = new THREE.Group();
  for (let i = 0; i < 14; i++) {
    const x = -448 - (i % 3) * 13, z = -410 + i * 61;
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(.1, .1, 3.2, 6), metal);
    pole.position.set(x, 1.6, z); umbrellas.add(pole);
    const canopy = new THREE.Mesh(new THREE.ConeGeometry(2.7, .8, 10), new THREE.MeshStandardMaterial({ color: i % 2 ? 0xf3b568 : 0xe87860, roughness: .7 }));
    canopy.position.set(x, 3.4, z); umbrellas.add(canopy);
  }
  for (let z of [-280, 220]) {
    const tower = new THREE.Group();
    const stilts = new THREE.Mesh(new THREE.BoxGeometry(5.5, 4.6, 5.5), new THREE.MeshStandardMaterial({ color: 0xe3d1ad }));
    stilts.position.set(-469, 3.3, z); tower.add(stilts);
    const hut = new THREE.Mesh(new THREE.BoxGeometry(7.5, 3.5, 7), new THREE.MeshStandardMaterial({ color: z < 0 ? 0xd8876b : 0x6a9c91 }));
    hut.position.set(-469, 7.1, z); tower.add(hut);
    const roof = new THREE.Mesh(new THREE.ConeGeometry(6.5, 2, 4), new THREE.MeshStandardMaterial({ color: 0xf2bd69 }));
    roof.rotation.y = Math.PI / 4; roof.position.set(-469, 9.7, z); tower.add(roof);
    umbrellas.add(tower);
  }
  props.add(umbrellas);
  const pier = new THREE.Mesh(new THREE.BoxGeometry(95, 1.2, 12), new THREE.MeshStandardMaterial({ color: 0x9b6f4f, roughness: 1 }));
  pier.position.set(-465, .1, -60); props.add(pier);
  const posts = [];
  for (let x = -505; x < -420; x += 16) posts.push(matrixAt(new THREE.Vector3(x, -1.2, -60)));
  addBatch(props, new THREE.CylinderGeometry(.4, .4, 4, 6), new THREE.MeshStandardMaterial({ color: 0x745a45 }), posts);
  const marina = new THREE.Group();
  for (let z = -185; z <= 185; z += 24) {
    const finger = new THREE.Mesh(new THREE.BoxGeometry(28, .55, 2.5), new THREE.MeshStandardMaterial({ color: 0xb48c65 }));
    finger.position.set(-416, .2, z); marina.add(finger);
    const boat = new THREE.Mesh(new THREE.ConeGeometry(3.2, 12, 4), new THREE.MeshStandardMaterial({ color: random() > .5 ? 0xf4eee0 : 0xe6a16e }));
    boat.rotation.x = Math.PI / 2; boat.position.set(-426, .55, z + 6); marina.add(boat);
  }
  props.add(marina);
  const dock = new THREE.Mesh(new THREE.BoxGeometry(72, 1, 115), new THREE.MeshStandardMaterial({ color: 0x797366, roughness: .88 }));
  dock.position.set(-365, -.5, 155); props.add(dock);
  const containerColors = [0x9e5745, 0x356d72, 0xc18a52, 0x5b6370];
  for (let i = 0; i < 8; i++) {
    const box = new THREE.Mesh(new THREE.BoxGeometry(14, 8, 23), new THREE.MeshStandardMaterial({ color: containerColors[i % containerColors.length], roughness: .8 }));
    box.position.set(i % 2 ? -337 : -389, 4 + Math.floor(i / 6) * 8, 111 + Math.floor(i / 2) % 3 * 40);
    box.castShadow = true; props.add(box);
  }
  scene.add(props);
  return props;
}
