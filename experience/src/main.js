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

  const bodyMat = new THREE.MeshBasicMaterial({
    color: new THREE.Color('#b9c8c8'),
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
    const mesh = new THREE.Mesh(new THREE.ShapeGeometry(shape), bodyMat);
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
  }
}

// ─── 5.6: Raycaster hover ───
const ray = new THREE.Raycaster();
ray.layers.set(0);
let hovered = null;

let modeNearMe = false;

function fillPanel(p, v) {
  const panel = document.getElementById('panel-body');
  if (!panel) return;
  panel.dataset.state = 'filled';
  modeNearMe = false;
  renderer.domElement.style.cursor = 'auto';

  const isLake = p.meta && p.meta.standard && p.meta.standard.includes('CPCB');
  let html = `<div class="p-id">${p.id}</div>`;
  html += `<div class="p-area">${p.area || p.name || ''}</div>`;
  html += `<div class="p-rule"></div>`;
  if (isLake) {
    html += `<div class="p-std">Assessed against CPCB Designated Best Use Class B (outdoor bathing). Not a drinking-water source; not assessed against IS 10500.</div>`;
  }
  html += `<div class="p-verdict">${v.statement || ''}</div>`;
  // ACTION guidance for health-relevant exceedances
  if (v.exceed && v.exceed.length) {
    html += `<div class="p-rule"></div><div class="p-action-title">WHAT THIS MEANS</div>`;
    const ACTION = { 'Nitrate (as NO3)': 'Risk is to bottle-fed infants. Boiling does NOT help — it concentrates nitrate.',
      'Fluoride (as F)': 'Long-term exposure causes fluorosis. Boiling does not remove fluoride.',
      'Lead (as Pb)': 'Lead accumulates; risk to children and pregnancy. Boiling does NOT remove lead — it concentrates it.',
      'Arsenic (as As)': 'Long-term exposure is carcinogenic. Boiling does not remove arsenic.',
      'Total Coliform': 'Indicates faecal contamination. Boiling is effective — bring to a rolling boil.',
      'E. coli / Thermotolerant coliform': 'Direct indicator of faecal contamination. Boiling is effective.',
      'Total Hardness (as CaCO3)': 'Affects taste, scaling. Not an acute health risk at these levels.',
      'Total Dissolved Solids': 'High mineral content — affects taste. Not an acute health risk.' };
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
  panel.innerHTML = html;
}

function clearPanel() {
  const panel = document.getElementById('panel-body');
  if (!panel || panel.dataset.state === 'empty' || panel.dataset.state === 'waiting') return;
  panel.dataset.state = 'empty';
  panel.innerHTML = `
    <div style="text-align: center; margin-top: 20px;">
      <button id="btn-near-me" style="font-family:'EB Garamond', serif; font-size: 13px; padding: 6px 12px; cursor: pointer; border: 1px solid var(--rule); background: transparent; color: var(--ink);">
        Show me what's measured near me
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

renderer.domElement.addEventListener('pointermove', e => {
  if (modeNearMe) return; // Don't highlight points while waiting for click
  ray.setFromCamera(new THREE.Vector2(
    (e.clientX / innerWidth) * 2 - 1, -(e.clientY / innerHeight) * 2 + 1), camera);
  const hit = ray.intersectObjects(pickables, false)[0];
  const next = hit?.object ?? null;
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
    hp.scale.copy(hovered.scale).multiplyScalar(1.9 / 1.0); // since hovered.scale already scaled by sizeMarks
    hp.layers.set(LAYER_HL);
    scene.add(hp);
    hovered.userData.hoverProxy = hp;
    
    fillPanel(hovered.userData.point, hovered.userData.verdict);
  } else {
    clearPanel();
  }
});

renderer.domElement.addEventListener('pointerdown', e => {
  if (!modeNearMe) return;
  ray.setFromCamera(new THREE.Vector2(
    (e.clientX / innerWidth) * 2 - 1, -(e.clientY / innerHeight) * 2 + 1), camera);
  
  const hit = ray.intersectObject(plane)[0];
  if (!hit) return;

  modeNearMe = false;
  renderer.domElement.style.cursor = 'auto';

  const pt = hit.point;
  const [lon, lat] = unproject(pt.x, pt.z);

  let minD = Infinity;
  let nearest = null;
  for (const m of markMeshes) {
    if (!m.userData.point) continue;
    const p = m.userData.point;
    const d = haversineKm(lat, lon, p.lat, p.lon);
    if (d < minD) {
      minD = d;
      nearest = m;
    }
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
      panel.innerHTML = `<div style="text-align: center; margin-top: 20px; color: var(--ink);">
        Nearest measurement is <b>${minD.toFixed(1)} km</b> away.<br><br>
        <span style="font-style: italic; font-size: 11px; color: var(--soft);">Hover over a point to read its verdict.</span>
      </div>`;
    }

    gsap.to(m, { opacity: 0, duration: 2, delay: 4, onComplete: () => {
      scene.remove(ring);
      g.dispose();
      m.dispose();
      clearPanel();
    }});
  }
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
clearPanel();

// ─── Exports for later steps ───
export { scene, camera, renderer, controls, plane, planeMat, compositeMat,
         rtDiffuse, rtNormal, rtHighlight, normalMat, noiseTex,
         BG, SHEET, INK, NORMAL_CLEAR, S, cLon, cLat, kx, FIT, lineMats, PEN, B,
         W, H, dpr, project };
