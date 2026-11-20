import * as THREE from 'three';

const presets = {
  day: {
    sky: ['#28577a', '#79aab8', '#d2e0d9', '#f4d0a1', '#29495d'],
    fog: 0xc3d3d0, fogDensity: .00048, ambient: .82, sun: 3.1,
    hemiSky: 0xa9d5ee, hemiGround: 0x53624f, sunColor: 0xffe0a1,
  },
  golden: {
    sky: ['#172f4a', '#594d69', '#c87579', '#f5ad7f', '#503a52'],
    fog: 0xb77e79, fogDensity: .0008, ambient: .58, sun: 3.8,
    hemiSky: 0x8e9bb8, hemiGround: 0x53434b, sunColor: 0xffbd72,
  },
  night: {
    sky: ['#071326', '#101f39', '#263750', '#594258', '#111a2d'],
    fog: 0x101a2d, fogDensity: .00078, ambient: 1.05, sun: .32,
    hemiSky: 0x7f9ccc, hemiGround: 0x2c4266, sunColor: 0x789ad0,
  },
};

function makeSkyTexture(stops, night = false) {
  const canvas = document.createElement('canvas');
  canvas.width = 256; canvas.height = 512;
  const context = canvas.getContext('2d');
  const gradient = context.createLinearGradient(0, 0, 0, canvas.height);
  stops.forEach((color, index) => gradient.addColorStop(index / (stops.length - 1), color));
  context.fillStyle = gradient; context.fillRect(0, 0, canvas.width, canvas.height);
  context.globalAlpha = .1;
  for (let cloud = 0; cloud < 22; cloud++) {
    const y = 110 + (cloud * 37) % 205;
    context.fillStyle = cloud % 3 === 0 ? '#fff1db' : '#d9e3df';
    context.beginPath();
    context.ellipse((cloud * 83) % 300 - 20, y, 35 + (cloud * 19) % 54, 2 + cloud % 4, -.04, 0, Math.PI * 2);
    context.fill();
  }
  if (night) {
    let seed = 193;
    for (let star = 0; star < 175; star++) {
      seed = (seed * 16807) % 2147483647;
      const x = seed / 2147483647 * canvas.width;
      seed = (seed * 16807) % 2147483647;
      const y = seed / 2147483647 * 300;
      const radius = star % 13 === 0 ? 1.5 : .7;
      context.globalAlpha = .35 + (star % 5) * .1;
      context.fillStyle = star % 4 === 0 ? '#b9d8ff' : '#fff1cf';
      context.beginPath(); context.arc(x, y, radius, 0, Math.PI * 2); context.fill();
    }
  }
  context.globalAlpha = 1;
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

function makeEnvironmentTexture(stops, night = false) {
  const canvas = document.createElement('canvas');
  canvas.width = 512; canvas.height = 256;
  const context = canvas.getContext('2d');
  const gradient = context.createLinearGradient(0, 0, 0, canvas.height);
  stops.forEach((color, index) => gradient.addColorStop(index / (stops.length - 1), color));
  context.fillStyle = gradient; context.fillRect(0, 0, canvas.width, canvas.height);
  context.globalAlpha = .12;
  context.fillStyle = '#fff2db'; context.fillRect(0, 138, canvas.width, 3);
  context.globalAlpha = .18;
  for (let i = 0; i < 13; i++) {
    context.fillStyle = i % 2 ? '#f5c393' : '#b7c8ce';
    context.beginPath();
    context.ellipse(37 + i * 43, 74 + (i % 3) * 9, 25 + (i % 4) * 7, 5 + i % 3, 0, 0, Math.PI * 2);
    context.fill();
  }
  context.globalAlpha = 1;
  if (!night) {
    const sunset = context.createRadialGradient(94, 144, 2, 94, 144, 54);
    sunset.addColorStop(0, '#fff0c1'); sunset.addColorStop(.24, '#ffb86e'); sunset.addColorStop(1, 'rgba(255,157,107,0)');
    context.fillStyle = sunset; context.fillRect(36, 90, 116, 108);
  }
  context.globalAlpha = .12;
  context.fillStyle = '#172d3a';
  for (let i = 0; i < 32; i++) {
    const x = i * 17;
    const height = 8 + (i * 29) % 35;
    context.fillRect(x, 145 - height, 9 + i % 8, height + 111);
  }
  context.globalAlpha = 1;
  const texture = new THREE.CanvasTexture(canvas);
  texture.mapping = THREE.EquirectangularReflectionMapping;
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

export function createSkyLighting(scene, renderer, initialPreset = 'golden') {
  const pmrem = new THREE.PMREMGenerator(renderer);
  pmrem.compileEquirectangularShader();
  const skyMaterial = new THREE.MeshBasicMaterial({
    map: makeSkyTexture(presets.golden.sky), side: THREE.BackSide, depthWrite: false, fog: false,
  });
  const skyDome = new THREE.Mesh(new THREE.SphereGeometry(850, 32, 24), skyMaterial);
  scene.add(skyDome);
  const hemi = new THREE.HemisphereLight(0xa9d5ee, 0x53624f, 1);
  scene.add(hemi);
  const sun = new THREE.DirectionalLight(0xffe0a1, 2.45);
  sun.position.set(-180, 260, 100); sun.castShadow = true;
  sun.shadow.mapSize.set(1024, 1024);
  sun.shadow.camera.left = -240; sun.shadow.camera.right = 240;
  sun.shadow.camera.top = 240; sun.shadow.camera.bottom = -240;
  sun.shadow.bias = -.0004; scene.add(sun);
  const streetlights = [];
  for (const x of [-276, 0, 276]) for (const z of [-368, -184, 0, 184, 368]) {
    const lamp = new THREE.PointLight(0xffb66b, 0, 84, 2);
    lamp.position.set(x + (z % 2 ? 10 : -10), 8, z); scene.add(lamp); streetlights.push(lamp);
  }
  const glowCanvas = document.createElement('canvas');
  glowCanvas.width = 64; glowCanvas.height = 64;
  const glowContext = glowCanvas.getContext('2d');
  const glowGradient = glowContext.createRadialGradient(32, 32, 1, 32, 32, 31);
  glowGradient.addColorStop(0, 'rgba(255,244,218,1)');
  glowGradient.addColorStop(.28, 'rgba(255,188,112,.82)');
  glowGradient.addColorStop(1, 'rgba(255,130,83,0)');
  glowContext.fillStyle = glowGradient; glowContext.fillRect(0, 0, 64, 64);
  const glowTexture = new THREE.CanvasTexture(glowCanvas);
  const glow = new THREE.Sprite(new THREE.SpriteMaterial({
    map: glowTexture, color: 0xffe3aa, transparent: true, depthWrite: false,
    blending: THREE.AdditiveBlending, toneMapped: false,
  }));
  glow.scale.set(23, 23, 1); glow.position.set(-260, 24, -285); scene.add(glow);
  let environmentTarget = null, environmentSource = null;

  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFShadowMap;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.16;

  function setPreset(name = 'golden') {
    const key = presets[name] ? name : 'golden';
    const preset = presets[key];
    skyMaterial.map?.dispose();
    skyMaterial.map = makeSkyTexture(preset.sky, key === 'night');
    skyMaterial.needsUpdate = true;
    environmentSource?.dispose();
    environmentTarget?.dispose();
    environmentSource = makeEnvironmentTexture(preset.sky, key === 'night');
    environmentTarget = pmrem.fromEquirectangular(environmentSource);
    scene.environment = environmentTarget.texture;
    scene.userData.reflectionTexture = environmentSource;
    scene.background = new THREE.Color(preset.sky[preset.sky.length - 1]);
    scene.fog = new THREE.FogExp2(preset.fog, preset.fogDensity);
    hemi.color.setHex(preset.hemiSky);
    hemi.groundColor.setHex(preset.hemiGround);
    hemi.intensity = preset.ambient;
    sun.color.setHex(preset.sunColor);
    sun.intensity = preset.sun;
    sun.position.y = key === 'golden' ? 115 : key === 'night' ? 75 : 255;
    streetlights.forEach(light => { light.intensity = key === 'night' ? 760 : key === 'golden' ? .5 : 0; });
    glow.visible = key !== 'night';
    glow.material.color.setHex(key === 'day' ? 0xfff0cc : 0xffbd9c);
    scene.userData.lightingPreset = key;
    return key;
  }
  const tintNight = new THREE.Color(0x101e36);
  const emissiveMaterials = [];
  scene.userData.emissiveMaterials = emissiveMaterials;
  scene.userData.registerNightMaterial = material => emissiveMaterials.push(material);
  const applyNightLighting = key => {
    const night = key === 'night';
    emissiveMaterials.forEach(material => {
      material.emissiveIntensity = night ? material.userData.nightEmissive ?? .65 : material.userData.dayEmissive ?? .12;
    });
    scene.background = new THREE.Color(presetColor(key));
    if (night) scene.fog.color.set(tintNight);
  };
  function presetColor(key) { return presets[key].sky[presets[key].sky.length - 1]; }
  const initialSetPreset = setPreset;
  const setPresetAndMaterials = name => {
    const key = initialSetPreset(name);
    applyNightLighting(key);
    return key;
  };
  setPreset(initialPreset);
  return { sun, hemi, glow, dome: skyDome, streetlights, setPreset: setPresetAndMaterials, presets };
}
