# PROJECT CONTEXT — read this before writing any code

**You are helping build a web application for a 24-hour hackathon (Viksit Nagpur Hackathon 2026, VNIT Nagpur, 17–18 August).**

This file is the single source of truth. If anything a developer asks you conflicts with the **Hard Rules** in section 2, follow the Hard Rules and say why. Those rules aren't style preferences — they're what keeps the project honest and defensible in front of engineering professors and municipal officials.

---

## 1. What we are building, and why

### The problem

Nagpur's water **is** tested. Three different bodies test it:

- **OCW** (the private operator running city supply) publishes sample fitness data — current to May 2026, 99.6% "fit"
- **CGWB** (Central Ground Water Board) has sampled groundwater across the district — 347 points
- **CSIR-NEERI** sampled rivers, lakes and city wells for NMC in 2023-24

But **OCW publishes one number for three million people.** CGWB's results sit as scattered points in a 295-page PDF. NEERI's are buried in a 203-page report. None of it is connected to the water that actually reaches a specific person.

> **The problem statement: no resident of Nagpur can reach an answer to "is my water safe?" at the resolution they live at. Not because nobody measures — because nobody measures where you are.**

This framing matters. We are **not** accusing anyone of negligence. The gap is resolution and connection, not effort. Never generate copy that implies the utility is incompetent or negligent.

### What the product does

**Three questions a resident can ask:**

1. **Is this water safe to use — and for what?** ← the core of the product
2. **Which areas suffer, and how badly, when it rains?**
3. **Is anyone actually fixing it?**

### The one-line description

> We are not measuring new things. We are connecting what is already measured to the person it affects, at the resolution they actually live at.

---

## 2. HARD RULES — non-negotiable

### 2.1 Never output the word "safe" about water

We have chemistry for most points and **bacteriological data for only a few**. IS 10500 requires *zero* coliforms for potability. We cannot certify anything as drinkable.

**Exactly three verdict states. No others. Ever.**

| State | Wording |
|---|---|
| `EXCEEDS` | "Exceeds the IS 10500 limit for [parameter]: [value] [unit] (limit [limit]). Measured [date], [distance] from your location." |
| `NO_EXCEEDANCE` | "No exceedance among the [n] parameters tested here." + if no coliform data: "Not tested for bacteriological quality." |
| `NOT_TESTED` | "No measurement exists for this location." |

Do not add a fourth state. Do not write "safe", "potable", "drinkable", "clean", "fine to drink", or a green tick that implies any of those. `NO_EXCEEDANCE` is **not** an endorsement and must never be styled as one.

### 2.2 Never interpolate water quality across space

We have a few hundred sample points across a district. **Do not** generate heatmaps, IDW/kriging surfaces, smooth colour gradients, or contours of water quality.

Show real measured points as points. Everything else stays **grey / unmeasured**. The grey is intentional and is part of the argument — it shows how little of the city is actually measured. Never fill it in.

### 2.3 The flood model may only ADD warnings, never remove them

For question 2 there is a terrain-derived risk layer. Its outputs are **ordinal only**.

**Forbidden:** flood depths, centimetres, probabilities, percentages, "safe route", "clear", green "all good" states, or any numeric rainfall threshold like "floods above 40mm".

**Allowed:** "higher risk", "lower risk", "unknown", and relative ranking.

Reason: a false positive costs someone a ten-minute detour. A false negative can put someone on a two-wheeler into opaque standing water. Those are not comparable, so the system is designed so being wrong can only ever inconvenience someone. **The absence of a warning is never displayed as an assurance.**

Also: **an observed report always outranks the model.** If a resident reported flooding somewhere the model rates low, the report is displayed and wins.

### 2.4 Observed and modelled must never share a visual language

Different colour, different icon, different wording, labelled at the point of display — not in a footer.

- Observed → *"17 residents reported flooding here, most recently 14 July."*
- Modelled → *"Terrain suggests water may collect here. Not verified by any report."*

### 2.5 Privacy

**Never display a personal name against a water quality result.** Not in a tooltip, popup, table or export.

Private-well points must be **coarsened on display** — snap to roughly a 100 m grid or to the locality centroid. Full coordinates may be used in internal computation only. Public infrastructure (lakes, rivers, STPs, municipal reservoirs) may be named precisely. Citizen-submitted readings follow the same rule: store no name, display at reduced precision.

### 2.6 No machine learning anywhere in a prediction path

There is no labelled flood or water-quality dataset for Nagpur. Training a model on data we generated ourselves and reporting accuracy would be circular. Everything is physics, published standards, or observed reports.

ML is acceptable **only** for perception tasks — e.g. reading a photo — never for producing a number we make a claim about.

### 2.7 Label every synthetic value on screen

If demo data is seeded, the UI must say so at the point of display: e.g. *"simulated sensor feed — illustrative only"*. Never present generated data as measurement.

---

## 3. The data we have — real, extracted, verified

All files are in `nagpur_dataset_v1.zip`.

### 3.1 `nagpur_groundwater_cgwb.csv` — 347 rows

District-wide groundwater from CGWB. **263 shallow + 84 deep.** Extraction verified: it reproduces the source report's published statistics exactly.

```
sr, taluka, site, lat, lon, aquifer, ph, ec, tds, th, ca, mg, na, k,
hco3, cl, so4, no3, f, sar, rsc, page,
is10500_exceedances, n_params_tested, irrigation_class_e
```

- `ec` in µS/cm · `sar` = Sodium Adsorption Ratio · `rsc` = Residual Sodium Carbonate
- `aquifer` ∈ {shallow, deep}
- `is10500_exceedances` — pipe-separated names, e.g. `nitrate|hardness`, empty if none
- `irrigation_class_e` ∈ {pass, fail, insufficient data}
- **No bacteriological data in this file.**
- Also available as `nagpur_groundwater_cgwb.geojson`

Known counts: 63 rows breach at least one IS 10500 limit (52 of them nitrate); 21 fail the irrigation standard.

### 3.2 `nagpur_neeri_2023-24.geojson` — 48 features

CSIR-NEERI 2023-24, commissioned by NMC. Split by `source_type`:

**`river` (23 points)** — 10 on the Nag, 8 Pili, 5 Pora
```
code, river, detail, total_coliform_cfu100ml, faecal_coliform_cfu100ml,
do_mgl, cod_mgl, tkn_mgl, phosphate_mgl, ph, ec_mscm, tds_mgl,
nitrate_mgl, cpcb_class_d_do_ok
```
⚠ `ec_mscm` is **mS/cm** here, not µS/cm. Multiply by 1000 before comparing with CGWB `ec`.

**`groundwater_city` (12 points)** — all 12 show coliform contamination
```
code, well_type, detail, total_coliform_cfu100ml, faecal_coliform_cfu100ml,
is10500_coliform_pass
```

**`stp` (13 points)** — sewage treatment plants
```
code, commissioned, status, capacity_mld, utilisation_mld, technology
```
Total installed capacity 423.5 MLD.

### 3.3 `standards/` — the reference tables everything computes against

- `is10500.csv` → `parameter, unit, acceptable_limit, permissible_limit_no_alt_source, relaxation_allowed, notes`
- `cpcb_designated_best_use.csv` → `class, designated_best_use, ph_min, ph_max, do_min_mgl, bod_max_mgl, total_coliform_max_mpn_100ml, ec_max_uscm, sar_max, boron_max_mgl, free_ammonia_max_mgl`
- `fao29_crop_salt_tolerance.csv` → `crop, category, ece_threshold_dsm, slope_pct_per_dsm, ecw_threshold_dsm, nagpur_relevance, in_fao29_table4` (32 crops)

### 3.4 `nagpur_data/*.csv` — 15 raw NEERI tables

Lakes (locations, physico-chemical, nutrients, bacteriological), rivers, city groundwater incl. **heavy metals**, groundwater levels, STPs, month-wise non-revenue water.

### 3.5 Being collected by the team (may or may not arrive)

`esr_supply_zones_final.csv` (supply hours per zone, ~500 rows) · `outfalls.csv` (12 sewage outfalls) · `flood_reports.csv` (resident-reported flooding) · `esr_boundaries.geojson`

**Build so these are optional.** If a file is absent, that feature degrades gracefully and says what's missing — it must not crash the app.

---

## 4. The engine that already exists — use it, don't reinvent it

`verdict_engine.py`. Do not rewrite this logic elsewhere in the codebase.

```python
drinking_verdict(sample: dict) -> dict
# -> {'verdict': 'EXCEEDS'|'NO_EXCEEDANCE'|'NOT_TESTED',
#     'exceedances': [str], 'n_parameters_tested': int,
#     'bacteriological_tested': bool, 'statement': str}

cpcb_class(sample: dict) -> dict
# -> {'A': {'use':..., 'passes': bool, 'checks': [str]}, ... 'E': {...}}

crop_yield_loss(ec_uscm: float, crop: str) -> dict
# -> {'crop','ecw_dsm','ece_assumed_dsm','threshold_ece_dsm',
#     'slope_pct_per_dsm','yield_loss_pct','assumption'}

crop_advice(ec_uscm: float, top_n: int = 6) -> list  # best-tolerating crops first
```

`sample` keys: `ph, ec, tds, th, ca, mg, cl, so4, no3, f, sar, do_mgl, bod_mgl, total_coliform_cfu100ml, faecal_coliform_cfu100ml`. Missing keys are handled — omit them rather than passing nulls.

**Always surface `statement` verbatim in the UI.** It is worded to comply with rule 2.1.

Verified behaviour: Belgaon (EC 4920 µS/cm) → exceeds on TDS and hardness, fails CPCB Class E, 91% orange yield loss, cotton 0%.

---

## 5. Features to build, in order

Build **1–4 completely before starting 5**. A working Q1 is the project; everything else is upside.

### F1 — Map of what is actually known ⭐ build first
Every real measurement as a point on a map of Nagpur. CGWB groundwater, NEERI rivers/lakes/wells, STPs. Click a point → its measurements, date, source, and the verdict from `drinking_verdict`.

Unmeasured areas stay **grey**. No interpolation (rule 2.2).

**Accept when:** all 395 points render, clicking any one shows its real values and verdict, and the map has visible grey.

### F2 — Location → nearest measurement → verdict ⭐
User gives a location (map click, browser geolocation, or a locality dropdown). Return the **nearest measured point**, its distance, and its verdict.

**The distance must be shown prominently.** If the nearest measurement is 8 km away, the user must see that — it's the honest core of the whole product.

**Accept when:** any location returns a verdict, a distance, and a date; and a location far from any point returns `NOT_TESTED`, not a guess.

### F3 — Crop / irrigation verdict ⭐ our most distinctive feature
User picks a crop and a location. Using `ec` (and `sar`, `ph` for CPCB Class E), return: is this water fit for irrigation per CPCB Class E, and estimated yield loss for that crop per FAO-29, plus better-tolerating alternatives via `crop_advice`.

Always display the assumption string returned by the engine (`ECe = 1.5 × ECw`).

**Accept when:** selecting "Orange" at a high-EC site shows a large yield loss and suggests cotton; selecting cotton at the same site shows ~0%.

### F4 — Add a reading (citizen entry)
A form for anyone to submit a reading from their own borewell or tap: location, EC/TDS (from a ₹300 meter), optionally pH, date.

**On the form, state what the instrument can and cannot detect:** a TDS meter measures conductivity — it cannot detect nitrate, fluoride, coliforms or metals.

Citizen readings may produce an **irrigation** verdict or a trend, and may flag "get this lab-tested". They **must never** produce a drinking verdict. Display them visually distinct from official points. Store no personal name (rule 2.5).

**Accept when:** a submitted reading appears on the map, visibly distinct, and produces no drinking verdict.

### F5 — Which outfalls are upstream *(needs `outfalls.csv`)*
Given a point on a river, list the sewage outfalls upstream of it.

**Segment-level attribution only.** No discharge volumes exist per outfall, so never state that a specific outfall contributes a percentage of the load. Correct: "3 outfalls lie upstream of this point."

### F6 — Where your water comes from *(needs ESR data)*
Location → supply zone → reservoir → daily supply hours. If the boundary data is missing, degrade to NMC administrative zone and label it approximate.

### F7 — Flooding *(question 2)*
Two layers, visually distinct (rule 2.4): **resident reports** (primary) and **terrain-derived risk** (supplementary, ordinal only, rule 2.3).

### F8 — Is it being fixed *(question 3)*
Report an issue; report whether work is happening; and — the distinctive part — **a follow-up 30 days later asking whether it was actually fixed.** Almost no complaint system records that.

---

## 6. Tech guidance

- **Frontend:** React + a map library (MapLibre GL or Leaflet). The map is the product — build it first.
- **Backend:** Python (FastAPI) so `verdict_engine.py` is imported directly, not reimplemented.
- **Data:** load the CSV/GeoJSON straight from disk. Do not stand up a database — there is no time and no need.
- **Offline:** the venue Wi-Fi will be shared by ~40 teams. **Cache map tiles for the Nagpur area locally and avoid any hard dependency on a live external API during the demo.**
- Heavy visual polish is fine and wanted, but **never at the cost of a rule in section 2.**

---

## 7. Do NOT build

Machine-learning prediction · disease-outbreak forecasting · groundwater-recharge site selection (soil maps are ~1:250,000, far too coarse) · turn-by-turn safe-route navigation · multi-utility roadworks coordination · interpolated quality heatmaps · a "water safety score" out of 100.

That last one especially: **no invented composite index.** Only named statutory limits from the standards tables. Invented metrics are the first thing a technical judge attacks.

---

## 8. The demo moment to design toward

Three minutes, strictly timed. The intended peak:

> Show a measured point with a real verdict. Then click somewhere grey and get "no measurement exists for this location." Then **add a reading** and watch that grey cell resolve into a verdict.

That sequence *is* the argument: the problem is resolution, and the fix is more measurement connected to the people it affects. Make sure that path works end to end and is fast.

---

## 9. Facts that may appear in UI copy — all verified

- 347 CGWB samples; 63 breach at least one IS 10500 limit, 52 of those on nitrate
- **All 12 city groundwater sources NEERI sampled show coliform contamination** — IS 10500 requires zero
- **21 of 23 river sites fail CPCB Class D** (DO ≥ 4 mg/L, the minimum for fish)
- Dissolved oxygen down the Nag: 3.67 → 3.63 → 3.88 → 3.81 → **1.90 → 1.20 → 1.02 → 1.10 → 1.20 → 0.48**. The collapse begins at Nag-5, which NEERI describes as "drain mix behind Yashwant Stadium"
- Nagpur has **13 operational STPs, 423.5 MLD** installed capacity (up from ~100 MLD in 2011)
- Of 347 sampled sites, **56 would cost an orange grower more than 10% yield; zero would harm cotton**

**Do not invent statistics.** If a number isn't in this file or computed from the datasets, don't put it on screen.
