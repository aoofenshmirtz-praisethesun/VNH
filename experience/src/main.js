import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { Line2 } from 'three/addons/lines/Line2.js';
import { LineMaterial } from 'three/addons/lines/LineMaterial.js';
import { LineGeometry } from 'three/addons/lines/LineGeometry.js';

import compositeVert from './shaders/composite.vert';
import compositeFrag from './shaders/composite.frag';

// ─── Palette (from spec, verbatim) ───
const BG    = new THREE.Color('#fdfcf5');
const SHEET = new THREE.Color('#f4efe4');
const INK   = new THREE.Color('#22201c');

// ─── Projection — metric-corrected equirectangular ───
const B = { minLon: 78.86942, maxLon: 79.39945, minLat: 20.95135, maxLat: 21.32682 };
const cLon = (B.minLon + B.maxLon) / 2;
const cLat = (B.minLat + B.maxLat) / 2;
const kx   = Math.cos(cLat * Math.PI / 180);

const spanX = (B.maxLon - B.minLon) * kx;
const spanY = (B.maxLat - B.minLat);

const FIT = 100;
const S   = FIT / Math.max(spanX, spanY);

function project(lon, lat) {
  return [(lon - cLon) * kx * S, -(lat - cLat) * S];
}

// ─── Renderer ───
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
const dpr = Math.min(window.devicePixelRatio, 2);
renderer.setPixelRatio(dpr);
renderer.setClearColor(BG, 1);
renderer.outputColorSpace = THREE.SRGBColorSpace;   // B5: get this right or parchment goes grey
document.body.appendChild(renderer.domElement);

// ─── Scene ───
const scene = new THREE.Scene();
scene.background = BG.clone();

// ─── Camera ───
const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(0, 120, 70);
camera.lookAt(0, 0, 0);

// ─── Orbit Controls ───
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.08;

// ─── Flat Plane — fading edge, no hard border for Sobel ───
const planeMat = new THREE.ShaderMaterial({
  uniforms: { uSheet: { value: SHEET }, uBg: { value: BG } },
  vertexShader: `
    varying vec2 vP;
    void main() {
      vP = uv - 0.5;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: `
    varying vec2 vP;
    uniform vec3 uSheet;
    uniform vec3 uBg;
    void main() {
      float d = max(abs(vP.x), abs(vP.y)) * 2.0;
      float k = smoothstep(0.30, 0.92, d);
      gl_FragColor = vec4(mix(uSheet, uBg, k), 1.0);
    }
  `,
});
const plane = new THREE.Mesh(
  new THREE.PlaneGeometry(FIT * 3, FIT * 3),
  planeMat
);
plane.rotation.x = -Math.PI / 2;
plane.layers.enable(1);   // B2: plane enters normal pass (layer 1)
scene.add(plane);

// ─── NO LIGHTS — nothing in this build is lit ───

// ─── Line materials — SCREEN PIXELS, not world units ───
const PEN = {
  river:  { width: 3.0, color: '#7c9497' },
  canal:  { width: 2.2, color: '#8fa6a8' },
  stream: { width: 1.6, color: '#8fa6a8' },
  drain:  { width: 1.1, color: '#a3b5b6' },
};

const lineMats = {};
for (const [k, v] of Object.entries(PEN)) {
  const m = new LineMaterial({
    color: new THREE.Color(v.color),
    linewidth: v.width,
    worldUnits: false,
    dashed: false,
    transparent: false,
  });
  m.resolution.set(renderer.domElement.width, renderer.domElement.height);
  lineMats[k] = m;
}

// ─── Load Waterways ───
async function loadWaterways() {
  const res = await fetch('/data/waterways.json');
  const waterways = await res.json();

  let count = 0;
  for (const f of waterways) {
    const pts = [];
    for (const [lon, lat] of f.p) {
      const [x, z] = project(lon, lat);
      pts.push(x, 0.02, z);
    }
    if (pts.length < 6) continue;

    const g = new LineGeometry();
    g.setPositions(pts);

    const line = new Line2(g, lineMats[f.w] || lineMats.stream);
    line.computeLineDistances();
    line.renderOrder = 2;
    // B2: Line2 stays on layer 0 ONLY — must NOT enter the normal pass
    scene.add(line);
    count++;
  }
  console.log(`Loaded ${count} waterways`);
}
loadWaterways();

// ═══════════════════════════════════════════════════════════════
// PART B — STEP 3: Composite Shader Pipeline
// ═══════════════════════════════════════════════════════════════

// ─── B3: Noise texture — procedural, tileable ───
function makeNoiseTexture(size = 256, lattice = 8) {
  const L = lattice;
  const hash = (x, y) => {
    const xi = ((x % L) + L) % L, yi = ((y % L) + L) % L;
    const s = Math.sin(xi * 127.1 + yi * 311.7) * 43758.5453;
    return s - Math.floor(s);
  };
  const vn = (x, y) => {
    const ix = Math.floor(x), iy = Math.floor(y);
    const fx = x - ix, fy = y - iy;
    const ux = fx * fx * (3 - 2 * fx), uy = fy * fy * (3 - 2 * fy);
    const a = hash(ix, iy), b = hash(ix + 1, iy), c = hash(ix, iy + 1), e = hash(ix + 1, iy + 1);
    return (a * (1 - ux) + b * ux) * (1 - uy) + (c * (1 - ux) + e * ux) * uy;
  };
  const fbm = (x, y, seed) => {
    let v = 0, a = 0.5, f = 1;
    for (let i = 0; i < 4; i++) { v += a * vn(x * f + seed * 37, y * f + seed * 17); f *= 2; a *= 0.5; }
    return v;
  };
  const d = new Uint8Array(size * size * 4);
  for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
    const i = (y * size + x) * 4, u = x / size * L, v = y / size * L;
    d[i] = fbm(u, v, 0) * 255; d[i + 1] = fbm(u, v, 1) * 255; d[i + 2] = fbm(u, v, 2) * 255; d[i + 3] = 255;
  }
  const t = new THREE.DataTexture(d, size, size, THREE.RGBAFormat);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.minFilter = t.magFilter = THREE.LinearFilter;
  t.colorSpace = THREE.NoColorSpace;   // DATA, not colour. sRGB decode would corrupt offsets.
  t.needsUpdate = true;
  return t;
}

const noiseTex = makeNoiseTexture();

// ─── B1: Render targets ───
const W = () => Math.floor(window.innerWidth * dpr);
const H = () => Math.floor(window.innerHeight * dpr);

const rtOpts = { type: THREE.HalfFloatType, depthBuffer: true, stencilBuffer: false };
const rtDiffuse = new THREE.WebGLRenderTarget(W(), H(), rtOpts);
const rtNormal  = new THREE.WebGLRenderTarget(W(), H(), rtOpts);
// B5: Do NOT set rtDiffuse/rtNormal texture.colorSpace to SRGBColorSpace — that double-converts.

// Step 5 fills this. For now bind a 1x1 black texture so the uniform is never null.
const rtHighlight = new THREE.WebGLRenderTarget(
  Math.floor(W() / 4), Math.floor(H() / 4),
  { depthBuffer: true, stencilBuffer: false, minFilter: THREE.NearestFilter, magFilter: THREE.NearestFilter }
);

const normalMat = new THREE.MeshNormalMaterial();

// ─── B4: Composite material ───
const compositeMat = new THREE.ShaderMaterial({
  uniforms: {
    tDiffuse:     { value: rtDiffuse.texture },
    uNormals:     { value: rtNormal.texture },
    uNoiseTex:    { value: noiseTex },
    tHighlight:   { value: rtHighlight.texture },
    uResolution:  { value: new THREE.Vector2(W(), H()) },
    uTime:        { value: 0 },
    uInkStrength: { value: 1.0 },
    uWobble:      { value: 1.0 },
    uFillMix:     { value: 0.35 },
  },
  vertexShader: compositeVert,
  fragmentShader: compositeFrag,
});

// ─── Fullscreen quad ───
const quadScene = new THREE.Scene();
const quadCam   = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
quadScene.add(new THREE.Mesh(new THREE.PlaneGeometry(2, 2), compositeMat));

// ─── B7: Debug view — simple blit materials ───
const debugBlitVert = `varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`;
const debugBlitFrag = `varying vec2 vUv; uniform sampler2D tTex; void main(){ gl_FragColor = texture2D(tTex, vUv); }`;

const debugDiffuseMat = new THREE.ShaderMaterial({
  uniforms: { tTex: { value: rtDiffuse.texture } },
  vertexShader: debugBlitVert, fragmentShader: debugBlitFrag,
});
const debugNormalMat = new THREE.ShaderMaterial({
  uniforms: { tTex: { value: rtNormal.texture } },
  vertexShader: debugBlitVert, fragmentShader: debugBlitFrag,
});
const debugNoiseMat = new THREE.ShaderMaterial({
  uniforms: { tTex: { value: noiseTex } },
  vertexShader: debugBlitVert, fragmentShader: debugBlitFrag,
});

let debugMode = 0;  // 0=composite, 1=diffuse, 2=normals, 3=noise
const quadMesh = quadScene.children[0];

window.addEventListener('keydown', (e) => {
  if (e.key === '1') { debugMode = 0; quadMesh.material = compositeMat; }
  if (e.key === '2') { debugMode = 1; quadMesh.material = debugDiffuseMat; }
  if (e.key === '3') { debugMode = 2; quadMesh.material = debugNormalMat; }
  if (e.key === '4') { debugMode = 3; quadMesh.material = debugNoiseMat; }
});

// ─── B6: Resize ───
window.addEventListener('resize', () => {
  const w = W(), h = H();
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(dpr);
  rtDiffuse.setSize(w, h);
  rtNormal.setSize(w, h);
  rtHighlight.setSize(Math.floor(w / 4), Math.floor(h / 4));
  compositeMat.uniforms.uResolution.value.set(w, h);
  for (const m of Object.values(lineMats)) m.resolution.set(w, h);  // do not forget
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
});

// ─── Render loop — manual pipeline, not EffectComposer ───
const clock = new THREE.Clock();

function animate() {
  requestAnimationFrame(animate);
  controls.update();
  compositeMat.uniforms.uTime.value = clock.getElapsedTime();

  // 1 — colour pass: layer 0 (plane + lines)
  camera.layers.set(0);
  renderer.setRenderTarget(rtDiffuse);
  renderer.clear();
  renderer.render(scene, camera);

  // 2 — normal pass: layer 1 ONLY (meshes — plane only at Step 3)
  //     B2: Line2 must NOT be in this pass or you get garbage triangles.
  scene.overrideMaterial = normalMat;
  camera.layers.set(1);
  renderer.setRenderTarget(rtNormal);
  renderer.clear();
  renderer.render(scene, camera);
  scene.overrideMaterial = null;   // MUST reset every frame
  camera.layers.set(0);

  // 3 — composite (or debug blit) to screen
  renderer.setRenderTarget(null);
  renderer.render(quadScene, quadCam);
}
animate();

// ─── Exports for later steps ───
export { scene, camera, renderer, controls, plane, planeMat, compositeMat,
         rtDiffuse, rtNormal, rtHighlight, normalMat, noiseTex,
         BG, SHEET, INK, S, cLon, cLat, kx, FIT, lineMats, PEN, B,
         W, H, dpr, project };
