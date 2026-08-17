# STEP 3b — fix what Step 3 revealed, then Step 4
### Paste this whole file to the agent. Read the top section before touching any code.

Step 3 **worked.** The composite is running, the wobble is real, the ink is warm. Four defects
are visible in the screenshot, and one of them I got wrong in the last spec. Fix them in this
order — the first two are one-line changes and both are visible in every frame.

---

## 3b.1 — The black horizon line. My spec caused it. *(1 line)*

There is a hard black line across the upper frame following the plane's rim. I told you the
plane-edge fade would prevent this. It doesn't, because **the edge isn't in the diffuse buffer —
it's in the normal buffer.**

`plane.layers.enable(1)` puts the plane in the normal pass. There it renders as a flat green
`(0.5, 1.0, 0.5)` quad against the scene background `#fdfcf5`. That silhouette is a contrast step
of ~0.67 — the strongest edge anywhere in the frame. Sobel draws it. The diffuse fade I specified
is working perfectly and is irrelevant to it.

```js
plane.layers.disable(1);     // main.js:80 — was plane.layers.enable(1)
```

A flat plane contributes **zero interior detail** to a normal pass, so it was never earning its
place there — only costing you the silhouette. The normal pass starts paying at Step 4, when the
extruded marks arrive.

**When you add marks in Step 4**, set the normal pass to clear to a flat up-normal so the marks
silhouette against "ground", not against paper:

```js
const NORMAL_CLEAR = new THREE.Color(0.5, 1.0, 0.5);
// in the normal pass, before render:
scene.background = null;
renderer.setClearColor(NORMAL_CLEAR, 1);
// ... render ...
renderer.setClearColor(BG, 1);
scene.background = BG.clone();
```

---

## 3b.2 — Every line is 100% black. There is no tonal range. *(1 line)*

Compare against the reference: it is mostly **light grey hatching**, with only a handful of
near-black strokes. Ours is uniformly saturated ink at one value. That single fact is most of the
remaining visual gap.

The cause is arithmetic. `sobelMag()` returns the un-normalised magnitude of an 8-tap Sobel — for
a full-contrast step it lands around **3.0**. Then:

```glsl
edge = smoothstep(0.05, 0.50, 3.0 * 0.6);   // = smoothstep(0.05, 0.50, 1.8) = 1.0
```

Every edge in the scene saturates. `edge` is a binary. There is no grey.

```glsl
float edge = (sD * 0.6 + sN * 0.3) * 0.25 * uInkStrength;   // 0.25 normalises the 8-tap sum
edge = smoothstep(0.05, 0.70, edge);
```

and set `uInkStrength: 0.85` in main.js. A full water-line step now lands at ≈0.45 → ≈0.79 ink;
the anti-aliased flanks of a thin drain land mid-range and come out **grey**. That is where the
weight hierarchy you can't currently see will appear.

While you are there, widen the pen spread so the hierarchy survives the composite:

```js
const PEN = {
  river:  { width: 4.0, color: '#6d8689' },
  canal:  { width: 2.6, color: '#8fa6a8' },
  stream: { width: 1.5, color: '#9db1b2' },
  drain:  { width: 0.9, color: '#adbdbd' },
};
```

---

## 3b.3 — Vertical banding across the paper *(3 lines)*

There is faint regular vertical striping over the whole background. It is aliasing, not noise.

```glsl
vec2 auv = vUv * vec2(uResolution.x / uResolution.y, 1.0);   // aspect ≈ 2.0
vnoise(auv * 820.0)   // → 1640 cycles across ~1700 device px → ~1 px per cycle
```

That is past Nyquist on the horizontal axis, so it moirés into stripes. Tuning the constants only
moves the problem to another window size. Anchor the grain in **pixels** instead of UV:

```glsl
float paperTone(vec2 fragPx){
  vec2 p = fragPx / 3.2;                        // ≈3 device px per noise cell, at any resolution
  float f = vnoise(p)*0.5 + vnoise(p*2.6)*0.3 + vnoise(p*0.09)*0.2;
  return 0.93 + f*0.07;
}
// call site:
float paper = paperTone(gl_FragCoord.xy);
```

Delete the `auv` line. The grain is now resolution-independent and cannot alias.

---

## 3b.4 — Depth haze. The whole atmosphere budget, spent in four lines.

Distant linework currently has exactly the same contrast as near linework, which is the main
reason the frame reads flat. One `FogExp2` fixes it, in the diffuse pass, for free:

```js
scene.fog = new THREE.FogExp2(BG, 0.0055);        // tune 0.003 – 0.010 by eye
for (const m of Object.values(lineMats)) { m.fog = true; m.needsUpdate = true; }
```

`LineMaterial` supports fog; it must be switched on per-material. Because the fog colour **is**
the paper colour, distant watercourses fade toward parchment — which is exactly aerial
perspective on a drawn map, and it also softens the far field so the Sobel finds weaker edges
there. You get depth haze and depth-dependent ink weight from one parameter.

> **Do not build the six-layer atmosphere stack.** Grain, dust, haze, veil, print noise and depth
> fog as separate systems is a studio's month. You have fog (above) and paper grain (3b.3). If
> there is time at the very end, add **one** sparse `THREE.Points` dust layer — ~250 sprites,
> opacity 0.02–0.12, drifting slowly. Nothing else.

---

## 3c — Water bodies *(30 min — do this before Step 4)*

`public/data/waterbodies.json` now exists: **243 polygons, 20 named**, from the OSM export,
already in the same projection as the waterways. Format:

```json
[ { "n": "Ambazari Lake", "t": "water", "a": 812.4, "p": [[79.038,21.126], ...] } ]
```

`n` may be null. `a` is a relative area figure, sorted descending — use it for label priority only.

```js
const bodyMat = new THREE.MeshBasicMaterial({ color: new THREE.Color('#b9c8c8'), fog: true });
for (const b of bodies) {
  const shape = new THREE.Shape(b.p.map(([lon, lat]) => {
    const [x, z] = project(lon, lat); return new THREE.Vector2(x, z);
  }));
  const mesh = new THREE.Mesh(new THREE.ShapeGeometry(shape), bodyMat);
  mesh.rotation.x = Math.PI / 2;      // note: +PI/2, ShapeGeometry is XY
  mesh.position.y = 0.01;             // under the lines (y = 0.02)
  mesh.renderOrder = 1;
  mesh.layers.enable(1);              // filled meshes DO belong in the normal pass
  scene.add(mesh);
}
```

This matters more than it looks. Filled shapes give the diffuse Sobel real **shorelines** — the
first closed contours in the scene. It roughly triples the amount of drawn linework and it puts
Ambazari, Futala, Gorewada and Gandhi Sagar on the map, which is what makes a Nagpur resident
recognise where they are.

---

## 3d — The camera. Read the warning first.

### ⚠️ Do NOT implement multi-depth parallax with per-layer transform multipliers

The comparison documents recommend giving each layer its own response to camera movement —
`water = D * 0.50`, `points = D * 0.72`. **Do not do this.** Chartogne-Taillet has real terrain,
villages and trees at genuinely different depths. Our layers are all the *same flat map*. Moving
the water layer at a different rate from the measurement layer means a measurement no longer sits
on the river it was taken from. That is not an aesthetic compromise — it breaks geographic
registration, and it is the one thing in this project that a VNIT examiner will catch instantly.

**The honest way to get parallax is height, under a real perspective camera.** Give the layers
genuine `y` separation and let perspective produce the parallax for free, with every feature still
at its true `x`/`z`:

```
y = 0.00   water body fills
y = 0.02   watercourses
y = 0.35   measurement marks          (extruded, Step 4)
y = 0.90   STP blocks / outfall pins  (extruded, Step 4)
y = 4.0    dust, if you add it
```

A camera at oblique pitch then gets real parallax between marks and rivers, correct occlusion, and
no positional lie. This is why the flat-plane-in-3D architecture was chosen; use it.

### The camera rig itself *(45 min, not the 5-phase rebuild)*

`OrbitControls` alone reads as panning a drawing. Keep it for debugging, but drive the camera from
a damped follower chasing a GSAP-animated *desired* pose:

```js
const desired = { pos: new THREE.Vector3(0,120,70), tgt: new THREE.Vector3(0,0,0) };
const vel = new THREE.Vector3();
const STIFF = 3.2, DAMP = 0.86;         // near-critical: settles, never bounces

function updateCamera(dt){
  const t = clock.getElapsedTime();
  // secondary micro-drift — coherent, not per-frame jitter
  const drift = new THREE.Vector3(
    Math.sin(t*0.13)*0.9, Math.sin(t*0.09+1.7)*0.5, Math.cos(t*0.11)*0.9);
  const want = desired.pos.clone().add(drift);

  vel.addScaledVector(want.clone().sub(camera.position), STIFF*dt);
  vel.multiplyScalar(DAMP);
  camera.position.addScaledVector(vel, dt);

  lookTarget.lerp(desired.tgt, 1 - Math.pow(0.002, dt));   // rotation lags position
  camera.lookAt(lookTarget);
}
```

Transitions animate `desired`, never `camera` — the follower supplies the mass. Curve the path by
animating `desired.pos` through a mid waypoint offset perpendicular to the A→B line, and let
`desired.tgt` arrive on a slower tween than `desired.pos` so the camera turns into the move.

Geographic anchors to travel between (all real, all in the data):

| Beat | Anchor | lat, lon |
|---|---|---|
| Basin overview | centroid | 21.139, 79.134 |
| Source | Ambazari Lake — the Nag starts here | 21.126, 79.043 |
| Corridor | Nag mid-course through the city | 21.146, 79.099 |
| Outfall | Bhandewadi STP | 21.138, 79.159 |

---

## 3e — The frame. **Highest remaining value per hour. Zero shader risk.**

Put the reference frame and ours side by side and list what is in one and not the other:

| Reference | Ours |
|---|---|
| ruled border with a numbered/lettered graticule | — |
| centred letterspaced serif title | — |
| inset map panel, own border, own caption | — |
| bottom index bar: numbered scale + place names | — |
| corner marks, `MENU` | — |
| one red annotation | — |
| dense low-contrast hatching | 302 thin lines on empty paper |

Roughly **half** the reference's identity is editorial furniture, and all of it is HTML and CSS.
It costs about ninety minutes, carries no risk of breaking the render, and every element can carry
real project content:

```html
<div class="sheet">
  <div class="rule-h top"></div><div class="rule-h bottom"></div>
  <div class="rule-v left"></div><div class="rule-v right"></div>
  <div class="grat grat-x"><span>78.9°</span><span>79.0°</span><span>79.1°</span>
                           <span>79.2°</span><span>79.3°</span><span>79.4°</span></div>
  <div class="grat grat-y"><span>21.3°</span><span>21.2°</span><span>21.1°</span><span>21.0°</span></div>

  <h1 class="title">NAG&nbsp;BASIN</h1>
  <div class="menu">M E<br>N U</div>

  <aside class="inset">
    <div class="inset-cap">NEAREST MEASUREMENT</div>
    <div class="inset-body"><!-- distance ring / verdict --></div>
  </aside>

  <nav class="index">
    <div class="index-scale"><i>1</i><i>2</i><i>3</i><i>4</i><i>5</i><i>6</i><i>7</i></div>
    <ol>
      <li>Nag</li><li>Pivli</li><li>Pora</li><li>Kanhan</li>
      <li>Kolar</li><li>Vena</li><li>Pohara</li>
      <li class="go">City wells →</li>
    </ol>
  </nav>
</div>
```

```css
:root{ --ink:#22201c; --soft:#6b655c; --rule:#cfc6b6; --red:#b23a26 }
.sheet{ position:fixed; inset:34px; pointer-events:none; z-index:10;
        font-family:'EB Garamond',Georgia,serif; color:var(--ink) }
.rule-h,.rule-v{ position:absolute; background:var(--rule) }
.rule-h{ left:0; right:0; height:1px } .top{ top:56px } .bottom{ bottom:96px }
.rule-v{ top:56px; bottom:96px; width:1px } .left{ left:0 } .right{ right:0 }
.grat{ position:absolute; display:flex; font-size:10px; letter-spacing:.18em; color:var(--soft) }
.grat-x{ top:40px; left:0; right:0; justify-content:space-between }
.grat-y{ top:56px; bottom:96px; left:-26px; flex-direction:column; justify-content:space-between }
.title{ position:absolute; top:0; left:0; right:0; text-align:center; margin:0;
        font-weight:400; text-transform:uppercase; letter-spacing:.28em;
        font-size:clamp(30px,4.2vw,64px) }
.menu{ position:absolute; top:0; left:0; font-size:11px; letter-spacing:.34em; line-height:1.5 }
.inset{ position:absolute; right:14px; top:110px; width:min(30vw,380px);
        border:1px solid var(--rule); background:rgba(253,252,245,.72);
        backdrop-filter:blur(2px); pointer-events:auto }
.inset-cap{ text-align:center; font-size:11px; letter-spacing:.24em;
            padding:7px 0; border-bottom:1px solid var(--rule) }
.index{ position:absolute; left:0; right:0; bottom:0; border-top:1px solid var(--rule);
        padding-top:12px; pointer-events:auto }
.index-scale{ display:flex; justify-content:space-between; font-size:9px;
              color:var(--soft); border-bottom:1px solid var(--rule); padding-bottom:4px }
.index ol{ display:flex; justify-content:space-between; list-style:none;
           margin:10px 0 0; padding:0; font-size:14px }
.index li{ cursor:pointer } .index li:hover{ color:var(--red) }
.index .go{ font-style:italic }
```

Self-host EB Garamond as woff2 in `public/fonts/` — no Google Fonts request; the demo has to run
if the venue wifi dies.

**The graticule is real cartography, not decoration.** Those are the actual longitudes and
latitudes of the data bounding box, so the frame is also a scale reference. Wire the tick labels
to the camera later if there is time; hardcode them now.

---

## STEP 4 — the marks *(45 min)*

`points.json` has grown to **405** and its shape changed — re-read it, don't assume the old schema.

| kind | n | mark | notes |
|---|---:|---|---|
| `groundwater` | 347 | circle | CGWB, mostly 20–50 km out |
| `river` | 23 | square | NEERI, has `do_mgl` |
| `citywell` | 12 | circle, heavier ring | **now 16 params + up to 10 metals** |
| `stp` | 13 | extruded block | height ∝ `meta.capacity_mld` |
| `lake` | 10 | **new** | ring at the water-body centroid |

Colour by `drinkingVerdict()` from `verdict.js` — **except lakes.** A lake is not a drinking source
and must never be judged against IS 10500. `standards.json` now carries `cpcb_dbu`; lakes are
assessed against **CPCB Class B** (outdoor bathing: DO ≥ 5.0, faecal coliform ≤ 2500 CFU/100 mL,
pH 6.5–8.5). All ten fail it. Point `p.meta.standard` states which standard applies — read it, do
not infer from `kind`.

Marks stand at `y = 0.35`, `layers.enable(1)`, unlit `MeshBasicMaterial`. Ink dot with a slightly
irregular ring, never a pin or a glossy sphere. Muted by default; the focused one is emphasised.
Red `#b23a26` for exceedance only. No green anywhere, for any state.

**New verdict input — heavy metals.** Twelve city wells now carry `metals` (mg/L) and
`metals_bdl` (below detection). `standards.json → is10500_metals` has the limits.
`verdict.js` does not read these yet — extend `drinkingVerdict()` to include them, keeping the
three states and the exact wording. Four of the twelve exceed the lead limit; see
`DATA-FINDINGS.md` for how that must be phrased on screen.

### 🛑 STOP. Screenshot. Then the four debug views.

---

## What to skip, and why

The comparison documents are right about the diagnosis and wrong about the budget. Their plan is
five phases and twenty-nine steps. Ranked by visible gain per hour, for the time actually left:

| | |
|---|---|
| **Do** | 3b.1 · 3b.2 · 3b.3 (≈15 min, fixes every frame) |
| **Do** | 3e the frame (90 min — the largest single gain remaining) |
| **Do** | 3c water bodies (30 min — density, landmarks, more Sobel edges) |
| **Do** | 3b.4 fog (5 min — the entire atmosphere budget) |
| **Do** | Step 4 marks (45 min — it is the product) |
| **Do** | 3d camera rig (45 min) |
| **Skip** | six-layer atmosphere stack, noise-based reveal masks, WebGL-rendered UI, contrast breathing, screen veil, print-imperfection layer |
| **Never** | per-layer parallax multipliers — breaks geographic registration |

A judge sees a still frame for most of three minutes. Frame furniture, density and tonal range
win that. Camera inertia wins the ten seconds of the fly-through.
