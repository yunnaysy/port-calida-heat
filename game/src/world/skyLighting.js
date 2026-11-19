import * as THREE from 'three';

export function createSkyLighting(scene, renderer) {
  scene.background = new THREE.Color(0xe9a46e);
  scene.fog = new THREE.FogExp2(0xd99a73, .00165);
  const skyPaint = document.createElement('canvas');
  skyPaint.width = 8; skyPaint.height = 512;
  const skyContext = skyPaint.getContext('2d');
  const gradient = skyContext.createLinearGradient(0, 0, 0, skyPaint.height);
  gradient.addColorStop(0, '#193b47'); gradient.addColorStop(.42, '#5e9295');
  gradient.addColorStop(.72, '#e9a36b'); gradient.addColorStop(1, '#ffc27b');
  skyContext.fillStyle = gradient; skyContext.fillRect(0, 0, skyPaint.width, skyPaint.height);
  const skyDome = new THREE.Mesh(new THREE.SphereGeometry(850, 32, 24),
    new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(skyPaint), side: THREE.BackSide, depthWrite: false, fog: false, toneMapped: false }));
  scene.add(skyDome);
  const hemi = new THREE.HemisphereLight(0xffe2bd, 0x43575d, 2.6);
  scene.add(hemi);
  const sun = new THREE.DirectionalLight(0xffc987, 3.45);
  sun.position.set(-180, 260, 100); sun.castShadow = true;
  sun.shadow.mapSize.set(1024, 1024);
  sun.shadow.camera.left = -240; sun.shadow.camera.right = 240;
  sun.shadow.camera.top = 240; sun.shadow.camera.bottom = -240;
  sun.shadow.bias = -.0004; scene.add(sun);
  const glow = new THREE.Mesh(new THREE.SphereGeometry(9, 22, 16), new THREE.MeshBasicMaterial({ color: 0xffe3aa, toneMapped: false }));
  glow.position.set(-260, 145, -580); scene.add(glow);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.13;
  return { sun, hemi, glow };
}
