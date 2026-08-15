# Viksit Nagpur Hackathon 2026 — Water & Irrigation Idea Brainstorm

**Reality check before anything else.** Coding runs 10:00 AM 17 Aug → 10:00 AM 18 Aug. That is a **24-hour build with 5 people**, then a **3-minute pitch + 3-minute jury Q&A**. So the filter for every idea below is not "is this cool" but *"can 5 people build a demo-able slice of this in 24 hours, and can it be explained in 180 seconds?"* Ideas are rated accordingly.

Your three starting ideas are good. They are also, as stated, three separate projects. The work below does two things: **sharpens them into one story**, and **adds the layers that make a jury sit up.**

---

## 1. The one-sentence pitch you are missing

Right now you have "water quality + drainage map + flood feedback." That reads as three features. Here is the framing that makes it one idea:

> **The water that floods Nagpur in July is the water Nagpur runs out of in April. It's the same water, the same rivers, the same drains — but the city manages it with three disconnected departments and zero shared data. We built the layer that connects them.**

One platform, one river basin, three states of the same water:

| Season | Problem | Your module |
|---|---|---|
| **Before monsoon** (May–Jun) | Drains silted, nobody knows which ones matter | Desilting priority list |
| **During monsoon** (Jul–Sep) | Flooding, water-borne disease | Predictive flood risk + alerts |
| **After monsoon** (Oct–May) | Scarcity, unusable river water, irrigation shortfall | Water usability + irrigation advisory |

That's your title slide. Everything below plugs into it.

**Name options:** *JalNetra* (eye on water) · *JalSetu Nagpur* · *NeerNet* · *Nag-Jal Darpan* · *AquaSutra*. I'd pick **JalNetra** — short, Indian, means something, and "Netra" justifies the map-with-eyes logo.

---

## 2. The Google Maps question — answer it before the jury asks

You correctly spotted the weakness. A jury member **will** ask it. Here is the answer, and it's a strong one:

**Google Maps serves the commuter. Nobody serves the ward engineer, the farmer, or the disaster cell.** Concretely:

1. **Google reports, we predict.** Google knows a road is flooded when cars stop moving — that is *after* it happened. We compute, from terrain + drain capacity + rainfall nowcast, which junctions will flood **3 hours before the first drop lands**.
2. **Google says "where." We say "why."** Our unit of analysis is not the road — it's the **drain asset**. "Sitabuldi floods because Drain #47, which carries a 3.2 km² catchment, is designed for 40 mm/hr and hasn't been desilted since 2024." Google can never say that. That sentence is a work order.
3. **Google's data dies when the traffic clears. Ours becomes permanent infrastructure knowledge.** Every verified citizen report becomes a labelled training point. The map gets smarter every monsoon.
4. **Google has no idea whether water is drinkable or usable for irrigation.** Half our platform doesn't exist in their problem space at all.
5. **The knockout line:** *"We're not competing with Google Maps. We're an open API they could consume. Our flood layer is designed to be published — to Google, to Ola, to the 108 ambulance service. We're upstream of them, not against them."*

Memorise #5. It turns the hardest question into your best 20 seconds.

---

## 3. Ranked module shortlist

**Effort** = 24-hour build cost. **Wow** = jury impact. Build the top block, put the rest on a roadmap slide.

| # | Module | Effort | Wow | Verdict |
|---|---|---|---|---|
| A1 | Terrain-derived flood sink map (DEM → flow accumulation) | Low | **Very high** | **Build first** |
| B1 | Water Usability Index (CPCB Class A–E, not a made-up score) | Low | High | **Build** |
| A2 | Drain capacity gap analysis (Rational Method vs Manning) | Low | **Very high** | **Build** |
| C1 | ET-based irrigation advisory ("don't irrigate, rain on Tuesday") | Low | High | **Build** |
| A5 | Ward console + SLA clock + repeat-offender ranking | Low | High | **Build** |
| B2 | Crop-specific irrigation verdict (FAO salt tolerance) | Low | **Very high** | **Build — this is your sleeper hit** |
| A3 | Ambazari gate / lake release advisory simulator | Medium | **Very high** | Build if time |
| B3 | Pollution source triangulation (which stretch adds the load) | Medium | **Very high** | Build if time |
| A4 | Citizen report + terrain cross-verification + depth estimate | Medium | High | Build if time |
| D2 | What-if simulator (sliders: rain, desilting, encroachment) | Medium | **Very high** | Build if time — best demo device |
| C2 | Pench water ledger (city draw vs farmer allocation) | Medium | **Very high** | **Most original idea here** |
| A7 | Safe-route / school-bus / ambulance routing | Low | Medium | Cheap add-on |
| A8 | Marathi SMS / WhatsApp / IVR alerts | Low | High | Cheap, huge on inclusion |
| D6 | Vulnerability overlay (schools, hospitals, slums) | Low | High | Cheap, huge on impact |
| B4 | ESP32 water sensor node (~₹2,500 BOM) | High* | **Very high** | Only if you already own the parts |
| B5 | Phone-photo turbidity test (no hardware) | Medium | High | Clever substitute for B4 |
| C3 | Recharge / rainwater-harvesting site finder | Medium | High | Ties the story shut |
| D3 | Auto-generated ward report card PDF | Low | Medium | Makes it feel like a product |
| A9 | Sentinel-1 SAR flood extent, Sept 2023 (pre-compute now) | Medium | High | Pre-compute *before* the event |
| C4 | Non-revenue water / leak detection by zone | Medium | Medium | Roadmap |
| B6 | Treated-water reuse matchmaking (STP → farms/industry) | Medium | High | Roadmap, strong on SDG |

\* Only "High" if you're buying/wiring on the day. If a teammate already has an ESP32 and a TDS sensor in a drawer, this drops to Low effort and stays Very High wow.

---

## 4. The modules that actually win it — detail

### A1. Terrain-derived flood sink map — *build this in the first 4 hours*

Download a DEM for Nagpur (Copernicus 30 m or Bhuvan CartoDEM, both free). Run flow-direction, flow-accumulation and **Topographic Wetness Index** with `pysheds` / `richdem` / WhiteboxTools in Python. Depressions and high-TWI cells = where water physically must collect. Overlay OSM roads → find the junctions and underpasses sitting in those sinks.

**Why this wins:** it produces a flood-prone map of Nagpur *from physics*, with no historical data, in about two hours. And then you do the thing that makes juries believe you:

> **The validation slide.** Show your computed map next to the actual 2023 flood zones and the known chronic spots. If your model independently lights up Ambazari, the Nag river corridor and the usual underpasses — you didn't code a map, you built a model that *works*. That single slide is worth more than three features.

### A2. Drain capacity gap analysis — *the most under-rated idea on this list*

For each drain segment: get upstream catchment area from the DEM, apply the **Rational Method** `Q = C·i·A` for a design storm, and compare with the drain's actual carrying capacity from **Manning's equation** (width, depth, slope). Output per drain:

> "Drain #47 · catchment 3.2 km² · delivers 8.4 m³/s in a 50 mm/hr storm · carries 5.1 m³/s · **deficit 39% · will surcharge at 32 mm/hr**"

This is real civil engineering, it's arithmetic over a table, and it produces something NMC genuinely cannot generate today. It also gives you the *causal* answer that beats Google Maps. If you build only two things, build A1 and A2.

### B1 + B2. Usability, not a score — *fixes the weak point in your idea #1*

Do **not** invent a 0–100 "purity score." Juries poke holes in invented metrics. Use the law:

- **CPCB Designated Best Use classes A–E** — the official Indian framework for "what is this water good for."
- **IS 10500** for drinking water limits.
- **FAO-29 / CPCB Class E** for irrigation: pH 6.0–8.5, EC < 2250 µS/cm, SAR < 26, boron < 2 mg/L.

So a sample at any point returns a verdict card, not a number:

> ❌ Drinking (Class A/C fail — coliform, BOD) · ❌ Bathing (Class B fail) · ✅ **Irrigation (Class E pass, with caution)** · ✅ Industrial cooling

Then **B2, the sleeper hit** — go one step further into agronomy. Given the water's EC/SAR and the farmer's crop, FAO salt-tolerance tables give a yield-loss estimate:

> "At EC 3.1 dS/m: **oranges lose ~30% yield** — Nagpur's signature crop. Cotton tolerates this. Recommendation: blend 1:1 with borewell water, or switch this plot to cotton."

Nobody expects a 24-hour hackathon project to output an agronomic recommendation. This is the moment the jury looks up from their scoresheet.

### B3. Pollution source triangulation — *upgrade your idea #1*

Model the river as a graph. If a downstream station is worse than upstream, the load entered *between* them. Highlight that segment and the sewage outfalls/nalas inside it:

> "The 1.8 km stretch between Ambazari and Shankar Nagar contributes 40% of total BOD load. Three outfalls. Intercept these and river quality improves one full class."

**Source attribution is the thing officials genuinely cannot do today.** Pair it with a mass-balance what-if slider ("if outfall #3 is intercepted →") and you have the best 20 seconds of your demo.

### C1. ET-based irrigation advisory — *highest real-world value per line of code*

Open-Meteo (free, no API key) gives temperature, humidity, wind and radiation. Compute reference evapotranspiration **ET₀ via FAO-56 Penman-Monteith**, multiply by crop coefficient Kc, subtract effective rainfall:

> "Cotton, 2 ha, Kalmeshwar: crop needs 5.4 mm today. 12 mm fell yesterday, 22 mm forecast Tuesday. **Skip irrigation — you save 108,000 litres and one diesel pump run.**"

~100 lines of Python. Delivered by SMS in Marathi. This is the module with the clearest "a real person's life is better" story, which is exactly what the Impact slide needs.

### C2. The Pench ledger — *your most original idea, and it's all public data*

This is the one nobody else will have. The hard numbers:

- Nagpur city draws **190 MCM/year (~520 MLD)** from the Pench reservoir — **over 70% of the city's water supply**.
- When the city got an extra **78 MCM** in 2000, the Pench irrigation command area was **cut by 8,658 hectares** (from a planned 104,476 ha). Those are real farmers who lost real water so the city could drink.

Build a live ledger: reservoir level → city draw vs farm allocation → "this month the city is over-drawing by X MCM; that's Y hectares of command area short." Then close the loop with your quality module: **every litre of treated sewage Nagpur reuses (it already sells treated water to the Koradi/Khaparkheda power plants) is a litre of fresh Pench water returned to the farmers' side of the ledger.** Quantify it.

That is a policy instrument, not a dashboard. It is also exactly what "Viksit Nagpur" is supposed to mean, and it makes your urban and rural halves one system instead of two.

### A5 + D6. The governance layer — *cheap to build, reads as extremely serious*

- Complaint → auto-assigned to ward + **nearest drain asset ID** → SLA clock → resolved.
- **Repeat-offender ranking:** "17 complaints at this junction over 3 years, still unfixed." That list *is* the pre-monsoon desilting work order — sorted by flood risk × population affected × months since last cleaned.
- **Vulnerability overlay:** flood risk × schools, hospitals, dialysis centres, low-lying settlements. Priority = risk × who's exposed.

CRUD you can build in 3 hours, and it's what makes a government jury believe you've thought past the demo.

---

## 5. Scope discipline — what to actually build in 24 hours

**Build 3 modules deep, not 12 shallow.** A shallow 12-feature demo dies in Q&A; three working things with a validation slide wins.

**Recommended MVP triangle:**

1. **Predict** — A1 flood sink map + A2 drain capacity gap + rainfall nowcast → risk map with 3-hour lead time
2. **Assess** — B1 usability verdict + B2 crop recommendation
3. **Act** — A5 ward console + desilting priority + A8 Marathi SMS alert

Everything else goes on a **roadmap slide**. Counter-intuitively this *strengthens* the pitch: it shows vision without over-promising, and it gives you prepared answers when the jury asks "what about X."

### 24-hour team split (5 people)

| Person | Hours 0–8 | Hours 8–16 | Hours 16–24 |
|---|---|---|---|
| **1 — Geo/data** | DEM → sinks/TWI → risk GeoJSON | Drain catchments, Manning capacity | Validation map vs 2023 flood |
| **2 — Backend** | FastAPI + SQLite schema | Open-Meteo poller, risk scoring | Alert engine, SMS hook |
| **3 — Frontend** | React + Leaflet/MapLibre base map | Layer toggles, time slider | What-if sliders, polish |
| **4 — Quality/agri** | CPCB class engine, IS 10500 tables | FAO crop tolerance, ET₀ advisory | Source-attribution graph |
| **5 — Lead** | Collect outfalls, hotspots, complaints | Deck + demo script | **Rehearse the 3 min, 6+ times** |

**Hard rule: freeze features at hour 18.** The last 6 hours are integration, seeding believable data, and rehearsal. Teams lose this competition by still coding at 09:55.

**On fake data — be honest and it becomes a strength.** Where no real feed exists, seed synthetic data but *label it on screen*: "simulated sensor feed — node BOM ₹2,400, schematic in appendix." Juries forgive simulated data. They do not forgive being misled, and they always ask.

---

## 6. Mapping to the 6-slide template

| Slide | What to put |
|---|---|
| **1 · Title** | Theme + exact portal problem statement wording + "JalNetra — one platform for Nagpur's water, in all three seasons" |
| **2 · Solution** | The three-season table. Three modules, one line each. The Google Maps differentiator as one bullet. |
| **3 · Technical approach** | Stack + the pipeline diagram: DEM → hydrology → risk engine ← rainfall API → alerts. Show the Manning/Rational formulas — formulas signal rigour. |
| **4 · Practical implementation** | **The validation slide** (your map vs 2023 flood). Plus challenges: DEM resolution, no public real-time drain sensors, report spam, NMC adoption, sensor vandalism — each with a mitigation. |
| **5 · Impact** | 10,000 houses affected in 2023 · 8,658 ha of farmland lost to city allocation · SDG 6, 11.5, 13, 2, 3 · fits AMRUT 2.0, Jal Jeevan Mission, NDMA, Smart City ICCC |
| **6 · References** | CPCB water quality criteria · IS 10500 · FAO-29 & FAO-56 · MPCB monitoring data · India-WRIS · Bhuvan/CartoDEM · Copernicus · OpenStreetMap · Open-Meteo · the MDPI Pench study · 2023 flood coverage |

**Critical:** the template says Theme, Problem Statement Title and Expected Solution Title must be the **existing** ones from the portal, and once chosen they cannot be changed. Read the exact PS wording and **mirror its vocabulary** in your Designed Solution Title. Juries score alignment, and rewording the problem in your own language reads as not having read it. Water most likely sits under *Open Innovation for Viksit Nagpur*, or *Smart City* if there's a drainage/flooding PS there — check the portal before locking it.

---

## 7. Free data sources that actually work (no auth headaches)

| Need | Source | Notes |
|---|---|---|
| Terrain | Copernicus DEM 30 m (OpenTopography API), Bhuvan CartoDEM | Free, instant |
| Rainfall forecast/nowcast | **Open-Meteo** | Free, **no API key** — use this |
| Drains, roads, water bodies | **OpenStreetMap Overpass API** | `waterway=drain/ditch/stream`, instant |
| Flood extent history | Sentinel-1 SAR (Copernicus Data Space) | SAR sees through monsoon cloud — pre-compute before the event |
| Reservoir levels | India-WRIS | Pench, Totladoh |
| Water quality | CPCB/MPCB NWMP station data, data.gov.in | Sparse but real and citable |
| Groundwater | CGWB / India-WRIS | Well levels |

**Do this tomorrow (16 Aug), not during the hackathon:** download the DEM, pull the OSM extract, pre-compute the Sentinel-1 2023 flood image, and collect the outfall/hotspot list. Data gathering is not coding, and having it ready on a pen drive at 10:00 AM is worth six hours.

---

## 8. Three things that will decide this more than your code

1. **The validation slide.** Model output vs 2023 reality. Nothing else buys credibility that fast.
2. **The 20-second what-if moment.** One slider that visibly changes the map. Juries remember interactivity; they forget architecture diagrams.
3. **Rehearsing to 2:45.** Three minutes is brutally short and enforced. Most teams get cut off mid-demo. Script it word for word, time it, cut it, time it again.

---

## Sources

- [2023 Nagpur flood — Wikipedia](https://en.wikipedia.org/wiki/2023_Nagpur_flood) — 109 mm on 24 Sep 2023, 4 deaths, ~10,000 houses affected, ₹266.63 cr mitigation package
- [Addressing Urban–Rural Water Conflicts in Nagpur through Benefit Sharing — MDPI *Water*](https://www.mdpi.com/2073-4441/12/11/2979) — 190 MCM Pench allocation, 8,658 ha command area reduction
- [₹70 Crore Sanctioned for Ambazari Lake & Nag River Strengthening — The Live Nagpur](https://thelivenagpur.com/2026/04/03/%E2%82%B970-crore-sanctioned-for-ambazari-lake-nag-river-strengthening/)
- [After 2023 Flood Chaos, NMC Installs Gates at Ambazari — Nagpur Today](https://www.nagpurtoday.in/after-2023-flood-chaos-nmc-installs-gates-at-ambazari-to-tame-nag-river/12262255)
- [Pora River: NMC's ₹874 cr initiative to tackle sewage pollution — Nagpur Today](https://nagpurtoday.in/pora-river-gets-lifeline-nmcs-rs-874-cr-initiative-to-tackle-sewage-pollution/03151730)
- [The Nag River revitalization project — PIB](https://www.pib.gov.in/Pressreleaseshare.aspx?PRID=1766914)
- [Heavy Rain Exposes Nagpur's Poor Drainage — The Live Nagpur, Jul 2026](https://thelivenagpur.com/2026/07/29/heavy-rain-exposes-nagpurs-poor-drainage-waterlogs-several-areas/)
- [Bhandewadi Sewage Treatment Plant — CSE India](https://www.cseindia.org/bhandewadi-i-sewage-treatment-plant-nagpur-maharashtra-12510)
