# CHARTOGNE-TAILLET → NAGPUR BASIN
## Master visual, camera, transition, atmosphere and implementation guide

**Purpose:** This is the master design/engineering brief for making the Nagpur Basin experience strongly resemble the *movement language, screen feel, transitions, camera behavior and atmosphere* of the Chartogne-Taillet experience, while keeping the content, geography and product purpose distinctly Nagpur.

**Important:** Do not copy vineyard content, names, maps or site-specific information. Copy the *visual grammar*: camera choreography, depth, softness, paper/ink material, reveal behavior, navigation transitions, atmospheric compositing and pacing.

---

# 1. Source and confidence

## 1.1 Supplied recordings actually reviewed

Three supplied 1920×1080, 60 fps recordings were reviewed, including frame sequences/contact sheets:

1. **Chartogne-Taillet reference video 1** — ~47.55 s.
2. **Chartogne-Taillet reference video 2** — ~42.23 s.
3. **Current Nagpur localhost implementation video 3** — ~23.15 s.

The comparison below is based on visible frame-to-frame behavior and composition in those recordings. Where an implementation number is suggested (camera damping, layer offsets, etc.), it is a **recommended recreation target**, not a claim that the original site literally used that exact number.

## 1.2 Project files reviewed

The supplied project documents establish that the current experience is a WebGL Nagpur Basin map, using a flat plane in a 3D scene, Three.js, GSAP, a dual Sobel composite, procedural noise/paper treatment, a highlight pass, and GPU particle flow along watercourses. The project explicitly calls for browser/screenshot verification after every build step. fileciteturn0file0L18-L22 fileciteturn0file0L55-L63 fileciteturn0file0L6-L12

The current shader specification already includes diffuse + normal Sobel, noise-offset sampling, paper fBm, parchment/ink compositing, highlight tint and vignette. fileciteturn0file2L239-L254

The product rules require discrete real measurements, no interpolated water-quality heatmap, no green/safe styling, and a clear distinction between measured and unmeasured space. fileciteturn0file3L39-L90

---

# 2. The target in one sentence

> **The viewer should feel that a real camera is travelling through a physical, archival, illustrated world — not that a flat SVG/map is being moved underneath a browser viewport.**

For Nagpur, the world is the basin, its rivers, water bodies, measurements, infrastructure and annotations.

The target experience is:

```text
ARCHIVAL MAP
    +
INK / PAPER MATERIAL
    +
A REAL 3D CAMERA
    +
MULTI-DEPTH PARALLAX
    +
SOFT DAMPED MOTION
    +
ATMOSPHERIC HAZE
    +
DUST / PARTICLES
    +
CONTINUOUS TRANSITIONS
    +
NAGPUR WATER DATA
```

---

# 3. The most important difference in the recordings

## 3.1 Chartogne-Taillet reference

The reference repeatedly creates the perception:

> **camera → physical scene → depth → atmosphere → destination**

Even when the underlying imagery is map-like, the viewer perceives camera travel because relative distances change.

Visible cues include:

- large perspective changes,
- foreground/midground/background moving at different rates,
- objects growing/shrinking as the camera travels,
- oblique camera angles,
- gentle pitch/yaw changes,
- atmospheric falloff over distance,
- broad depth-based haze,
- continuity between page/map and immersive landscape states,
- visual content disappearing/reappearing without hard scene cuts.

## 3.2 Current Nagpur recording

The current implementation is recognizably a **large flat line illustration being translated and reframed**.

The current frames show:

- strong 2D line identity,
- mostly uniform depth,
- limited/no convincing perspective separation,
- a visible hard geometric plane boundary in the frame,
- very little atmospheric depth,
- no visible multi-layer scene hierarchy,
- no physical-looking camera inertia,
- no substantial foreground/midground/background parallax,
- very little material variation beyond the parchment-like background.

The current image is therefore closer to:

```text
2D drawing
   ↓
translate / scale
   ↓
2D drawing in a new place
```

while the target is:

```text
camera
  ↓
3D world
  ↓
multiple depths
  ↓
perspective
  ↓
atmosphere
  ↓
new composition
```

---

# 4. Camera system: recreate this before anything else

## 4.1 Do not directly animate the camera to keyframes

Avoid a system where the camera is simply assigned to each GSAP endpoint.

Bad conceptual model:

```js
camera.position.x = x
camera.position.y = y
camera.position.z = z
```

Better:

```text
camera path / intended target
           ↓
desired camera pose
           ↓
spring / damping / inertia
           ↓
actual camera pose
```

The desired pose may be GSAP-driven. The *actual* pose should follow it smoothly.

---

# 5. Camera inertia and damping

The reference feels as though the camera has mass.

The camera should:

1. begin gradually,
2. accelerate without a visible snap,
3. travel smoothly,
4. decelerate before reaching the destination,
5. settle over a short period,
6. never visibly bounce.

The correct feeling is a smooth cinema rail/gimbal, not a game-camera easing curve and not handheld footage.

A critically damped or slightly underdamped follower is a good implementation target.

Example conceptual equation:

```text
velocity += (targetPosition - position) * stiffness * dt
velocity *= damping
position += velocity * dt
```

Keep damping high enough that there is almost no overshoot. A tiny continuation is useful; a visible spring bounce is not.

---

# 6. Camera motion must contain multiple components

Do not drive every camera parameter from the exact same easing curve.

Use separate low-frequency components:

```text
X translation       = primary travel
Y translation       = small framing adjustment
Z / dolly            = primary depth movement
pitch                = small
 yaw                 = small
roll                 = extremely small
focal target         = independently drifting
camera micro-drift   = extremely small
```

Recommended relative proportions:

| Component | Suggested strength | Purpose |
|---|---:|---|
| Main translation | 100% | The visible journey |
| Dolly/depth | 50–100% | Perspective change |
| Pitch | 10–20% | Reveal oblique surface |
| Yaw | 5–15% | Make path feel curved |
| Roll | 1–3% | Physical imperfection |
| Low-frequency noise | 1–5% | Organic camera life |

These are recreation targets, not measured source values.

---

# 7. Follow a focal target instead of blindly following a camera spline

The reference often feels like the camera is **discovering a subject**.

Use:

```text
focal point / area of interest
             ↓
look-at target
             ↓
desired orientation
             ↓
damped actual camera
```

The focal point should not always be screen-centred. Allow it to drift slightly and let the camera catch it.

This produces a subtle human/cinematic quality without handheld shake.

For Nagpur, focal targets should be meaningful geography:

- the Nag river corridor,
- major tributaries,
- selected measurement clusters,
- Ambazari / Futala / Gorewada / Gandhi Sagar,
- STPs,
- selected data points,
- transitions into new sections.

The supplied project already identifies the water network and recognisable water bodies as meaningful visual landmarks. fileciteturn0file2L384-L395

---

# 8. Use curved camera paths

Avoid obvious straight A→B travel:

```text
A ───────────────────── B
```

Prefer:

```text
A
 ╲
  ╲
   ╲____
        ╲
         B
```

The curve does not need to be obvious. It creates changing spatial relationships and prevents the scene from looking like an SVG transition.

---

# 9. Perspective is mandatory for the final target

The camera needs to occupy actual 3D space relative to the map plane.

When the camera moves forward:

- close elements enlarge faster,
- distant elements move more slowly,
- the horizon/plane angle changes,
- the projected shape of the basin changes,
- depth relationships change.

A simple scale/translate animation cannot reproduce this convincingly.

Your project architecture of a **flat plane placed in a 3D scene** is a good solution. It gives you bird's-eye and oblique views without requiring a DEM. fileciteturn0file0L55-L63

---

# 10. Multi-depth parallax

Create at least 4–5 logical depth groups even though the actual map remains a flat surface.

Suggested groups:

```text
Depth 0 — distant/background map texture
Depth 1 — basin/terrain drawing
Depth 2 — rivers and water-body wash
Depth 3 — measurement points / structures
Depth 4 — foreground annotation / selected object
Depth 5 — screen-space atmospheric particles
```

The visual response should approximately be:

```text
foreground  >>>>>>>>>>>
midground   >>>>>>>
background  >>>
```

Not huge. The reference uses subtle relative motion; the purpose is to make the eye infer depth.

---

# 11. Do not make all layers obey one transform

This is a key recreation rule.

If all map layers move by the same matrix, the result remains flat.

Each depth group should have a small independent response to camera movement.

For a single camera delta `D`, a conceptual parallax response might be:

```text
background   = D * 0.15
map          = D * 0.35
water        = D * 0.50
points       = D * 0.72
foreground   = D * 1.00
```

Those coefficients are starting points only. Tune by eye.

---

# 12. The reference's fluidity is NOT merely easing

It comes from the combination of:

```text
smooth acceleration
+
damping
+
curved path
+
independent pitch/yaw
+
subject tracking
+
parallax
+
perspective
+
secondary micro-motion
```

A GSAP `power2.out` animation alone will not reproduce the same physical feeling.

GSAP can drive the intended camera target, while a damped camera controller converts that into the final pose.

---

# 13. Continuous scene transitions

The reference does not feel like:

```text
SCENE A
↓
FADE
↓
SCENE B
```

It feels closer to:

```text
SCENE A
 ↓
camera begins moving
 ↓
A remains partially visible
 ↓
layers dissolve / reorganise
 ↓
new depth state emerges
 ↓
SCENE B becomes dominant
```

For Nagpur, every major section should feel like a continuation of the same world.

Do not make the user feel that a new web page was loaded.

---

# 14. Opening choreography for Nagpur

Recommended sequence:

```text
1. Almost blank parchment
2. Tiny paper/grain movement
3. Very faint basin traces appear
4. Large editorial title appears
5. Camera begins pulling back
6. Main river network becomes legible
7. Measurement network gradually resolves
8. Water particles start moving
9. UI settles into its final locations
```

The opening should feel like the map is being **revealed**, not rendered instantly.

---

# 15. Use camera travel as navigation

Do not make navigation a conventional web-app scene switch.

When the user selects a section:

```text
current position
      ↓
camera turns
      ↓
camera travels
      ↓
new geographic anchor enters
      ↓
new information becomes visible
```

For example:

### Basin overview

High, stable, slow movement.

### River section

Lower oblique camera, slightly stronger forward movement.

### Measurement detail

Slow push-in with minimal rotation.

### Flood section

Camera pulls back/widens, then reveals the relevant warning layer.

### Supply/repair sections

Camera travels toward infrastructure or geographic zones.

The product documents define the main questions and features; use those real product sections as destinations instead of inventing unrelated ones. fileciteturn0file3L25-L31 fileciteturn0file3L196-L242

---

# 16. The atmosphere is a stack, not one blur filter

The “dust / ash / cloudy / distant” feeling visible in the reference should be treated as several independent systems.

## Layer A — Paper grain

Tiny, dense, mostly stationary or very slowly drifting texture.

Purpose: stop the image feeling digitally flat.

## Layer B — Fine particles / dust

Sparse, screen-facing particles at different depths.

Each particle gets:

- different size,
- different alpha,
- different velocity,
- different lifetime,
- slight opacity variation.

Do not animate every particle with the same velocity.

## Layer C — Broad atmospheric haze

Large, soft, low-opacity cloud-like structures.

This is not normal Gaussian blur.

Use:

- low-frequency procedural noise,
- very large scale,
- low opacity,
- slow drift,
- soft luminance modulation.

## Layer D — Depth haze / aerial perspective

Distant geometry loses contrast and becomes milky.

This should be driven by depth or by logical scene distance, not uniformly applied.

## Layer E — Soft optical/film veil

A very subtle whole-screen moving opacity field.

Purpose: make the image feel like a physical capture rather than a perfect digital render.

## Layer F — Fine grain / print imperfections

A final high-frequency texture at very low strength.

---

# 17. Dust is NOT the same thing as haze

Keep these separate.

```text
grain   = tiny + dense + near-static

dust    = sparse + small visible particles + moving

haze    = large + soft + low-frequency + depth-like

veil    = whole-screen + very low opacity
```

Mixing these into one shader makes the result muddy.

---

# 18. The atmospheric cloudiness should have internal structure

Avoid:

```css
filter: blur(30px)
```

as the main effect.

Use a procedural mask whose density varies spatially.

Conceptual model:

```text
hazeAlpha = lowFrequencyNoise(worldPosition, time)
            * verySmallOpacity
            * depthFactor
```

The cloud should drift slowly across the image.

---

# 19. Make the haze spatial rather than generic

For Nagpur, the atmosphere can be biased toward the basin/river corridors without becoming a GIS heatmap.

The screen should still look like parchment first.

Atmospheric variation should be subtle enough that a viewer does not interpret it as a data layer.

---

# 20. Paper / parchment treatment

The reference has a tactile archival surface.

Recommended stack:

```text
base parchment
+
large low-frequency tone variation
+
medium paper fibre variation
+
fine grain
+
rare tiny specks
+
soft edge falloff
```

Do not make the paper texture too strong. Strong noise makes the site look like a texture demo.

---

# 21. Ink treatment

Use warm near-black rather than pure black.

Current palette already specifies `#22201c`, which is appropriate. fileciteturn0file0L179-L179

The line should feel printed rather than digitally generated.

Useful subtle effects:

- slight UV wobble,
- tiny density variation,
- occasional faint secondary ink offset,
- slightly softened edges due to atmosphere,
- stable screen-space pen weight.

The existing shader spec correctly calls for **offsetting the sample UV with noise**, rather than multiplying the edge by noise. fileciteturn0file2L286-L313

---

# 22. Existing dual-Sobel shader direction should remain

The current spec is already strong:

```text
diffuse Sobel × 0.6
+
normal Sobel × 0.3
+
noise-offset sampling
+
paper fBm
+
parchment/scene fill
+
highlight tint
+
vignette
```

The normal pass should remain restricted to mesh objects. The project notes explicitly warn that `Line2` geometry should not leak into the normal pass. fileciteturn0file2L183-L200

Do not “fix” flatness by randomly increasing `uInkStrength`.

First make sure the scene has the correct depth/geometry structure.

---

# 23. Watercourses should remain ink, not tubes

The existing implementation notes are correct that raised, lit tubes look like CG beads.

Use continuous screen-space lines (`Line2`) with fixed pixel widths, and keep them effectively zero-volume. fileciteturn0file2L8-L20

The hierarchy should remain approximately:

```text
river   3.0 px
canal   2.2 px
stream  1.6 px
drain   1.1 px
```

The exact widths may be tuned, but the hierarchy must remain visible. fileciteturn0file2L37-L55

---

# 24. Basin-specific visual identity

Do NOT make this “European vineyard visual design with different labels.”

Keep the motion and material language, but transform the metaphor.

### Chartogne-like concept

```text
landscape discovery
vineyard / plots
estate / terrain
```

### Nagpur concept

```text
hydrological discovery
river basin / water network
measurements / infrastructure
water movement / uncertainty
```

The best Nagpur identity is:

> **an archival scientific map that has become alive.**

The map is old; the water is moving; the measurements are current.

---

# 25. Typography direction

The current project recommendation of EB Garamond, large uppercase titles, wide letter spacing and staggered reveal is appropriate. fileciteturn0file0L136-L145

Use typography as editorial material, not as dashboard UI.

Suggested hierarchy:

```text
THE NAG BASIN

WATER
GROUND
RAIN
RESPONSE
```

Large titles should occupy empty parchment space and breathe.

Do not overcrowd the canvas with labels.

---

# 26. Text reveal animation

The existing staggered character reveal is a useful foundation:

- characters begin slightly displaced,
- slightly blurred,
- become opaque,
- settle into position.

Keep it slower and more editorial than a typical website text animation.

Avoid flashy spring/bounce effects.

---

# 27. UI should look like annotations on the map

Use HTML absolutely positioned over the WebGL scene, as already planned. fileciteturn0file0L125-L131

But visually treat it as printed annotations:

```text
NAG-05
────────────
DISSOLVED OXYGEN
1.20 mg/L

SOURCE
CSIR-NEERI

SAMPLE
2023–24
```

UI should feel like an extension of the paper, not a modern SaaS dashboard.

---

# 28. Navigation should be sparse

Use only the product's meaningful sections.

The navigation should be thin, typographic and quiet.

Do not create a large toolbar full of icons.

The map/world should remain dominant.

---

# 29. Measurement points: plotted data vs ink marks

A measurement point should feel like something physically placed onto the archival sheet.

Recommended visual language:

```text
small dark point
+
slightly irregular ink ring
+
subtle bleed/halo
+
label only when selected/focused
```

Avoid:

- Google Maps pins,
- glossy markers,
- material-looking 3D pins,
- coloured bubbles,
- giant dashboard dots.

The project rules require real measured points and intentional unmeasured space. fileciteturn0file3L55-L59

---

# 30. Do not give every point equal visual emphasis

Render all real points, but create a focus hierarchy:

```text
background points → muted
focused points    → stronger
hovered point     → subtle emphasis
selected point    → strongest + annotation
```

This is visual hierarchy, not changing the underlying data.

---

# 31. The grey/unmeasured space is part of the story

Do not fill blank areas just because they look empty.

The project specifically treats the absence of measurements as a core argument. fileciteturn0file1L14-L21

The viewer should subconsciously notice:

```text
measured point
       ●

             empty

   ●

                empty
```

The blank space should remain beautiful.

---

# 32. Water bodies and landmarks

Use recognisable Nagpur water bodies as visual anchors where appropriate.

The project notes specifically mention Ambazari, Futala, Gorewada and Gandhi Sagar as useful landmarks. fileciteturn0file2L393-L395

Use filled water-body shapes under the linework, not glossy 3D lakes.

A subtle blue-grey wash can help the eye immediately recognise water.

---

# 33. Infrastructure as tiny physical depth cues

STPs, outfall pins, markers and similar elements can use small extruded shapes.

Keep them simple.

Purpose:

> **make the camera's 3D space perceptible.**

Do not model full realistic buildings unless there is an actual product need.

---

# 34. Particle system: decorative vs meaningful

The project already proposes GPU particles following the 302 watercourses and varying with dissolved oxygen. fileciteturn0file0L114-L121

Keep this, but ensure the visual motion remains subtle.

The water movement should feel like:

```text
slow drift
+
slight turbulence
+
occasional variation
```

not a stream of glowing particles.

Particles should remain low contrast.

---

# 35. Make downstream behaviour legible but not cartoonish

If dissolved oxygen is encoded, prefer a restrained shift in density/tone rather than a rainbow scale.

Do not use neon colours.

The red warning colour should remain reserved for actual exceedance/highlight semantics defined by the product.

---

# 36. Atmospheric particles in front of the map

Add a second particle layer that is independent of river particles.

These are the visual “dust in the air” particles.

They should:

- move very slowly,
- vary in size,
- vary in opacity,
- occasionally appear/disappear,
- move with slightly different depth speeds.

Some can be screen-facing.

The result should look like air or film grain, not snow.

---

# 37. Foreground vs scene haze

Use two depth relationships:

```text
camera
  ↓
foreground dust
  ↓
scene / map
  ↓
depth haze
  ↓
distant scene
```

This is much more convincing than putting all particles and blur in one screen-space layer.

---

# 38. Avoid excessive blur

The reference is soft, but important information remains legible.

Bad:

```text
EVERYTHING = blurry
```

Good:

```text
near / focal = relatively crisp
midground    = slightly softened
far field    = milky
atmosphere   = very soft
```

Softness must have a reason.

---

# 39. Vignette should be extremely gentle

The current shader correction from the project is appropriate: use a smooth, low-strength falloff rather than making the corners dark. fileciteturn0file2L319-L325

The goal is to make the paper feel like it has physical edges/illumination, not to create a cinematic black vignette.

---

# 40. No obvious hard plane boundary

This is a concrete defect visible in the current recording.

The current Nagpur frames show a polygon/trapezoid edge from the plane itself.

This must disappear.

The project already proposes an oversized plane that fades toward the background specifically so Sobel does not outline its rim. fileciteturn0file2L98-L123

This fix should be treated as mandatory before judging the aesthetic.

---

# 41. Lighting should not look like normal 3D lighting

For the archival map aesthetic:

- avoid glossy materials,
- avoid specular highlights,
- avoid visible point lights,
- use mostly unlit/base-colour materials,
- let the composite shader create the ink/paper look.

The project notes already say to remove scene lights for this build. fileciteturn0file2L124-L126

---

# 42. What “high quality” means here

Do not measure quality by how many effects are on screen.

Measure it by whether all small effects cooperate:

```text
camera inertia
+
parallax
+
perspective
+
ink wobble
+
paper variation
+
distance haze
+
dust
+
slow particles
+
soft transitions
+
typography
```

Each should be subtle.

The combined image should feel rich.

---

# 43. A complete target render pipeline

Recommended order:

```text
1. 3D camera
2. flat basin/world plane
3. depth-separated map layers
4. water bodies
5. continuous watercourse lines
6. measurement points / physical markers
7. water particles
8. camera-facing dust
9. depth haze
10. diffuse render
11. normal render
12. dual-Sobel edge extraction
13. paper texture
14. ink/parchment composite
15. highlight tint
16. gentle vignette
17. fine grain / print imperfections
18. HTML annotations/UI
19. typography transitions
```

---

# 44. Implementation architecture

Recommended conceptual structure:

```text
WorldScene
 ├── paperPlane
 ├── basinLayer
 ├── waterBodies
 ├── waterways
 ├── measurements
 ├── structures
 ├── waterParticles
 ├── cameraDust
 └── atmosphericHaze

Render
 ├── diffuseRenderTarget
 ├── normalRenderTarget
 ├── highlightRenderTarget
 └── composite

HTML
 ├── title
 ├── navigation
 ├── annotations
 ├── pointPanel
 └── footer/contact
```

---

# 45. Current shader pipeline: retain and verify

The current documented composite includes:

```text
tDiffuse
uNormals
uNoiseTex
tHighlight
uResolution
uTime
uInkStrength
uWobble
uFillMix
```

and performs noise-offset Sobel, paper treatment, scene/parchment blending, highlight tint and vignette. fileciteturn0file2L241-L315

Use the existing debug views:

```text
1 = composite
2 = diffuse
3 = normals
4 = noise
```

The project explicitly requires these checks because shader failures can otherwise appear merely “wrong” rather than broken. fileciteturn0file2L353-L366

---

# 46. Camera tuning order

Do tuning in this order:

1. remove hard plane edge,
2. make line geometry continuous,
3. establish actual camera perspective,
4. add target-following,
5. add damping/inertia,
6. add depth-separated layers,
7. add gentle camera pitch/yaw,
8. add secondary camera drift,
9. add atmosphere,
10. add particles,
11. tune shader.

Do **not** tune the shader before the camera/depth system is convincing.

---

# 47. Acceptance test: camera

The camera passes only when an observer can say:

- “The scene feels 3D.”
- “The camera is travelling, not the map.”
- “The movement has weight.”
- “The camera follows something.”
- “Nearby and far elements move differently.”
- “The camera settles instead of snapping.”
- “There is no visible mechanical keyframe change.”

If those are not true, keep working on the camera.

---

# 48. Acceptance test: atmosphere

The atmosphere passes only when:

- paper grain is visible but not distracting,
- dust particles are sparse and subtle,
- haze is broad and soft,
- far elements lose contrast naturally,
- focal content remains readable,
- the image does not look like a Gaussian blur filter,
- the air seems to occupy the same physical scene as the camera.

---

# 49. Acceptance test: Nagpur identity

The final result must clearly feel like Nagpur rather than a generic clone.

It should contain:

- Nag basin geometry,
- real water-course relationships,
- Nagpur landmarks,
- real measurement points,
- real source/date metadata,
- product-specific verdict logic,
- Nagpur-relevant sections and story.

The visual treatment can resemble Chartogne-Taillet; the content model cannot be confused with it.

---

# 50. Acceptance test: product honesty

The experience must preserve the project's hard rules:

- no “safe”/“potable”/“drinkable” claims,
- exactly the three verdict states,
- no spatial quality interpolation,
- no synthetic measurement presented as real,
- observed vs modelled flood information stays visually distinct,
- private points remain spatially coarsened,
- sources and sampling periods are shown.

These are product constraints, not visual suggestions. fileciteturn0file3L39-L96

---

# 51. Final visual target

The best description of the desired result is:

> **A living archival map of Nagpur.**
>
> The paper is old.
> The ink is imperfect.
> The air contains dust.
> The distant basin dissolves into haze.
> The camera has mass.
> The rivers move.
> The measurements are current.
> The empty spaces remain empty because that is what the record actually knows.

The visitor should feel that they **entered the map**, not that they opened a map component.
