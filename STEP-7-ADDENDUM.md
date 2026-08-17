# STEP 7 — ADDENDUM
### Read 7.0 before writing any of 7.2. It corrects an error in the main Step 7 document.

Verified against `log 1.3`: fonts are self-hosted, the panel close button works, and the
nearest-measurement beat is fully implemented and draws its ring. Good.

What follows is the genuinely unfinished work — including 6.6, which was never built.

---

## 7.0 — CORRECTION: marks share materials, so `setMode` as written fades everything ⚠

In `loadMarks()` every mark is assigned one of two shared instances:

```js
let mat = markMat;                 // one MeshBasicMaterial for ~289 marks
if (v.state === 'EXCEEDS') mat = redMat;
```

My §7.2 says `gsap.to(m.material, { opacity: ... })` per mark. Against a shared material that runs
405 competing tweens on the same object and **fades the entire map at once**. §7.5's attention
falloff has the identical problem.

Give every mark its own material at build time:

```js
mesh.material = mat.clone();
mesh.material.transparent = true;      // set NOW, not inside the tween, or frame one pops
mesh.material.opacity = 1;
```

405 `MeshBasicMaterial` clones cost effectively nothing — each mark is already its own draw call.
Both 7.2 and 7.5 depend on this; neither works without it.

The exceedance proxies are fine as they are: they toggle `.visible`, which is per-object, so the
shared `HL_EXCEED` material is not a problem.

---

## 7.7 — River particles *(the 6.6 item — 75 min)*

Never built, and it is the one piece of motion in the whole build that carries an argument instead
of decorating one. **The water visibly darkens as it crosses the city, and that is a measured fact.**

Start with a CPU implementation, not GPGPU. At 3,000 particles a plain `BufferGeometry` updated on
the CPU runs comfortably, and it removes a whole class of silent shader failure on the night before
a deadline. Move to GPGPU only if you have hours to spare, which you don't.

```js
// Build flow paths from waterways.json — rivers and canals only, not every drain
const paths = waterways
  .filter(f => f.w === 'river' || f.w === 'canal')
  .map(f => f.p.map(([lon, lat]) => { const [x, z] = project(lon, lat); return [x, z]; }))
  .filter(p => p.length > 8);

const N = 3000;
const pos  = new Float32Array(N * 3);
const col  = new Float32Array(N * 3);
const seed = new Array(N);

for (let i = 0; i < N; i++) {
  const path = paths[(Math.random() * paths.length) | 0];
  seed[i] = { path, t: Math.random() * (path.length - 1), life: 3 + Math.random() * 7 };
}

// Dissolved oxygen 3.67 -> 0.48 along the Nag. Interpolate along each path's own length.
const DO = std.rivers.Nag.map(r => r.do_mgl ?? r);       // ordered series
function doAt(u) {                                        // u = 0..1 downstream
  const f = u * (DO.length - 1), i = Math.floor(f);
  return THREE.MathUtils.lerp(DO[i], DO[Math.min(i + 1, DO.length - 1)], f - i);
}
```

Per frame, advance each particle along its polyline, add Perlin jitter perpendicular to flow, and
decrement `life`; at zero, reseed at the path start. Colour comes from oxygen:

```js
const ox = doAt(t / (path.length - 1));                   // 3.67 downto 0.48
const k  = THREE.MathUtils.clamp((ox - 0.48) / (3.67 - 0.48), 0, 1);
c.setHex(0x000000).lerpColors(INK_DARK, WATER, k);        // low oxygen -> dark ink
```

```js
const mat = new THREE.PointsMaterial({
  size: 1.6, sizeAttenuation: false,      // screen-space, like everything else on this map
  transparent: true, opacity: 0.42,
  vertexColors: true, fog: true,
  depthWrite: false,
});
const pts = new THREE.Points(geo, mat);
pts.layers.set(0);          // LAYER 0 ONLY — same trap as Line2. Points in the normal
                            // pass become garbage triangles.
pts.renderOrder = 2;
```

**The failure mode to avoid is a particle effect.** Not hundreds of bright dots moving fast — a
quiet current inside the line. If you notice the particles before you notice the flow, halve the
opacity and halve the speed. They must stay visually subordinate to the river stroke itself.

Only run them in modes where they mean something: `all`, `water`, and off in `unmeasured` — the
whole point of that mode is stillness.

---

## 7.8 — Quality tiers and reduced motion *(30 min — these are hard rules, not polish)*

Neither exists in the build. Both were non-negotiable from the start and both are cheap.

```js
let frames = 0, fpsT = 0, tier = 2;                       // 2 = full, 1 = no particles, 0 = no composite
function monitorFps(dt) {
  frames++; fpsT += dt;
  if (fpsT < 1) return;
  const fps = frames / fpsT; frames = 0; fpsT = 0;
  if (fps < 40 && tier === 2) { tier = 1; pts.visible = false; console.warn('tier 1: particles off'); }
  else if (fps < 32 && tier === 1) { tier = 0; useComposite = false; console.warn('tier 0: composite off'); }
}
```

At tier 0 the composite pass is skipped and the diffuse buffer blits straight to screen. It looks
plainer. **A stuttering demo is worse than a plain one**, and this runs on whatever laptop is
plugged into the projector, not yours.

```js
if (matchMedia('(prefers-reduced-motion: reduce)').matches) {
  pts.visible = false;
  DRIFT = 0;                    // no idle camera drift
  NAV_DURATION = 0.4;           // navigation still works, just doesn't swoop
}
```

---

## 7.9 — The crop tool. Written months ago, never wired. *(45 min — biggest free win left)*

`verdict.js` exports `cropLoss()` and `irrigationVerdict()`. Neither is imported by `main.js`.
`standards.json` carries **35 crops, 13 with direct FAO-29 ECw bands**. And **all 347 CGWB
groundwater points have EC, pH and SAR** — every input the functions need is already loaded.

This is the entire agricultural half of the pitch, sitting unused behind one import.

```js
import { cropLoss, irrigationVerdict } from './verdict.js';
```

A second tab in the existing panel, shown when a groundwater or city-well mark is selected:

```
IRRIGATION                    ← tab beside DRINKING

CPCB Class E: PASS
  pH 8.0 (allowed 6.0–8.5)
  EC 1160 µS/cm (limit 2250)
  SAR 4.22 (limit 26)
─────────────────────────────
PREDICTED YIELD LOSS
  Cotton              0%
  Sorghum (jowar)     0%
  Wheat               0%
  Bean               12%
  FAO-29 ECw bands (direct)
```

Sort by `nagpur_relevance: high` first — Cotton is flagged high and is the district's signature
crop. Always print the `method` string `cropLoss()` returns; it names FAO-29 and says whether the
direct bands or the derived threshold was used. That one line is what makes it survive a question
from a VNIT examiner.

### The honest result is the good result

| | |
|---|---|
| Groundwater EC | median **861**, p90 **1898**, max **4920** µS/cm |
| Fail CPCB Class E for irrigation | **21 of 347** |
| Cotton with any yield loss | **1 of 347** sites |
| Bean with any yield loss | **235 of 347** sites |
| At the worst site (4920 µS/cm) | Bean **100%**, Broadbean 62%, Maize 58%, Rice 43%, Cotton **2%** |

**Do not dress this up as a crisis.** The finding is that for cotton the groundwater is fine almost
everywhere, and for beans it isn't — the salinity problem is real, localised, and crop-specific.
Say exactly that:

> For cotton, groundwater salinity is a non-issue across almost the whole district — one site in
> 347. For beans it costs yield at two-thirds of them. That's the difference between a warning a
> farmer can act on and a headline they'd ignore.

A team that reports a null result correctly is more trustworthy than one that finds a crisis
everywhere, and this costs you nothing to say.

---

## 7.10 — Small loose ends, all quick

**The panel caption is hardcoded.** `index.html:254` always reads `NEAREST MEASUREMENT`, even when
you clicked a mark directly. That is literally the "measurement of what?" complaint still on
screen. Drive it from state:

```js
capEl.textContent = selected ? OBSERVATION[selected.userData.kind].type   // GROUNDWATER, LAKE OBSERVATION…
                  : nearMeActive ? 'NEAREST MEASUREMENT'
                  : 'THE RECORD';
```

**Particles must respect the fog** — `fog: true` on `PointsMaterial`, or they float in front of the
depth haze and destroy the aerial perspective you already have.

**`setMode` must also drive the lake polygons and shorelines**, not only `markMeshes`. In "Drinking
sources" the lakes should recede; in "Rivers and lakes" they lead. They're in a separate array —
easy to forget.

**Selection must survive a mode change.** If a selected mark's group fades to 0.06, either clear
the selection or keep that one mark at full opacity. Silently fading the thing the panel is
describing is the same class of bug as the original flicker.

**Delete the Vite template leftovers**: `src/counter.js`, `src/assets/hero.png`,
`src/assets/javascript.svg`, `src/assets/vite.svg`. Dead weight in the build and in the repo you're
handing to judges.

**Add a WebGL context-loss handler.** Two lines, and it turns a black screen at the venue into a
recoverable one:

```js
renderer.domElement.addEventListener('webglcontextlost', e => { e.preventDefault(); });
renderer.domElement.addEventListener('webglcontextrestored', () => location.reload());
```

---

## 7.11 — What stays cut, deliberately

| | |
|---|---|
| **GPGPU particles** | The CPU version at 3,000 points is indistinguishable at this density and cannot fail silently. |
| **Loading gate** | Nice, but the data is ~500 KB and loads instantly on a local server. Zero visible benefit. |
| **Citizen reporting form** | Real feature, no time. Say in the pitch that submissions store no name and no personal identifier — the privacy design is worth describing even unbuilt. |
| **Sewage outfalls** | 12 of them, still ungeocoded. Not blocking; nothing depends on them. |
| **Six-layer atmosphere** | You have `FogExp2` and paper grain. If everything else is done and there's still time, one sparse `THREE.Points` dust layer, ~250 sprites, opacity 0.02–0.12. Nothing more. |
| **Per-layer parallax** | Still wrong, still would break geographic registration. Never. |

---

## Revised order for whatever time is left

| | | |
|---|---|---|
| **7.0** | material cloning | 10 min — **blocks 7.2 and 7.5** |
| **7.1** | lake pick meshes | 35 min · P0 |
| **7.2** | six menu modes | 60 min · P0 |
| **7.10** | panel caption + selection-survives-mode | 20 min |
| **7.9** | crop tool | 45 min — most product value per minute remaining |
| **7.8** | quality tiers + reduced motion | 30 min — hard rules, and insurance for the venue laptop |
| **7.3** | menu choreography + font | 40 min |
| **7.4** | nav anticipation and settle | 30 min |
| **7.7** | river particles | 75 min — the signature, if the hours exist |
| **7.5** | attention falloff | 20 min |

If it comes down to a choice: **7.9 before 7.7.** The crop tool answers "what does this do for a
person?", which is the question that decides the round. The particles answer "is this beautiful?",
and by now the map already is.
