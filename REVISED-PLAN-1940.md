# Revised plan · 19:40, 17 Aug
### 8h 20m to freeze · 14h 20m to code end · nothing pushed since 12:56

---

# PART 1 — the phone plan: what to keep, what to change

The architecture from the other conversation is technically correct. But **it is explicitly a six-week plan** — its own build order says Week 1 terrain, Week 2 polygons, Week 3 shader, Week 4 particles, Week 5 camera, Week 6 data panels. Six changes make it fit tonight.

## ✅ KEEP — this is the part that matters

**The four-pass compositing shader.** Sobel edge detection + Perlin irregularity + paper texture overlay. **This is the entire look.** Everything else in that plan is scaffolding around it. If you build one thing from the shader spec, build this.

**GPGPU particles.** Position-in-texture, updated in GLSL, life resetting to origin. Correct technique, keep it.

**GSAP for the camera journey.** Right tool.

**Dynamic quality degradation on frame rate.** Keep — and it's your insurance under a projector.

---

## 🔴 CHANGE 1 — Drop the 3D terrain. Entirely.

**The plan's biggest cost and your smallest return.**

Chartogne needed 3D because terroir *is* slopes — the whole story is which plot sits on which hill. **Your story is points on a map and how far apart they are.** Relief adds nothing to that argument.

What dropping it saves: an EarthExplorer account, an SRTM download, GeoTIFF→PNG conversion, 256×256 mesh displacement, vertex normals, lighting, and every bug in that chain.

**A flat 2D ink map delivers ~90% of the aesthetic**, because the signature is the *pencil-on-paper compositing*, not the third dimension. The shader doesn't care whether the scene beneath it is flat.

## 🔴 CHANGE 2 — Invert the build order

The plan puts **data panels at Week 6**. Those panels *are the product*. Build in that order and if you run out of time you have a beautiful empty map.

**Data first, beauty second.** You already have the data layer working in `web/index.html` — the WebGL build should wrap around it, not replace it.

## 🔴 CHANGE 3 — Do NOT render the UI inside WebGL

**This is the single worst thing to copy tonight.**

Immersive Garden did it because they had a full 3D scene plus hundreds of thousands of particles and HTML overlay genuinely cost them frames. **You have 395 points.** You will never be GPU-bound.

Copying it means drawing every text label to a canvas, uploading it as a texture, building a coordinate projection system, and hand-rolling mouse hit-testing against rectangles. **That is most of your remaining night, for zero visual difference.**

**Keep HTML panels absolutely positioned over the canvas.** Same look, styleable in CSS, accessible, debuggable, and free.

## 🔴 CHANGE 4 — Verify ward polygons before depending on them

The plan assumes DataMeet has Nagpur ward GeoJSON. **I looked earlier and could not find NMC ward boundaries published anywhere.** If they're not there, that layer dies and takes the "extrude polygons, colour by quality" step with it.

**And you don't need it.** 395 points and 302 watercourses is your geography. Check the repo in five minutes; don't build on the assumption.

## 🔴 CHANGE 5 — Particles flow along rivers, not pipelines

The plan flows particles along OSM water pipelines. **Your OSM extract has essentially no water pipelines for Nagpur** — it has 302 watercourses: rivers, streams, drains, canals.

Flow them down the watercourses instead. **It's also more on-message** — particles carrying downstream *is* the pollution story, and the oxygen dying from 3.67 to 0.48 is exactly what they'd be visualising.

## 🔴 CHANGE 6 — Skip sound design

In the reference, correct. In a noisy hall, in three minutes, with a projector — it adds nothing and it's one more thing to fail.

---

## What you actually need to provide manually

The phone plan's manual list shrinks a lot with terrain dropped:

| Their list | Now |
|---|---|
| SRTM DEM .tif from EarthExplorer | ❌ **not needed** |
| Overpass query result | ✅ **already have it** — 302 watercourses extracted |
| Water quality CSV | ✅ **already have it** — 395 points, verified |
| Paper texture PNG | ⚪ I can generate procedurally in the shader — no asset needed |
| Colour palette approval | ✅ done — the tokens are in `DESIGN-PROMPT.md` |
| Screenshot feedback | ✅ **this is the real one.** Only you can see it running |
| Branding / copy | ✅ done — it's in the verdict wording |

**So: nothing external is needed. Everything is in the repo already.**

---

# PART 2 — the plan for the next 8h20m

**Two tracks in parallel. The abort criterion is the important part.**

## Track A — the WebGL experience *(Sonnet, in Antigravity)*

Build as `web/experience.html`. **Never touch `index.html`.** Same `verdict.js`, same `data/*.json`.

| Time | Step | Checkpoint |
|---|---|---|
| 19:45–20:30 | Scene + flat map, watercourses as ink geometry, HTML panel overlay | Something renders |
| 20:30–21:45 | **The compositing shader** — Sobel + Perlin + paper + vignette | It looks hand-drawn |
| 21:45–22:30 | 395 marks, draw-on with the counter, hover highlight pass | It looks alive |
| 22:30–23:30 | GPGPU particles down the watercourses | It looks expensive |
| 23:30–00:30 | Selection → pigment bleed, zoom choreography | It feels designed |
| 00:30–01:30 | Frame-rate quality tiers + the fallback switch | It's safe |

> ## 🚨 THE ABORT CRITERION — 01:30
> **If the compositing shader is not working and looking right by 01:30, stop and demo `index.html`.**
>
> Not a judgement on ambition — a decision made now, while calm, so it isn't made at 3am while panicking. Write it on a wall.

## Track B — content that works either way *(me, now)*

These land in both versions because they're data and logic, not rendering:

| Time | What | Why |
|---|---|---|
| 19:45–20:15 | **F4 crop verdict + yield-loss bars** | Backs your best claim. Zero blockers |
| 20:15–20:45 | **F6 river DO chart** | Backs your second-best claim. Data ready |
| 20:45–21:15 | **F5 add-a-reading** | The demo climax |
| 21:15–21:45 | Counter line: *"395 measurements · 12 inside the city · 3 million residents"* | Your best statistic, currently unsaid |
| 21:45–23:00 | Deck + 3-minute script + Q&A assignments | Nobody has started this |

## Track C — yours, tonight *(1 hour total, high value)*

| # | Task | Why now |
|---|---|---|
| 1 | **Commit and push everything, including `web/`** | It only exists on one laptop. That is a single point of failure |
| 2 | **Geocode the 12 outfalls** | 1 hour, unlocks F7 |
| 3 | Check DataMeet for Nagpur wards | 5 min, answers Change 4 |

---

## The one thing I'd say if I could only say one

**At 19:39, nine and a half hours in, nothing is committed and the only working build is on one machine.** Push first. Everything else — shader, particles, panels — is recoverable. A laptop dying at 2am with the sole copy is not.
