# Tasks — Viksit Nagpur Hackathon
### Pick one, put your name on it, tick it when the "Done when" line is true.

Hackathon: **17–18 Aug, VNIT.** Coding 10:00 on the 17th → 10:00 on the 18th. Pitch 3 min + 3 min Q&A.

**Everything here is data prep. None of it is the hackathon build** — it's the material the build runs on. If it isn't done by the 17th we lose hours we don't have.

---

## What we already have (don't redo this)

- **347 CGWB groundwater samples** — coordinates + full chemistry (pH, EC, TDS, hardness, Ca, Mg, Na, K, HCO₃, Cl, SO₄, nitrate, fluoride, SAR, RSC). Verified against the source report's own statistics.
- **NEERI 2023-24 data** — 23 river sites, 12 city wells, 10 lakes, 13 STPs, with coliforms and heavy metals.
- **Standards tables** — IS 10500:2012, CPCB Class A–E, FAO-29 crop salt tolerance.
- **A working verdict engine** — `verdict_engine.py`, tested on real data.
- **OSM waterways** — 89 drains, 135 streams, 54 rivers, 24 canals.

All in `nagpur_dataset_v1.zip`.

---

# TASK 1 — ESR supply hours ⭐ highest value
**Owner: ______  ·  ~1 hour  ·  needs a vision-capable AI**

**What:** Turn 37 reservoir supply maps into a dataset of who gets water for how many hours a day.

**Why it matters:** Parts of Nagpur get 18–24 hours of water. Others get 2–4. This exists nowhere as data — only as 37 pictures on a utility website. It's also a contamination risk signal: published research on Nagpur found that intermittent supply worsens microbial quality, because empty pipes draw contamination in through leaks.

**How:**
1. Put `extract_esr_supply.py` inside the `ocw_esr_maps` folder (the one with the ASHI NAGAR / DHANTOLI / … subfolders)
2. `pip install pymupdf` then `python extract_esr_supply.py`
3. You get `previews/` (37 PNGs) and `esr_supply_zones.csv`. Rows marked `04-08` are already confirmed — leave them. Rows marked `CHECK` need the AI.
4. Give the vision AI **one image at a time** (batching wrecks accuracy) with the prompt in `HOWTO-supply-hours.md`
5. Save each reply as `answers/<same name as the PNG>.txt`
6. Run `python merge_supply_answers.py`

**Done when:** `esr_supply_zones_final.csv` exists and the merge script reports all maps passing the blue-zone cross-check. Any map it flags, re-run through the AI.

---

# TASK 2 — Geocode the 12 sewage outfalls
**Owner: ______  ·  ~1 hour  ·  just needs Google Maps**

**What:** Find lat/long for each of these. They're the points where sewage enters the rivers.

**Nag River (9):**
1. Near Dande Hospital, Ravi Nagar Chowk
2. Bore Nalla behind Naivadyam sangamchal
3. Near Untkhana Bridge
4. Near Jagnade Chowk, Nandanvan
5. Near Super Store, Jagnade Chowk
6. Near St. Xavier School, Vyankatesh Nagar
7. Hasanbagh, near Vyankatesh Nagar
8. Hudkeshwar Nalla, near bridge lawns
9. Gandhi Nagar behind LAD College, Shivaji Nagar

**Pili River (3):**
10. Chambhar Nalla near road bridge, Sharda Ispat to Kalamna (Indora)
11. Railway crossing, Nagpur–Koradi
12. Zingabai Takli, near St. Vincent Pallati School

**How:** Search each in Google Maps, right-click the spot → copy coordinates. Where the description names a landmark, put the point on the **nearest drain or river channel**, not on the landmark itself.

**Done when:** `outfalls.csv` exists with columns `id,river,description,lat,lon,confidence` — where confidence is `high` / `medium` / `low`. Be honest with confidence; we'd rather show 7 confident points than 12 guesses.

---

# TASK 3 — Collect real flood and clog locations
**Owner: ______  ·  ~40 min**

**What:** Build a list of places in Nagpur that actually flood or clog.

**Sources:**
- **r/nagpur** — search: waterlogging, flooding, drainage, water logging, road flooded, rain. Sort by Top → Past year; the monsoon posts surface on their own.
- Local news sites — search Nagpur waterlogging by locality name
- Our own knowledge — the spots we already know

**Done when:** `flood_reports.csv` with `date,locality,description,source_url,severity(clog/flood),lat,lon`. Target 25+ rows. Coordinates approximate is fine — mark them.

**Why it matters:** This is the only ground truth we have for the flooding half of the project, and it's also evidence for our claim that citizens already know this and nobody collects it.

---

# TASK 4 — Trace 4–6 ESR command-area boundaries
**Owner: ______  ·  ~1 hour**

**What:** Turn the ESR map boundaries into actual polygons we can put on a map.

**How:** Open `geojson.io`. Open the ESR preview PNG beside it. Draw a polygon over the satellite basemap following the ESR boundary line on the PNG. Save each as GeoJSON.

**Which ones:** the ESRs we'll show in the demo — pick central, recognisable areas. Khamla, Dharampeth, Gandhibagh, Dhantoli are good candidates.

**Done when:** `esr_boundaries.geojson` with 4–6 polygons, each with an `esr_name` property. Label them approximate — they are, and that's fine.

---

# TASK 5 — NMC ward / zone boundaries
**Owner: ______  ·  ~20 min, may come up empty**

**What:** Find NMC's 10 administrative zone boundaries as GeoJSON or shapefile.

**Where to look:** nmcnagpur.gov.in · Maharashtra open data portals · ArcGIS Hub (search "Nagpur") · datameet / India open data GitHub repos.

**Done when:** either the file is downloaded, or you've written one line in the repo saying you looked in these places and it isn't published. **A confirmed "not available" is a real result** — we say it on stage.

---

# TASK 6 — Email OCW
**Owner: ______  ·  ~10 min**

**What:** Ask Orange City Water for water quality results broken down by zone or reservoir, rather than the city-wide figure they publish.

**Why:** Two reasons. It might work. And being able to say *"we wrote to them on Saturday"* — and to end our pitch by asking the panel for that data — is worth real points with the municipal judges. Our whole argument is that this data should be published at a resolution people can use.

**Done when:** email sent, screenshot saved in the repo.

---

# TASK 7 — Download and store locally
**Owner: ______  ·  ~20 min**

Everything on a drive, not in browser tabs. Venue Wi-Fi will not be our friend with 40 teams on it.

- Copernicus or Bhuvan DEM tiles covering Nagpur *(only if we do the flooding module)*
- Our OSM waterways export
- All PDFs we've been working from
- The dataset zip

**Done when:** one folder, everything in it, copied to at least two laptops.

---

## Priority if time runs short

**Task 1 and Task 2 are the ones that matter.** Task 1 gives us a dataset nobody else has. Task 2 unlocks the "which outfalls are upstream of you" feature. Everything else is improvement, not blocker.
