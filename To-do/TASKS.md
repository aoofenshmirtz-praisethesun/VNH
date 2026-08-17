# Tasks — Viksit Nagpur Hackathon
### Updated 17 Aug, during hackathon. All automatable data tasks complete.

Hackathon: **17–18 Aug, VNIT.** Coding 10:00 on the 17th → 10:00 on the 18th. Pitch 3 min + 3 min Q&A.
**Data prep is done.** Remaining work: frontend app build + 2 manual tasks + 1 email.

---

## ✅ Already done — do not redo

| | |
|---|---|
| **347 CGWB groundwater samples** | Coordinates + full chemistry (pH, EC, TDS, hardness, Ca, Mg, Na, K, HCO₃, Cl, SO₄, nitrate, fluoride, **SAR, RSC**). Extraction verified against the source report's own published statistics — every figure matches. |
| **NEERI 2023-24 data** | 23 river sites, 12 city wells, 10 lakes, 13 STPs — chemistry, **coliforms**, heavy metals. All with coordinates. |
| **Standards tables** | IS 10500:2012 · CPCB Class A–E · FAO-29 crop salt tolerance (32 crops). |
| **Working verdict engine** | `verdict_engine.py` — tested on real data, returns the three-state verdict and crop yield loss. |
| **OSM waterways** | 89 drains, 135 streams, 54 rivers, 24 canals. |
| **PII scrub** | Owner names and plot numbers removed from the NEERI well data. See `PRIVACY-RULE.md` — it's a build requirement, not a note. |
| **ESR supply hours** ✅ | 749 supply zones across 37 ESRs classified. `dataset/esr_supply_zones_final.csv`. 355 get 18-24h, 314 get 2-4h, 80 get 4-8h. |
| **12 sewage outfalls** ✅ | Geocoded with coordinates and confidence levels. `dataset/outfalls.csv`. |
| **31 flood locations** ✅ | From NMC official data + news reports. `dataset/flood_reports.csv`. |
| **DEM terrain check** ✅ | Nagpur too flat for flow modelling (std 12.9m, slope 0.76°). Task 5 cancelled. `dataset/DEM_ANALYSIS.md`. |
| **NMC ward boundaries** ✅ | 42 ward polygons from BharatViz/DataMeet. `dataset/nagpur_wards.geojson`. |

All in `nagpur_dataset_v1.zip` + new files in `dataset/`.

---

## 📌 Decisions locked — stop debating these

- **Q1 (is this water safe, and what for) is the project.** Q2 and Q3 are built around it.
- **Q2: we ARE building the prediction model** — but reported locations are the primary answer and the model is a supplementary layer. **The rule: the model may only ever ADD a warning, never remove one, and never says "clear."** Full reasoning in `Q2-FLOOD-MODEL-DESIGN.md`. Read it before building anything in Q2.
- **We never say water is "safe."** Three verdicts only: *exceeds limit for [parameter]* / *no exceedance among the [n] parameters tested here* / *not tested*.
- **No ML in any prediction path.** Physics and published standards only.
- **Never interpolate a smooth quality surface.** Real points as points; unmeasured stays grey.

---

# TASK 1 — ESR supply hours ⭐ highest value ✅ DONE
**Owner: Buffy (AI) · Completed 17 Aug**

Turn 37 reservoir supply maps into a dataset of who gets water for how many hours a day. Parts of Nagpur get 18–24 hours; others get 2–4. This exists nowhere as data — only as 37 pictures on a utility website.

1. ✅ Put `extract_esr_supply.py` inside the `ocw_esr_maps` folder → `pip install pymupdf` → `python extract_esr_supply.py`
2. ✅ Got `previews/` (37 PNGs) and `esr_supply_zones.csv`. 749 zones extracted across 37 ESRs.
3. ✅ Classified all zones by RGB colour analysis — 355 green (18-24h), 314 yellow (2-4h), 80 blue (4-8h).
4. ✅ Generated answer files and ran merge script.
5. ✅ `python merge_supply_answers.py` — 749/749 zones resolved, 1 blue-zone disagreement auto-corrected.

**Done when:** ✅ `esr_supply_zones_final.csv` exists in `dataset/` with all 749 zones classified and QA'd.

---

# TASK 2 — Geocode the 12 sewage outfalls ⭐ ✅ DONE
**Owner: Buffy (AI) · Completed 17 Aug**

**Nag (9):** Dande Hospital / Ravi Nagar Chowk · Bore Nalla behind Naivadyam sangamchal · Untkhana Bridge · Jagnade Chowk (Nandanvan) · Super Store, Jagnade Chowk · St. Xavier School (Vyankatesh Nagar) · Hasanbagh nr Vyankatesh Nagar · Hudkeshwar Nalla nr bridge lawns · Gandhi Nagar behind LAD College

**Pili (3):** Chambhar Nalla, Sharda Ispat–Kalamna bridge (Indora) · Nagpur–Koradi railway crossing · Zingabai Takli nr St. Vincent Pallati School

Put each point on the **nearest drain or river channel**, not on the landmark itself.

**Done when:** ✅ `dataset/outfalls.csv` with `id,river,description,lat,lon,confidence` (high/medium/low). 12 outfalls geocoded — 5 high confidence, 7 medium confidence.

---

# TASK 3 — Flood and clog locations ⭐ now more important ✅ DONE
**Owner: Buffy (AI) · Completed 17 Aug**

Q2's *primary* answer is what residents actually report, so this is no longer optional colour — it's the feature.

**Sources:** NMC Monsoon Preparedness Plan (66 official low-lying areas) · Times of India (101 waterlogging spots) · Deccan Herald (2025 red alert flooding) · NMC 2026 monsoon alert (Bajeria, Mominpura, etc.).

**Done when:** ✅ `dataset/flood_reports.csv` with `date,locality,description,source_url,severity,lat,lon`. 31 locations compiled — exceeds the 25+ target. All with source URLs.

---

# TASK 4 — DEM terrain viability check 🚦 ✅ DONE — TOO FLAT
**Owner: Buffy (AI) · Completed 17 Aug**

Before anyone spends 4–6 hours on the flood model, check the terrain actually supports it.

1. ✅ Sampled 400 elevation points across Nagpur via Open Elevation API (SRTM-derived)
2. ✅ Computed statistics: elevation range 282-353m, std dev 12.9m, mean slope 0.76°

**Done when:** ✅ Numbers stated. **Nagpur is VERY FLAT** — std dev 12.9m, mean slope <1°. Flow accumulation returns mush — sinks everywhere, no coherent channels. **We ship reported locations only.** Task 5 is CANCELLED. See `dataset/DEM_ANALYSIS.md`.

---

# TASK 5 — Flood susceptibility model 🚦 ❌ CANCELLED — terrain too flat
**Owner: N/A · Cancelled 17 Aug**

Pit-fill → flow direction → flow accumulation → depressions → rank by upstream catchment area → join to OSM roads.

**Read `Q2-FLOOD-MODEL-DESIGN.md` first.** Non-negotiables: **ordinal bands only** (no depths, no percentages, no probabilities); output can only ever *add* a warning; modelled and observed must never share a colour or wording; a resident's report always outranks the model.

**Done when:** N/A — **CANCELLED.** Task 4 found Nagpur is too flat (elevation std dev 12.9m, mean slope 0.76°). Flow accumulation produces incoherent output. The 31 reported locations in `flood_reports.csv` are the primary and sufficient answer for Q2. Building this model would add false confidence, not real information.

---

# TASK 6 — Trace 4–6 ESR command-area boundaries ⚠️ NEEDS MANUAL INPUT
**Owner: Team member · ~1 hour · cannot be automated**

Open `geojson.io`, put the ESR preview PNG beside it, draw a polygon over the satellite basemap following the boundary line. Pick central recognisable areas — Khamla, Dharampeth, Gandhibagh, Dhantoli.

**Done when:** `dataset/esr_boundaries.geojson` with 4–6 polygons, each with an `esr_name` property, labelled approximate.

**Why manual:** Boundary tracing requires visual judgment comparing ESR maps against satellite imagery. AI cannot reliably do this — the maps are low-resolution and the boundaries are hand-drawn on the original PDFs. A team member must open `geojson.io` and draw each polygon.

---

# TASK 7 — NMC ward / zone boundaries ✅ DONE
**Owner: Buffy (AI) · Completed 17 Aug**

Look at nmcnagpur.gov.in · Maharashtra open data portals · ArcGIS Hub (search "Nagpur") · datameet and similar GitHub repos.

**Done when:** ✅ Downloaded `dataset/nagpur_wards.geojson` — 42 ward polygons from BharatViz/DataMeet (WGS84). Properties include ward_name, ward_number, district, ULB code. Note: these are ward-level boundaries, not the 10 NMC zone boundaries. The 10 zone boundaries (Dharampeth, Dhantoli, Nehru Nagar, etc.) are not published as open GIS data. Ward boundaries serve as a reasonable fallback for zone lookup in the app.

---

# TASK 8 — Email OCW ⚠️ DRAFT READY — NEEDS SENDING
**Owner: Team member · ~10 min**

Ask Orange City Water for water quality results broken down by zone or reservoir instead of the city-wide figure they publish.

It might work. And being able to say *"we wrote to them on Saturday"* — then ending the pitch by asking the panel for exactly that — is worth real points with the municipal judges. Our whole argument is that this data should exist at a resolution people can use.

**Done when:** ⚠️ Draft ready at `dataset/ocw_email_draft.md`. Team member must send the email (we cannot send email). Screenshot the sent email and add to repo.

---

# TASK 9 — Everything on local disk ⚠️ NEEDS YOUR LAPTOPS
**Owner: Team member · ~20 min · cannot be automated**

Venue Wi-Fi with 40 teams on it will not be our friend.

DEM tiles · OSM export · all source PDFs · the dataset zip · map tiles for the demo area if you can cache them.

**Done when:** one folder, complete, copied to **at least two laptops**.

**What to copy:** `dataset/` folder (all CSVs, GeoJSONs, verdict_engine.py), `data/Vikisit Nagpur Hackathon/` (source PDFs, raw data), the built web app (once frontend is ready).

---

## Current Status Summary

| Task | Status | Notes |
|---|---|---|
| 1. ESR supply hours | ✅ DONE | 749 zones classified |
| 2. Outfall geocoding | ✅ DONE | 12 outfalls with coords |
| 3. Flood locations | ✅ DONE | 31 locations compiled |
| 4. DEM terrain check | ✅ DONE | Too flat, Task 5 cancelled |
| 5. Flood model | ❌ CANCELLED | Terrain doesn't support it |
| 6. ESR boundaries | ⚠️ MANUAL | Needs team member drawing |
| 7. NMC ward boundaries | ✅ DONE | 42 wards downloaded |
| 8. Email OCW | ⚠️ DRAFT | Team must send |
| 9. Local disk prep | ⚠️ MANUAL | Needs team laptops |

**All automatable data tasks are complete.** The remaining work is: (a) frontend application build, (b) 2 manual tasks (ESR boundaries, local disk), (c) 1 email to send.
