import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { Line2 } from 'three/addons/lines/Line2.js';
import { LineMaterial } from 'three/addons/lines/LineMaterial.js';
import { LineGeometry } from 'three/addons/lines/LineGeometry.js';

import compositeVert from './shaders/composite.vert';
import compositeFrag from './shaders/composite.frag';
import gsap from 'gsap';
import { drinkingVerdict, lakeVerdict, loadStandards } from './verdict.js';

// ─── Palette (from spec, verbatim) ───
const BG    = new THREE.Color('#fdfcf5');
const SHEET = new THREE.Color('#f4efe4');
const INK   = new THREE.Color('#22201c');

// 3b.1: Normal pass clears to a flat up-normal so marks silhouette against "ground"
const NORMAL_CLEAR = new THREE.Color(0.5, 1.0, 0.5);

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
renderer.outputColorSpace = THREE.SRGBColorSpace;
document.body.appendChild(renderer.domElement);

// ─── Scene ───
const scene = new THREE.Scene();
scene.background = BG.clone();

// 3b.4: Depth haze — distant watercourses fade toward parchment
scene.fog = new THREE.FogExp2(BG, 0.0055);

// ─── Camera ───
const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(0, 120, 70);
camera.lookAt(0, 0, 0);

// ─── Orbit Controls ───
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.08;

// ─── Camera Rig (Step 3d) ───
const desired = { pos: new THREE.Vector3(0, 120, 70), tgt: new THREE.Vector3(0, 0, 0) };
const lookTarget = new THREE.Vector3(0, 0, 0);
const vel = new THREE.Vector3();
const STIFF = 3.2, DAMP = 0.86;

// Geographic anchors for camera
const ANCHORS = {
  overview: { lat: 21.139, lon: 79.134 },
  source:   { lat: 21.126, lon: 79.043 },
  corridor: { lat: 21.146, lon: 79.099 },
  outfall:  { lat: 21.138, lon: 79.159 }
};

window.gotoAnchor = function(key) {
  const a = ANCHORS[key];
  if (!a) return;
  const [x, z] = project(a.lon, a.lat);
  
  // Animate desired pos and tgt
  gsap.to(desired.tgt, { x, y: 0, z, duration: 2.5, ease: 'power2.out' });
  gsap.to(desired.pos, { x: x, y: 25, z: z + 20, duration: 2.0, ease: 'power3.inOut' });
};

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
// 3b.1: plane.layers.disable(1) — was enable(1). A flat plane contributes ZERO
// interior detail to a normal pass, only costs the silhouette (the black horizon line).
// Do NOT put plane in layer 1.
scene.add(plane);

// ─── NO LIGHTS — nothing in this build is lit ───

// ─── Line materials — SCREEN PIXELS, not world units ───
// 3b.2: Widened pen spread so the weight hierarchy survives the composite
const PEN = {
  river:  { width: 4.0, color: '#6d8689' },
  canal:  { width: 2.6, color: '#8fa6a8' },
  stream: { width: 1.5, color: '#9db1b2' },
  drain:  { width: 0.9, color: '#adbdbd' },
};

const lineMats = {};
for (const [k, v] of Object.entries(PEN)) {
  const m = new LineMaterial({
    color: new THREE.Color(v.color),
    linewidth: v.width,
    worldUnits: false,
    dashed: false,
    transparent: false,
    fog: true,             // 3b.4: LineMaterial supports fog; must be switched on
  });
  m.resolution.set(renderer.domElement.width, renderer.domElement.height);
  m.needsUpdate = true;   // 3b.4: needed after setting fog
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
    // Line2 stays on layer 0 ONLY — must NOT enter the normal pass
    scene.add(line);
    count++;
  }
  console.log(`Loaded ${count} waterways`);
}
loadWaterways();

// ─── 3c: Water bodies (243 polygons) ───
async function loadWaterBodies() {
  const res = await fetch('/data/waterbodies.json');
  const bodies = await res.json();

  const bodyMat = new THREE.MeshBasicMaterial({
    color: new THREE.Color('#b9c8c8'),
    fog: true,
  });

  let count = 0;
  for (const b of bodies) {
    if (!b.p || b.p.length < 3) continue;

    const shape = new THREE.Shape(b.p.map(([lon, lat]) => {
      const [x, z] = project(lon, lat);
      return new THREE.Vector2(x, z);
    }));

    const mesh = new THREE.Mesh(new THREE.ShapeGeometry(shape), bodyMat);
    mesh.rotation.x = Math.PI / 2;     // +PI/2: ShapeGeometry is XY, flip to XZ
    mesh.position.y = 0.01;            // under the lines (y=0.02)
    mesh.renderOrder = 1;
    mesh.layers.enable(1);             // filled meshes DO belong in the normal pass
    scene.add(mesh);
    count++;
  }
  console.log(`Loaded ${count} water bodies`);
}
loadWaterBodies();

// ─── 4: Marks (405 points) ───
async function loadMarks() {
  const [resPoints, resStd] = await Promise.all([
    fetch('/data/points.json'),
    fetch('/data/standards.json')
  ]);
  const points = await resPoints.json();
  const std = await resStd.json();
  loadStandards(std);

  const markMat = new THREE.MeshBasicMaterial({ color: new THREE.Color('#d3cfc1'), fog: true }); // Muted default
  const redMat = new THREE.MeshBasicMaterial({ color: new THREE.Color('#b23a26'), fog: true }); // Exceedance

  const geoCircle = new THREE.CircleGeometry(0.2, 16);
  const geoSquare = new THREE.PlaneGeometry(0.3, 0.3);
  const geoRing = new THREE.RingGeometry(0.2, 0.3, 16);
  const geoHeavyRing = new THREE.RingGeometry(0.15, 0.35, 16);
  
  let count = 0;
  for (const p of points) {
    const [x, z] = project(p.lon, p.lat);
    let mat = markMat;
    
    // Merge metals into values for city wells (metals live at p.metals, not p.v)
    const vals = { ...p.v };
    if (p.metals) Object.assign(vals, p.metals);

    if (p.kind === 'lake') {
      const v = lakeVerdict(vals);
      if (v.state === 'EXCEEDS') mat = redMat;
    } else if (p.kind === 'groundwater' || p.kind === 'river' || p.kind === 'citywell') {
      const v = drinkingVerdict(vals);
      if (v.state === 'EXCEEDS') mat = redMat;
    } else if (p.kind === 'stp') {
      // STP — no drinking verdict, stays muted
    }

    let mesh;
    let y = 0.35; // Default marks height

    if (p.kind === 'groundwater') {
      mesh = new THREE.Mesh(geoCircle, mat);
    } else if (p.kind === 'river') {
      mesh = new THREE.Mesh(geoSquare, mat);
    } else if (p.kind === 'citywell') {
      mesh = new THREE.Mesh(geoHeavyRing, mat);
    } else if (p.kind === 'lake') {
      mesh = new THREE.Mesh(geoRing, mat);
    } else if (p.kind === 'stp') {
      const cap = p.meta && p.meta.capacity_mld ? parseFloat(p.meta.capacity_mld) : 10;
      const height = Math.max(1, cap / 20); // Scale down slightly so it's not too huge
      const geoBox = new THREE.BoxGeometry(0.5, height, 0.5);
      mesh = new THREE.Mesh(geoBox, mat);
      y = 0.90 + height / 2; // Base at 0.90
    }

    if (mesh) {
      if (p.kind !== 'stp') {
        mesh.rotation.x = -Math.PI / 2; // Flat on the ground
      }
      mesh.position.set(x, y, z);
      mesh.renderOrder = 3;
      mesh.layers.enable(1); // Put in normal pass for silhouettes
      scene.add(mesh);
      count++;
    }
  }
  console.log(`Loaded ${count} marks`);
}
loadMarks();

// ═══════════════════════════════════════════════════════════════
// STEP 3: Composite Shader Pipeline
// ═══════════════════════════════════════════════════════════════

// ─── Noise texture — procedural, tileable ───
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
  t.colorSpace = THREE.NoColorSpace;
  t.needsUpdate = true;
  return t;
}

const noiseTex = makeNoiseTexture();

// ─── Render targets ───
const W = () => Math.floor(window.innerWidth * dpr);
const H = () => Math.floor(window.innerHeight * dpr);

const rtOpts = { type: THREE.HalfFloatType, depthBuffer: true, stencilBuffer: false };
const rtDiffuse = new THREE.WebGLRenderTarget(W(), H(), rtOpts);
const rtNormal  = new THREE.WebGLRenderTarget(W(), H(), rtOpts);

const rtHighlight = new THREE.WebGLRenderTarget(
  Math.floor(W() / 4), Math.floor(H() / 4),
  { depthBuffer: true, stencilBuffer: false, minFilter: THREE.NearestFilter, magFilter: THREE.NearestFilter }
);

const normalMat = new THREE.MeshNormalMaterial();

// ─── Composite material ───
const compositeMat = new THREE.ShaderMaterial({
  uniforms: {
    tDiffuse:     { value: rtDiffuse.texture },
    uNormals:     { value: rtNormal.texture },
    uNoiseTex:    { value: noiseTex },
    tHighlight:   { value: rtHighlight.texture },
    uResolution:  { value: new THREE.Vector2(W(), H()) },
    uTime:        { value: 0 },
    uInkStrength: { value: 0.85 },    // 3b.2: was 1.0 — now 0.85 for tonal range
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

// ─── Debug view — simple blit materials ───
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

let debugMode = 0;
const quadMesh = quadScene.children[0];

window.addEventListener('keydown', (e) => {
  if (e.key === '1') { debugMode = 0; quadMesh.material = compositeMat; }
  if (e.key === '2') { debugMode = 1; quadMesh.material = debugDiffuseMat; }
  if (e.key === '3') { debugMode = 2; quadMesh.material = debugNormalMat; }
  if (e.key === '4') { debugMode = 3; quadMesh.material = debugNoiseMat; }
});

// ─── Resize ───
window.addEventListener('resize', () => {
  const w = W(), h = H();
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(dpr);
  rtDiffuse.setSize(w, h);
  rtNormal.setSize(w, h);
  rtHighlight.setSize(Math.floor(w / 4), Math.floor(h / 4));
  compositeMat.uniforms.uResolution.value.set(w, h);
  for (const m of Object.values(lineMats)) m.resolution.set(w, h);
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
});

// ─── Render loop — manual pipeline ───
const clock = new THREE.Clock();
let lastTime = 0;

function animate() {
  requestAnimationFrame(animate);
  const t = clock.getElapsedTime();
  const dt = Math.min(t - lastTime, 0.1);
  lastTime = t;

  if (controls.enabled) {
    controls.update();
  } else {
    // 3d: Damped camera follower
    const drift = new THREE.Vector3(
      Math.sin(t*0.13)*0.9, Math.sin(t*0.09+1.7)*0.5, Math.cos(t*0.11)*0.9
    );
    const want = desired.pos.clone().add(drift);

    vel.addScaledVector(want.clone().sub(camera.position), STIFF*dt);
    vel.multiplyScalar(DAMP);
    camera.position.addScaledVector(vel, dt);

    lookTarget.lerp(desired.tgt, 1 - Math.pow(0.002, dt));
    camera.lookAt(lookTarget);
  }

  compositeMat.uniforms.uTime.value = t;

  // Save scene background for restore after normal pass
  const savedBg = scene.background;

  // 1 — colour pass: layer 0 (plane + lines + water bodies)
  camera.layers.set(0);
  renderer.setRenderTarget(rtDiffuse);
  renderer.clear();
  renderer.render(scene, camera);

  // 2 — normal pass: layer 1 ONLY (meshes only — water bodies, later marks)
  //     3b.1: Plane is NOT in layer 1 (no silhouette). Water body fills ARE.
  //     Clear to flat up-normal so marks silhouette against "ground"
  scene.overrideMaterial = normalMat;
  scene.background = null;
  camera.layers.set(1);
  renderer.setClearColor(NORMAL_CLEAR, 1);
  renderer.setRenderTarget(rtNormal);
  renderer.clear();
  renderer.render(scene, camera);
  scene.overrideMaterial = null;   // MUST reset every frame
  camera.layers.set(0);
  renderer.setClearColor(BG, 1);
  scene.background = savedBg;

  // 3 — composite (or debug blit) to screen
  renderer.setRenderTarget(null);
  renderer.render(quadScene, quadCam);
}
animate();

// ─── Exports for later steps ───
export { scene, camera, renderer, controls, plane, planeMat, compositeMat,
         rtDiffuse, rtNormal, rtHighlight, normalMat, noiseTex,
         BG, SHEET, INK, NORMAL_CLEAR, S, cLon, cLat, kx, FIT, lineMats, PEN, B,
         W, H, dpr, project };
