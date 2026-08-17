# Frontend plan
### What the site must prove, and the screens that prove it

⏱ **Coding ends 10:00 tomorrow. Freeze features at 04:00 and spend the last 6 hours on integration, demo data and rehearsal.**

---

## The one thing the site must prove

> **"Nagpur's water is measured. It just isn't measured where you are — and we can show you exactly what is and isn't known about your water."**

Every screen serves that sentence. If a screen doesn't, cut it.

The emotional beat you're aiming for is **not** "look at all this data." It's the opposite: **"look how little of this city anyone has actually measured."** The map should feel sparse and honest, not busy and impressive. That's a deliberate design decision and it's your whole argument.

---

## SCREEN 1 — The map *(the product)*

**Build this first. If only one screen exists at 04:00, it's this one.**

### What's on it

- Nagpur basemap, **muted and desaturated** — the data must be the only colourful thing
- **395 measured points**, by type:
  - 347 CGWB groundwater (district-wide)
  - 23 river sites (Nag / Pili / Pora)
  - 12 city wells
  - 13 STPs
- **Everything else is grey.** No heatmap, no gradient, no interpolation.

### Visual hierarchy

1. Point colour = **verdict**, not value → red `EXCEEDS` · neutral `NO_EXCEEDANCE` · hollow/outline `NOT_TESTED`
2. Point shape = **source type** → circle groundwater, triangle river, square STP
3. Everything else recedes

**Never use green.** `NO_EXCEEDANCE` is not an endorsement, and green reads as "safe" no matter what the label says.

### Click a point → side panel

```
NGW-8 · Bharatwada · Dug well
Sampled 2023-24 · CSIR-NEERI

⚠ EXCEEDS IS 10500
   Total Coliform  164 CFU/100mL   (limit 0)
   Faecal coliform  54 CFU/100mL   (limit 0)

Tested for 6 parameters
Source: NMC / CSIR-NEERI Environment Status Report 2023-24
```

Show the **verdict first, the number second, the source always.** The source line is what makes a judge trust the whole thing.

---

## SCREEN 2 — "What about my water?" *(the argument)*

The user gives a location — map click, browser geolocation, or a locality dropdown.

**The screen returns the nearest measurement AND the distance to it. The distance is the headline, not a footnote.**

```
        Nearest measurement to you

              6.8 km away
              ────────────
         sampled Dec 2023 · CGWB

    No exceedance among the 6 parameters
    tested there. Not tested for
    bacteriological quality.

    ─────────────────────────────────
    This tells you about a well 6.8 km
    from you. It does not tell you
    about your water.
```

**That last line is the entire pitch, on screen, in the product.** Make it big. Don't bury it in a tooltip.

If nothing is within a sensible radius: **"No measurement exists for this location"** — a real answer, displayed with confidence, not an error state.

---

## SCREEN 3 — "What is this water good for?" *(the distinctive feature)*

Pick a location + a crop. Show the irrigation verdict.

```
   Water at this location:  EC 4,920 µS/cm

   ✕  Irrigation (CPCB Class E) — FAILS on EC
      limit 2,250 µS/cm

   ── If you grow it anyway ──────────────

   Orange (santra)      ████████████░  ~91% yield loss
   Soybean              ██████░░░░░░░  ~48%
   Sorghum              ██░░░░░░░░░░░  ~9%
   Cotton               ░░░░░░░░░░░░░   0%

   Basis: FAO-29 crop salt tolerance
```

**This is your best screen.** A horizontal bar chart of yield loss by crop is instantly readable, needs no explanation, and the orange-vs-cotton contrast is the story: *the same water is killing Nagpur's signature crop and is completely fine for a different one.*

Have a preset button — **"Show me Belgaon, Umred"** — so the demo hits this in one click with no typing.

---

## SCREEN 4 — Add a reading *(the resolution)*

A short form: location, EC/TDS, optional pH, date.

**On the form itself**, in plain sight:

> A TDS meter measures conductivity. It **cannot** detect nitrate, fluoride, bacteria or metals. Your reading can tell us about irrigation suitability and about change over time — it cannot tell you whether water is drinkable.

Submitted points render **visually distinct** from official ones — dashed outline, different icon.

**This screen is the demo climax.** Submit a reading in a grey area and watch that area resolve into a verdict. That's the argument completing itself on stage.

---

## Secondary screens — only if time allows

**River profile.** A line chart of dissolved oxygen down the Nag: `3.67 → 3.63 → 3.88 → 3.81 → 1.90 → 1.20 → 1.02 → 1.10 → 1.20 → 0.48`, with the drain-confluence point marked at Nag-5. Annotate the CPCB Class D line at DO = 4. **21 of 23 sites fall below it.** One chart, no explanation needed — the river dies in front of you.

**Flooding.** Two visually distinct layers: 66 official low-lying areas from NMC's Monsoon Preparedness Plan (solid — observed), and terrain risk if it gets built (dashed, ordinal only — modelled). Never green, never "clear."

---

## Where to spend the visual budget

**Worth it:**
- Map interaction — smooth pan/zoom, satisfying point selection
- The yield-loss bar chart animating in
- The grey → resolved transition when a reading is submitted
- Typography and spacing. Restraint reads as authority

**Not worth it, and actively harmful:**
- 3D globes and particle effects. They say "we had nothing real to show"
- Animated water backgrounds
- Anything that delays the map appearing
- Dashboard-style KPI tiles with big numbers — this is a *sparse data* project; a dense dashboard contradicts your own thesis

**The aesthetic to aim for:** an instrument, not a dashboard. Calm, precise, a lot of empty space. The emptiness is the point.

---

## Colour rules

| | |
|---|---|
| `EXCEEDS` | red / amber |
| `NO_EXCEEDANCE` | **neutral grey-blue. NEVER green.** |
| `NOT_TESTED` | hollow outline, no fill |
| Unmeasured area | flat grey, no gradient |
| Citizen-submitted | dashed outline, distinct hue |
| Observed flooding | solid |
| Modelled flood risk | dashed / hatched |

---

## Build order — non-negotiable

1. Map renders with all 395 real points *(nothing else matters until this works)*
2. Click → side panel with real verdict from `verdict_engine.py`
3. Location → nearest measurement + **distance**
4. Crop verdict + bar chart
5. Add-a-reading form
6. River DO chart
7. Flooding layer

**04:00 — FREEZE.** Then seed demo data, cache tiles, and rehearse.

---

## The 3-minute demo path

Wire these five clicks so they're instant. Nothing else needs to be fast.

1. Map loads — sparse, mostly grey → *"this is every water measurement in Nagpur"*
2. Click a river point → EXCEEDS, coliform, real numbers
3. Click somewhere grey → *"no measurement exists for this location"*
4. Preset "Belgaon" → orange 91% loss, cotton 0%
5. Submit a reading → grey resolves into a verdict

**Cache the map tiles locally.** Forty teams will be on that Wi-Fi at noon.
