# CLAUDE CODE PROMPT
## Recreate the Chartogne-Taillet movement, camera, atmosphere and transition language for the Nagpur Basin

**Paste this document as an implementation brief to Claude Code.**

---

# 1. Mission

We are building a Nagpur Basin WebGL experience.

The visual/content subject is **Nagpur's water basin**, not a vineyard.

However, the site must strongly resemble the supplied Chartogne-Taillet reference recordings in:

1. camera movement,
2. camera inertia,
3. smoothness/fluidity,
4. perspective,
5. multi-depth parallax,
6. transition choreography,
7. paper/ink material feel,
8. atmospheric haze,
9. dust/particle treatment,
10. reveal behaviour,
11. typography pacing,
12. overall editorial/immersive feeling.

**Do not make a generic map UI. Do not simply move SVG/map layers around. The goal is a physical-camera illusion inside an archival illustrated world.**

You cannot rely on watching the reference video yourself in the coding environment. Therefore this document translates the visible behaviour of the supplied recordings into explicit implementation requirements and acceptance tests.

---

# 2. Reference observations you must treat as design requirements

The supplied reference recordings show the following visible behaviour:

## 2.1 The viewer perceives a real camera moving through a world

The reference does NOT mainly feel like a 2D illustration being translated.

It feels like:

```text
physical camera
      ↓
3D / multi-depth scene
      ↓
perspective changes
      ↓
parallax
      ↓
atmosphere
```

Our current Nagpur video still reads mostly as a large 2D line drawing being repositioned.

### Required correction

Build a real perspective camera travelling through a 3D scene, even though the core Nagpur basin remains a flat map plane.

Do NOT replace the existing flat-plane architecture with a DEM. The existing project explicitly chose a flat plane in 3D because it provides the needed bird's-eye/oblique camera behaviour without a terrain pipeline.

---

# 3. Camera system — implement this exactly in spirit

## 3.1 Separate intended motion from actual camera motion

Use:

```text
cameraPath / targetPath
        ↓
desiredCameraPose
        ↓
dampedFollower
        ↓
actualCameraPose
```

Do NOT directly set the camera equal to the target.

The camera must have **inertia**.

The intended motion may be GSAP controlled.
The final camera pose must be smoothed by a physically plausible follower.

---

# 4. Camera inertia requirements

The reference has a heavy, smooth cinematic movement.

Implement:

- gentle acceleration,
- long smooth travel,
- early deceleration,
- tiny continuation into the final position,
- subtle settling.

Avoid:

- linear constant speed,
- snapping,
- obvious spring bounce,
- game-camera damping that feels loose,
- handheld shake.

Use a critically damped or nearly critically damped system.

Conceptual implementation:

```js
velocity.x += (target.x - position.x) * stiffness * dt;
velocity.y += (target.y - position.y) * stiffness * dt;
velocity.z += (target.z - position.z) * stiffness * dt;

velocity.multiplyScalar(damping);
position.addScaledVector(velocity, dt);
```

Tune by screenshot/video review.

---

# 5. Camera must follow a meaningful target

Do not use only a pre-baked camera spline.

Have a moving focal target.

```text
target point
   ↓
lookAt
   ↓
small framing offset
   ↓
damped camera
```

Allow the focal target to sit slightly off-centre.

The camera should subtly correct and settle.

For Nagpur, use meaningful geographic anchors:

- the Nag river,
- major tributaries,
- selected measurement clusters,
- Ambazari,
- Futala,
- Gorewada,
- Gandhi Sagar,
- STPs,
- selected measurement points.

Do not invent fake geography to create movement.

---

# 6. Camera path must be curved

Do not make every transition a straight translation.

Use smooth curved paths with depth changes.

Conceptually:

```text
A
 ╲
  ╲
   ╲____
        ╲
         B
```

The curve can be subtle.

The goal is to make the camera's spatial relationship to the map change continuously.

---

# 7. Camera rotations

Use separate low-amplitude rotations:

- pitch = noticeable but slow,
- yaw = subtle,
- roll = nearly imperceptible.

Starting recreation ranges:

```text
pitch: 10–20% of the visual strength of the main translation
 yaw:  5–15%
roll:  1–3%
```

These are starting values, not claims about the source implementation.

Do not make the rotation theatrical.

The camera should feel mounted on a very smooth system.

---

# 8. Perspective must visibly change

When the camera moves:

- near layers must enlarge faster,
- distant layers must move more slowly,
- the surface angle must change,
- the apparent horizon must shift,
- objects should enter/leave the composition through camera travel.

If the entire map remains visually identical except for translation/scale, the camera implementation is not finished.

---

# 9. Multi-depth scene structure

Keep the basin itself as a flat plane in the 3D scene.

Then create logical depth groups:

```text
0 background texture
1 basin/territory artwork
2 water bodies / major river wash
3 waterways
4 measurement points / infrastructure
5 foreground annotations
6 screen-space dust
```

Do not apply the same transform to everything.

Suggested first-pass parallax factors:

```text
background = 0.15
basin      = 0.35
water      = 0.50
points     = 0.72
foreground = 1.00
```

These must be tuned visually.

---

# 10. The camera needs secondary micro-motion

Add very-low-frequency drift.

Examples:

```js
slowNoiseX
slowNoiseY
slowNoiseZ
```

Do not use random per-frame jitter.

The viewer should feel:

> “the camera is alive”

not:

> “the browser is shaking.”

---

# 11. IMPORTANT: fix the current hard plane edge

The current Nagpur recording visibly shows a large polygon/trapezoid boundary of the map plane.

This is a defect.

The plane must visually dissolve into the same parchment background.

Required:

- oversized plane,
- background-matching material,
- soft radial/edge fade,
- no hard boundary for Sobel to outline.

Do not move forward until the hard plane edge is gone.

---

# 12. Watercourse rendering

The current project has already identified raised/illuminated tubes as too CG.

Use continuous `Line2` rendering rather than per-segment tubes.

Keep waterways effectively zero-volume.

Use screen-space pen widths so they resemble cartographic ink.

Start from:

```text
river   3.0 px
canal   2.2 px
stream  1.6 px
drain   1.1 px
```

Keep the hierarchy visible.

No white specular highlights.
No physical pipe tubes.
No beads.

---

# 13. Shader/composite requirements

Retain the existing dual-Sobel approach.

The composite should use:

```text
diffuse Sobel × 0.6
+
normal Sobel × 0.3
+
noise-offset sample UV
+
parchment/paper texture
+
ink colour
+
controlled highlight tint
+
gentle vignette
```

The project specification already contains the exact shader structure. Do not rewrite it unnecessarily.

Important:

**Noise should offset the Sobel sampling coordinates. Do not multiply the final edge value by noise.**

This is necessary for hand-drawn wobble rather than jagged noise.

---

# 14. Normal pass requirements

Normal rendering must contain meshes only.

Do not allow `Line2` objects into the `MeshNormalMaterial` pass.

Use layers so the normal pass contains:

- plane,
- future extruded marks,
- pins,
- STP blocks,
- water-body meshes if desired.

Keep `Line2` in the colour pass only.

Use the project's debug view:

```text
3 = normal buffer
```

At early stages, a largely flat normal field is correct.

Garbage triangles mean line geometry leaked into the normal pass.

---

# 15. Atmospheric stack — do NOT use one blur

The target look requires several systems.

## 15.1 Paper grain

Always present, very subtle.

## 15.2 Fine dust particles

Sparse, slow, variable-size, variable-alpha.

Each particle needs independent:

- size,
- opacity,
- depth,
- velocity,
- lifetime.

## 15.3 Broad haze

Large, low-frequency, soft moving noise field.

## 15.4 Depth haze

Far geometry gets lower contrast and more milky.

## 15.5 Screen veil

Very subtle slowly changing opacity layer.

## 15.6 Fine print noise

High-frequency final texture at very low strength.

Do not combine all six into one noise texture.

---

# 16. What the atmospheric layer should feel like

The reference looks as if there is air between the camera and the distant landscape.

The scene should transition roughly like:

```text
foreground / focus = relatively crisp
midground            = softer
background           = milky
far field            = atmospheric
```

This must be depth-related or logically distance-related.

Do not blur the entire image equally.

---

# 17. Haze movement requirements

Haze must move much more slowly than the camera.

Think:

```text
camera             = noticeable movement
haze               = extremely slow drift
fine particles     = slow independent motion
paper grain        = almost stationary
```

This difference in temporal frequency is important.

If all effects move together, the scene will look like a single animated texture.

---

# 18. Dust particle requirements

Dust should never look like snow.

Avoid uniform downward motion.

Use:

```text
slow drift
+ slight lateral noise
+ different depth speeds
+ occasional fade in/out
+ low opacity
```

A small number of barely visible particles is better than thousands of obvious particles.

---

# 19. Nagpur water particles are a different system

The water-flow particles have a meaning and must not be confused with atmospheric dust.

Keep two systems:

```text
AtmosphericDust
WaterFlowParticles
```

WaterFlowParticles follow watercourse geometry.
AtmosphericDust exists in front of/around the scene.

The project already calls for GPU particle motion along the 302 watercourses and a downstream dissolved-oxygen visualisation. Preserve that system. Do not replace it with generic decorative particles.

---

# 20. Nagpur visual metaphor

Do not recreate vineyard imagery.

The correct translation is:

```text
vineyard discovery  → basin discovery
plots               → measurements / water network
estate landscape    → hydrological landscape
terroir              → water geography
wine movement        → water movement
```

The final emotional concept should be:

> **A living archival map of Nagpur's water.**

---

# 21. Typography

Use the existing EB Garamond direction.

Large uppercase editorial titles.

Use generous letter spacing.

Titles should enter as material elements of the map rather than modern UI banners.

The existing project uses character-by-character reveal with opacity, vertical offset and blur. Preserve the idea but tune it toward slow editorial pacing.

Avoid:

- bouncing,
- elastic easing,
- neon,
- large shadow effects,
- modern dashboard cards everywhere.

---

# 22. HTML UI architecture

Keep UI in HTML over the WebGL canvas, as the project documents require.

Do not place ordinary accessibility/product panels inside the shader scene.

Make the HTML look like map annotations:

```text
thin rules
small typography
wide tracking
cream paper
warm dark ink
rare red emphasis
```

---

# 23. Navigation transition choreography

Navigation should cause the camera to travel.

Do not simply hide/show React sections.

For each navigation state:

1. identify the geographic anchor,
2. move the camera toward it,
3. adjust pitch/yaw slightly,
4. allow depth layers to respond,
5. reveal the new annotation layer,
6. let the camera settle,
7. reveal the section title.

The user should feel that all sections are different rooms of the same map.

---

# 24. Opening sequence

Implement approximately this choreography:

```text
0. parchment nearly blank
1. fine grain becomes perceptible
2. faint basin geometry emerges
3. title appears
4. camera begins slow pullback
5. water network resolves
6. measurement field resolves
7. water particles begin
8. UI settles
```

Do not dump every layer onto the screen at once.

---

# 25. Measurement point style

Points must look physically marked on paper.

Prefer:

- dark ink dot,
- tiny ring,
- subtle bleed,
- label only when needed.

Avoid Google Maps pins, glossy markers and giant coloured circles.

The project requires that all 395 actual measurement points remain represented, while unmeasured areas remain intentionally empty/grey.

---

# 26. Product honesty rules still apply

No visual effect may override these hard constraints:

- never call water “safe”, “potable”, “drinkable” or “clean”,
- use exactly the project verdict states,
- no interpolated water-quality heatmap,
- do not fabricate measurements,
- show source/date metadata,
- distinguish observed flood reports from modelled risk,
- coarsen private locations,
- respect `prefers-reduced-motion`.

These are hard product rules, not optional styling.

---

# 27. Camera-driven Nagpur section examples

## Overview

High camera, slow wide motion.

## River

Lower oblique camera, following a section of the Nag.

## Measurement

Slow push toward selected point.

## Flood

Wider view with additional warning layer; observed and modelled layers remain visually distinct.

## Repair

Travel toward infrastructure/intervention event.

These sections must remain grounded in the actual product features and data.

---

# 28. Required engineering order

Do NOT work in arbitrary visual order.

Use this exact priority:

### Phase 1 — Structural camera fix

1. remove hard plane edge,
2. verify true perspective camera,
3. create target-following,
4. add damping/inertia,
5. make path curved,
6. add pitch/yaw,
7. add multiple depth groups,
8. verify parallax.

### Phase 2 — Material fix

9. verify continuous line rendering,
10. remove CG lighting/specular appearance,
11. verify dual-Sobel,
12. verify UV-offset line wobble,
13. tune parchment,
14. tune paper grain,
15. tune vignette.

### Phase 3 — Atmosphere

16. add depth haze,
17. add broad animated haze,
18. add foreground dust,
19. add fine grain/veil.

### Phase 4 — Meaningful movement

20. add water particles,
21. add focal geographic destinations,
22. connect navigation to camera travel,
23. add text reveals.

### Phase 5 — Final polish

24. hover/highlight pass,
25. annotation positioning,
26. responsive camera framing,
27. reduced-motion mode,
28. quality tiers,
29. frame-rate testing.

---

# 29. Screenshot verification protocol

After EVERY camera/rendering milestone:

1. run the dev server,
2. open the page in the browser,
3. screenshot the result,
4. inspect the screenshot,
5. fix anything visually wrong,
6. only then continue.

This is mandatory because shader mistakes can look like aesthetic mistakes.

The project's existing instructions explicitly require this verification workflow. Do not skip it.

---

# 30. Debug views

Keep these available during development:

```text
1 = final composite
2 = diffuse buffer
3 = normal buffer
4 = noise texture
```

Also add temporary debug controls for:

```text
camera damping
camera stiffness
parallax amount
haze opacity
haze speed
particle density
particle speed
ink wobble
ink strength
paper strength
```

Do not ship the debug controls visibly unless necessary.

---

# 31. Acceptance test — movement

The build is NOT complete until all of the following are true:

- camera feels physical,
- camera accelerates/decelerates invisibly,
- target-following is apparent,
- camera has subtle inertia,
- path is not simply straight,
- pitch/yaw change gently,
- multiple layers move at different rates,
- perspective changes,
- camera settles instead of snapping,
- transitions feel continuous.

If any of these fail, continue working on the camera rather than adding more visual effects.

---

# 32. Acceptance test — atmosphere

The build is NOT complete until:

- paper texture is present but restrained,
- broad haze exists,
- distant content is softer than focal content,
- dust exists as sparse particles,
- atmospheric dust and river particles are separate systems,
- the atmosphere moves more slowly than the camera,
- no global blur washes out the UI/data,
- the scene looks tactile rather than digitally clean.

---

# 33. Acceptance test — resemblance

Compare screenshots mentally against this statement:

> “If I removed the UI labels and changed the subject matter, would this still feel like the same type of immersive site?”

The answer should be **yes**.

If it only resembles Chartogne because it has beige paper and black lines, the recreation is insufficient.

The important resemblance is:

```text
movement
camera
depth
transitions
softness
atmosphere
pacing
composition
```

---

# 34. What NOT to do

Do not solve the problem by:

- adding random blur,
- adding heavy film grain,
- adding huge numbers of particles,
- adding a generic 3D terrain,
- making everything glossy 3D,
- using Google Maps styling,
- adding bright UI colours,
- using a rainbow quality heatmap,
- translating the entire map as one object,
- using constant-speed camera movement,
- using springy bouncy transitions,
- adding arbitrary decorative effects that have no relationship to camera/depth.

---

# 35. Final instruction to Claude

Do not tell me “this is close” based only on code.

**Judge the rendered browser screenshots.**

The key target is not correctness of code alone. The target is the perceptual result:

```text
REAL CAMERA
    +
REAL DEPTH CUES
    +
REAL CONTINUITY
    +
SOFT PHYSICAL ATMOSPHERE
    +
ARCHIVAL MATERIAL
    +
NAGPUR WATER CONTENT
```

When a screenshot still looks like a flat SVG being panned, stop and fix the camera/depth system.

When a screenshot looks like a polished WebGL demo but not like archival paper/ink, stop and fix the material/composite system.

When the camera and material work but the transitions feel like separate pages, stop and connect navigation to geographic camera travel.

The final goal is a **strong visual and motion resemblance to the real Chartogne-Taillet experience while unmistakably remaining the Nagpur Basin experience.**
