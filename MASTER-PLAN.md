# MASTER PLAN
### Written 12:26, Mon 17 Aug · 15h 33m to freeze · 21h 33m to code end · 23h 33m to pitch

---

## Correction — I've now read the case study

My earlier description of chartogne-taillet.com was a guess stated too confidently. Having read the technical case study, here's what it actually is:

**Custom WebGL with hand-written shaders** (not three.js as the renderer). A four-pass compositing pipeline — data pass encoding opacity/pencil-marks/depth into RGB channels, a highlight pass, a compositing pass adding edge detection, perlin noise and paper texture, then an overlay pass. GPU particle systems simulating watercolour pigment diffusion. Low-poly villages rebuilt from satellite photography. **All UI — navigation, cursor, titles, maps — rendered inside WebGL**, with text converted to canvas textures. Dynamic quality degradation based on measured frame rate.

The aesthetic: **15th-century French maps and watercolour.** Hand-drawn, pen-on-paper.

### What this means for us — and it's more useful than I first thought

**It is a map experience.** So the reference is far more relevant to this project than I assumed. But separate the two layers:

| | Feasible tonight? |
|---|---|
| **The aesthetic** — hand-drawn cartography, paper texture, ink linework, muted watercolour palette | ✅ **Yes, ~1 hour.** Custom MapLibre style + a paper-texture and noise overlay in CSS. No WebGL needed |
| **The implementation** — four-pass shader compositing, GPU particles, WebGL-rendered UI, satellite-derived low-poly geometry | ❌ **No.** That is specialist studio work over months |

**And the aesthetic is worth taking, for a reason beyond taste:** on a hand-drawn cartographic style, your sparse points read as *deliberate marks on a chart*. On a default Google-style basemap, the same points read as *missing pins*. The same data feels like craft in one and failure in the other.

That's the single highest-leverage visual decision available, and it costs an hour of styling.

---

## What I can and cannot actually do

Being exact, because the plan depends on it.

### ✅ I can
- Write any file and commit it directly into your local clone at `C:\Users\user\Downloads\VBH`
- Process data, run Python, verify logic
- **Render HTML/JS in headless Chromium and screenshot it** — so I can build the frontend *and see whether it works* before you ever open it
- Download libraries and vendor them into the repo (so the demo needs no network)
- Search and fetch from the web

### ❌ I cannot
- Run `npm install` on your machine — the device shell has **no network access**
- Run your dev server or see your browser
- `git push` — you do that
- Do the ESR vision pass (needs your AI), geocode outfalls, or rehearse

### The architecture decision this forces

**Build a self-contained static app**: one HTML file + vendored JS libraries + the data files, opened directly. No build step, no npm, no dev server.

Reasons, in order of weight:
1. **I can render and screenshot it here**, so I catch breakage before you see it. With a React/Vite app I'd be writing blind.
2. **No install step** means no npm failure at 3am on venue wifi.
3. **Vendored libraries** mean the demo works with the network unplugged.
4. It removes an entire class of problem from a night where you cannot afford one.

If you want React later, the data layer and verdict logic port unchanged. **But start here.**

---

# TIMELINE

## PHASE 1 · 12:30–14:00 — Foundation *(me)*

| Task | Logic |
|---|---|
| Vendor MapLibre GL + CSS into `web/vendor/` | Demo must run offline. Doing this first means it's never a last-minute scramble |
| `web/index.html` + `app.js` skeleton, loads the 3 data files | Everything downstream needs data on screen; nothing else can be validated until this works |
| Render all 395 points, coloured by verdict, shaped by source | This is F1. Until it renders, no other feature can be judged |
| Screenshot-verify in headless Chromium | Catches breakage before it reaches you |

**Output:** a page you double-click that shows Nagpur with 395 real points.
**You do:** nothing. Wait.

## PHASE 2 · 14:00–15:30 — Verdicts *(me)*

| Task | Logic |
|---|---|
| Port `verdict_engine.py` logic to JS *(same rules, same wording)* | A static app has no Python. The wording is what enforces Hard Rule 2.1, so it must port exactly |
| Click a point → side panel: verdict, values, `source_agency`, `sample_period` | F2. Also closes loose ends 2 and 5 |
| Nearest-measurement + **distance**, from a map click | F3. The distance line is the pitch — it must exist early, not be bolted on |

**You do:** open it, click three points, tell me if anything reads wrong.

## PHASE 3 · 15:30–17:00 — The crop screen *(me)*

| Task | Logic |
|---|---|
| Crop selector + CPCB Class E pass/fail + FAO yield-loss bars | F4. Your most distinctive feature — build it while there's still slack |
| "Belgaon, Umred" one-click preset | Demo must not require typing on stage |
| Wording: *"groundwater at this location"* | Closes loose end 3 at the point it's written, not in review |

## PHASE 4 · 17:00–18:15 — Add a reading *(me)*

| Task | Logic |
|---|---|
| Form: location, EC/TDS, optional pH → point appears, visually distinct | F5, and the demo climax — grey resolves live |
| Instrument-limits notice on the form | Closes loose end 6 from the earlier review; also honest |
| Irrigation verdict only — never a drinking verdict | Hard Rule; a citizen TDS reading cannot support potability |

**You do:** submit one reading, confirm it renders distinctly.

## PHASE 5 · 18:15–19:30 — Tap water state + visual pass *(me)*

| Task | Logic |
|---|---|
| Tap-water screen: *"tested city-wide, no result for your zone"* | Turns the emptiest screen into the argument. Closes loose end 1 |
| Palette, type, spacing, muted map style | 80% of the "expensive" feel, cheap, and safe to do once function is proven |

## PHASE 6 · 19:30–21:00 — Second-tier content *(me)*

River DO chart (3.67 → 0.48, Class D line marked) · district→city zoom choreographed as a button · flood layer if `flood_reports.csv` exists.

## PHASE 7 · 21:00–23:00 — Hero *(me, only if 1–6 are done)*

395 points fading in with a counter, ending on *"Every water measurement in Nagpur. All of it."* Canvas, no 3D.

**Cut without hesitation if anything earlier is unfinished.**

## PHASE 8 · 23:00–02:00 — Deck and script *(me)* + rehearsal *(you)*

6 slides to the template · 3-minute script timed to 2:45 · Q&A assignments from the defense pack.

## 04:00 — FREEZE
No new features. Caching, seeding, rehearsal only.

## 04:00–10:00 — Yours
Rehearse six times · cache map tiles · screen-record a 60-second fallback · charge everything · put the build on two laptops.

---

# YOUR PARALLEL TRACK — anytime, doesn't block me

| # | Task | Time | Why it matters |
|---|---|---|---|
| **A** | **Push the PII scrub** | 5 min | ⚠️ Live exposure in a public repo. Do this first |
| **B** | Outfall geocoding (12 points) | 1 hr | Unlocks F7. Only you can judge "nearest channel" |
| **C** | ESR supply-hours vision pass | 1 hr | Unlocks F8 and the supply-inequality story |
| **D** | Flood locations — start from NMC Monsoon Preparedness Plan's 66 areas | 40 min | Q2's primary layer |
| **E** | Read `LOOPHOLE-REVIEW.md` — the JJM/urban gap | 15 min | This is now your strongest framing. Someone must own it |

**None of A–E blocks me.** I build while you do these.

---

# Can I do the ESR vision pass myself?

**Yes.** I can read images — I rendered and read the Khamla map earlier in this session. So I can classify the supply-hour colours directly, no separate AI needed.

**But it competes with the build.** 37 maps means 37 image reads plus staging them across ~10 batches, and it would eat several hours I'd otherwise spend building the app.

### The efficient split

| Option | Cost | Verdict |
|---|---|---|
| I render all 37 PNGs and commit them, another Claude chat classifies | ~20 min of mine | ✅ **Best.** Removes your pymupdf install *and* frees me |
| Another chat does the whole thing from `extract_esr_supply.py` | needs pymupdf on your machine | ✅ Fine |
| I do the whole pass here | 2–3 hrs of build time | ⚠️ Only if the app is finished early |

**Recommendation:** I render the previews, another chat classifies them. Remember F8 (supply hours) is **Tier 2** — it doesn't block the demo. Do not let it delay F1–F5.

---

# Backend — everything still pending

Being complete, since you asked. On the static architecture, "backend" means the data + logic layer inside the app.

### Mine, and blocking — must be done for the demo

| # | Item | Note |
|---|---|---|
| B1 | **Unit normalisation** | ⚠️ NEERI river `ec_mscm` is mS/cm; CGWB `ec` is µS/cm. **×1000.** If this is wrong, every river verdict is wrong by three orders of magnitude and nobody notices until a judge does |
| B2 | Verdict logic ported to JS | Wording must port verbatim — it's what enforces the "never say safe" rule |
| B3 | Unified layer model | One shape for CGWB / NEERI / STP / citizen points so the map and panel treat them identically |
| B4 | Nearest-point search + haversine distance | Powers F3; the distance is the argument |
| B5 | Crop calculation from FAO bands | Prefer `ecw_*` columns; fall back to threshold+slope only where blank |
| B6 | Citizen submission persistence | localStorage. Never produces a drinking verdict |
| B7 | Provenance rendering | `source_agency` + `sample_period` in every popup |

### Mine, but blocked on your data

| # | Item | Blocked on |
|---|---|---|
| B8 | Outfall upstream lookup | `outfalls.csv` — your Task B |
| B9 | Supply-hours lookup | ESR pass — Task C |
| B10 | Flood layer | `flood_reports.csv` — Task D |

**B1–B7 are enough for a complete demo.** B8–B10 are additive.

---

# WHAT I NEED FROM YOU TO START

**One decision, then I begin immediately:**

> **Static self-contained app (I build and visually verify it), or React/Vite (you run npm, I write blind)?**

If you don't answer, **I default to static** and start now — because it's the only path where I can see what I'm shipping, and being able to verify is worth more than framework preference tonight.

**Then, right now, in this order:**
1. Push the PII scrub *(5 min — it's public)*
2. Push the `dataset/` folder and the corrected `AI-BUILD-CONTEXT.md`
3. Tell me the decision above
4. Start task B or C

I'll have a map rendering 395 real points by 14:00.
