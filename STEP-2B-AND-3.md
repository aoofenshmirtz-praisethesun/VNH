# STEP 2b + STEP 3 — corrections and full shader spec

Paste this whole file to the agent. It replaces nothing in `HANDOFF-TO-AGENT.md`; it corrects
Step 2 and expands Step 3 with the exact code, because Step 3 is the entire aesthetic.

---

## PART A — STEP 2b: fix the watercourses *(25 min)*

### The problem, named

The watercourses currently render as a **chain of raised, lit beads** — like a weld bead
laid over the plane. Two causes, both must be fixed:

1. **They have height and volume.** They are pipes standing on the plane.
   They should be **ink on paper** — zero volume.
2. **They use a lit material.** Each bead's top face catches the light and goes near-white.
   That white is the single most "CG" thing in the frame.
3. **They are built per-segment.** Each polyline segment is its own solid with no join,
   so the stroke breaks into discrete blobs instead of reading as one continuous line.

### Why this must be fixed *before* Step 3, not after

Step 3 runs Sobel edge detection. Sobel traces **every** intensity boundary. Right now every
bead has two boundaries, so the composite pass will draw the river as a **chain of small
circles**, not a river. And the white specular highlights will be traced as ink lines too.
You will look at the Step 3 screenshot, conclude the shader is broken, and start changing
shader weights — when the actual fault is upstream in the geometry.

### The fix — use `Line2`, not tubes

```js
import { Line2 }        from 'three/examples/jsm/lines/Line2.js'
import { LineGeometry } from 'three/examples/jsm/lines/LineGeometry.js'
import { LineMaterial } from 'three/examples/jsm/lines/LineMaterial.js'

// Pen weights in SCREEN PIXELS. A drawn map does not get thinner with distance —
// constant pixel width is correct and intentional. Do not use worldUnits.
const PEN = {
  river:  { width: 3.0, color: '#7c9497' },
  canal:  { width: 2.2, color: '#8fa6a8' },
  stream: { width: 1.6, color: '#8fa6a8' },
  drain:  { width: 1.1, color: '#a3b5b6' },
}

const lineMats = {}
for (const [k, v] of Object.entries(PEN)) {
  const m = new LineMaterial({
    color: new THREE.Color(v.color),
    linewidth: v.width,
    worldUnits: false,
    dashed: false,
    transparent: false,
  })
  m.resolution.set(renderer.domElement.width, renderer.domElement.height) // REQUIRED
  lineMats[k] = m
}

for (const f of waterways) {
  const pts = []
  for (const [lon, lat] of f.p) {
    const [x, z] = project(lon, lat)
    pts.push(x, 0.02, z)                    // y = 0.02 only to beat z-fighting. No volume.
  }
  if (pts.length < 6) continue
  const g = new LineGeometry(); g.setPositions(pts)
  const line = new Line2(g, lineMats[f.w] || lineMats.stream)
  line.computeLineDistances()
  line.renderOrder = 2
  scene.add(line)
}
```

**`m.resolution` must be re-set on every resize** or the lines render at the wrong width or
vanish entirely. This is the single most common `Line2` bug.

### Fix the projection at the same time

Raw lon/lat degrees stretch Nagpur horizontally by ~7%. Use metric-corrected equirectangular:

```js
const B = { minLon:78.86942, maxLon:79.39945, minLat:20.95135, maxLat:21.32682 }
const cLon = (B.minLon + B.maxLon) / 2          // 79.134435
const cLat = (B.minLat + B.maxLat) / 2          // 21.139085
const kx   = Math.cos(cLat * Math.PI / 180)     // 0.93300

const spanX = (B.maxLon - B.minLon) * kx        // 0.494518
const spanY = (B.maxLat - B.minLat)             // 0.375470   -> true aspect 1.3168

const FIT   = 100                                // world units for the LONGER axis
const S     = FIT / Math.max(spanX, spanY)

function project(lon, lat) {
  return [ (lon - cLon) * kx * S, -(lat - cLat) * S ]
}
```

### Kill the hard plane edge — this is important

The plane's trapezoid boundary is currently the **highest-contrast edge in the frame**.
Sobel will find it first and draw a heavy black quadrilateral frame around your map. Fix:

```js
// Plane is 3x the data extent, and fades to the background colour at its rim,
// so there is no hard step for Sobel to find.
const BG = new THREE.Color('#fdfcf5')
const SHEET = new THREE.Color('#f4efe4')
const planeMat = new THREE.ShaderMaterial({
  uniforms: { uSheet:{value:SHEET}, uBg:{value:BG} },
  vertexShader: `varying vec2 vP; void main(){ vP = uv - 0.5;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`,
  fragmentShader: `varying vec2 vP; uniform vec3 uSheet; uniform vec3 uBg;
    void main(){
      float d = max(abs(vP.x), abs(vP.y)) * 2.0;      // 0 centre -> 1 rim
      float k = smoothstep(0.30, 0.92, d);            // data occupies inner third
      gl_FragColor = vec4(mix(uSheet, uBg, k), 1.0);
    }`,
})
const plane = new THREE.Mesh(new THREE.PlaneGeometry(FIT*3, FIT*3), planeMat)
plane.rotation.x = -Math.PI/2
plane.layers.enable(1)          // see Part B — the normal pass reads layer 1
scene.add(plane)
renderer.setClearColor(BG)
```

Remove every light from the scene. Nothing in this build is lit.

### 🛑 STOP. Screenshot both camera angles. Expected:

- Strokes are **continuous** — no beads, no gaps, no white
- Rivers visibly heavier than drains; four distinguishable weights
- The plane has **no visible border** — it dissolves into the background
- The oblique view still reads as a tilted surface, carried by the lines' perspective

---

## PART B — STEP 3: the composite shader *(90 min)*

### B1 · Pipeline — manual, not `EffectComposer`

You need **two scene renders** per frame (colour and normals), which `EffectComposer`'s
`RenderPass` does not give you. Do it by hand — it is shorter and far less likely to fail silently.

```js
const dpr = Math.min(devicePixelRatio, 2)
const W = () => Math.floor(innerWidth  * dpr)
const H = () => Math.floor(innerHeight * dpr)

const rtOpts = { type: THREE.HalfFloatType, depthBuffer: true, stencilBuffer: false }
const rtDiffuse = new THREE.WebGLRenderTarget(W(), H(), rtOpts)
const rtNormal  = new THREE.WebGLRenderTarget(W(), H(), rtOpts)
// Step 5 fills this. For now bind a 1x1 black texture so the uniform is never null.
let   rtHighlight = new THREE.WebGLRenderTarget(Math.floor(W()/4), Math.floor(H()/4),
        { depthBuffer:true, stencilBuffer:false, minFilter:THREE.NearestFilter, magFilter:THREE.NearestFilter })

const normalMat = new THREE.MeshNormalMaterial()

const quadScene = new THREE.Scene()
const quadCam   = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1)
quadScene.add(new THREE.Mesh(new THREE.PlaneGeometry(2, 2), compositeMat))

function render() {
  // 1 — colour
  camera.layers.set(0)
  renderer.setRenderTarget(rtDiffuse); renderer.clear(); renderer.render(scene, camera)

  // 2 — normals, MESHES ONLY (layer 1). See B2 for why lines must be excluded.
  scene.overrideMaterial = normalMat
  camera.layers.set(1)
  renderer.setRenderTarget(rtNormal); renderer.clear(); renderer.render(scene, camera)
  scene.overrideMaterial = null
  camera.layers.set(0)

  // 3 — composite to screen
  renderer.setRenderTarget(null)
  renderer.render(quadScene, quadCam)
}
```

**`scene.overrideMaterial = null` must run every frame.** Forgetting it renders the whole
app as a normal map and looks like a catastrophic bug.

### B2 · The trap that will cost you an hour

`Line2` uses **instanced** geometry with custom attributes. If `scene.overrideMaterial`
applies `MeshNormalMaterial` to it, those attributes are reinterpreted as vertex positions
and you get **garbage triangles smeared across the frame**.

So: the normal pass renders **layer 1**, and layer 1 contains **meshes only** — the plane,
and (from Step 4) the marks, pins and STP blocks. `Line2` objects stay on layer 0 only.

```js
mesh.layers.enable(1)     // plane, marks, pins, blocks
// line2.layers  -> leave at default (layer 0 only)
```

**At Step 3 this means the normal pass contributes almost nothing** — the only thing on
layer 1 is a flat plane, whose normals are uniform. That is CORRECT. The normal pass earns
its keep at Step 4 when the extruded marks arrive. **Do not compensate by raising
`uInkStrength` or the diffuse weight.** Build it correctly now, verify it is not garbage,
and move on.

### B3 · The noise texture — generate it, tileable

```js
function makeNoiseTexture(size = 256, lattice = 8) {
  const L = lattice
  const hash = (x, y) => {
    const xi = ((x % L) + L) % L, yi = ((y % L) + L) % L      // wrap -> seamless tiling
    const s = Math.sin(xi * 127.1 + yi * 311.7) * 43758.5453
    return s - Math.floor(s)
  }
  const vn = (x, y) => {
    const ix = Math.floor(x), iy = Math.floor(y)
    const fx = x - ix, fy = y - iy
    const ux = fx*fx*(3-2*fx), uy = fy*fy*(3-2*fy)
    const a = hash(ix,iy), b = hash(ix+1,iy), c = hash(ix,iy+1), e = hash(ix+1,iy+1)
    return (a*(1-ux)+b*ux)*(1-uy) + (c*(1-ux)+e*ux)*uy
  }
  const fbm = (x, y, seed) => {
    let v = 0, a = 0.5, f = 1
    for (let i = 0; i < 4; i++) { v += a * vn(x*f + seed*37, y*f + seed*17); f *= 2; a *= 0.5 }
    return v
  }
  const d = new Uint8Array(size * size * 4)
  for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
    const i = (y*size + x) * 4, u = x/size * L, v = y/size * L
    d[i] = fbm(u,v,0)*255; d[i+1] = fbm(u,v,1)*255; d[i+2] = fbm(u,v,2)*255; d[i+3] = 255
  }
  const t = new THREE.DataTexture(d, size, size, THREE.RGBAFormat)
  t.wrapS = t.wrapT = THREE.RepeatWrapping
  t.minFilter = t.magFilter = THREE.LinearFilter
  t.colorSpace = THREE.NoColorSpace          // it is DATA. sRGB decode would corrupt the offsets.
  t.needsUpdate = true
  return t
}
```

### B4 · `composite.frag` — complete

```glsl
precision highp float;

varying vec2 vUv;

uniform sampler2D tDiffuse;
uniform sampler2D uNormals;
uniform sampler2D uNoiseTex;
uniform sampler2D tHighlight;
uniform vec2  uResolution;
uniform float uTime;
uniform float uInkStrength;   // 1.0 default; GSAP animates this with the camera in Step 7
uniform float uWobble;        // 1.0 default
uniform float uFillMix;       // 0.35 default; 0.0 = pure monochrome reference look

const vec3 PARCHMENT = vec3(0.9922, 0.9882, 0.9608);  // #fdfcf5
const vec3 INK       = vec3(0.1333, 0.1255, 0.1098);  // #22201c
const vec3 EXCEED    = vec3(0.6980, 0.2275, 0.1490);  // #b23a26

float sobelMag(sampler2D tex, vec2 uv, vec2 texel) {
  vec3 tl = texture2D(tex, uv + texel * vec2(-1.,-1.)).rgb;
  vec3 tc = texture2D(tex, uv + texel * vec2( 0.,-1.)).rgb;
  vec3 tr = texture2D(tex, uv + texel * vec2( 1.,-1.)).rgb;
  vec3 ml = texture2D(tex, uv + texel * vec2(-1., 0.)).rgb;
  vec3 mr = texture2D(tex, uv + texel * vec2( 1., 0.)).rgb;
  vec3 bl = texture2D(tex, uv + texel * vec2(-1., 1.)).rgb;
  vec3 bc = texture2D(tex, uv + texel * vec2( 0., 1.)).rgb;
  vec3 br = texture2D(tex, uv + texel * vec2( 1., 1.)).rgb;
  vec3 gx = -tl - 2.*ml - bl + tr + 2.*mr + br;
  vec3 gy = -tl - 2.*tc - tr + bl + 2.*bc + br;
  return sqrt(dot(gx,gx) + dot(gy,gy));
}

float hash21(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123); }
float vnoise(vec2 p){
  vec2 i = floor(p), f = fract(p);
  vec2 u = f*f*(3.0-2.0*f);
  return mix(mix(hash21(i), hash21(i+vec2(1,0)), u.x),
             mix(hash21(i+vec2(0,1)), hash21(i+vec2(1,1)), u.x), u.y);
}
float paperTone(vec2 uv){
  float f = vnoise(uv*380.0)*0.5 + vnoise(uv*820.0)*0.3 + vnoise(uv*40.0)*0.2;
  return 0.93 + f*0.07;
}

void main() {
  vec2 texel = 1.0 / uResolution;

  // ---- the hand-drawn line. OFFSET the sample UV; never multiply the edge by noise.
  // Two octaves: a long slow wander + a short jitter. Both centred on zero (-0.5).
  vec2 n1 = texture2D(uNoiseTex, vUv *  3.0).rg - 0.5;
  vec2 n2 = texture2D(uNoiseTex, vUv * 11.0).gb - 0.5;
  vec2 uvN = vUv + (n1 * 0.0020 + n2 * 0.0009) * uWobble;

  float sD = sobelMag(tDiffuse, uvN, texel);
  float sN = sobelMag(uNormals, uvN, texel);
  float edge = (sD * 0.6 + sN * 0.3) * uInkStrength;
  edge = smoothstep(0.05, 0.50, edge);

  // ---- paper, corrected for aspect so the grain is not stretched
  vec2 auv = vUv * vec2(uResolution.x / uResolution.y, 1.0);
  float paper = paperTone(auv);

  // ---- compose
  vec3 scene = texture2D(tDiffuse, vUv).rgb;
  vec3 col   = mix(PARCHMENT, scene, uFillMix);   // lets lake/water fills survive faintly
  col = mix(col, INK, edge);

  float hl = texture2D(tHighlight, vUv).r;
  col = mix(col, EXCEED, hl * 0.4);

  col *= paper;
  col *= 1.0 - smoothstep(0.25, 0.85, length(vUv - 0.5)) * 0.35;   // vignette

  gl_FragColor = vec4(col, 1.0);
}
```

**Three corrections to the earlier spec, all deliberate:**

| Earlier | Now | Why |
|---|---|---|
| `texture2D(uNoiseTex, vUv*2.0).rg * 0.004` | `(… - 0.5)` at two octaves, ~0.002 | Un-centred noise shifts the *whole image* diagonally instead of wobbling the line. `vUv*2.0` is 2 cycles across the screen — far too low to read as a pen stroke. |
| `mix(parchment, ink, edge)` | `mix(mix(parchment, scene, uFillMix), ink, edge)` | Pure form discards lake and water fills entirely. Set `uFillMix = 0.0` for the strict reference look. |
| vignette `* (1 - len*0.8)` | `smoothstep(0.25,0.85,len) * 0.35` | The linear form puts corners at 43% brightness — near-black. |

### B5 · Colour space — get this right or the parchment goes grey

```js
renderer.outputColorSpace = THREE.SRGBColorSpace
// Leave rtDiffuse.texture.colorSpace and rtNormal.texture.colorSpace at their DEFAULT.
// Do NOT set them to SRGBColorSpace — that double-converts and washes the parchment out.
```

### B6 · Resize

```js
addEventListener('resize', () => {
  const w = W(), h = H()
  renderer.setSize(innerWidth, innerHeight); renderer.setPixelRatio(dpr)
  rtDiffuse.setSize(w, h); rtNormal.setSize(w, h)
  rtHighlight.setSize(Math.floor(w/4), Math.floor(h/4))
  compositeMat.uniforms.uResolution.value.set(w, h)
  for (const m of Object.values(lineMats)) m.resolution.set(w, h)   // do not forget
  camera.aspect = innerWidth / innerHeight; camera.updateProjectionMatrix()
})
```

`uResolution` **must** be the render-target size in device pixels. If it is CSS pixels on a
2× display the Sobel texel step is halved, edges thin out, and it looks like the shader did
nothing.

### B7 · Debug view keys — add these, they are how you verify

Shaders fail silently. Bind number keys to blit each buffer straight to screen:

```
1 = composite (default)
2 = tDiffuse   -> should look like your Step 2b screenshot
3 = uNormals   -> should be a FLAT lilac/blue field (the plane). Flat is correct at Step 3.
                  Smeared coloured triangles = Line2 leaked into the normal pass -> fix layers.
4 = uNoiseTex  -> soft grey clouds, seamless, no visible tile seam
```

Screenshot **all four** at the stop point. This is the only way to tell a working shader
from a broken one.

### 🛑 STOP. Screenshot. Judge it against this list, honestly:

- [ ] Watercourse lines **wobble** — 1–3 px of irregularity, not vector-perfect
- [ ] Stroke weight **varies along** a single line
- [ ] Paper grain visible at 100% zoom
- [ ] Corners fall off gently; no hard vignette ring
- [ ] **No black rectangle or trapezoid** anywhere in frame
- [ ] Ink is warm near-black `#22201c`, never `#000000`
- [ ] `3` shows a flat lilac field, not garbage

**If it reads as flat and CG rather than drawn, say so plainly and stop.** Everything after
this inherits the look. The tuning order if it is close but wrong:
`uWobble` 0.6→1.8 → `smoothstep(0.05, 0.50, edge)` lower bound → `uFillMix` → vignette last.

---

## PART C — STEP 2c: water bodies *(optional, do NOT block Step 3 on it)*

A `public/data/waterbodies.json` is being exported separately. When it lands:

- Flat filled polygons at `y = 0.01`, **under** the lines, `MeshBasicMaterial` (unlit),
  colour `#aebfc0`, `renderOrder = 1`, `.layers.enable(1)` so they join the normal pass
- Build with `THREE.Shape` + `ShapeGeometry`, rotate `-PI/2` on X
- Named lakes get an HTML label at Step 5, not a WebGL one

This layer materially improves Step 3 — filled shapes give the diffuse Sobel real shorelines
to draw, and Ambazari, Futala, Gorewada and Gandhi Sagar are the landmarks a Nagpur resident
recognises instantly. But it changes no shader code, so it slots in cleanly afterwards.
