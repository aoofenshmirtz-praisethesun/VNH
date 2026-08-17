# NAGPUR BASIN — CURRENT STAGE GAP ANALYSIS
## What is already present, what is visibly lacking, and what must be done next

**Basis:** current project handoff documents + the supplied three recordings, including the current localhost recording.

---

# 1. Executive status

The project is **not starting from zero**.

The current implementation already has the correct broad direction:

- Nagpur basin/watercourse linework,
- parchment-like background,
- a WebGL/Three.js direction,
- flat-plane-in-3D architecture,
- planned dual-Sobel drawing composite,
- planned paper/noise treatment,
- planned particles,
- planned HTML overlay UI,
- real water-quality data and product logic.

However, the current rendered stage visible in the supplied localhost recording is still fundamentally a **flat 2D line map with camera-like translation**, rather than the immersive, physical-camera, atmospheric experience being targeted.

The largest remaining work is therefore **visual systems work**, not adding more data.

---

# 2. What the current recording visibly contains

The current recording shows:

1. large Nagpur basin/watercourse line drawings,
2. warm off-white/parchment background,
3. black/warm-dark linework,
4. broad movement of the drawing through the viewport,
5. a visible hard polygon/trapezoid boundary from the plane,
6. little visible depth separation,
7. little/no convincing perspective depth,
8. little atmospheric haze,
9. no obvious foreground dust system,
10. no visible layered depth/parallax system,
11. no visible camera inertia/physical settling at the level of the target,
12. no visible full Chartogne-style transition architecture yet.

That makes the implementation visually coherent, but not yet close enough to the reference in **camera feel + atmosphere + transition behaviour**.

---

# 3. Gap severity ranking

## CRITICAL — must fix before cosmetic polish

1. Camera still feels like a 2D transform.
2. No convincing depth/parallax hierarchy.
3. Hard plane boundary is visible.
4. Perspective/camera pitch behaviour is not strong enough.
5. Scene transitions are not yet a continuous camera journey.

## HIGH — must add for the real visual vibe

6. Camera damping/inertia.
7. Moving focal target / subject tracking.
8. Curved camera paths.
9. Broad depth haze.
10. Foreground dust/particle layer.
11. Depth-based softness.
12. Continuous screen/composite atmosphere.
13. Stronger paper/material treatment.

## MEDIUM — important for polish

14. Text/annotation choreography.
15. Measurement point material treatment.
16. Navigation-as-camera-travel.
17. Water-flow particles.
18. More subtle ink imperfections.
19. Layer-specific motion rates.

## FINAL POLISH

20. Quality tiers.
21. Reduced-motion handling.
22. Responsive camera framing.
23. Debug/tuning controls removed or hidden.
24. 40+ fps validation and degradation strategy.

---

# 4. Gap #1 — camera is not yet physical enough

### Current state

The current animation mostly reads as:

```text
large 2D drawing
      ↓
move / scale
      ↓
large 2D drawing
```

### Target state

```text
camera
  ↓
physical 3D relationship
  ↓
near/mid/far layers
  ↓
parallax
  ↓
perspective
```

### Required work

Implement a real perspective camera with:

- target position,
- desired camera pose,
- damping,
- velocity/inertia,
- look-at target,
- curved path,
- small pitch/yaw/roll.

---

# 5. Gap #2 — no strong multi-depth hierarchy yet

The current linework is overwhelmingly perceived as one plane.

### Required

Split the scene conceptually into at least:

```text
background
basin art
water
waterways
points
foreground annotations
screen-space atmosphere
```

The current architecture already allows this because the map is a flat plane in a 3D scene. fileciteturn0file0L55-L63

Use subtle different parallax coefficients.

---

# 6. Gap #3 — visible hard plane edge

This is the easiest obvious defect to explain and one of the first things to fix.

The current screenshot clearly shows a large angular boundary at the top/perimeter of the plane.

That edge makes the illusion fail immediately because the viewer sees:

> “this is a rectangle in WebGL.”

### Required fix

Use an oversized plane and a material that smoothly fades to the same background colour.

The existing implementation notes already specify this strategy. fileciteturn0file2L98-L123

---

# 7. Gap #4 — linework is good conceptually but still too digitally clean

The current linework already points toward the right visual language.

But the final effect needs:

- subtle UV wobble,
- small density variation,
- warm-black ink instead of pure black,
- paper interaction,
- atmospheric softening,
- depth-dependent contrast.

The existing shader design already calls for noise-offset Sobel sampling and paper fBm. fileciteturn0file2L286-L313

So do not redesign the entire shader.

First verify that the shader is actually visible and correctly composited, then tune it.

---

# 8. Gap #5 — paper currently reads mostly as background colour

The target needs the paper to feel like a material.

### Add in this order

1. very low-frequency parchment variation,
2. medium fibre texture,
3. fine grain,
4. rare tiny specks,
5. gentle edge falloff,
6. subtle animated atmospheric veil.

Do not make the grain loud.

At normal viewing distance the user should primarily feel **material**, not “noise.”

---

# 9. Gap #6 — no strong atmospheric depth yet

The reference has a visible soft distant haze.

The current implementation is comparatively clean and flat.

### Required

Build at least:

```text
depth haze
+
broad animated haze
+
foreground dust
+
fine grain/veil
```

Make these independent temporal frequencies.

Camera: relatively fast.
Haze: very slow.
Dust: slow but independent.
Grain: nearly stationary.

---

# 10. Gap #7 — no convincing foreground dust

The target “ash/dust” feeling should not be achieved by adding strong noise.

Create actual sparse particles.

Properties:

- few rather than many,
- variable size,
- variable opacity,
- slow drift,
- different depth speeds,
- long fade times.

These particles are separate from water-flow particles.

---

# 11. Gap #8 — no true distance/focus hierarchy

The reference visually distinguishes:

```text
focus
 ↓
midground
 ↓
far field
```

The current linework is mostly equally legible at all depths.

### Add

Depth-based modulation of:

- contrast,
- opacity,
- haze,
- edge strength.

Keep the focal region readable.

Do not blur the complete screen.

---

# 12. Gap #9 — navigation has not become camera choreography yet

The final target requires the camera to be the mechanism that moves the user from one experience to another.

Instead of:

```text
section A
↓
UI switch
↓
section B
```

implement:

```text
section A
↓
camera begins travelling
↓
world changes naturally
↓
geographic destination appears
↓
section B settles
```

This is one of the most important steps for making the site feel like a single authored experience.

---

# 13. Gap #10 — typography is not yet carrying the same cinematic weight

The project already recommends EB Garamond with very large editorial titles and staggered reveals. fileciteturn0file0L136-L145

The remaining work is choreography:

- title appears after/while camera settles,
- title can overlap landscape subtly,
- letters should be slow and soft,
- no modern UI bounce.

Typography should feel printed into the world.

---

# 14. Gap #11 — measurement points need material treatment

Real data points are already central to the project.

Current/expected point system should be refined so points look like marks on paper rather than GIS pins.

Use:

```text
ink dot
+
small irregular ring
+
subtle opacity/bleed
+
annotation on focus
```

Avoid glossy 3D markers.

---

# 15. Gap #12 — water-flow motion must become part of the storytelling

The project already has the right conceptual idea: particles follow the 302 watercourses and can be visually influenced by dissolved oxygen. fileciteturn0file0L114-L121

What remains is to integrate that motion into the camera language.

The user should discover flowing water as the camera moves closer.

Do not show all particles at maximum intensity from the first frame.

---

# 16. Gap #13 — water bodies should provide recognition and depth

The project notes that Ambazari, Futala, Gorewada and Gandhi Sagar can materially improve visual recognition. fileciteturn0file2L393-L395

Implement these as restrained filled water shapes, not glossy 3D reservoirs.

They should help the viewer understand where they are while maintaining the archival-map aesthetic.

---

# 17. Gap #14 — the scene currently needs more compositional breathing room

The reference has large areas where the map fades and typography/annotations breathe.

Do not fill empty space with UI just because it exists.

The project's “grey/unmeasured” space is a real narrative device. fileciteturn0file1L14-L21

Keep it.

---

# 18. Priority execution plan

## PHASE A — make the current scene believable

### A1
Remove hard plane boundary.

### A2
Confirm camera is perspective-based, not simply orthographic/2D.

### A3
Implement target-following.

### A4
Implement damping/inertia.

### A5
Introduce actual Z/depth travel.

### A6
Introduce pitch/yaw.

### A7
Introduce depth-separated scene groups.

### A8
Verify parallax.

**Stop and screenshot.**

The scene should already feel substantially more 3D before moving forward.

---

# 19. PHASE B — fix the material

### B1
Make waterways continuous `Line2` strokes.

The project identifies per-segment tubes/beads as a major CG-looking defect. fileciteturn0file2L8-L20

### B2
Remove visible lighting/specular response.

### B3
Verify diffuse render.

### B4
Verify normal render.

### B5
Verify noise texture.

### B6
Verify dual-Sobel.

### B7
Tune paper grain.

### B8
Tune ink warmth and wobble.

### B9
Add gentle vignette.

**Stop and screenshot all debug views.**

---

# 20. PHASE C — atmospheric treatment

### C1
Broad haze.

### C2
Depth haze.

### C3
Foreground dust.

### C4
Fine film/print grain.

### C5
Slow atmospheric veil.

### C6
Tune atmosphere against the camera movement.

Important:

The haze must not move at the same speed as the camera.

---

# 21. PHASE D — continuous storytelling

### D1
Connect navigation states to geographic anchors.

### D2
Create camera paths for each section.

### D3
Add section titles.

### D4
Reveal supporting UI after/around camera settling.

### D5
Use water flow as a transition/motion signal.

### D6
Use landmarks to make transitions geographically meaningful.

---

# 22. PHASE E — product layer and data

The visual system must now be connected to:

- the 395 real measurements,
- nearest-measurement logic,
- statutory verdict engine,
- crop/irrigation features,
- observed/modelled flood distinction,
- source/date metadata,
- future supply/outfall/repair features when their data arrives.

The project says to build F1–F4 completely before moving further into optional features, with F1 being the real measured-point map and F2 the location-to-nearest-measurement path. fileciteturn0file3L196-L228

Do not sacrifice those features for visual polish.

---

# 23. Phase F — performance and safety

Once the visual system works:

1. measure frame rate,
2. implement particle quality tiers,
3. reduce particle count first under load,
4. disable/cheapen composite only after that,
5. respect `prefers-reduced-motion`,
6. test camera on laptop/mobile widths,
7. verify WebGL context resilience if possible.

The existing project hard rule is that a stuttering demo is worse than a plain one. fileciteturn0file0L170-L179

---

# 24. Concrete “before / after” target

## Current

```text
cream background
+
black basin lines
+
2D movement
+
visible plane edge
+
little atmosphere
```

## Target

```text
cream archival sheet
+
subtle paper material
+
ink basin
+
water-body washes
+
real perspective camera
+
damped camera motion
+
curved camera path
+
subtle camera pitch/yaw
+
foreground/mid/background parallax
+
depth haze
+
slow drifting dust
+
fine print grain
+
water-flow particles
+
map annotations
+
large editorial typography
+
continuous geographic transitions
```

---

# 25. Definition of “we are done with the reference recreation”

The reference recreation stage is complete only when a viewer who knows neither code nor implementation can look at the experience and say:

> “This feels like a camera moving through a physical old illustrated map.”

and not:

> “This is an SVG/map animation with a parchment background.”

That distinction is the main milestone.

---

# 26. Definition of “we are done with the Nagpur product”

After the reference recreation is achieved, the product is complete only when the same visual world can support:

1. measured-point discovery,
2. nearest measurement and distance,
3. exact verdict statements,
4. no-exceedance/not-tested distinction,
5. crop/irrigation analysis,
6. citizen reading pathway,
7. flood warning layers,
8. repair/follow-up features as data becomes available.

All of those must continue to follow the project's non-negotiable data/ethics rules. fileciteturn0file3L39-L96

---

# 27. Immediate next three actions

If only three things can be done next, do these in order:

### 1. Fix the camera

Perspective + target-follow + damping + curved path + depth travel.

### 2. Remove the obvious CG/2D defects

Hard plane edge + any raised/bright watercourse geometry + equal-depth rendering.

### 3. Add atmosphere

Depth haze + sparse foreground dust + paper/grain + soft distant contrast.

Only after those are visually convincing should you spend substantial time on extra decorative effects.

---

# 28. Screenshot checklist for the next milestone

Before declaring the next visual milestone complete, capture:

- [ ] wide overview frame,
- [ ] oblique camera frame,
- [ ] camera approaching a landmark,
- [ ] camera settling on a point,
- [ ] transition between two sections,
- [ ] diffuse buffer,
- [ ] normal buffer,
- [ ] final composite,
- [ ] final with dust/haze,
- [ ] final with typography/HTML UI.

The project's instructions explicitly require screenshot verification after each build step. fileciteturn0file0L6-L12

---

# 29. Final diagnosis

The project is currently **conceptually right but visually underdeveloped in the exact systems that make the reference special**.

The missing pieces are not primarily “more map detail.”

They are:

```text
PHYSICAL CAMERA
DAMPING
PERSPECTIVE
DEPTH
PARALLAX
CONTINUOUS TRANSITIONS
ATMOSPHERE
HAZE
DUST
MATERIAL
TYPOGRAPHIC CHOREOGRAPHY
```

The current Nagpur linework can stay.

The next development phase should make that linework behave as though it exists inside a physical, atmospheric, moving world.
