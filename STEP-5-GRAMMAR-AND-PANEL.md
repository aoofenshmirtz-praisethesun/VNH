# STEP 5 — object grammar, exceedance red, and the panel
### Replaces the earlier draft. Everything below is traced to `main.js` at `log_1.1`, not inferred.

Step 4 landed and every 3b fix is correctly in place — plane off layer 1, Sobel normalised at
0.25, paper grain in `gl_FragCoord` space, fog on the line materials, `uInkStrength` at 0.85, the
normal pass clearing to flat up-normal and restoring `scene.background`. The frame, graticule,
index bar and title are all working.

So this document is not a rewrite. It is four specific defects, and then the panel.

**Scale constant used throughout:** `FIT = 100` world units spans the data bounding box, which is
**54.7 km wide**. So **1 world unit ≈ 547 m.** Every number below follows from that.

---

## 5.1 — Answering what you actually asked

### The tiny circles (first screenshot)

`main.js:215` — `geoCircle = new THREE.CircleGeometry(0.2, 16)`, used at `:243` for
`kind === 'groundwater'`. **347 CGWB groundwater points**, filled discs of radius 0.2 units =
**109 m radius, 219 m across**. At the basin camera that is about **3.6 px**.

They come in two visual families and the reason is a bug, not a design choice:

| what you see | what it is |
|---|---|
| pale, barely-there rings | `markMat #d3cfc1` — NO_EXCEEDANCE |
| **dark near-black rings** | **EXCEEDS — and the red has been destroyed by the composite** |

That is defect 5.2 below, and it is the most important thing in this document.

### The rings (second and third screenshots)

Three separate families, all `RingGeometry`:

- `main.js:218` `geoHeavyRing = RingGeometry(0.15, 0.35, 16)` → `citywell`, **12 points**. Outer
  radius 191 m, annulus **109 m thick**. That very fat annulus is why they read as heavy donuts
  rather than cartographic marks.
- `main.js:217` `geoRing = RingGeometry(0.2, 0.3, 16)` → `lake`, **10 points**.
- `main.js:216` `geoSquare = PlaneGeometry(0.3, 0.3)` → `river`, **23 points**. These are the small
  pink parallelograms along the watercourses — squares foreshortened by the oblique camera.

**The lakes are represented twice.** `loadWaterBodies()` already draws 243 filled polygons
(`:171-200`), and then `loadMarks()` puts a ring on top of ten of them. Pick one. The polygon is
the lake; the ring should go. See 5.5.

### The buildings

`main.js:250-256`:

```js
const cap = p.meta.capacity_mld ? parseFloat(p.meta.capacity_mld) : 10;
const height = Math.max(1, cap / 20);
const geoBox = new THREE.BoxGeometry(0.5, height, 0.5);
y = 0.90 + height / 2;
```

Run the arithmetic at 547 m per unit:

| | |
|---|---|
| Bhandewadi, 130 MLD | `height = 6.5` → a **3.55 km tall**, 273 m wide needle |
| every STP under 20 MLD | `height = 1` → a **547 m** slab |
| base at `y = 0.90` | every block **floats 492 m above the sheet** |

At the basin camera the Bhandewadi block subtends about **59 px**; a groundwater measurement
subtends **3.6**. The infrastructure marker is sixteen times the size of the finding. At the city
camera (`desired.pos.y = 25`, `main.js:83`) it reaches roughly **260 px** — a quarter of the
screen. And because they are on layer 1 (`:264`) they hand the normal-pass Sobel long hard
silhouettes, which is why they out-draw everything else in ink as well.

`capacity_mld` spans 130 down to single digits — a 26× range. Encoding that in geometry means one
tower and twelve stubs. **Capacity belongs in the panel text, not in the height.**

---

## 5.2 — The exceedance red never reaches the screen ⭐ *(fix first — 40 min)*

This is the real bug behind the "dark rings", and it means the single most important signal in
the product is currently invisible.

`composite.frag:66-71`:

```glsl
vec3 col = mix(PARCHMENT, scene, uFillMix);   // uFillMix = 0.35
col = mix(col, INK, edge);
float hl = texture2D(tHighlight, vUv).r;
col = mix(col, EXCEED, hl * 0.4);
```

A red mark's own colour survives at only 35%: `mix(#fdfcf5, #b23a26, 0.35)` ≈ `#d9b0a1`, a washed
pink. Then the Sobel finds a strong edge around that high-contrast disc and `mix(col, INK, edge)`
takes the ring to near-black. **You get a dark ink ring with a faint pink centre — exactly the
screenshots.** Raising `uFillMix` is not the answer; it would flatten the drawn look everywhere.

The shader already contains the correct mechanism and nothing is using it. `tHighlight` is
composited **after** the ink mix, so anything written there survives. But `rtHighlight`
(`main.js:320`) is allocated and **never rendered into** — it is a permanently black texture.

### Write exceedance into the highlight buffer

Proxy meshes on a third layer, sharing geometry with the marks:

```js
const LAYER_HL = 2;
const HL_EXCEED = new THREE.MeshBasicMaterial({ color: new THREE.Color(0,1,0), fog:false });
const HL_HOVER  = new THREE.MeshBasicMaterial({ color: new THREE.Color(1,0,0), fog:false });

// in loadMarks(), when the verdict is EXCEEDS:
const proxy = new THREE.Mesh(mesh.geometry, HL_EXCEED);
proxy.position.copy(mesh.position);
proxy.rotation.copy(mesh.rotation);
proxy.scale.setScalar(1.7);            // bleeds slightly wider than the mark — reads as ink halo
proxy.layers.set(LAYER_HL);            // set, not enable — HL layer only
scene.add(proxy);
mesh.userData.proxy = proxy;
```

A third pass, between the normal pass and the composite:

```js
camera.layers.set(LAYER_HL);
renderer.setClearColor(0x000000, 1);
renderer.setRenderTarget(rtHighlight);
renderer.clear();
renderer.render(scene, camera);
renderer.setClearColor(BG, 1);
camera.layers.set(0);
```

```glsl
vec2 hl = texture2D(tHighlight, vUv).rg;
col = mix(col, EXCEED, hl.g * 0.45);    // exceedance — survives the ink
col = mix(col, EXCEED, hl.r * 0.70);    // hover — stronger, added in 5.6
```

**Change `rtHighlight` from quarter to half resolution** (`main.js:321`, `/4` → `/2`). At quarter
res a 4 px mark occupies one texel and the red dissolves entirely.

### Not every exceedance should be red

**116 of the 405 points exceed IS 10500 — 29%.** That is too much red to carry meaning, and 19 of
them exceed *only* on hardness, TDS, calcium, magnesium, chloride or sulphate. `verdict.js`'s own
`ACTION` table already says of those: *"Not an acute health risk at these levels."*

```js
const HEALTH = new Set([
  'Nitrate (as NO3)', 'Fluoride (as F)', 'Total Coliform',
  'E. coli / Thermotolerant coliform', 'Lead (as Pb)', 'Arsenic (as As)',
  'Cadmium (as Cd)', 'Chromium (as Cr6+)', 'Nickel (as Ni)',
]);
const isHealth = v => v.exceed.some(e => HEALTH.has(e.param));
```

- **97 health-relevant** → highlight proxy, red
- **19 aesthetic/operational only** → **no proxy**, ink only. Still `EXCEEDS`, still the exact
  verdict string in the panel, just not red on the map.

This is not softening the finding. It is the difference between *"this will harm you"* and *"this
tastes bad and scales your kettle"*, and a judge who asks why a third of the basin is red deserves
the second answer to exist.

---

## 5.3 — Size marks in screen pixels, not world units *(25 min)*

Every mark is a fixed world size, so they inflate as the camera descends — at the city camera a
groundwater disc goes from 3.6 px to about 16 px and the map becomes a field of blobs. Cartographic
marks hold constant apparent size; that is what makes them read as marks.

```js
const SPP = 2 * Math.tan(camera.fov * Math.PI / 360) / window.innerHeight; // world units per px at d=1
function sizeMarks() {
  for (const m of markMeshes) {
    const d = camera.position.distanceTo(m.position);
    const s = d * SPP * m.userData.px / m.userData.baseSize;
    m.scale.setScalar(s);
    if (m.userData.proxy) m.userData.proxy.scale.setScalar(s * 1.7);
  }
}
```

Call it once per frame in `animate()`. Recompute `SPP` on resize.

| kind | target px | shape | tone |
|---|---:|---|---|
| `groundwater` | **5** | open circle, hairline — `RingGeometry(0.17, 0.20)` not a filled disc | 35% ink |
| `river` | **7** | open square | 60% |
| `citywell` | **9** | circle + one concentric ring, annulus thinned to `RingGeometry(0.26, 0.32)` | 85% |
| `stp` | **11 × 6** | flat plan rectangle, two internal divisions | 45% |
| `lake` | — | the polygon *is* the mark | wash |

The twelve city wells get the heaviest routine treatment and the only double ring, because they
are the **only measurements physically inside Nagpur** and four of them exceed the lead limit.
Twelve objects can carry a distinct treatment; 347 cannot.

**Squint test:** the river network must be the first thing you see, then the marks, then the
infrastructure. If blocks and rings arrive first, keep reducing. The paper has to win.

---

## 5.4 — STPs: plan symbol, and height that follows the camera *(25 min)*

Replace the box with a flat plan symbol — the standard cartographic sedimentation-tank mark, a
small rectangle with two internal divisions — flat at `y = 0.03`, no float, no capacity scaling:

```js
const g = new THREE.PlaneGeometry(1.0, 0.55);       // scaled to 11 x 6 px by sizeMarks()
mesh = new THREE.Mesh(g, markMat);
mesh.rotation.x = -Math.PI / 2;
mesh.position.set(x, 0.03, z);
mesh.userData = { kind:'stp', px:11, baseSize:1.0, capacity:cap, fullH: 0.35 };
```

Draw the two dividing lines as a tiny `Line2` pair on the same footprint. Capacity goes in the
panel: *"Bhandewadi · 130 MLD · SBR"*.

### Then earn the third dimension honestly

At basin zoom anything with visible height is lying about scale, and that lie is what makes the
frame read "3D render" instead of "old map". At city zoom a small lift is plausible and gives the
normal pass real interior geometry. So make it a function of altitude:

```js
const lift = 1 - THREE.MathUtils.smoothstep(camera.position.y, 30, 95);  // 1 low, 0 high
for (const o of liftables) o.scale.y = 0.001 + lift * o.userData.fullH;
```

`fullH = 0.35` units ≈ 190 m — a slight lift, not a monolith. Only STPs and (later) outfall pins
are `liftables`; measurement marks stay flat always.

The map is pure flat ink on paper at basin altitude, and the infrastructure **rises out of the
sheet** as you descend. That is honest about scale, it is a far better reveal than anything
static, and it is exactly the "zoom shows more context, never more measurements" model already
agreed.

---

## 5.5 — Lakes are already polygons. Delete the rings.

The review document asks for water bodies to be replaced with real polygons. **They already are**
— `loadWaterBodies()` draws all 243. Remove the `kind === 'lake'` ring branch at `main.js:248-249`
entirely; a lake's clickable target becomes its polygon.

Ambazari is 15.4 ha; on a 54.7 km basin that is about 0.7% of the frame width. The lakes look
small because they **are** small. Do not enlarge them — that would be the first fabricated geometry
in the project. The answer is the camera coming down, plus labels (5.7).

One thing the polygons do need: a **darker shoreline**. Give `bodyMat` a companion `Line2` outline
per polygon at `#7c9497`, 1.2 px. Filled `#b9c8c8` at `uFillMix 0.35` is nearly invisible against
parchment, so right now the lakes read only through whatever Sobel edge they happen to produce.

---

## 5.6 — The highlight pass and the panel. **This is the product.** *(75 min)*

Everything so far is a beautiful map that answers no question. Until a resident can point at a
place and read a verdict, there is nothing to demo and nothing to defend. **This is the most
important remaining item in the build, ahead of atmosphere, particles and transitions.**

### Use a raycaster for hover, not a GPU readback

I specified colour-id picking earlier. At 405 objects that was over-engineering, and I should
correct it: `readRenderTargetPixels` is a **synchronous GPU stall** — it blocks the pipeline every
pointer move. A `THREE.Raycaster` against ~420 tiny meshes, throttled to pointer-move, costs well
under a millisecond and has no stall. Use the raycaster. `rtHighlight` stays, but purely as the
red tint mask from 5.2.

```js
const ray = new THREE.Raycaster();
ray.layers.set(0);
let hovered = null;
renderer.domElement.addEventListener('pointermove', e => {
  ray.setFromCamera(new THREE.Vector2(
    (e.clientX / innerWidth) * 2 - 1, -(e.clientY / innerHeight) * 2 + 1), camera);
  const hit = ray.intersectObjects(pickables, false)[0];
  const next = hit?.object ?? null;
  if (next === hovered) return;
  if (hovered?.userData.hoverProxy) scene.remove(hovered.userData.hoverProxy);
  hovered = next;
  if (hovered) { /* add HL_HOVER proxy on LAYER_HL; fill the panel */ }
  else clearPanel();
});
```

**Every mark needs `userData`** — it has none today, and nothing downstream works without it:

```js
mesh.userData = { kind: p.kind, id: p.id, point: p, verdict: v,
                  px: PX[p.kind], baseSize: BASE[p.kind] };
```

### The panel

HTML, in the `.inset` box `index.html:169-172` already provides. Every field below is mandatory:

```
NGW-7                                    ← id
NARMADA COLONY                           ← area
─────────────────────────────────────
Exceeds the IS 10500 limit for:          ← verdict.statement, VERBATIM
Lead (as Pb) = 0.014 mg/L (limit 0.01);
Total Coliform = 112 CFU/100mL
─────────────────────────────────────
WHAT THIS MEANS
Lead accumulates; the risk is to
children and to pregnancy.
Boiling does NOT remove lead — it
concentrates it.                         ← ACTION[param], VERBATIM
─────────────────────────────────────
SOURCE     CSIR-NEERI for NMC            ← source_agency, mandatory
SAMPLE     2023-24                       ← sample_period, mandatory
16 parameters tested · 8 metals
```

Verdict strings **verbatim** — never paraphrased or shortened. Never "safe", "potable",
"drinkable", "clean". No green, for any state. `source_agency` and `sample_period` on every panel
with no exceptions.

**Lakes take a different panel.** `p.meta.standard` states which standard applies — read it, never
infer from `kind`. `lakeVerdict()` is already written (`verdict.js:130`) against
`standards.json → cpcb_dbu.B_outdoor_bathing`. Applying a drinking standard to a lake is the kind
of error that loses a technical round, so the panel must say out loud which standard it used:

```
AMBAZARI LAKE
─────────────────────────────────────
Assessed against CPCB Designated Best
Use Class B (outdoor bathing). Not a
drinking-water source; not assessed
against IS 10500.

Below Class B on: dissolved oxygen
4.90 mg/L (minimum 5.0); faecal
coliform 20,000 CFU/100mL (limit 2,500);
pH 8.82 (range 6.5–8.5).

The Nag River rises here.
─────────────────────────────────────
SOURCE  CSIR-NEERI for NMC · SAMPLE 2023-24
```

**The one scripted beat.** A single button in the panel: *"show me what's measured near me"*.
Click anywhere; draw a ring from that point to the nearest measurement using the `haversineKm`
already exported from `verdict.js:199`. In much of the city that ring is 3–8 km across. It makes
the argument once, powerfully, then gets out of the way.

---

## 5.7 — Lake labels *(20 min)*

Eight of the ten sampled lakes are matched to a real OSM name. HTML labels projected each frame,
EB Garamond italic, 12 px, `#6b655c`, shown only below 90 units of altitude — at basin zoom they
overlap into clutter:

```js
const v = new THREE.Vector3(x, 0.4, z).project(camera);
el.style.transform = `translate(-50%,-50%) translate(${(v.x*.5+.5)*innerWidth}px, ${(-v.y*.5+.5)*innerHeight}px)`;
el.style.opacity = (v.z < 1 && camera.position.y < 90) ? 1 : 0;
```

Ambazari · Futala · Gorewada · Gandhi Sagar · Sonegaon · Sakkardara · Pandrapodi · Lendi Talav.

**Do not label `BK` or `PLT`.** Those matched at 1.5 km and 3.7 km, beyond the 1.2 km acceptance
threshold, so their names are not established. Leave them unnamed.

---

## Order, and what stays cut

| | | |
|---|---|---|
| **5.2** | exceedance red into the highlight buffer + health/aesthetic split | 40 min ⭐ |
| **5.3** | screen-pixel mark sizing and tone hierarchy | 25 min |
| **5.4** | STP plan symbol + camera-scaled lift | 25 min |
| **5.5** | delete lake rings, add shoreline outlines | 15 min |
| **5.6** | raycast hover + panel | 75 min ⭐ **the product** |
| **5.7** | lake labels | 20 min |
| then | Step 6 particles, Step 8 quality tiers | |

**Cut, and correctly so:**

- **Depth-layer parallax.** Right call. The map is flat, and offsetting layers by different
  transform multipliers would mean a measurement no longer sits on the river it came from — broken
  geographic registration, not an aesthetic compromise. 5.4's camera-scaled height gives you the
  honest version of the same effect.
- **The six-layer atmosphere stack.** You have `FogExp2` and pixel-space paper grain. If time
  remains at the very end, add one sparse `THREE.Points` dust layer — ~250 sprites, opacity
  0.02–0.12. Nothing else.
- Noise-based reveal masks, WebGL-rendered UI, contrast breathing, screen veil, ghost ink
  registration.

The review document orders camera physics and atmosphere ahead of the panel. For a studio with a
month, that is right. For a three-minute pitch to municipal officials and VNIT faculty it is not:
**the panel answers every question they will ask and the atmosphere answers none of them.** Camera
inertia wins ten seconds of fly-through; the panel wins the Q&A.

---

## Numbers for whoever writes the deck

- **116 of 405 points exceed IS 10500** — 97 on a health-relevant parameter, 19 on taste/scaling only.
- **All 23 river sites exceed. All 12 city wells exceed.** 81 of 347 CGWB points exceed.
- Drivers: nitrate 52 · coliform 35 · hardness 22 · fluoride 10 · **lead 4**.
- All 10 lakes fail CPCB Class B, by 4× to 40× on faecal coliform.

The pattern is the finding: **exceedance concentrates where people live.** Every measured point
inside the city fails. Most points 30 km out do not.
