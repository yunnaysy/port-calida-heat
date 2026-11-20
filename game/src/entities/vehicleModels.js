import * as THREE from 'three';

const carPaint = color => {
  const material = new THREE.MeshPhysicalMaterial({
    color, roughness: .17, metalness: .42, clearcoat: 1, clearcoatRoughness: .1, envMapIntensity: 1.8,
  });
  material.userData.carPaint = true;
  return material;
};
const rubber = new THREE.MeshStandardMaterial({ color: 0x202426, roughness: .88 });
const wheelMetal = new THREE.MeshStandardMaterial({ color: 0xc3bca9, metalness: .78, roughness: .25 });
const glass = new THREE.MeshPhysicalMaterial({
  color: 0x29434b, roughness: .12, metalness: .12, clearcoat: .8,
  transparent: true, opacity: .48, envMapIntensity: 1.8, side: THREE.DoubleSide,
});
const lamps = new THREE.MeshStandardMaterial({ color: 0xfff0ce, emissive: 0xffd079, emissiveIntensity: 1.3 });
const brake = new THREE.MeshStandardMaterial({ color: 0xea574a, emissive: 0x9b160b, emissiveIntensity: 1 });
const chrome = new THREE.MeshStandardMaterial({ color: 0xb9c2ba, metalness: .72, roughness: .29 });
const sirenCanvas = document.createElement('canvas');
sirenCanvas.width = 64; sirenCanvas.height = 64;
const sirenContext = sirenCanvas.getContext('2d');
const sirenGradient = sirenContext.createRadialGradient(32, 32, 2, 32, 32, 31);
sirenGradient.addColorStop(0, 'rgba(255,255,255,1)');
sirenGradient.addColorStop(.24, 'rgba(255,255,255,.72)');
sirenGradient.addColorStop(1, 'rgba(255,255,255,0)');
sirenContext.fillStyle = sirenGradient; sirenContext.fillRect(0, 0, 64, 64);
const sirenTexture = new THREE.CanvasTexture(sirenCanvas);

function mergeGeometries(parts) {
  const merged = new THREE.BufferGeometry();
  const positions = [], normals = [], uvs = [], indices = [];
  let offset = 0;
  for (const { geometry, matrix } of parts) {
    const transformed = geometry.clone();
    transformed.applyMatrix4(matrix);
    const position = transformed.getAttribute('position');
    const normal = transformed.getAttribute('normal');
    const uv = transformed.getAttribute('uv');
    for (let i = 0; i < position.count; i++) {
      positions.push(position.getX(i), position.getY(i), position.getZ(i));
      normals.push(normal.getX(i), normal.getY(i), normal.getZ(i));
      if (uv) uvs.push(uv.getX(i), uv.getY(i));
    }
    if (transformed.index) {
      for (const index of transformed.index.array) indices.push(index + offset);
    } else {
      for (let i = 0; i < position.count; i++) indices.push(i + offset);
    }
    offset += position.count;
    transformed.dispose();
  }
  merged.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  merged.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
  if (uvs.length) merged.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  merged.setIndex(indices);
  return merged;
}

function loftBody(width, length) {
  const stations = [
    [-.5, .76, .52, .94, 1.06], [-.42, .94, .52, 1.13, 1.3],
    [-.24, 1, .52, 1.2, 1.4], [-.06, .98, .52, 1.2, 1.43],
    [.22, .97, .52, 1.18, 1.4], [.4, .9, .52, 1.1, 1.27],
    [.5, .74, .52, .92, 1.04],
  ];
  const profile = [
    [-1, 0], [-1, .58], [-.82, 1], [-.48, 1], [0, 1],
    [.48, 1], [.82, 1], [1, .58], [1, 0],
  ];
  const vertices = [];
  for (const [z, widthScale, bottom, side, top] of stations) {
    for (const [xScale, yLevel] of profile) {
      const y = yLevel === 0 ? bottom : yLevel === .58 ? side : top;
      vertices.push(xScale * width * widthScale * .5, y, z * length);
    }
  }
  const indices = [];
  const ringSize = profile.length;
  for (let station = 0; station < stations.length - 1; station++) {
    for (let point = 0; point < ringSize - 1; point++) {
      const a = station * ringSize + point, b = a + ringSize;
      indices.push(a, b, a + 1, a + 1, b, b + 1);
    }
    const leftA = station * ringSize, leftB = leftA + ringSize;
    const rightA = leftA + ringSize - 1, rightB = rightA + ringSize;
    indices.push(leftA, leftA + 1, leftB, rightA, rightA - 1, rightB);
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return geometry;
}

function paneGeometry(width, length) {
  const vertices = [];
  const quad = points => vertices.push(...points.flat());
  const w = width * .35;
  quad([[-w, 1.34, -length * .18], [w, 1.34, -length * .18], [w * .9, 2.12, -length * .035], [-w * .9, 2.12, -length * .035]]);
  quad([[-w * .9, 2.12, length * .2], [w * .9, 2.12, length * .2], [w, 1.3, length * .39], [-w, 1.3, length * .39]]);
  for (const side of [-1, 1]) {
    const x = side * width * .365;
    quad([[x, 1.34, -length * .16], [x, 2.1, -length * .035], [x, 2.1, length * .19], [x, 1.3, length * .36]]);
    quad([[x, 1.34, -length * .16], [x, 1.29, -length * .3], [x, 1.28, length * .39], [x, 1.3, length * .36]]);
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
  const indices = [];
  for (let i = 0; i < vertices.length / 3; i += 4) indices.push(i, i + 1, i + 2, i, i + 2, i + 3);
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return geometry;
}

function part(geometry, position = [0, 0, 0], rotation = [0, 0, 0]) {
  const matrix = new THREE.Matrix4().compose(
    new THREE.Vector3(...position),
    new THREE.Quaternion().setFromEuler(new THREE.Euler(...rotation)),
    new THREE.Vector3(1, 1, 1),
  );
  return { geometry, matrix };
}

function meshFromParts(parts, material, root) {
  const mesh = new THREE.Mesh(mergeGeometries(parts), material);
  mesh.castShadow = true; mesh.receiveShadow = true; root.add(mesh);
  return mesh;
}

export function createVehicleModel(kind = 'coupe', color = 0xc36c4f) {
  const root = new THREE.Group();
  const paint = carPaint(color);
  const sizes = {
    coupe: [4.1, 1.15, 7.6], taxi: [4.25, 1.25, 7.3], cruiser: [4.35, 1.3, 7.8],
    suv: [4.5, 1.65, 7.2], compact: [3.8, 1.1, 6.5], muscle: [4.6, 1.35, 8.2],
  };
  const [width, height, length] = sizes[kind] ?? sizes.coupe;
  const paintParts = [part(loftBody(width, length))];
  const glassParts = [part(paneGeometry(width, length))];
  const chromeParts = [];

  paintParts.push(part(new THREE.BoxGeometry(width * .68, .14, length * .29), [0, 2.13, length * .075]));
  paintParts.push(part(new THREE.BoxGeometry(width * .88, .16, length * .08), [0, .8, -length * .48]));
  paintParts.push(part(new THREE.BoxGeometry(width * .88, .16, length * .07), [0, .8, length * .48]));
  for (const side of [-1, 1]) {
    paintParts.push(part(new THREE.BoxGeometry(.2, .22, length * .66), [side * width * .46, .62, -.01]));
    for (const z of [-length * .29, length * .31]) {
      const arch = new THREE.TorusGeometry(.79, .085, 6, 18, Math.PI);
      chromeParts.push(part(arch, [side * width * .5, .65, z], [0, Math.PI / 2, 0]));
      arch.dispose();
    }
  }
  const roof = new THREE.Mesh(new THREE.BoxGeometry(width * .68, .14, length * .29), paint);
  roof.position.set(0, 2.13, length * .075); roof.castShadow = true; roof.receiveShadow = true; root.add(roof);
  paintParts.splice(1, 1);
  meshFromParts(paintParts, paint, root);
  meshFromParts(glassParts, glass, root);
  if (chromeParts.length) meshFromParts(chromeParts, chrome, root);

  const wheelGroups = [];
  for (const side of [-1, 1]) for (const z of [-length * .29, length * .31]) {
    const wheel = new THREE.Group();
    wheel.position.set(side * (width / 2 - .08), .65, z);
    wheel.rotation.z = Math.PI / 2;
    const tire = new THREE.Mesh(new THREE.CylinderGeometry(.63, .63, .38, 12), rubber);
    tire.castShadow = true; tire.receiveShadow = true; wheel.add(tire);
    const hub = new THREE.Mesh(new THREE.CylinderGeometry(.31, .31, .4, 10), wheelMetal);
    hub.position.x = side * .025; wheel.add(hub);
    root.add(wheel); wheelGroups.push(wheel);
  }
  const splitLights = (material, z, y, span, segmentWidth) => {
    const pieces = [];
    for (const side of [-1, 1]) {
      pieces.push(part(new THREE.BoxGeometry(segmentWidth, .19, .09), [side * (span / 2), y, z]));
    }
    meshFromParts(pieces, material, root);
  };
  splitLights(lamps, -length * .492, 1.05, width * .44, width * .36);
  splitLights(brake, length * .492, 1.04, width * .52, width * .43);
  const bumper = new THREE.MeshStandardMaterial({ color: 0x39464a, metalness: .58, roughness: .35 });
  meshFromParts([
    part(new THREE.BoxGeometry(width * .9, .2, .2), [0, .66, -length * .5]),
    part(new THREE.BoxGeometry(width * .9, .2, .2), [0, .66, length * .5]),
  ], bumper, root);

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
    const labelTexture = new THREE.CanvasTexture(labelCanvas);
    labelTexture.colorSpace = THREE.SRGBColorSpace;
    const doorBadge = new THREE.MeshBasicMaterial({ map: labelTexture, side: THREE.DoubleSide });
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
      const material = new THREE.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: 3.2, toneMapped: false });
      const light = new THREE.Mesh(new THREE.BoxGeometry(.7, .36, .44), material);
      light.position.set(side * .52, 2.92, .12); light.userData.sirenColor = color; root.add(light);
      const glow = new THREE.PointLight(color, 17, 15, 2);
      glow.position.set(side * .52, 3.05, .12); glow.userData.sirenColor = color; root.add(glow);
      const halo = new THREE.Sprite(new THREE.SpriteMaterial({
        map: sirenTexture, color, transparent: true, opacity: .82, depthWrite: false,
        blending: THREE.AdditiveBlending, toneMapped: false,
      }));
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
  root.userData.wheels = wheelGroups;
  return root;
}
