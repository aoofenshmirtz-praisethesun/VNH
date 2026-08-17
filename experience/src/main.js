import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { Line2 } from 'three/addons/lines/Line2.js';
import { LineMaterial } from 'three/addons/lines/LineMaterial.js';
import { LineGeometry } from 'three/addons/lines/LineGeometry.js';

import compositeVert from './shaders/composite.vert';
import compositeFrag from './shaders/composite.frag';
import gsap from 'gsap';
import { drinkingVerdict, lakeVerdict, loadStandards, haversineKm } from './verdict.js';

// ─── Palette (from spec, verbatim) ───
const BG    = new THREE.Color('#fdfcf5');
const SHEET = new THREE.Color('#f4efe4');
const INK   = new THREE.Color('#22201c');

// 3b.1: Normal pass clears to a flat up-normal so marks silhouette against "ground"
const NORMAL_CLEAR = new THREE.Color(0.5, 1.0, 0.5);

// 5.2: Highlight layer for exceedance red
const LAYER_HL = 2;
const HL_EXCEED = new THREE.MeshBasicMaterial({ color: new THREE.Color(0, 1, 0), fog: false });
const HL_HOVER  = new THREE.MeshBasicMaterial({ color: new THREE.Color(1, 0, 0), fog: false });

// 5.2: Health-relevant parameters (get red). Aesthetic-only stay ink.
const HEALTH = new Set([
  'Nitrate (as NO3)', 'Fluoride (as F)', 'Total Coliform',
  'E. coli / Thermotolerant coliform', 'Lead (as Pb)', 'Arsenic (as As)',
  'Cadmium (as Cd)', 'Chromium (as Cr6+)', 'Nickel (as Ni)',
]);
const isHealth = v => v.exceed && v.exceed.some(e => HEALTH.has(e.param));

// 5.3: Target screen pixels and base sizes per kind
const PX   = { groundwater: 5, river: 7, citywell: 9, stp: 11, lake: 0 };
const BASE = { groundwater: 0.20, river: 0.30, citywell: 0.32, stp: 1.0, lake: 1 };

// 5.3: Ink tone materials per kind (no green anywhere)
const toneMat = kind => new THREE.MeshBasicMaterial({
  color: new THREE.Color('#22201c'),
  opacity: { groundwater: 0.35, river: 0.60, citywell: 0.85, stp: 0.45 }[kind] || 0.5,
  transparent: true, fog: true,
});

// Shared arrays
const markMeshes = [];
const pickables = [];
const liftables = [];
const lakeLabels = [];

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

function unproject(x, z) {
  return [x / (kx * S) + cLon, -z / S + cLat];
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

// 6.3: Geographic anchors — from spec, with real extents in km
const ANCHORS = {
  overview:   { lat: 21.139, lon: 79.134, w: 54.7, h: 54.7, label: 'NAG\u00a0BASIN' },
  nag:        { lat: 21.1330, lon: 79.0842, w: 8.8, h: 1.9, label: 'NAG\u00a0RIVER', noData: false },
  pivli:      { lat: 21.1802, lon: 79.0782, w: 13.5, h: 4.3, label: 'PIVLI\u00a0RIVER', noData: false },
  pora:       { lat: 21.0892, lon: 79.0902, w: 7.0, h: 3.3, label: 'PORA\u00a0RIVER', noData: false },
  kanhan:     { lat: 21.1892, lon: 79.2787, w: 24.9, h: 17.6, label: 'KANHAN\u00a0RIVER', noData: true },
  kolar:      { lat: 21.2875, lon: 79.0509, w: 22.2, h: 8.7, label: 'KOLAR\u00a0RIVER', noData: true },
  vena:       { lat: 21.0500, lon: 78.9389, w: 14.3, h: 21.8, label: 'VENA\u00a0RIVER', noData: true },
  citywells:  { lat: 21.1351, lon: 79.0911, w: 14.5, h: 14.8, label: 'CITY\u00a0WELLS', noData: false },
  lakes:      { lat: 21.1255, lon: 79.0430, w: 8, h: 8, label: 'LAKES', noData: false },
  treatment:  { lat: 21.1351, lon: 79.0822, w: 14, h: 14, label: 'TREATMENT', noData: false },
};

// 6.3: Derive altitude from extent
const UNITS_PER_KM = FIT / 54.7;
const FRAME = 2 * Math.tan(45 * Math.PI / 360); // at fov 45

function gotoAnchor(key) {
  const a = ANCHORS[key];
  if (!a) return;
  const [x, z] = project(a.lon, a.lat);
  const alt = Math.max(18, (Math.max(a.w, a.h) * UNITS_PER_KM / FRAME) * 1.25);
  const pitch = THREE.MathUtils.degToRad(58);

  // Disable controls during transition, re-enable on complete
  controls.enabled = false;

  gsap.to(desired.tgt, { x, y: 0, z, duration: 2.6, ease: 'power2.inOut' });
  const startX = desired.pos.x;
  const startY = desired.pos.y;
  const startZ = desired.pos.z;
  const endX = x + alt * 0.18;
  const endY = alt * Math.sin(pitch);
  const endZ = z + alt * Math.cos(pitch);

  const dx = endX - startX;
  const dz = endZ - startZ;
  const dist = Math.sqrt(dx * dx + dz * dz) || 1; // avoid /0
  const bow = dist * 0.3; // bow magnitude
  const nx = -dz / dist;
  const nz = dx / dist;

  const proxy = { t: 0 };
  gsap.to(proxy, {
    t: 1,
    duration: 2.9,
    ease: 'power3.inOut',
    onUpdate: () => {
      const lx = startX + dx * proxy.t;
      const lz = startZ + dz * proxy.t;
      const ly = startY + (endY - startY) * proxy.t;
      const arc = Math.sin(proxy.t * Math.PI) * bow;
      desired.pos.set(lx + nx * arc, ly, lz + nz * arc);
    },
    onComplete: () => { controls.enabled = true; }
  });

  // Title crossfade
  const titleEl = document.getElementById('main-title');
  if (titleEl) {
    gsap.to(titleEl, { opacity: 0, duration: 0.4, onComplete: () => {
      titleEl.textContent = a.label;
      gsap.to(titleEl, { opacity: 1, duration: 0.6, delay: 0.3 });
    }});
  }

  // If this anchor has no data, show that in the panel on arrival
  if (a.noData) {
    setTimeout(() => {
      const panel = document.getElementById('panel-body');
      if (panel) {
        panel.dataset.state = 'filled';
        panel.innerHTML = `<div class="p-no-data">No published measurement exists on this watercourse.</div>`;
      }
    }, 2800);
  }
}
window.gotoAnchor = gotoAnchor;

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

// ─── 3c: Water bodies (243 polygons) + 5.5 shoreline outlines ───
const shorelineMat = new LineMaterial({
  color: new THREE.Color('#7c9497'),
  linewidth: 1.2,
  worldUnits: false,
  fog: true,
});
shorelineMat.resolution.set(renderer.domElement.width, renderer.domElement.height);

async function loadWaterBodies() {
  const res = await fetch('/data/waterbodies.json');
  const bodies = await res.json();

  // 6.5: Lake wash — transparent, paper grain reads through
  const bodyMat = new THREE.MeshBasicMaterial({
    color: new THREE.Color('#b9c8c8'),
    transparent: true,
    opacity: 0.55,
    fog: true,
  });
  const bodyMatLarge = new THREE.MeshBasicMaterial({
    color: new THREE.Color('#aec0c0'),
    transparent: true,
    opacity: 0.55,
    fog: true,
  });

  let count = 0;
  for (const b of bodies) {
    if (!b.p || b.p.length < 3) continue;

    const pts2d = b.p.map(([lon, lat]) => {
      const [x, z] = project(lon, lat);
      return new THREE.Vector2(x, z);
    });

    const shape = new THREE.Shape(pts2d);
    // 6.5: Vary fill by area — larger bodies get deeper colour
    const area = Math.abs(THREE.ShapeUtils.area(pts2d));
    const mat = area > 2.0 ? bodyMatLarge : bodyMat;
    const mesh = new THREE.Mesh(new THREE.ShapeGeometry(shape), mat);
    mesh.rotation.x = Math.PI / 2;
    mesh.position.y = 0.01;
    mesh.renderOrder = 1;
    mesh.layers.enable(1);
    scene.add(mesh);

    // 5.5: Shoreline outline
    const linePos = [];
    for (const v of pts2d) linePos.push(v.x, 0.015, v.y);
    // Close the loop
    linePos.push(pts2d[0].x, 0.015, pts2d[0].y);
    if (linePos.length >= 6) {
      const lg = new LineGeometry();
      lg.setPositions(linePos);
      const outline = new Line2(lg, shorelineMat);
      outline.computeLineDistances();
      outline.renderOrder = 2;
      scene.add(outline);
    }

    count++;
  }
  console.log(`Loaded ${count} water bodies`);
}
loadWaterBodies();

// ─── 4+5: Marks (405 points) — 5.2/5.3/5.4/5.5 ───
// 5.3: Geometries — open rings, not filled discs
const geoGW      = new THREE.RingGeometry(0.17, 0.20, 16);     // groundwater: hairline open circle
const geoRiver   = new THREE.PlaneGeometry(0.30, 0.30);        // river: small square
const geoCWInner = new THREE.RingGeometry(0.14, 0.18, 16);     // citywell: double ring (inner)
const geoCWOuter = new THREE.RingGeometry(0.26, 0.32, 16);     // citywell: double ring (outer)
const geoSTP     = new THREE.PlaneGeometry(1.0, 0.55);         // STP: flat plan rectangle

async function loadMarks() {
  const [resPoints, resStd] = await Promise.all([
    fetch('/data/points.json'),
    fetch('/data/standards.json')
  ]);
  const points = await resPoints.json();
  const std = await resStd.json();
  loadStandards(std);

  let count = 0;
  for (const p of points) {
    // 5.5: Lakes are already polygons — no mark needed
    if (p.kind === 'lake') continue;

    const [x, z] = project(p.lon, p.lat);

    // Merge metals for verdict
    const vals = { ...p.v };
    if (p.metals) Object.assign(vals, p.metals);

    let v = { state: 'NOT_TESTED', exceed: [] };
    if (p.kind === 'groundwater' || p.kind === 'river' || p.kind === 'citywell') {
      v = drinkingVerdict(vals);
    }

    const mat = toneMat(p.kind);
    let mesh;
    let y = 0.35;
    const cap = p.meta && p.meta.capacity_mld ? parseFloat(p.meta.capacity_mld) : 10;

    if (p.kind === 'groundwater') {
      mesh = new THREE.Mesh(geoGW, mat);
    } else if (p.kind === 'river') {
      mesh = new THREE.Mesh(geoRiver, mat);
    } else if (p.kind === 'citywell') {
      // Double ring — outer ring is the mesh, inner added as child
      mesh = new THREE.Mesh(geoCWOuter, mat);
      const inner = new THREE.Mesh(geoCWInner, mat);
      mesh.add(inner);
    } else if (p.kind === 'stp') {
      // 5.4: Flat plan symbol, no box
      mesh = new THREE.Mesh(geoSTP, mat);
      y = 0.03;
    }

    if (!mesh) continue;

    mesh.rotation.x = -Math.PI / 2;
    mesh.position.set(x, y, z);
    mesh.renderOrder = 3;
    mesh.layers.enable(1);

    mesh.userData = {
      kind: p.kind, id: p.id, point: p, verdict: v,
      px: PX[p.kind] || 5, baseSize: BASE[p.kind] || 0.2,
      capacity: cap,
      fullH: p.kind === 'stp' ? 0.35 : 0,
    };

    scene.add(mesh);
    markMeshes.push(mesh);
    pickables.push(mesh);
    if (p.kind === 'stp') liftables.push(mesh);

    // 5.2: Highlight proxy for health-relevant exceedances
    if (v.state === 'EXCEEDS' && isHealth(v)) {
      const proxy = new THREE.Mesh(mesh.geometry, HL_EXCEED);
      proxy.position.copy(mesh.position);
      proxy.rotation.copy(mesh.rotation);
      proxy.scale.setScalar(1.7);
      proxy.layers.set(LAYER_HL);
      scene.add(proxy);
      mesh.userData.proxy = proxy;
    }

    count++;
  }
  console.log(`Loaded ${count} marks (${markMeshes.filter(m=>m.userData.proxy).length} health-exceedance)`);
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

// 5.2: Half resolution (was /4 — at quarter res a 4px mark is one texel and red dissolves)
const rtHighlight = new THREE.WebGLRenderTarget(
  Math.floor(W() / 2), Math.floor(H() / 2),
  { depthBuffer: true, stencilBuffer: false, minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter }
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
  rtHighlight.setSize(Math.floor(w / 2), Math.floor(h / 2));
  compositeMat.uniforms.uResolution.value.set(w, h);
  shorelineMat.resolution.set(w, h);
  for (const m of Object.values(lineMats)) m.resolution.set(w, h);
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
});

// ─── 5.3: Screen-pixel mark sizing ───
let SPP = 2 * Math.tan(camera.fov * Math.PI / 360) / window.innerHeight;
function sizeMarks() {
  for (const m of markMeshes) {
    const d = camera.position.distanceTo(m.position);
    const s = d * SPP * m.userData.px / m.userData.baseSize;
    m.scale.setScalar(s);
    if (m.userData.proxy) m.userData.proxy.scale.setScalar(s * 1.7);
    if (m.userData.hoverProxy) m.userData.hoverProxy.scale.setScalar(s * 1.9);
    if (m.userData.selProxy) m.userData.selProxy.scale.setScalar(s * 2.1);
  }
}

// ─── 6.1: Stable selection + raycaster hover ───
const ray = new THREE.Raycaster();
ray.layers.set(0);
let hovered  = null;   // transient, follows pointer
let selected = null;   // persistent, only click changes it
let modeNearMe = false;
let ptr = null, lastPick = 0;

// 6.2: Observation type lookup
const OBSERVATION = {
  groundwater: { type: 'GROUNDWATER',       verb: 'SAMPLED / COMPILED' },
  citywell:    { type: 'CITY WELL',          verb: 'SAMPLED' },
  river:       { type: 'RIVER OBSERVATION',  verb: 'SAMPLED' },
  lake:        { type: 'LAKE OBSERVATION',   verb: 'ASSESSED' },
  stp:         { type: 'INFRASTRUCTURE',     verb: 'RECORD' },
};

function pickAt(e) {
  const coords = e.clientX !== undefined ? e : { clientX: e.x, clientY: e.y };
  ray.setFromCamera(new THREE.Vector2(
    (coords.clientX / innerWidth) * 2 - 1, -(coords.clientY / innerHeight) * 2 + 1), camera);
  const hit = ray.intersectObjects(pickables, false)[0];
  return hit?.object ?? null;
}

function setHovered(next) {
  if (next === hovered) return;
  if (hovered && hovered.userData.hoverProxy) {
    scene.remove(hovered.userData.hoverProxy);
    hovered.userData.hoverProxy = null;
  }
  hovered = next;
  if (hovered && hovered.userData.point) {
    const hp = new THREE.Mesh(hovered.geometry, HL_HOVER);
    hp.position.copy(hovered.position);
    hp.rotation.copy(hovered.rotation);
    hp.layers.set(LAYER_HL);
    scene.add(hp);
    hovered.userData.hoverProxy = hp;
  }
}

const geoSelRing = new THREE.RingGeometry(0.38, 0.42, 32);
const selRingMat = new THREE.MeshBasicMaterial({
  color: new THREE.Color('#22201c'), transparent: true, opacity: 0.7, fog: false
});

function setSelected(next) {
  if (selected && selected.userData.selProxy) {
    scene.remove(selected.userData.selProxy);
    selected.userData.selProxy = null;
  }
  selected = next;
  const closeBtn = document.getElementById('panel-close');
  if (selected && selected.userData.point) {
    const sp = new THREE.Mesh(geoSelRing, selRingMat);
    sp.position.copy(selected.position);
    sp.rotation.copy(selected.rotation);
    sp.layers.set(0); // visible in main pass, not highlight
    scene.add(sp);
    selected.userData.selProxy = sp;
    if (closeBtn) closeBtn.style.display = 'inline';
  } else {
    if (closeBtn) closeBtn.style.display = 'none';
  }
  refreshPanel();
}

function refreshPanel() {
  const shown = selected ?? hovered;
  if (shown?.userData.point) fillPanel(shown.userData.point, shown.userData.verdict);
  else showDefaultPanel();
}

function fillPanel(p, v) {
  const panel = document.getElementById('panel-body');
  if (!panel) return;
  panel.dataset.state = 'filled';
  modeNearMe = false;
  renderer.domElement.style.cursor = 'auto';

  const obs = OBSERVATION[p.kind] || { type: 'OBSERVATION', verb: 'RECORDED' };
  const isLake = p.meta && p.meta.standard && p.meta.standard.includes('CPCB');
  const isSTP = p.kind === 'stp';

  let html = `<div class="p-obs-type">${obs.type}</div>`;
  html += `<div class="p-obs-agency">${p.src || ''}</div>`;
  html += `<div class="p-rule"></div>`;
  html += `<div class="p-id">${p.id}</div>`;
  html += `<div class="p-area">${p.area || p.name || ''}</div>`;
  html += `<div class="p-sample">${obs.verb} &nbsp; ${p.period || ''}</div>`;
  html += `<div class="p-disclaimer">A published sample from this location and period — not a live reading.</div>`;
  html += `<div class="p-rule"></div>`;

  if (isSTP) {
    const cap = p.meta?.capacity_mld || '';
    const tech = p.meta?.technology || '';
    html += `<div class="p-stp-info">${cap ? cap + ' MLD' : ''} ${tech ? '· ' + tech : ''} · operational</div>`;
    html += `<div class="p-no-data">No water-quality measurement is published for this location.</div>`;
  } else if (isLake) {
    html += `<div class="p-std">Assessed against CPCB Designated Best Use Class B (outdoor bathing). Not a drinking-water source; not assessed against IS 10500.</div>`;
    html += `<div class="p-verdict">${v.statement || ''}</div>`;
    // Ambazari hinge
    if (p.id && (p.id.toLowerCase().includes('ambazari') || (p.name && p.name.toLowerCase().includes('ambazari')))) {
      html += `<div class="p-hinge">The Nag River rises here.</div>`;
    }
  } else {
    html += `<div class="p-verdict">${v.statement || ''}</div>`;
  }

  // ACTION guidance for exceedances
  if (v.exceed && v.exceed.length && !isSTP) {
    html += `<div class="p-rule"></div><div class="p-action-title">WHAT THIS MEANS</div>`;
    const ACTION = {
      'Nitrate (as NO3)': 'Risk is to bottle-fed infants. Boiling does NOT help — it concentrates nitrate.',
      'Fluoride (as F)': 'Long-term exposure causes fluorosis. Boiling does not remove fluoride.',
      'Lead (as Pb)': 'Lead accumulates; risk to children and pregnancy. Boiling does NOT remove lead — it concentrates it.',
      'Arsenic (as As)': 'Long-term exposure is carcinogenic. Boiling does not remove arsenic.',
      'Total Coliform': 'Indicates faecal contamination. Boiling is effective — bring to a rolling boil.',
      'E. coli / Thermotolerant coliform': 'Direct indicator of faecal contamination. Boiling is effective.',
      'Total Hardness (as CaCO3)': 'Affects taste, scaling. Not an acute health risk at these levels.',
      'Total Dissolved Solids': 'High mineral content — affects taste. Not an acute health risk.',
    };
    const seen = new Set();
    for (const e of v.exceed) {
      if (seen.has(e.param)) continue; seen.add(e.param);
      const act = ACTION[e.param];
      if (act) html += `<div class="p-action">${act}</div>`;
    }
  }

  html += `<div class="p-rule"></div>`;
  html += `<div class="p-source">SOURCE &nbsp; ${p.src || '—'}</div>`;
  html += `<div class="p-source">SAMPLE &nbsp; ${p.period || '—'}</div>`;
  if (v.nTested) html += `<div class="p-source">${v.nTested} parameters tested</div>`;
  panel.innerHTML = html;
}

function showDefaultPanel() {
  const panel = document.getElementById('panel-body');
  if (!panel || panel.dataset.state === 'empty' || panel.dataset.state === 'waiting') return;
  panel.dataset.state = 'empty';
  panel.innerHTML = `
    <div style="text-align: center; margin-top: 20px;">
      <button id="btn-near-me" style="font-family:'EB Garamond', serif; font-size: 13px; padding: 6px 12px; cursor: pointer; border: 1px solid var(--rule); background: transparent; color: var(--ink);">
        Show me what\u2019s measured near me
      </button>
    </div>
  `;
  document.getElementById('btn-near-me').addEventListener('click', () => {
    modeNearMe = true;
    panel.dataset.state = 'waiting';
    panel.innerHTML = `<div style="text-align: center; font-style: italic; margin-top: 20px; color: var(--soft);">Click anywhere on the map...</div>`;
    renderer.domElement.style.cursor = 'crosshair';
  });
}

// 6.1: Pointer events — pointermove only sets hovered, pointerdown sets selected
renderer.domElement.addEventListener('pointermove', e => {
  ptr = { x: e.clientX, y: e.clientY };
  if (modeNearMe) return;
});

renderer.domElement.addEventListener('pointerdown', e => {
  if (modeNearMe) {
    // Nearest-measurement branch
    ray.setFromCamera(new THREE.Vector2(
      (e.clientX / innerWidth) * 2 - 1, -(e.clientY / innerHeight) * 2 + 1), camera);
    const hit = ray.intersectObject(plane)[0];
    if (!hit) return;
    modeNearMe = false;
    renderer.domElement.style.cursor = 'auto';
    const pt = hit.point;
    const [lon, lat] = unproject(pt.x, pt.z);
    let minD = Infinity, nearest = null;
    for (const m of markMeshes) {
      if (!m.userData.point) continue;
      const p = m.userData.point;
      const d = haversineKm(lat, lon, p.lat, p.lon);
      if (d < minD) { minD = d; nearest = m; }
    }
    if (nearest) {
      const worldDist = Math.sqrt((nearest.position.x - pt.x)**2 + (nearest.position.z - pt.z)**2);
      const g = new THREE.RingGeometry(worldDist - 0.05, worldDist + 0.05, 64);
      const m = new THREE.MeshBasicMaterial({ color: new THREE.Color('#b23a26'), transparent: true, opacity: 0.8, fog: false });
      const ring = new THREE.Mesh(g, m);
      ring.rotation.x = -Math.PI / 2;
      ring.position.set(pt.x, 0.015, pt.z);
      ring.renderOrder = 4;
      scene.add(ring);
      const panel = document.getElementById('panel-body');
      if (panel) {
        panel.dataset.state = 'waiting';
        panel.innerHTML = `<div style="text-align: center; margin-top: 20px; color: var(--ink);">Nearest measurement is <b>${minD.toFixed(1)} km</b> away.</div>`;
      }
      gsap.to(m, { opacity: 0, duration: 2, delay: 4, onComplete: () => {
        scene.remove(ring); g.dispose(); m.dispose();
        const panel = document.getElementById('panel-body');
        if (panel) { panel.dataset.state = 'x'; showDefaultPanel(); }
      }});
    }
    return;
  }

  // 6.1: Click sets selection
  const hit = pickAt(e);
  setSelected(hit);
});

// 6.1: Panel close button
document.getElementById('panel-close')?.addEventListener('click', () => setSelected(null));

// ─── 6.3: Navigation rail wiring ───
document.getElementById('nav-rail')?.addEventListener('click', e => {
  const li = e.target.closest('li[data-anchor]');
  if (!li) return;
  gotoAnchor(li.dataset.anchor);
});

// ─── 6.4: Menu layer state ───
let currentFilter = 'all';

function applyFilter(filter) {
  currentFilter = filter;
  for (const m of markMeshes) {
    const k = m.userData.kind;
    const isHealthExceed = m.userData.proxy != null;
    let vis = true, opa = 1;
    switch (filter) {
      case 'all':       vis = true; break;
      case 'drinking':  vis = (k === 'groundwater' || k === 'citywell'); break;
      case 'rivers':    vis = (k === 'river' || k === 'lake'); break;
      case 'health':    vis = isHealthExceed; opa = isHealthExceed ? 1 : 0.15; vis = true; break;
      case 'unmeasured': vis = false; break;
      case 'treatment': vis = (k === 'stp'); break;
    }
    m.visible = vis;
    if (m.material.opacity !== undefined) m.material.opacity = opa * ({ groundwater: 0.35, river: 0.60, citywell: 0.85, stp: 0.45 }[k] || 0.5);
    if (m.userData.proxy) m.userData.proxy.visible = vis && isHealthExceed;
  }
  // Navigate to treatment centroid
  if (filter === 'treatment') gotoAnchor('treatment');
  if (filter === 'unmeasured') {
    gotoAnchor('overview');
    // Trigger nearest measurement from centre
    setTimeout(() => {
      modeNearMe = true;
      const panel = document.getElementById('panel-body');
      if (panel) {
        panel.dataset.state = 'waiting';
        panel.innerHTML = `<div style="text-align: center; font-style: italic; margin-top: 20px; color: var(--soft);">Click anywhere on the map to see how far the nearest measurement is...</div>`;
      }
      renderer.domElement.style.cursor = 'crosshair';
    }, 3000);
  }
}

document.getElementById('menu-btn')?.addEventListener('click', () => {
  document.getElementById('menu-overlay')?.classList.add('open');
});
document.getElementById('menu-close-btn')?.addEventListener('click', () => {
  document.getElementById('menu-overlay')?.classList.remove('open');
});
document.querySelector('.menu-backdrop')?.addEventListener('click', () => {
  document.getElementById('menu-overlay')?.classList.remove('open');
});
document.getElementById('menu-list')?.addEventListener('click', e => {
  const li = e.target.closest('li[data-filter]');
  if (!li) return;
  document.querySelectorAll('#menu-list li').forEach(l => l.classList.remove('active'));
  li.classList.add('active');
  applyFilter(li.dataset.filter);
  document.getElementById('menu-overlay')?.classList.remove('open');
});

// ─── 5.7: Lake labels ───
function setupLakeLabels(points) {
  const namedLakes = points.filter(p => p.kind === 'lake' && p.meta && p.meta.osm_name_match
    && p.meta.match_dist_km !== undefined && p.meta.match_dist_km < 1.2);
  const container = document.getElementById('lake-labels');
  if (!container) return;
  for (const lk of namedLakes) {
    const [x, z] = project(lk.lon, lk.lat);
    const el = document.createElement('div');
    el.className = 'lake-label';
    el.textContent = lk.meta.osm_name_match;
    container.appendChild(el);
    lakeLabels.push({ el, x, z });
  }
}

function updateLakeLabels() {
  const show = camera.position.y < 90;
  for (const lb of lakeLabels) {
    const v = new THREE.Vector3(lb.x, 0.4, lb.z).project(camera);
    if (v.z < 1 && show) {
      lb.el.style.transform = `translate(-50%,-50%) translate(${(v.x*.5+.5)*innerWidth}px, ${(-v.y*.5+.5)*innerHeight}px)`;
      lb.el.style.opacity = '1';
    } else {
      lb.el.style.opacity = '0';
    }
  }
}

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
    const drift = new THREE.Vector3(
      Math.sin(t*0.13)*0.9, Math.sin(t*0.09+1.7)*0.5, Math.cos(t*0.11)*0.9);
    const want = desired.pos.clone().add(drift);
    vel.addScaledVector(want.clone().sub(camera.position), STIFF*dt);
    vel.multiplyScalar(DAMP);
    camera.position.addScaledVector(vel, dt);
    lookTarget.lerp(desired.tgt, 1 - Math.pow(0.002, dt));
    camera.lookAt(lookTarget);
  }

  compositeMat.uniforms.uTime.value = t;

  // 5.3: Screen-pixel sizing
  sizeMarks();

  // 5.4: Camera-scaled STP lift
  const lift = 1 - THREE.MathUtils.smoothstep(camera.position.y, 30, 95);
  for (const o of liftables) o.scale.y = 0.001 + lift * o.userData.fullH;

  // 5.7: Lake labels
  updateLakeLabels();

  // 6.1: Throttled re-raycast (~8 Hz) to fix stale hover during camera drift
  if (ptr && !modeNearMe && t - lastPick > 0.12) {
    lastPick = t;
    const next = pickAt(ptr);
    if (next !== hovered) { setHovered(next); refreshPanel(); }
  }

  const savedBg = scene.background;

  // 1 — colour pass
  camera.layers.set(0);
  renderer.setRenderTarget(rtDiffuse);
  renderer.clear();
  renderer.render(scene, camera);

  // 2 — normal pass
  scene.overrideMaterial = normalMat;
  scene.background = null;
  camera.layers.set(1);
  renderer.setClearColor(NORMAL_CLEAR, 1);
  renderer.setRenderTarget(rtNormal);
  renderer.clear();
  renderer.render(scene, camera);
  scene.overrideMaterial = null;

  // 2.5 — highlight pass (5.2)
  camera.layers.set(LAYER_HL);
  renderer.setClearColor(0x000000, 1);
  renderer.setRenderTarget(rtHighlight);
  renderer.clear();
  renderer.render(scene, camera);

  camera.layers.set(0);
  renderer.setClearColor(BG, 1);
  scene.background = savedBg;

  // 3 — composite to screen
  renderer.setRenderTarget(null);
  renderer.render(quadScene, quadCam);
}
animate();

// Deferred setup: load lake labels after marks are loaded
fetch('/data/points.json').then(r => r.json()).then(setupLakeLabels);

// Initialize panel to show the button
showDefaultPanel();

// ─── Exports for later steps ───
export { scene, camera, renderer, controls, plane, planeMat, compositeMat,
         rtDiffuse, rtNormal, rtHighlight, normalMat, noiseTex,
         BG, SHEET, INK, NORMAL_CLEAR, S, cLon, cLat, kx, FIT, lineMats, PEN, B,
         W, H, dpr, project, gotoAnchor, ANCHORS, markMeshes, pickables };
