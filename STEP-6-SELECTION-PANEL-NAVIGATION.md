# STEP 6 — stable selection, semantic panel, working navigation
### Traced against `log_1.2`. The flicker cause is confirmed in code, not guessed.

Step 5 landed well. Lake rings are gone (`main.js:280`), shoreline outlines are in, STPs are plan
symbols with `fullH: 0.35` lift, screen-pixel sizing works, the exceedance proxies reach the
highlight buffer, and the panel fills. The review documents are right about what's left, and two
of their three top items are the same defect wearing different clothes.

---

## 6.1 — The flicker. There is no selection state at all. *(45 min — do first)*

The panel is driven **entirely** by `pointermove` (`main.js:545-572`). `pointerdown`
(`main.js:574`) does nothing except handle `modeNearMe`. So `hovered` *is* the selection, and
`clearPanel()` fires the moment the raycast misses.

That alone would be survivable. What makes it flicker is that **the camera never stops moving.**
The damped follower plus the drift term in `animate()` mean a mark under a stationary cursor
drifts by a pixel or two every frame. Any tiny mouse movement re-runs the raycast, the mark is no
longer under the cursor, `clearPanel()` runs, the next jiggle finds it again. Fill, clear, fill,
clear.

### Two independent states, and the panel reads from selection first

```js
let hovered  = null;   // transient, follows the pointer
let selected = null;   // persistent, only a click changes it

function refreshPanel() {
  const shown = selected ?? hovered;
  if (shown?.userData.point) fillPanel(shown.userData.point, shown.userData.verdict);
  else clearPanel();
}
```

`pointermove` sets `hovered` and calls `refreshPanel()`. It must **never** touch `selected`.

```js
renderer.domElement.addEventListener('pointerdown', e => {
  if (modeNearMe) { /* existing nearest-measurement branch, unchanged */ return; }
  const hit = pickAt(e);
  if (hit) { setSelected(hit); }
  else     { setSelected(null); }        // background click clears — the only way to clear
});
```

Add a visible way out: an `×` in the panel header calling `setSelected(null)`.

### Hover must be re-evaluated while the camera moves

`hovered` currently only updates on pointer events, so during a camera move it is stale — the
cursor sits over empty paper while the panel still shows a mark. Cache the last pointer position
and re-raycast in `animate()`, **throttled to about 8 Hz**, not every frame:

```js
let ptr = null, lastPick = 0;
renderer.domElement.addEventListener('pointermove', e => { ptr = { x: e.clientX, y: e.clientY }; });

// in animate(), after the camera update:
if (ptr && t - lastPick > 0.12) {
  lastPick = t;
  const next = pickAt(ptr);
  if (next !== hovered) { setHovered(next); refreshPanel(); }
}
```

### Two proxy bugs while you are in there

`main.js:566` sets the hover proxy scale from `hovered.scale` at creation, and `sizeMarks()`
(`:475`) sets it again from `s * 1.9`. Two different bases writing the same value. Delete the
first — let `sizeMarks()` own every scale, always derived from base, never multiplied in place:

```js
if (m.userData.proxy)      m.userData.proxy.scale.setScalar(s * 1.7);
if (m.userData.hoverProxy) m.userData.hoverProxy.scale.setScalar(s * 1.9);
if (m.userData.selProxy)   m.userData.selProxy.scale.setScalar(s * 2.1);
```

And selection needs its own proxy, distinct from hover — a **thin open ring**, not a filled halo,
so a selected non-exceeding point doesn't suddenly look like an exceedance. Selection reads as
*"you are looking at this"*, exceedance reads as *"this is a finding"*. Different jobs.

### Acceptance

Click a mark. Move the cursor to the far corner. Let the camera drift for ten seconds. **The panel
must not change once.** Hover another mark — it may emphasise, but the panel stays on the selected
one until you click.

---

## 6.2 — The panel must say what kind of observation it is *(30 min)*

`NEAREST MEASUREMENT` leaves "measurement of what?" unanswered, and the answer differs per record.
Derive it from the data — never hardcode, and never from `kind` alone where `meta` is
authoritative:

```js
const OBSERVATION = {
  groundwater: { type: 'GROUNDWATER',       verb: 'SAMPLED / COMPILED' },
  citywell:    { type: 'CITY WELL',          verb: 'SAMPLED' },
  river:       { type: 'RIVER OBSERVATION',  verb: 'SAMPLED' },
  lake:        { type: 'LAKE OBSERVATION',   verb: 'ASSESSED' },
  stp:         { type: 'INFRASTRUCTURE',     verb: 'RECORD' },
};
```

Header block, above the identifier:

```
GROUNDWATER
CGWB · NAQUIM
─────────────────────────────
CGWB-53-DEEP
NARKHED

SAMPLED / COMPILED   2019–20
```

**One line matters more than all of this**, and it is the difference between a defensible product
and an overclaim. Put it under the sample period, in the muted tone:

> *A published sample from this location and period — not a live reading.*

An STP is **not** a measurement and its panel must not imply one. `verdict.js` already returns
`NOT_TESTED` for the thirteen; make the panel say why in plain words rather than showing a bare
verdict:

```
INFRASTRUCTURE
CSIR-NEERI for NMC
─────────────────────────────
BHANDEWADI
130 MLD · SBR · operational

No water-quality measurement is
published for this location.
```

That is where `capacity_mld` lives now that it no longer drives geometry.

Lakes keep the CPCB standard block already implemented at `main.js:497` — that is correct and must
stay. Add the sentence *"The Nag River rises here"* to Ambazari specifically; it is the hinge of
the whole argument.

---

## 6.3 — Navigation. This is the feature surface, not decoration. *(60 min)*

The bottom rail (`index.html:203-209`) is eight bare `<li>` elements with no handlers, and
`.menu` is static text. Wire both.

### The anchors are real geometry — I computed them from your own data

| target | lat | lon | extent | note |
|---|---:|---:|---|---|
| Basin overview | 21.139 | 79.134 | 54.7 km | |
| **Nag** | 21.1330 | 79.0842 | 8.8 × 1.9 km | 112 verts, 10 measured sites |
| **Pivli** | 21.1802 | 79.0782 | 13.5 × 4.3 km | 8 sites (`Pilli` in `points.json`) |
| **Pora** | 21.0892 | 79.0902 | 7.0 × 3.3 km | 5 sites |
| **Kanhan** | 21.1892 | 79.2787 | 24.9 × 17.6 km | no measurements |
| **Kolar** | 21.2875 | 79.0509 | 22.2 × 8.7 km | no measurements |
| **Vena** | 21.0500 | 78.9389 | 14.3 × 21.8 km | no measurements |
| **City wells** | 21.1351 | 79.0911 | 14.5 × 14.8 km | 12 sites |
| **Lakes** | 21.1255 | 79.0430 | — | Ambazari |
| **STPs** | 21.1351 | 79.0822 | — | 13 |

**Fix the rail's contents while you are there: `Pora` and `Pohara` are the same river.** The OSM
linework is named "Pohara River"; `points.json` calls it `Pora`. Eight items, one of them a
duplicate. Replace with: *Nag · Pivli · Pora · Kanhan · Kolar · Vena* then *City wells → · Lakes ·
Treatment*.

Kanhan, Kolar and Vena have linework but **no published measurements**. Do not hide them. Grey
their labels and have the panel say so on arrival: *"No published measurement exists on this
watercourse."* That absence is the argument the whole product makes — flying somewhere and finding
nothing is more convincing than never offering to go.

### Frame the target instead of hardcoding altitude

`gotoAnchor()` (`main.js:110`) sends every destination to `y: 25, z: z + 20`. Kanhan is 25 km
across; at 25 units of altitude the camera ends up inside the riverbed. Derive it:

```js
const UNITS_PER_KM = 100 / 54.7;                    // FIT spans 54.7 km
const FRAME = 2 * Math.tan(camera.fov * Math.PI / 360);   // 0.828 at fov 45

function gotoAnchor(a) {
  const [x, z] = project(a.lon, a.lat);
  const alt = Math.max(18, (Math.max(a.w, a.h) * UNITS_PER_KM / FRAME) * 1.25);
  const pitch = THREE.MathUtils.degToRad(58);
  gsap.to(desired.tgt, { x, y: 0, z, duration: 2.6, ease: 'power2.inOut' });
  gsap.to(desired.pos, {
    x: x + alt * 0.18,                              // slight lateral offset — never dead-on
    y: alt * Math.sin(pitch),
    z: z + alt * Math.cos(pitch),
    duration: 2.9, ease: 'power3.inOut',
  });
}
```

Nag lands at ~24 units, Kanhan at ~69, the basin at ~151. The **target tween finishes before the
position tween** (2.6 s vs 2.9 s), so the camera turns into the move and settles after it — that
is most of what makes a move read as a camera rather than a cut. The damped follower already in
`animate()` supplies the mass; keep animating `desired`, never `camera`.

Curve it: tween through one midpoint offset perpendicular to the A→B line, so the path bows
instead of running straight.

### Arrival choreography

```
click → camera turns → travels → settles
                                    ↓
                    title crossfades to the section name
                                    ↓
                    panel shows the section summary
```

Reuse the letter-stagger for the title. Never fade the map out and in.

---

## 6.4 — The menu is layer state, not pages *(30 min)*

`M E / N U` should open a short typographic list that changes **what is on the map**, not which
page you are on. Everything below already exists in the data:

| item | effect |
|---|---|
| **All measurements** | default |
| **Drinking sources** | groundwater + city wells only |
| **Rivers and lakes** | river + lake + water bodies, marks for the rest hidden |
| **Health exceedances** | only the 97 health-relevant; everything else drops to 15% |
| **What is not measured** | inverts — hides marks, keeps the network, draws the nearest-measurement ring from screen centre |
| **Treatment** | 13 STPs, camera to the STP centroid |

Implement as opacity and `visible` on existing meshes plus a camera move — no rebuild, no reload,
no page swap. *"What is not measured"* is the one to demo: it is the whole thesis in one click,
and it costs nothing but a visibility toggle.

---

## 6.5 — Lake wash *(20 min, only after the above)*

Shoreline outlines are in. Two refinements the reviews ask for, both cheap:

- `bodyMat` gets `transparent: true, opacity: 0.55` so paper grain reads through the fill. An old
  atlas watercolour wash, not a GIS polygon.
- Vary the fill slightly by area: bodies above the median get `#aec0c0`, below get `#c2cfcf`. Large
  water reads deeper. One line, and it is honest — it encodes size, which is real.

**Do not enlarge any polygon.** Ambazari is 15.4 ha and is meant to look small at basin zoom. The
camera coming down is the answer.

---

## 6.6 — Then, and only then, particles *(75 min — the original Step 6)*

GPGPU points seeded on the 302 watercourse polylines, advancing along the path, Perlin jitter
perpendicular to flow, `life` decrementing and resetting. Colour interpolated along
`standards.json → rivers.Nag`, the ordered series **3.67 → 0.48 mg/L**, so particles visibly
darken travelling downstream.

Keep them low-contrast and slow. This is the one piece of motion in the build that is carrying an
argument rather than decorating one: the water goes dark as it crosses the city, and that is a
measured fact, not a style choice.

---

# Your two questions, short

### What is left for a complete working thing

Six items. Three are this document.

1. **Selection + panel + navigation** — 6.1 to 6.4, this step. Turns a map into a product.
2. **Particles** — 6.6.
3. **Quality tiers** — frame-rate monitor, drop particles then the composite pass below 40 fps.
4. **The crop tool** — `cropLoss()` and the 35-crop FAO table are already written and unused. One
   panel: pick a crop, see predicted yield loss at the nearest EC measurement. Half a day's value
   for about an hour, and it is the entire agricultural half of the pitch.
5. **The citizen path** — a form that stores a reading with no name attached. Can be local-storage
   only for the demo; say so on screen.
6. **Deck and script** — six slides, timed to 2:45.

### Should features wait until last

**No — and the framing is the trap.** The navigation *is* the feature surface. Wiring the bottom
rail and the menu is not UI polish that precedes features; it is how the features ship. "Show me
the Nag" and "show me what is not measured" are not buttons that lead to features, they *are*
features F1 and F2.

The only two things that should genuinely wait are the crop tool and the citizen form, because
they are self-contained panels that plug into a working selection system. Build 6.1–6.4 and you
will find you have already built most of what you were calling "features later".

One real risk to name: **the deck and the three-minute script are the only items with no fallback.**
A shader that does not land still demos. A pitch you have not timed does not. Someone should be
writing it in parallel with this, not after it.
