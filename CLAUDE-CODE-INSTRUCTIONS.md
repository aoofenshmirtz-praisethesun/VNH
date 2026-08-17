# Instructions for Claude Code in Antigravity
### Paste this whole file as the first message

---

## ⚡ FIRST — use Antigravity's browser, every step

Antigravity gives you **browser control and screenshot capability**, and Artifacts (screenshots, browser recordings) as deliverables. **Use them on every single step.**

> **After each build step: run the dev server, open the page in the browser, screenshot it, and look at your own screenshot before saying the step is done.**

This matters more here than on a normal build, because **shaders fail silently** — a wrong uniform gives you a black screen or an unchanged image, not an error. Reading the console is not enough; you have to look.

If a step's screenshot doesn't match its described intent, fix it before moving on. Never stack a step on an unverified one.

---

## PROJECT

Building `experience/` — a WebGL map of the Nagpur river basin, in the visual language of chartogne-taillet.com (hand-drawn 15th-century cartography, ink on parchment, watercolour particles).

**A second "legacy" site is being built separately by another team.** This one is the experience — no need to hedge for accessibility fallbacks beyond `prefers-reduced-motion` and a frame-rate quality tier.

`web/index.html` in this repo is the **data-correctness reference**. Same data, same verdict logic, different presentation. **Copy `web/verdict.js` unchanged** — its output strings are compliance-critical and must never be paraphrased.

---

## SETUP — ~20 minutes

```bash
cd VBH
npm create vite@latest experience -- --template vanilla
cd experience
npm install three gsap
npm install -D vite-plugin-glsl
```

```js
// vite.config.js
import glsl from 'vite-plugin-glsl'
export default { plugins:[glsl()], base:'./' }
```

```bash
mkdir -p public/data src/shaders
cp ../web/data/*.json public/data/
cp ../web/verdict.js src/verdict.js
npm run dev
```

**Screenshot the running Vite page before doing anything else.** That's step zero.

---

## THE CORE ARCHITECTURAL DECISION

> **The map is a FLAT PLANE in a 3D scene.**

No DEM, no heightmap, no terrain mesh, no EarthExplorer account, no GeoTIFF conversion.

A flat plane in 3D gives **both camera angles**: bird's-eye (camera above, looking down) and peripheral/oblique (camera tilted ~55°). GSAP animates between them. All the dimensional feel of the reference, none of the terrain pipeline.

Things that should look 3D — measurement marks, outfall pins, STP blocks — are small extruded shapes standing *on* the plane. **Generate them in code** (`ExtrudeGeometry`, `CylinderGeometry`); do not import models.

---

## ⭐ THE SHADER — this is 90% of the aesthetic

The reference's look comes from a multi-pass composite. The publicly documented technique that gets closest is the Codrops "Sketchy Pencil Effect" approach. **Two details matter enormously — most naive attempts miss both:**

### Detail 1 — run Sobel on the NORMAL buffer, not just colour

Silhouette-only edge detection looks like a cartoon outline. What produces *drawn* linework is combining:

- **Sobel on the diffuse (colour) buffer — weight 0.6**
- **Sobel on a normal buffer — weight 0.3**, captured by re-rendering the scene with `MeshNormalMaterial` into a second render target

```
combinedSobel = diffuseSobel * 0.6 + normalSobel * 0.3
```

The normal pass is what gives interior detail and makes surfaces read as hatched rather than outlined.

### Detail 2 — offset the SAMPLE UV with noise, don't multiply the edge by noise

Multiplying noise into the edge value gives you jagged, aliased lines. **Offsetting the UV you sample at** gives you squiggly, hand-drawn lines:

```glsl
vec2 uvNoise = vUv + texture2D(uNoiseTex, vUv * 2.0).rg * 0.004;
float edge = combinedSobelValue(uvNoise);
```

Generate `uNoiseTex` procedurally at startup — a cloud/fBm texture rendered once to a canvas or a data texture. No asset to download.

### Full composite order

```glsl
// 1. sobel(diffuse) * 0.6 + sobel(normals) * 0.3, sampled at noise-offset UV
// 2. paper = procedural fBm, 0.93 + f*0.07
// 3. color = mix(parchment #fdfcf5, ink #22201c, edge)
// 4. color = mix(color, highlightTint, highlight.r * 0.4)
// 5. color *= paper
// 6. color *= 1.0 - length(vUv-0.5) * 0.8    // vignette
```

**Uniforms:** `tDiffuse`, `uNormals`, `uNoiseTex`, `tHighlight`, `uResolution`, `uTime`, `uInkStrength`.

### Highlight pass

A **low-resolution** second render target. Render only hoverable objects, each in a flat unique colour. Read the pixel under the cursor → that identifies what's hovered with **no raycasting**. Feed the target in as `tHighlight` to tint the hovered region red, as the reference does.

---

## PARTICLES — the fluid

GPGPU, position stored in a texture, updated in a fragment shader.

- **Flow paths are the 302 watercourses** in `waterways.json`. The OSM extract has essentially no water pipelines, so rivers and drains are the network.
- Seed each particle at a random vertex on a watercourse; advance along the polyline each frame; add Perlin jitter perpendicular to flow.
- `life` decrements each frame; at zero, reset to the path start.
- **Colour by dissolved oxygen.** `standards.json` has `rivers.Nag` as an ordered series running 3.67 → 0.48 mg/L. Interpolate along it so **particles visibly darken as they move downstream.** The fluid animation becomes the pollution argument rather than decoration.

---

## LAYOUT

Panel and rails are **HTML absolutely positioned over the canvas** — styled to match (paper background, EB Garamond, hairline borders). Do **not** render UI inside WebGL; the reference did that for performance reasons that do not apply at 395 points, and it would cost hours and all accessibility.

```
left rail: graphs / more info   |   centre: canvas   |   right: panel + filters
bottom-centre: contact / feedback
```

---

## TEXT ANIMATION

```js
function revealText(el){
  el.innerHTML = [...el.textContent].map(c =>
    `<span style="display:inline-block;white-space:pre">${c}</span>`).join('')
  gsap.fromTo(el.querySelectorAll('span'),
    { opacity:0, y:14, filter:'blur(6px)' },
    { opacity:1, y:0, filter:'blur(0px)', duration:.9, ease:'power2.out',
      stagger:{ each:.028, from:'random' } })
}
```

`from:'random'` produces the scattered-then-settling effect. Titles: EB Garamond, self-hosted woff2, `letter-spacing:.28em`, uppercase, `clamp(48px,7vw,120px)`.

---

## BUILD ORDER — screenshot after every step

| # | Step | Time | Screenshot should show |
|---|---|---|---|
| 1 | Vite + three, flat plane, orbit camera | 20m | A plane, orbitable |
| 2 | 302 watercourses as line geometry on the plane | 30m | The river network |
| 3 | **Composite shader** — dual Sobel, UV-offset noise, paper, vignette | 90m | **It looks drawn** ⭐ |
| 4 | 395 marks as extruded shapes, colour by `drinkingVerdict()` | 45m | Marks on the map |
| 5 | Highlight pass + hover + HTML panel wired to verdict | 60m | Hover tints, panel fills |
| 6 | GPGPU particles down watercourses, coloured by oxygen | 75m | Water flowing, darkening |
| 7 | GSAP camera bird's-eye ⇄ oblique + letter-stagger titles | 45m | It moves |
| 8 | Filters, frame-rate quality tiers | 45m | It's safe |

**Step 3 is the one that matters.** If it looks flat and CG rather than drawn, stop and fix it before continuing — everything after inherits that look.

---

## HARD RULES — do not violate for any aesthetic reason

- Verdict strings from `verdict.js` **verbatim**. Never paraphrase, shorten or "improve".
- **No green anywhere.** No ticks. Never the words safe / potable / drinkable / clean.
- **No interpolated surface** — no heatmap, no kriging, no smooth quality gradient. Discrete marks only; unmeasured space stays paper.
- Every panel shows `source_agency` and `sample_period`.
- Below 40fps: reduce particle count, then disable the composite pass. **A stuttering demo is worse than a plain one.**
- Respect `prefers-reduced-motion`.

**Palette:** paper `#fdfcf5` / `#efe9dd` · ink `#22201c` · muted ink `#6b655c` · water `#8fa6a8` · exceedance `#b23a26`.
