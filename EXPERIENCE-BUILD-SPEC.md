# experience.html — build spec for Sonnet / Antigravity
### Every technique you asked for, with how to actually do it

**Context:** two sites. Another team builds the **legacy** site (plain, data-first). **You build this one** — the experience. That means no hedging here; the legacy site is the fallback.

`web/index.html` in this repo is not a competitor — it's the **data-correctness reference**. Same `data/*.json`, same `verdict.js`, same wording. Copy the logic, not the look.

---

## SETUP — run these first

```bash
cd VBH
npm create vite@latest experience -- --template vanilla
cd experience
npm install three gsap
npm install -D vite-plugin-glsl
```

`vite.config.js`:
```js
import glsl from 'vite-plugin-glsl'
export default { plugins:[glsl()], base:'./' }
```

Copy `web/data/*.json` → `experience/public/data/`
Copy `web/verdict.js` → `experience/src/verdict.js` **unchanged**

**Structure:**
```
src/ main.js · scene.js · marks.js · particles.js · ui.js · verdict.js
     shaders/ composite.frag · highlight.frag · particles.frag · quad.vert
public/data/ points.json · waterways.json · standards.json
```

---

## THE ONE ARCHITECTURAL DECISION THAT MAKES THIS CHEAP

> **The map is a FLAT PLANE living in a 3D scene.**

No DEM. No heightmap. No terrain mesh. No EarthExplorer account.

A flat plane in 3D gives you **both camera angles you asked for** — bird's-eye is the camera straight above, the peripheral/oblique view is the camera tilted to ~55°. GSAP animates between them. You get the entire 3D feel of the reference for zero terrain work.

Objects that need to look 3D (marks, outfall pins, STP blocks) are small extruded shapes standing *on* that plane. That's where the dimensionality reads from — not from hills.

---

## YOUR 5 REQUESTED FEATURES — how each is actually done

### 1 · Text rendering, letter by letter

The reference draws text into canvas and uploads it as a WebGL texture. **Do not copy that.** They did it because they had a full 3D scene and no HTML anywhere. You have HTML.

Same visual result, ~15 lines:

```js
// split into per-letter spans, then stagger them in
function revealText(el){
  el.innerHTML = [...el.textContent].map(c =>
    `<span style="display:inline-block;white-space:pre">${c}</span>`).join('')
  gsap.fromTo(el.querySelectorAll('span'),
    { opacity:0, y:14, filter:'blur(6px)' },
    { opacity:1, y:0, filter:'blur(0px)', duration:.9, ease:'power2.out',
      stagger:{ each:.028, from:'random' } })   // 'random' gives the scattered look
}
```

`stagger.from:'random'` is what produces the effect in your screenshot — letters arriving out of order and settling.

### 2 · Loading and font

**Loading gate**, same idea as the reference's age-check: show a minimal screen, start the background as soon as the *minimum* is loaded, continue loading the rest behind it.

```js
const critical = ['data/waterways.json','data/points.json']   // start after these
const deferred = ['textures/paper.png']                        // load behind the gate
```

**Font.** The reference uses Sabon LT Std (paid). Free and very close in feel:
- **EB Garamond** — closest to Sabon
- **Cormorant Garamond** — more delicate, good for the huge letterspaced titles

Self-host the woff2 (no Google Fonts request — the demo must work offline). For the title treatment in your screenshots: `letter-spacing: .28em; font-size: clamp(48px, 7vw, 120px); text-transform: uppercase`.

### 3 · Transitions between views

One GSAP timeline per transition. Camera position + target + composite-shader uniforms all animate together so the paper effect breathes with the movement.

```js
gsap.timeline({defaults:{duration:1.4, ease:'power2.inOut'}})
  .to(camera.position, {x:0, y:120, z:0.1}, 0)       // to bird's eye
  .to(controls.target, {x:tx, y:0, z:tz}, 0)
  .to(uniforms.uInkStrength, {value:1.15}, 0)
```

### 4 · Highlight pass + composite pass ⭐ the actual look

**Highlight pass** — a second render target, deliberately low resolution:
1. Render only hoverable geometry, each in a flat unique colour
2. Read the pixel under the cursor → tells you what's hovered, no raycasting needed
3. Feed that target into the composite as `tHighlight` to tint the hovered region

**Composite pass** — this is the entire aesthetic. In `composite.frag`:

```glsl
// 1. Sobel edge detection on the scene render -> pencil lines
// 2. Perlin noise multiplied into the edges -> irregular, hand-drawn stroke weight
// 3. mix(parchment, ink, edge * noise) -> the drawing
// 4. multiply by paper texture -> grain
// 5. add tHighlight tint -> hover feedback
// 6. radial vignette -> the aged look
```

**Generate the paper texture procedurally** — no asset to download:
```glsl
float paper(vec2 uv){
  float f = snoise(uv*380.)*.5 + snoise(uv*820.)*.3 + snoise(uv*40.)*.2;
  return .93 + f*.07;
}
```

### 5 · Fluid, from bird's eye and peripheral

**GPGPU particles flowing down the watercourses.** You have 302 of them in `waterways.json` — use those as the flow paths (there are essentially no water pipelines in the OSM extract, so rivers and drains are the network).

- Seed each particle at a random vertex along a watercourse
- Each frame in the shader: advance along the polyline, add Perlin jitter perpendicular to flow
- `life` decrements; at zero, reset to the path origin
- **Colour by the river's oxygen** — the Nag going 3.67 → 0.48 means particles literally darken as they travel downstream. **The fluid animation becomes the pollution story.**

Both camera angles work on the same particle system — bird's-eye reads as flow through a network, oblique reads as water moving across a landscape.

---

## LAYOUT — from your sketch

```
┌──────────────────────────────────────────┬──────────────┐
│ [thin left rail]                         │  PANEL       │
│  graphs / more info                      │  ┌────────┐  │
│                                          │  │FILTERS │  │
│         THE MAP  (WebGL canvas)          │  └────────┘  │
│                                          │  verdict     │
│                                          │  values      │
│  ┌────────────────────────┐              │  sources     │
│  │ contact / feedback bar │              │              │
└──┴────────────────────────┴──────────────┴──────────────┘
```

**Panel and rails are HTML**, absolutely positioned over the canvas. Style them to match — paper background, same serif, hairline borders. Nobody can tell, and you keep CSS, accessibility and debuggability.

Filters (layer toggles: groundwater / rivers / STPs / outfalls / supply hours) go in the panel and drive `uniforms.uLayerMask` — the shader hides layers without a re-render.

---

## ZOOM — the corrected model

**Zoom in reveals more CONTEXT, never more measurements.**

| Zoom | What appears |
|---|---|
| Basin | 395 marks, watercourse skeleton, title |
| City | Watercourse names, outfall markers, STP blocks, supply-zone tint |
| Locality | Individual parameter values, sample dates, the confidence ring to the nearest measurement |

The measured points never multiply — but the screen gets richer at every level. Honest *and* rewarding.

**The one honest moment is a scripted beat, not the whole interaction:** one button, *"show me what's measured near me"*, draws the ring to the nearest sample. If it's 40 km, that ring is enormous, and it makes the argument once, powerfully, without punishing exploration.

---

## BUILD ORDER — stop after each, show a screenshot

1. **Vite + three + flat plane + orbit camera.** Nothing else. *(20 min)*
2. **Watercourses as line geometry on the plane** — 302 of them. *(30 min)*
3. **Composite shader** — Sobel + Perlin + procedural paper + vignette. ⭐ *(90 min — this is the look, spend the time here)*
4. **395 marks as small extruded shapes**, colour by verdict from `verdict.js`. *(45 min)*
5. **Highlight pass + hover + HTML panel wired to `drinkingVerdict()`.** *(60 min)*
6. **GPGPU particles down the watercourses**, coloured by oxygen. *(75 min)*
7. **GSAP camera: bird's-eye ⇄ oblique**, letter-stagger titles. *(45 min)*
8. **Filters, frame-rate quality tiers.** *(45 min)*

**Steps 1–5 give you a finished-looking product.** 6–8 are the wow. If you stop at 5 you still have something that looks considered.

---

## NON-NEGOTIABLE — carried from the data side

- Verdict strings come from `verdict.js` **verbatim**. Never paraphrase.
- **No green.** Not for any state. Palette: paper `#fdfcf5` / `#efe9dd`, ink `#22201c`, water `#8fa6a8`, exceedance `#b23a26`.
- **No interpolated surface.** Discrete marks only; unmeasured space stays paper.
- Every panel shows `source_agency` and `sample_period`.
- Below 40fps, drop particle count and disable the composite pass rather than stuttering.
