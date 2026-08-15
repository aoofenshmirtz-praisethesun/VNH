# Tasks — Viksit Nagpur Hackathon
### Updated 15 Aug, end of day. Pick one, put your name on it, tick when the "Done when" line is true.

Hackathon: **17–18 Aug, VNIT.** Coding 10:00 on the 17th → 10:00 on the 18th. Pitch 3 min + 3 min Q&A.
**Everything below is prep for the 16th.** None of it is the hackathon build — it's the material the build runs on.

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

All in `nagpur_dataset_v1.zip`.

---

## 📌 Decisions locked — stop debating these

- **Q1 (is this water safe, and what for) is the project.** Q2 and Q3 are built around it.
- **Q2: we ARE building the prediction model** — but reported locations are the primary answer and the model is a supplementary layer. **The rule: the model may only ever ADD a warning, never remove one, and never says "clear."** Full reasoning in `Q2-FLOOD-MODEL-DESIGN.md`. Read it before building anything in Q2.
- **We never say water is "safe."** Three verdicts only: *exceeds limit for [parameter]* / *no exceedance among the [n] parameters tested here* / *not tested*.
- **No ML in any prediction path.** Physics and published standards only.
- **Never interpolate a smooth quality surface.** Real points as points; unmeasured stays grey.

---

# TASK 1 — ESR supply hours ⭐ highest value
**Owner: ______ · ~1 hour · needs a vision-capable AI**

Turn 37 reservoir supply maps into a dataset of who gets water for how many hours a day. Parts of Nagpur get 18–24 hours; others get 2–4. This exists nowhere as data — only as 37 pictures on a utility website.

1. Put `extract_esr_supply.py` inside the `ocw_esr_maps` folder → `pip install pymupdf` → `python extract_esr_supply.py`
2. You get `previews/` (37 PNGs) and `esr_supply_zones.csv`. Rows already marked `04-08` are confirmed — leave them. Rows marked `CHECK` need the AI.
3. Feed the AI **one image at a time** (batching wrecks accuracy). Prompt is in `HOWTO-supply-hours.md`.
4. Save each reply as `answers/<same name as the PNG>.txt`
5. `python merge_supply_answers.py`

**Done when:** `esr_supply_zones_final.csv` exists and the merge script reports every map passing the blue-zone cross-check. Re-run any map it flags.

---

# TASK 2 — Geocode the 12 sewage outfalls ⭐
**Owner: ______ · ~1 hour · just Google Maps**

**Nag (9):** Dande Hospital / Ravi Nagar Chowk · Bore Nalla behind Naivadyam sangamchal · Untkhana Bridge · Jagnade Chowk (Nandanvan) · Super Store, Jagnade Chowk · St. Xavier School (Vyankatesh Nagar) · Hasanbagh nr Vyankatesh Nagar · Hudkeshwar Nalla nr bridge lawns · Gandhi Nagar behind LAD College

**Pili (3):** Chambhar Nalla, Sharda Ispat–Kalamna bridge (Indora) · Nagpur–Koradi railway crossing · Zingabai Takli nr St. Vincent Pallati School

Put each point on the **nearest drain or river channel**, not on the landmark itself.

**Done when:** `outfalls.csv` with `id,river,description,lat,lon,confidence` (high/medium/low). Be honest with confidence — 7 confident points beat 12 guesses.

---

# TASK 3 — Flood and clog locations ⭐ now more important
**Owner: ______ · ~40 min**

Q2's *primary* answer is what residents actually report, so this is no longer optional colour — it's the feature.

**Sources:** r/nagpur (search waterlogging, flooding, drainage, road flooded, rain — sort Top → Past year) · local news by locality · our own knowledge · Google Maps reviews/photos on known spots.

**Done when:** `flood_reports.csv` with `date,locality,description,source_url,severity(clog/flood),lat,lon`. Target 25+ rows. Approximate coordinates fine — mark them approximate.

---

# TASK 4 — DEM terrain viability check 🚦 NEW — gates Task 5
**Owner: ______ · ~20 min**

Before anyone spends 4–6 hours on the flood model, check the terrain actually supports it.

1. Download a Copernicus or CartoDEM tile covering Nagpur
2. Compute elevation range, mean slope, and standard deviation across the city area

**Done when:** you can state the numbers. **If the city is very flat, flow accumulation returns mush** — sinks everywhere, no coherent channels, output that's noise dressed up as analysis. If that's what you find, **we ship reported locations only and say why.** That's a good answer, not a failure.

---

# TASK 5 — Flood susceptibility model 🚦 only if Task 4 passes
**Owner: ______ · 4–6 hours · do this AFTER Q1 works**

Pit-fill → flow direction → flow accumulation → depressions → rank by upstream catchment area → join to OSM roads.

**Read `Q2-FLOOD-MODEL-DESIGN.md` first.** Non-negotiables: **ordinal bands only** (no depths, no percentages, no probabilities); output can only ever *add* a warning; modelled and observed must never share a colour or wording; a resident's report always outranks the model.

**Done when:** an ordinal risk layer exists and a report at a "low risk" location still displays that report.

**Time-box it.** Losing this costs one feature. Losing Q1 because someone spent the night debugging projections costs the hackathon.

---

# TASK 6 — Trace 4–6 ESR command-area boundaries
**Owner: ______ · ~1 hour**

Open `geojson.io`, put the ESR preview PNG beside it, draw a polygon over the satellite basemap following the boundary line. Pick central recognisable areas — Khamla, Dharampeth, Gandhibagh, Dhantoli.

**Done when:** `esr_boundaries.geojson` with 4–6 polygons, each with an `esr_name` property, labelled approximate.

---

# TASK 7 — NMC ward / zone boundaries
**Owner: ______ · ~20 min, may come up empty**

Look at nmcnagpur.gov.in · Maharashtra open data portals · ArcGIS Hub (search "Nagpur") · datameet and similar GitHub repos.

**Done when:** file downloaded, **or** one line in the repo recording where you looked and that it isn't published. A confirmed "not available" is a real result — we say it on stage.

---

# TASK 8 — Email OCW
**Owner: ______ · ~10 min**

Ask Orange City Water for water quality results broken down by zone or reservoir instead of the city-wide figure they publish.

It might work. And being able to say *"we wrote to them on Saturday"* — then ending the pitch by asking the panel for exactly that — is worth real points with the municipal judges. Our whole argument is that this data should exist at a resolution people can use.

**Done when:** sent, screenshot in the repo.

---

# TASK 9 — Everything on local disk
**Owner: ______ · ~20 min**

Venue Wi-Fi with 40 teams on it will not be our friend.

DEM tiles · OSM export · all source PDFs · the dataset zip · map tiles for the demo area if you can cache them.

**Done when:** one folder, complete, copied to **at least two laptops**.

---

## Priority if the day runs short

**Tasks 1, 2 and 3.** Task 1 gives us a dataset nobody else has. Task 2 unlocks the outfall feature. Task 3 is now the backbone of Q2. Tasks 4 and 5 are a bet — take it only once the first three are done.
