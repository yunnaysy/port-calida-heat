import * as THREE from 'three';

const fullscreenVertex = `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = vec4(position.xy, 0.0, 1.0);
  }
`;

function fullscreenPass(fragmentShader, uniforms) {
  const scene = new THREE.Scene();
  const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
  const material = new THREE.ShaderMaterial({
    uniforms,
    vertexShader: fullscreenVertex,
    fragmentShader,
    depthTest: false,
    depthWrite: false,
    toneMapped: false,
  });
  scene.add(new THREE.Mesh(new THREE.PlaneGeometry(2, 2), material));
  return { scene, camera, material };
}

export class RenderPass {
  constructor(scene, camera) { this.scene = scene; this.camera = camera; }
  render(renderer, target) {
    renderer.setRenderTarget(target);
    renderer.clear();
    renderer.render(this.scene, this.camera);
  }
}

export class UnrealBloomPass {
  constructor(width, height) {
    this.target = new THREE.WebGLRenderTarget(width, height, { depthBuffer: false });
    this.strength = .62;
    this.pass = fullscreenPass(`
      uniform sampler2D tDiffuse;
      uniform vec2 uTexel;
      uniform float uThreshold;
      varying vec2 vUv;
      vec3 bright(vec2 uv) {
        vec3 c = texture2D(tDiffuse, uv).rgb;
        float luma = dot(c, vec3(.2126, .7152, .0722));
        return c * smoothstep(uThreshold, uThreshold + .18, luma);
      }
      void main() {
        vec3 bloom = bright(vUv) * .22;
        bloom += bright(vUv + vec2(uTexel.x, 0.0)) * .12;
        bloom += bright(vUv - vec2(uTexel.x, 0.0)) * .12;
        bloom += bright(vUv + vec2(0.0, uTexel.y)) * .12;
        bloom += bright(vUv - vec2(0.0, uTexel.y)) * .12;
        bloom += bright(vUv + uTexel) * .075;
        bloom += bright(vUv - uTexel) * .075;
        bloom += bright(vUv + vec2(uTexel.x, -uTexel.y)) * .075;
        bloom += bright(vUv + vec2(-uTexel.x, uTexel.y)) * .075;
        gl_FragColor = vec4(bloom, 1.0);
      }
    `, {
      tDiffuse: { value: null },
      uTexel: { value: new THREE.Vector2(1 / width, 1 / height) },
      uThreshold: { value: .78 },
    });
  }
  render(renderer, source) {
    this.pass.material.uniforms.tDiffuse.value = source;
    renderer.setRenderTarget(this.target);
    renderer.render(this.pass.scene, this.pass.camera);
  }
  setSize(width, height) {
    this.target.setSize(width, height);
    this.pass.material.uniforms.uTexel.value.set(1 / width, 1 / height);
  }
}

export class ShaderPass {
  constructor(width, height) {
    this.target = new THREE.WebGLRenderTarget(width, height, { depthBuffer: false });
    this.pass = fullscreenPass(`
      uniform sampler2D tDiffuse;
      uniform sampler2D tBloom;
      uniform vec2 uSun;
      uniform float uBloomStrength;
      uniform float uShaftStrength;
      uniform float uCinematicFocus;
      varying vec2 vUv;
      float calcLuma(vec3 c) { return dot(c, vec3(.2126, .7152, .0722)); }
      void main() {
        vec3 color = texture2D(tDiffuse, vUv).rgb;
        vec3 bloom = texture2D(tBloom, vUv).rgb;
        color += bloom * uBloomStrength;

        color = (color - .5) * 1.035 + .5;

        vec2 ray = uSun - vUv;
        vec3 shafts = vec3(0.0);
        if (uShaftStrength > .001) {
          for (int i = 0; i < 10; i++) {
            float t = float(i + 1) / 11.0;
            vec3 sampleColor = texture2D(tDiffuse, vUv + ray * t).rgb;
            shafts += max(calcLuma(sampleColor) - .78, 0.0) * vec3(1.0, .66, .38);
          }
        }
        float edgeFade = smoothstep(.03, .38, length(ray));
        color += shafts * uShaftStrength * edgeFade * .0018;

        float vignette = 1.0 - smoothstep(.28, .92, length((vUv - .5) * vec2(1.0, .92)));
        color *= mix(.88, 1.0, vignette);
        if (uCinematicFocus > .5) {
          vec2 offset = (vUv - .5) * .0012;
          vec3 soft = texture2D(tDiffuse, vUv + offset).rgb * .25;
          soft += texture2D(tDiffuse, vUv - offset).rgb * .25;
          soft += texture2D(tDiffuse, vUv + vec2(-offset.y, offset.x)).rgb * .25;
          soft += texture2D(tDiffuse, vUv - vec2(-offset.y, offset.x)).rgb * .25;
          color = mix(color, soft + bloom * uBloomStrength, .16);
        }
        gl_FragColor = vec4(color, 1.0);
      }
    `, {
      tDiffuse: { value: null },
      tBloom: { value: null },
      uSun: { value: new THREE.Vector2(.5, .5) },
      uBloomStrength: { value: .62 },
      uShaftStrength: { value: 0 },
      uCinematicFocus: { value: 0 },
    });
  }
  render(renderer, source, bloom, sunPosition, shafts, focus) {
    const uniforms = this.pass.material.uniforms;
    uniforms.tDiffuse.value = source;
    uniforms.tBloom.value = bloom;
    uniforms.uSun.value.copy(sunPosition);
    uniforms.uShaftStrength.value = shafts;
    uniforms.uCinematicFocus.value = focus ? 1 : 0;
    renderer.setRenderTarget(this.target);
    renderer.render(this.pass.scene, this.pass.camera);
  }
  setSize(width, height) { this.target.setSize(width, height); }
}

export class OutputPass {
  constructor() {
    this.pass = fullscreenPass(`
      uniform sampler2D tDiffuse;
      varying vec2 vUv;
      void main() {
        gl_FragColor = texture2D(tDiffuse, vUv);
        #include <colorspace_fragment>
      }
    `, { tDiffuse: { value: null } });
  }
  render(renderer, source) {
    this.pass.material.uniforms.tDiffuse.value = source;
    renderer.setRenderTarget(null);
    renderer.render(this.pass.scene, this.pass.camera);
  }
}

export class EffectComposer {
  constructor(renderer, scene, camera, sun) {
    this.renderer = renderer;
    this.scene = scene;
    this.camera = camera;
    this.sun = sun;
    this.enabled = true;
    const width = Math.max(1, Math.floor(window.innerWidth * renderer.getPixelRatio()));
    const height = Math.max(1, Math.floor(window.innerHeight * renderer.getPixelRatio()));
    this.target = new THREE.WebGLRenderTarget(width, height, { depthBuffer: true });
    this.renderPass = new RenderPass(scene, camera);
    this.bloomPass = new UnrealBloomPass(width, height);
    this.gradePass = new ShaderPass(width, height);
    this.outputPass = new OutputPass();
    this.passes = [this.renderPass, this.bloomPass, this.gradePass, this.outputPass];
  }
  setEnabled(enabled) { this.enabled = enabled; }
  setSize(width, height) {
    const ratio = this.renderer.getPixelRatio();
    const w = Math.max(1, Math.floor(width * ratio)), h = Math.max(1, Math.floor(height * ratio));
    this.target.setSize(w, h);
    this.bloomPass.setSize(w, h);
    this.gradePass.setSize(w, h);
  }
  render(camera, cinematic, preset) {
    if (!this.enabled) {
      this.renderer.setRenderTarget(null);
      this.renderer.render(this.scene, camera);
      return;
    }
    this.renderPass.camera = camera;
    this.renderPass.render(this.renderer, this.target);
    this.bloomPass.render(this.renderer, this.target.texture);
    const activePreset = typeof preset === 'string' ? preset : this.scene.userData.lightingPreset;
    const projected = this.sun.position.clone().project(camera);
    const sunPosition = new THREE.Vector2(projected.x * .5 + .5, projected.y * .5 + .5);
    const visible = projected.z < 1 && Math.abs(projected.x) < 1.2 && Math.abs(projected.y) < 1.2;
    this.gradePass.pass.material.uniforms.uBloomStrength.value = this.bloomPass.strength;
    this.gradePass.render(this.renderer, this.target.texture, this.bloomPass.target.texture,
      sunPosition, visible && activePreset === 'golden' ? .34 : 0, cinematic);
    this.outputPass.render(this.renderer, this.gradePass.target.texture);
  }
}
