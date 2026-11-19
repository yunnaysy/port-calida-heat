import * as THREE from 'three';
import { CITY, COLORS } from '../config.js';

const facade = [0xd9c3a0, 0xf0a18b, 0xc3b89e, 0x91adb1, 0xe7bd87, 0xd88783];

function windowTexture(random, tint) {
  const canvas = document.createElement('canvas');
  canvas.width = 256; canvas.height = 512;
  const ctx = canvas.getContext('2d');
  const lights = document.createElement('canvas');
  lights.width = canvas.width; lights.height = canvas.height;
  const lightContext = lights.getContext('2d');
  ctx.fillStyle = `#${tint.toString(16).padStart(6, '0')}`; ctx.fillRect(0, 0, 256, 512);
  ctx.fillStyle = '#fff0d5'; ctx.fillRect(0, 8, 256, 9);
  for (let y = 28; y < 500; y += 38) {
    for (let x = 14; x < 248; x += 38) {
      const lit = random() > .78;
      ctx.fillStyle = lit ? '#d9ad68' : '#243a43';
      ctx.fillRect(x, y, 22, 24);
      if (lit) { lightContext.fillStyle = '#fff'; lightContext.fillRect(x, y, 22, 24); }
      ctx.fillStyle = 'rgba(255,232,189,.46)'; ctx.fillRect(x + 2, y + 2, 2, 20);
      ctx.fillStyle = 'rgba(18,39,44,.9)'; ctx.fillRect(x - 2, y - 2, 26, 2);
      ctx.fillRect(x - 2, y + 24, 26, 2); ctx.fillRect(x - 2, y - 2, 2, 28);
      ctx.fillRect(x + 22, y - 2, 2, 28); ctx.fillRect(x + 9, y, 2, 24);
      ctx.fillStyle = '#ead3ad'; ctx.fillRect(x - 2, y + 24, 26, 3);
    }
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  const emissiveMap = new THREE.CanvasTexture(lights);
  emissiveMap.colorSpace = THREE.SRGBColorSpace;
  return { texture, emissiveMap };
}

function makeSign(random, text) {
  const canvas = document.createElement('canvas');
  canvas.width = 512; canvas.height = 96;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#10242a'; ctx.fillRect(0, 0, 512, 96);
  ctx.strokeStyle = '#f6bd66'; ctx.lineWidth = 5; ctx.strokeRect(4, 4, 504, 88);
  ctx.shadowColor = '#ef9d59'; ctx.shadowBlur = 18;
  ctx.fillStyle = random() > .5 ? '#ffe3a3' : '#f4a478';
  ctx.font = '900 38px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText(text, 256, 49);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

export function addBuildings(scene, random) {
  const buildings = new THREE.Group();
  const textures = facade.map(color => windowTexture(random, color));
  const signNames = ['LUNA MOTEL', 'MARÉ MARKET', 'CALIDA ARMS', 'PALOMA', 'BLUE FIN', 'SOLANA'];
  for (let gx = -4; gx <= 3; gx++) for (let gz = -4; gz <= 3; gz++) {
    if (random() < .08) continue;
    const x = gx * CITY.spacing + CITY.spacing / 2, z = gz * CITY.spacing + CITY.spacing / 2;
    const w = 39 + random() * 25, d = 38 + random() * 24;
    const height = 13 + Math.floor(random() * 4) * 5 + (Math.abs(gx) < 2 && Math.abs(gz) < 2 ? 10 : 0);
    const colorIndex = Math.floor(random() * textures.length);
    const material = new THREE.MeshStandardMaterial({
      map: textures[colorIndex].texture, emissiveMap: textures[colorIndex].emissiveMap,
      emissive: 0xffb76b, emissiveIntensity: .12, roughness: .78, metalness: .04,
    });
    material.userData.dayEmissive = .1;
    material.userData.nightEmissive = .95;
    scene.userData.registerNightMaterial?.(material);
    const body = new THREE.Mesh(new THREE.BoxGeometry(w, height, d), material);
    body.position.set(x, height / 2, z); body.castShadow = true; body.receiveShadow = true;
    buildings.add(body);
    if (height > 30 && random() > .38) {
      const bands = new THREE.MeshStandardMaterial({ color: [0xf3d2a3, 0x7aa5a4, 0xd98972][Math.floor(random() * 3)], roughness: .7 });
      for (const y of [height * .24, height * .48, height * .72]) {
        const band = new THREE.Mesh(new THREE.BoxGeometry(w + 1.4, .58, d + 1.4), bands);
        band.position.set(x, y, z); buildings.add(band);
      }
      const cornerGeometry = new THREE.CylinderGeometry(2.4, 2.4, height, 12, 1, false, 0, Math.PI);
      const corner = new THREE.Mesh(cornerGeometry, material);
      corner.position.set(x - w / 2 + 1.2, height / 2, z + d / 2 - 1.2);
      corner.rotation.y = Math.PI / 2; buildings.add(corner);
    }
    const roof = new THREE.Mesh(new THREE.BoxGeometry(w + 1, 1, d + 1), new THREE.MeshStandardMaterial({ color: COLORS.cream, roughness: 1 }));
    roof.position.set(x, height + .5, z); buildings.add(roof);
    if (height < 25) {
      const storefrontBand = new THREE.Mesh(new THREE.BoxGeometry(w + .35, 1.15, d + .35),
        new THREE.MeshStandardMaterial({ color: [0x568b83, 0x9a6250, 0x777e70][colorIndex % 3], roughness: .8 }));
      storefrontBand.position.set(x, 1.25, z); buildings.add(storefrontBand);
    }
    const parapet = new THREE.Mesh(new THREE.BoxGeometry(w + 1.8, .42, d + 1.8),
      new THREE.MeshStandardMaterial({ color: colorIndex % 2 ? 0xf3d7ae : 0xe7bd87, roughness: .74 }));
    parapet.position.set(x, height + 1.12, z); buildings.add(parapet);
    if (height > 25) {
      const crown = new THREE.Mesh(new THREE.BoxGeometry(w * .62, 3.2, d * .66), new THREE.MeshStandardMaterial({ color: facade[colorIndex], roughness: .88 }));
      crown.position.set(x, height + 2.5, z); crown.castShadow = true; buildings.add(crown);
      const cap = new THREE.Mesh(new THREE.BoxGeometry(w * .7, .45, d * .74), new THREE.MeshStandardMaterial({ color: 0xe7bd87, roughness: .75 }));
      cap.position.set(x, height + 4.25, z); buildings.add(cap);
    }
    if (height > 25) {
      const ledge = new THREE.Mesh(new THREE.BoxGeometry(w + 2, .4, d + 2), new THREE.MeshStandardMaterial({ color: 0xe6b885 }));
      ledge.position.set(x, height * .64, z); buildings.add(ledge);
      const rooftop = new THREE.Mesh(new THREE.BoxGeometry(w * .24, 2.8, d * .2), new THREE.MeshStandardMaterial({ color: 0x667775, roughness: .9 }));
      rooftop.position.set(x + w * .18, height + 2.1, z - d * .14); buildings.add(rooftop);
    }
    if (random() > .52) {
      const trim = new THREE.Mesh(new THREE.BoxGeometry(.52, height - 2, .5), new THREE.MeshStandardMaterial({ color: 0xf2d6ae, roughness: .86 }));
      trim.position.set(x - w * .42, height / 2, z + d / 2 + .12); buildings.add(trim);
    }
    if (random() > .45) {
      const sign = new THREE.Mesh(new THREE.PlaneGeometry(Math.min(w - 4, 27), 4.7), new THREE.MeshBasicMaterial({ map: makeSign(random, signNames[Math.floor(random() * signNames.length)]), side: THREE.DoubleSide, toneMapped: false }));
      sign.position.set(x, Math.min(height - 2, 9), z + d / 2 + .08); buildings.add(sign);
      if (height < 25) {
        const awning = new THREE.Mesh(new THREE.BoxGeometry(Math.min(w - 3, 24), .42, 3.2),
          new THREE.MeshStandardMaterial({ color: [0x6a9c91, 0xc9745c, 0xe4b65f][Math.floor(random() * 3)], roughness: .82 }));
        awning.position.set(x, 5.2, z + d / 2 + 1.5); buildings.add(awning);
      }
      if (random() > .55 && height > 25) {
        const balcony = new THREE.Mesh(new THREE.BoxGeometry(w * .55, .25, 2.8), new THREE.MeshStandardMaterial({ color: 0xe6c69d, metalness: .28 }));
        balcony.position.set(x, height * .38, z + d / 2 + 1); buildings.add(balcony);
        for (let post = -2; post <= 2; post++) {
          const railPost = new THREE.Mesh(new THREE.BoxGeometry(.12, 1.2, .12), balcony.material);
          railPost.position.set(x + post * w * .1, height * .38 + .65, z + d / 2 + 2.2); buildings.add(railPost);
        }
      }
    }
  }
  scene.add(buildings);
  return buildings;
}
