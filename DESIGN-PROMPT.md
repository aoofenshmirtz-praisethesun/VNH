# Design prompts — paste these into Claude Code / Antigravity

Two prompts. **The first is the build prompt. The second is for generated imagery.**

Both are written in the Norrly format you're already using, but with our data model, our constraints, and our hard rules embedded — so the design AI cannot violate the honesty rules while chasing the aesthetic.

---

# PROMPT 1 — the build

> You are a world-class web designer and frontend engineer. You are building a data experience, not a landing page. Follow every token below precisely — they are the product.
>
> **PROJECT**
> A map of every published water-quality measurement in Nagpur, India. 395 real government measurements over 302 watercourses. The point of the product is that **most of the city has never been measured** — the emptiness is the argument, not a flaw to hide.
>
> **STACK**
> Vanilla JS + WebGL (raw, or three.js). No React needed — this is one canvas and one panel. Must run from a local static server with **no network access at runtime**. Vendor every dependency.
>
> ---
> **DESIGN LANGUAGE — hand-drawn cartography**
>
> Reference anchor: chartogne-taillet.com — hand-drawn terroir maps, warm artisanal storytelling, pen-on-paper. Combine that reference with the exact values below.
>
> - Page background `#fdfcf5`, deeper paper `#efe9dd`, warm mid `#fff0d8`, shadow tint `#d8c0a8`
> - Ink `#22201c` · muted ink `#6b655c` · hairline rule `#cfc6b6`
> - Water lines `#8fa6a8` · exceedance `#b23a26` · measured-no-exceedance `#5d6f77` · citizen-submitted `#7a5ea8`
> - **Never green.** Not for any state, ever. A green dot reads as "safe" and we never say that.
> - Headings: a serif — Sabon LT Std, fall back to Georgia / Iowan Old Style. Body labels: one grotesque, Inter.
> - H1 64–88px desktop, weight 600, line-height 1.1. Small labels 12px uppercase, letter-spacing 0.11em.
> - Maximum two font families on the page.
>
> ---
> **THE WEBGL LAYER — this is the signature, invest here**
>
> The map is drawn in WebGL with a multi-pass, hand-drawn look:
>
> 1. **Base pass** — paper. A subtle fibre/grain texture generated with layered noise, warm off-white, very low contrast. It should read as aged paper, not as a gradient.
> 2. **Ink pass** — the 302 watercourses drawn as ink strokes with slight width jitter and a soft bleed at the edges, as if drawn with a nib. Rivers heavier than drains. Strokes should feel *drawn*, not vector-perfect.
> 3. **Mark pass** — the 395 measurement points as small hand-inked marks. Circles for groundwater, squares for river sites, hollow rings for infrastructure. Slight irregularity per mark — no two identical.
> 4. **Composite** — edge detection and perlin noise over the whole frame for a printed feel; a faint vignette; optional paper-fibre overlay at very low opacity.
>
> **Motion, and only this motion:**
> - On load, the ink strokes **draw themselves** — watercourses first over ~1.2s, then the marks appear one by one over ~2s with a counter ticking to 395.
> - Watercolour bleed: when a point is selected, a soft pigment diffusion spreads from it and settles. GPU particles, subtle, 600–800ms, eased, no bounce.
> - Cursor parallax on the paper texture, ≤4px. Barely perceptible.
> - Everything else is still. The stillness is what makes the ink land.
>
> ---
> **LAYOUT**
> - Full-bleed canvas left, a 380px panel right on a slightly warmer paper tint separated by a 1px rule — **no shadows anywhere**.
> - Title block floats top-left over the canvas, no container.
> - Legend bottom-left, 11.5px, muted.
>
> ---
> **HARD RULES — these override any aesthetic instinct**
> - Never render a heatmap, gradient surface, kriging, IDW or contour of water quality. **Only discrete measured points.** Unmeasured space stays paper.
> - Never use green, never use a tick, never use the word "safe", "clean", "potable" or "drinkable" in any state, label, tooltip or legend.
> - Verdict strings come from `verdict.js` and are rendered **verbatim**. Do not paraphrase, shorten or "improve" them.
> - The distance readout on the nearest-measurement view is a primary display element at 34px+, never a footnote.
> - Respect `prefers-reduced-motion`: disable the draw-on animation and the pigment bleed.
> - Performance: if frame rate drops below 40fps, degrade to the static SVG renderer automatically. **A demo that stutters is worse than one that is plain.**
>
> ---
> **BUILD ORDER — one step at a time, stop after each**
> 1. Paper base pass only. Show me.
> 2. Add the ink pass for watercourses with draw-on. Show me.
> 3. Add the mark pass with the counter. Show me.
> 4. Add selection and the pigment bleed. Show me.
> 5. Composite pass — noise, edges, vignette. Show me.
>
> Do not redesign a step I haven't mentioned. Keep everything else exactly as is.

---

# PROMPT 2 — generated imagery

**Hero / texture asset**

> A hand-drawn 15th-century cartographic study of a river basin, ink on aged warm paper. Sepia and bone palette, strictly `#fdfcf5`, `#fff0d8`, `#d8c0a8`, with muted blue-grey `#8fa6a8` for watercourses. Fine nib linework, visible paper fibre, subtle watercolour bleed at the river edges. Rivers and small drains only — no towns, no labels, no text, no compass rose, no legend. Generous empty paper. 16:9, space reserved upper-left for a headline. No people, no modern elements.

**Paper texture tile (seamless)**

> Seamless tileable aged paper texture, warm off-white `#fdfcf5`, very subtle fibre and grain, faint uneven tone, no folds, no stains, no text, no border. Flat even lighting. 2048×2048, suitable as a low-opacity overlay.

**Ink mark set**

> A set of small hand-inked cartographic marks on white — filled circles, open rings, small filled squares — drawn with a fine nib, each slightly irregular, dark warm ink `#22201c`. Arranged on a grid with generous spacing, no text, no numbers. Suitable for use as sprite textures.

---

## The honest caveat, once

The reference site is a specialist studio's work over months — four-pass shader compositing, GPU pigment simulation, WebGL-rendered UI. **You will get somewhere between 60% and 80% of that feel tonight, and that is genuinely enough.**

The parts that carry most of the impression are cheap: **paper texture, ink-coloured linework, serif type, generous emptiness, and draw-on animation.** The parts that are expensive — true pigment diffusion, hand-drawn stroke synthesis — add the last 20%.

Build in the order above so that if you stop at step 3 you still have something that looks considered rather than half-finished.

**And keep `web/index.html` as it is.** It works, it's verified, and it's your fallback if the WebGL build doesn't land. Build the new one alongside it as `experience.html` — same data, same `verdict.js`.
