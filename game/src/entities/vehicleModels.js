import * as THREE from 'three';

const carPaint = color => new THREE.MeshStandardMaterial({ color, roughness: .34, metalness: .25 });
const rubber = new THREE.MeshStandardMaterial({ color: 0x202426, roughness: .9 });
const glass = new THREE.MeshStandardMaterial({ color: 0x31535a, roughness: .18, metalness: .18, transparent: true, opacity: .84 });
const glowCanvas = document.createElement('canvas');
glowCanvas.width = 64; glowCanvas.height = 64;
const glowContext = glowCanvas.getContext('2d');
const glowGradient = glowContext.createRadialGradient(32, 32, 2, 32, 32, 31);
glowGradient.addColorStop(0, 'rgba(255,255,255,1)');
glowGradient.addColorStop(.24, 'rgba(255,255,255,.72)');
glowGradient.addColorStop(1, 'rgba(255,255,255,0)');
glowContext.fillStyle = glowGradient; glowContext.fillRect(0, 0, 64, 64);
const glowTexture = new THREE.CanvasTexture(glowCanvas);

export function createVehicleModel(kind = 'coupe', color = 0xc36c4f) {
  const root = new THREE.Group();
  const paint = carPaint(color);
  const sizes = {
    coupe: [4.1, 1.15, 7.6], taxi: [4.25, 1.25, 7.3], cruiser: [4.35, 1.3, 7.8],
    suv: [4.5, 1.65, 7.2], compact: [3.8, 1.1, 6.5], muscle: [4.6, 1.35, 8.2],
  };
  const [width, height, length] = sizes[kind] ?? sizes.coupe;
  const bodyHeight = kind === 'coupe' ? .98 : height;
  const bodyY = kind === 'coupe' ? .98 : 1.05;
  const base = new THREE.Mesh(new THREE.BoxGeometry(width, bodyHeight, length), paint);
  base.position.y = bodyY; base.castShadow = true; base.receiveShadow = true; root.add(base);
  const cabinHeight = kind === 'suv' ? 1.35 : kind === 'coupe' ? .72 : .95;
  const cabinY = kind === 'coupe' ? 1.76 : 2.03;
  const cabin = new THREE.Mesh(new THREE.BoxGeometry(width * .72, cabinHeight, length * .48), glass);
  cabin.position.set(0, cabinY, .15); cabin.castShadow = true; root.add(cabin);
  const roof = new THREE.Mesh(new THREE.BoxGeometry(width * .68, .14, length * .45), paint);
  roof.position.set(0, kind === 'coupe' ? 2.17 : 2.55, .15); root.add(roof);
  const hood = new THREE.Mesh(new THREE.BoxGeometry(width * .85, .17, length * .24), paint);
  hood.position.set(0, kind === 'coupe' ? 1.52 : 1.68, -length * .34); root.add(hood);
  const bumper = new THREE.Mesh(new THREE.BoxGeometry(width * .94, .25, .26), new THREE.MeshStandardMaterial({ color: 0xd8c39c, metalness: .45, roughness: .35 }));
  bumper.position.set(0, .8, -length * .49); root.add(bumper);
  const lamps = new THREE.MeshStandardMaterial({ color: 0xffe6aa, emissive: 0xffd079, emissiveIntensity: 1.3 });
  const brake = new THREE.MeshStandardMaterial({ color: 0xea574a, emissive: 0x9b160b, emissiveIntensity: 1 });
  for (const side of [-1, 1]) {
    const tire = new THREE.Mesh(new THREE.CylinderGeometry(.63, .63, .38, 12), rubber);
    tire.rotation.z = Math.PI / 2; tire.position.set(side * (width / 2 - .08), .65, -length * .28); root.add(tire);
    const rear = tire.clone(); rear.position.z = length * .31; root.add(rear);
    const headlight = new THREE.Mesh(new THREE.BoxGeometry(.8, .25, .12), lamps);
    headlight.position.set(side * width * .31, kind === 'coupe' ? 1.16 : 1.25, -length * .5); root.add(headlight);
    const taillight = new THREE.Mesh(new THREE.BoxGeometry(.66, .25, .12), brake);
    taillight.position.set(side * width * .32, kind === 'coupe' ? 1.16 : 1.25, length * .5); root.add(taillight);
  }
  if (kind === 'taxi') {
    const cap = new THREE.Mesh(new THREE.BoxGeometry(1.45, .35, .68), new THREE.MeshStandardMaterial({ color: 0xf2c85c }));
    cap.position.set(0, 2.85, .15); root.add(cap);
  }
  if (kind === 'cruiser') {
    const stripe = new THREE.MeshStandardMaterial({ color: 0x287a95, roughness: .5, metalness: .2 });
    const labelCanvas = document.createElement('canvas');
    labelCanvas.width = 256; labelCanvas.height = 64;
    const labelContext = labelCanvas.getContext('2d');
    labelContext.fillStyle = '#e9e5d7'; labelContext.fillRect(0, 0, 256, 64);
    labelContext.fillStyle = '#17657b'; labelContext.font = '900 42px sans-serif'; labelContext.textAlign = 'center'; labelContext.textBaseline = 'middle';
    labelContext.fillText('PCPD', 128, 33);
    const doorBadge = new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(labelCanvas), side: THREE.DoubleSide });
    for (const side of [-1, 1]) {
      const doorStripe = new THREE.Mesh(new THREE.BoxGeometry(.06, .3, length * .38), stripe);
      doorStripe.position.set(side * (width / 2 + .02), 1.15, .12); root.add(doorStripe);
      const badge = new THREE.Mesh(new THREE.PlaneGeometry(1.7, .43), doorBadge);
      badge.position.set(side * (width / 2 + .06), 1.48, .1);
      badge.rotation.y = side * Math.PI / 2; root.add(badge);
    }
    const bar = new THREE.Mesh(new THREE.BoxGeometry(1.9, .28, .48), new THREE.MeshStandardMaterial({ color: 0x263e48 }));
    bar.position.set(0, 2.72, .12); root.add(bar);
    for (const side of [-1, 1]) {
      const color = side < 0 ? 0x237de7 : 0xe83939;
      const light = new THREE.Mesh(new THREE.BoxGeometry(.7, .36, .44),
        new THREE.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: 3.2, toneMapped: false }));
      light.position.set(side * .52, 2.92, .12); root.add(light);
      const glow = new THREE.PointLight(color, 17, 15, 2);
      glow.position.set(side * .52, 3.05, .12); glow.userData.sirenColor = color; root.add(glow);
      const halo = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTexture, color, transparent: true, opacity: .82, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false }));
      halo.position.copy(glow.position); halo.scale.set(4.2, 3.1, 1); root.add(halo);
    }
  }
  if (kind === 'coupe' || kind === 'muscle') {
    const wing = new THREE.Mesh(new THREE.BoxGeometry(width * .72, .12, .48), paint);
    wing.position.set(0, 1.95, length * .48); root.add(wing);
    for (const side of [-1, 1]) {
      const support = new THREE.Mesh(new THREE.BoxGeometry(.12, .38, .12), paint);
      support.position.set(side * width * .27, 1.78, length * .46); root.add(support);
    }
  }
  root.userData.kind = kind; root.userData.width = width; root.userData.length = length;
  root.userData.headlightMaterial = lamps;
  return root;
}
