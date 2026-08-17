# HANDOFF — read fully before writing any code

You are building `experience/` for a 24-hour hackathon. **This file is the contract.** If any instruction you're given later conflicts with the HARD RULES below, follow the rules and say why.

---

## 🛑 STOP POINTS — non-negotiable

**You must STOP and wait for human review at each 🛑 below.** Do not continue to the next step on your own.

At every stop:
1. Run the dev server, open the page in the browser
2. **Take a screenshot and look at it yourself**
3. Post the screenshot + one line on what works and what doesn't
4. **Wait.**

**Why this is stricter than normal:** shaders fail silently. A wrong uniform gives a black screen or an unchanged image — not an error. The console will be clean while the output is wrong. **You cannot verify this work by reading logs. You must look.**

If a screenshot doesn't match the step's stated intent, fix it before proceeding. Never build on an unverified step.

---

## THE PROJECT

A WebGL map of the Nagpur river basin showing every published water measurement — 395 of them — in the visual language of chartogne-taillet.com: hand-drawn 15th-century cartography, ink on parchment, watercolour particles.

**The argument the product makes:** Nagpur's water *is* tested by three government bodies, but published as one city-wide percentage, a 295-page PDF, and 37 separate map files. No resident can get an answer about where they actually live. We connect what's already measured to the person it affects.

**Emptiness on the map is intentional.** Unmeasured areas stay blank because nobody has measured them. Never fill them in.

---

## WHAT ALREADY EXISTS — do not rebuild

| File | What |
|---|---|
| `web/verdict.js` | Verdict engine. **Copy unchanged.** Its output strings are compliance-critical |
| `web/data/points.json` | 395 measurements — 347 CGWB groundwater, 23 river, 12 city wells, 13 STPs |
| `web/data/waterways.json` | 302 watercourses — rivers, streams, drains, canals |
| `web/data/standards.json` | IS 10500 limits, FAO crop table, `rivers.Nag` oxygen series |
| `web/index.html` | Working reference implementation. Copy the **logic**, not the look |

A separate "legacy" site is being built by another team. **This one is the experience** — no accessibility fallback needed beyond `prefers-reduced-motion` and a frame-rate quality tier.

---

## HARD RULES

1. **Never output the word "safe"** — or potable, drinkable, clean. Three verdict states only, from `verdict.js`, **verbatim**. Never paraphrase or shorten them.
2. **No green anywhere.** No ticks. `NO_EXCEEDANCE` is not an endorsement.
3. **No interpolated surface.** No heatmap, kriging, IDW or smooth quality gradient. Discrete marks only.
4. **Every panel shows** `source_agency` and `sample_period`.
5. **Never render UI inside WebGL.** HTML panels positioned over the canvas. The reference did it in WebGL for performance reasons that don't apply at 395 points.
6. **Below 40fps** — reduce particles, then disable the composite pass. A stuttering demo is worse than a plain one.

**Palette:** paper `#fdfcf5` / `#efe9dd` · ink `#22201c` · muted `#6b655c` · water `#8fa6a8` · exceedance `#b23a26`

---

## SETUP

```bash
cd VBH
npm create vite@latest experience -- --template vanilla
cd experience && npm install three gsap && npm install -D vite-plugin-glsl
mkdir -p public/data src/shaders
cp ../web/data/*.json public/data/
cp ../web/verdict.js src/verdict.js
npm run dev
```

```js
// vite.config.js
import glsl from 'vite-plugin-glsl'
export default { plugins:[glsl()], base:'./' }
```

---

## CORE ARCHITECTURE

> **The map is a FLAT PLANE in a 3D scene.**

No DEM, no heightmap, no terrain mesh. A flat plane gives both camera angles — bird's-eye (above) and peripheral (tilted ~55°) — animated with GSAP. Marks, outfall pins and STP blocks are small extruded shapes **generated in code**, standing on the plane. Import no models.

---

## BUILD STEPS

### STEP 1 — scaffold *(20 min)*
Vite + three. Flat plane, orbit camera, correct background colour.
### 🛑 STOP. Screenshot. Wait.

### STEP 2 — watercourses *(30 min)*
Load `waterways.json`, project lon/lat to plane coordinates, draw all 302 as line geometry. Rivers thicker than drains.
### 🛑 STOP. Screenshot. Wait.

### STEP 3 — the composite shader ⭐ *(90 min — this is the entire aesthetic)*

Two details that most attempts get wrong:

**(a) Sobel on the NORMAL buffer as well as colour.** Re-render the scene with `MeshNormalMaterial` into a second render target. Then:
```
combinedSobel = sobel(diffuse) * 0.6 + sobel(normals) * 0.3
```
Colour-only Sobel gives cartoon outlines. The normal pass is what produces interior linework that reads as *drawn*.

**(b) Offset the sample UV with noise — do not multiply the edge by noise.**
```glsl
vec2 uvNoise = vUv + texture2D(uNoiseTex, vUv * 2.0).rg * 0.004;
float edge = combinedSobelValue(uvNoise);
```
Multiplying gives jagged aliased lines. Offsetting where you sample gives squiggly hand-drawn ones. **This single line is most of the pen-on-paper feel.**

Generate `uNoiseTex` procedurally at startup (fBm to a canvas or DataTexture). No asset.

**Composite order:**
```
edge → paper(fBm, 0.93+f*0.07) → mix(parchment, ink, edge)
     → mix(color, highlightTint, highlight.r*0.4) → *paper → vignette
```
Uniforms: `tDiffuse`, `uNormals`, `uNoiseTex`, `tHighlight`, `uResolution`, `uTime`, `uInkStrength`.

### 🛑 STOP. Screenshot. Wait.
**If it looks flat/CG rather than drawn, say so plainly. Do not proceed — every later step inherits this look.**

### STEP 4 — the 395 marks *(45 min)*
Small extruded shapes on the plane. Colour by `drinkingVerdict()` from `verdict.js`: exceedance red, no-exceedance muted blue-grey, not-tested hollow. Circles for groundwater, squares for river sites, rings for STPs.
### 🛑 STOP. Screenshot. Wait.

### STEP 5 — highlight pass + panel *(60 min)*
Low-res render target, hoverable objects each in a flat unique colour. Read the pixel under the cursor to identify what's hovered — **no raycasting needed.** Feed as `tHighlight`. HTML panel shows the verdict, values, source, period.
### 🛑 STOP. Screenshot. Wait.

### STEP 6 — GPGPU particles *(75 min)*
Position in a texture, updated in a fragment shader. Flow paths are the 302 watercourses. Seed at a random vertex, advance along the polyline, Perlin jitter perpendicular to flow, `life` decrements and resets at zero.

**Colour by dissolved oxygen.** `standards.json → rivers.Nag` is an ordered series 3.67 → 0.48 mg/L. Interpolate along it so **particles visibly darken travelling downstream.** The fluid animation carries the pollution argument.
### 🛑 STOP. Screenshot. Wait.

### STEP 7 — camera + titles *(45 min)*
GSAP timeline between bird's-eye and oblique, animating camera position, target and `uInkStrength` together. Letter-stagger title reveal:
```js
gsap.fromTo(spans, {opacity:0,y:14,filter:'blur(6px)'},
  {opacity:1,y:0,filter:'blur(0px)',duration:.9,stagger:{each:.028,from:'random'}})
```
Font: EB Garamond, self-hosted woff2, `letter-spacing:.28em`, uppercase.
### 🛑 STOP. Screenshot. Wait.

### STEP 8 — filters + quality tiers *(45 min)*
Layer toggles in the panel driving a uniform mask. Frame-rate monitor with graceful degradation.
### 🛑 STOP. Final screenshot + browser recording.

---

## IF YOU GET STUCK

**Say so immediately rather than trying alternatives silently.** There is a hard deadline. Twenty minutes on one shader bug is acceptable; an hour is not. If step 3 isn't converging after 45 minutes, stop and report — there is a fallback plan.
