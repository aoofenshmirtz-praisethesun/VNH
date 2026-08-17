# Visual direction
### Editorial aesthetic, application speed

---

## The two references, judged against this project

**Editorial / immersive (Chartogne-Taillet direction) — ✅ take this.**

Slow, typographic, confident, generous negative space. It reads as *authority and restraint*, which is exactly what a project built on "we refuse to overclaim" should look like. Sparse data presented sparsely is coherent. **Restraint reads as authority; density reads as insecurity.**

**3D / WebGL (w3reality direction) — ⚠️ mostly skip.**

3D terrain, globes, extruded buildings, particle fields. On a project whose entire argument is *"there is almost no data here"*, elaborate 3D reads as compensating for thin content. A technical judge in particular will register it as decoration.

**And there is a hard constraint that settles it: you have three minutes.**

A scroll-driven immersive site is a *slow* format. If your demo requires scrolling through a narrative with cinematic transitions, you will burn 40 seconds on movement you can't afford. That alone rules out making the whole site an editorial experience.

---

## The resolution

> **Look like an editorial piece. Behave like an instrument.**

Two distinct surfaces:

| | Purpose | Speed |
|---|---|---|
| **Hero / landing** — one screen | The wow. What you screenshot, what opens the pitch | Cinematic, ~6–8 sec |
| **The application** — the map and panels | What you actually demo | Instant. One click per action |

The hero buys you the aesthetic credit. The app keeps the three minutes.

---

## Where the WOW should come from

Here's the thing worth internalising: **your wow moments are already in the data.** You don't need to manufacture one.

1. **The district → city zoom emptying out** — the map goes sparse as you approach where people live
2. **A grey area resolving into a verdict** when someone submits a reading
3. **Orange 91% vs cotton 0%** — same water, one crop dies
4. **The river's oxygen collapsing** — 3.67 → 0.48 down its length

Every one of those is a *content* wow. The design job is to make them land cleanly, not to add a separate spectacle beside them. A rendering wow competing with a data wow makes the data look like it needed help.

---

## The one piece of spectacle worth building — and it's on-message

**The hero: stage the emptiness.**

Near-black full-bleed screen. The city outline barely implied. Then **395 points fade in one at a time**, with a counter ticking up beside them. It takes a few seconds. The counter stops at 395.

The screen is still overwhelmingly empty.

Then the line:

> **Every water measurement in Nagpur.**
> *All of it.*

That's genuinely cinematic, it needs no 3D — canvas or SVG is enough — and it **is** the argument rather than decoration on top of it. It's also the single best screenshot you'll have for the deck.

**Cost:** 1–2 hours with AI writing it. **Build it only after Tier 1 works.** If 04:00 arrives and it doesn't exist, you've lost nothing essential.

---

## Concrete styling

**Palette** — near-black (`#0d0f10`-ish) or bone-white. Not grey-blue corporate. One accent only, for `EXCEEDS`: a warm red or amber. **Never green anywhere.**

**Type** — a serif for headings and the big statements (this is where the editorial feel lives), a clean grotesque for data and labels. Large type for the key sentences; the *"this does not tell you about your water"* line should be genuinely big.

**Motion** — slow and eased. 600–800ms, no bounce, no spring. Cinematic sites feel expensive because they move slowly and confidently. But: **motion only on the hero and on transitions the user initiates.** Never animate a map redraw during the demo.

**Map style** — do not ship default OSM tiles; they look generic and instantly cheap. Use a muted custom MapLibre style, desaturated, low contrast, so the data points are the only saturated thing on screen.

**Space** — generous margins, one idea per screen. The emptiness of the layout should echo the emptiness of the data. That's the whole aesthetic thesis and it's free.

---

## What to avoid

Particle backgrounds · animated water ripples · 3D globes · rotating terrain · parallax on the map · anything that delays the map appearing · KPI tile dashboards · progress rings · gradient meshes.

Each of these is a signal that the content couldn't carry the screen alone. Yours can.

---

## Build order, given the clock

1. Map with real points, functional, ugly
2. Panels and verdicts working
3. **Then** the visual pass — palette, type, spacing, map style *(this is where 80% of the "expensive" feeling comes from, and it's cheap)*
4. **Then** the hero animation, if time remains

Steps 1–3 give you a site that looks considered. Step 4 gives you the screenshot. **Do not invert this order.**
