# JalNetra — Product Definition & Jury Defense Pack
### Viksit Nagpur Hackathon 2026 · Open Innovation theme

---

## 0. The thesis that wins this

While researching I found the thing that turns this from "good student project" into "why has nobody done this."

**The NDMA Guidelines on Management of Urban Flooding (September 2010)** already mandate, for all 2,325 Class I/II/III cities in India:

- *"Watershed will be the basis for all Urban Flooding Disaster Management Actions"* — catchment-based planning, not ward boundaries
- Stormwater drains designed by the **Rational Method** with runoff coefficient up to 0.95
- **All cities mapped on GIS** with contour intervals of 0.2–0.5 m, and existing stormwater drainage inventories prepared on GIS
- **Pre-monsoon desilting completed by 31 March** every year
- Automatic Rain Gauges at a density of **1 per 4 km²**
- **Urban Flooding Cells** established in every Urban Local Body

Sixteen years later Nagpur has none of it. Not because the city is negligent — because **every one of those mandates presupposes a surveyed, digitised drainage inventory that costs crores and years to produce.** The mandate is stuck behind a data problem.

> ### The pitch
> **"India has had a national mandate for catchment-based urban flood management since 2010. It has never been implemented at scale, because it requires a GIS drainage inventory no city can afford to survey. We generate that inventory — for any Indian city — from free satellite and open-map data, in about two hours of compute. Nagpur is our pilot. Everything else we built is what becomes possible once that inventory exists."**

That framing does five things at once: it gives you a real, cited problem; it explains why the gap exists (so you're not implying officials are stupid — critical with a municipal jury); it makes your work the *unlock* rather than yet another dashboard; it makes national scale obvious; and it means every capability below is **compliance with existing policy**, not an invention you have to justify.

Lead with this. It is stronger than any feature.

---

## 1. The architectural spine

**The biggest risk in "many ideas in one product" is that it reads as a feature list.** The defence is that everything must be a *consequence* of one object, not an addition to it.

> **We did not build ten features. We built one model of Nagpur's water — and these ten things are what you can ask it.**

### The object: a catchment graph of the Nagpur basin

Nodes = sub-catchments, junctions, outfalls, lakes, STPs, gauges, intake points, command-area blocks.
Edges = drains, nalas, river reaches, pipelines — each carrying **capacity**, **slope**, **length**, **material**, **last-desilted date**, **quality state**.

Built by: Copernicus/CartoDEM 30 m → pit-fill → flow direction → flow accumulation → catchment delineation → Topographic Wetness Index, joined to OpenStreetMap `waterway=drain/ditch/stream/river` and road/building layers, then topologically sorted into a directed graph.

**Now watch every capability fall out of the same object:**

| Capability | What it is on the graph |
|---|---|
| Flood prediction | Route rainfall through edges; find where inflow > edge capacity |
| Drain capacity deficit | Compare Rational-Method inflow to Manning capacity, per edge |
| Pollution source attribution | Propagate load along edges; diff upstream vs downstream nodes |
| Desilting priority | Rank edges by (deficit × population downstream × months since cleaned) |
| Intervention simulator | **Edit an edge, re-run, diff the outcome** |
| Cost–benefit ranking | Cost of that edit ÷ damage avoided in the diff |
| Irrigation usability | Read the quality state of the nearest downstream node |
| Recharge siting | Find high-inflow nodes over permeable geology |
| Disease risk window | Find stagnation nodes × population × 5–10 day lag |
| Water ledger | Sum flows across the city-intake and command-area nodes |

That table is your Slide 2. **The intervention simulator is the crown jewel** — because on a graph, "what if we desilt drain #47 / remove that encroachment / build a retention pond here" is literally an edge edit and a re-run. On any other architecture it's a separate feature you'd have to build. On this one it's free. And a cost-benefit engine falls straight out of it.

Say this line and the "isn't this just a dashboard" question dies: **"A dashboard shows you what happened. We simulate what would happen if you spent the money differently."**

---

## 2. The product — three consoles, one engine

Three users, because "who is this for" is a question you must answer in one breath.

### Console A — NMC Operations *(the buyer)*

1. **Predictive flood risk, 3-hour lead** — rainfall nowcast routed through the graph → risk level per junction/asset, before the rain lands
2. **Capacity deficit register** — every drain scored against its catchment: *"Drain #47 · 3.2 km² catchment · surcharges at 32 mm/hr · deficit 39%"*
3. **Intervention simulator + cost–benefit ranking** — edit the network, re-run, see damage avoided per rupee; output is a ranked capital plan
4. **Complaint → asset routing with SLA** — every citizen report auto-bound to the drain asset that caused it; repeat-offender ranking becomes the statutory 31 March desilting list

### Console B — Citizens & Vulnerability *(legitimacy)*

5. **Geofenced Marathi alerts** — SMS / WhatsApp / IVR, plus safe-route advisory around predicted flood points
6. **Verified citizen reports** — photo + GPS, cross-checked against the terrain model (is this point actually a predicted sink?), each verified report becoming a permanent training label
7. **Vulnerability overlay + post-flood disease window** — risk × schools, hospitals, dialysis centres, low-lying settlements; and the 5–10 day gastro/dengue/lepto forecast that follows every flood

### Console C — Water Usability & Irrigation *(the differentiator)*

8. **Usability verdict, not a made-up score** — CPCB Designated Best Use Class A–E, IS 10500, FAO-29 → *"❌ drinking · ❌ bathing · ✅ irrigation with caution · ✅ industrial cooling"*
9. **Crop-specific advisory** — FAO-56 ET₀ for irrigation timing, FAO-29 salt tolerance for yield loss: *"at EC 3.1 dS/m oranges lose ~30% yield; cotton tolerates it; blend 1:1 with borewell water"*
10. **Pollution source attribution + the Pench ledger** — which 1.8 km stretch adds 40% of the BOD load; and city draw vs farmers' command area, with treated-water reuse credited back

### The demo device — "Ask the Twin"

A natural-language layer over the graph: *"Which drains overflow if it rains 60 mm tonight?"* → map + ranked list + the numbers.

This is the one LLM feature that isn't lazy, and the defence is precise: **"The model doesn't do the hydrology. It translates a question into a query against the physics engine. Every number on screen comes from the graph, not from a language model."** Juries in 2026 have seen fifty GPT wrappers; they will notice you drawing that line yourself.

It also solves your 3-minute problem — you type one question and the whole product explains itself.

---

## 3. Feature evaluation — including what we cut and why

Senior work is visible in the **cut list**. Have this ready; "what did you decide *not* to build" is a real jury question and almost nobody can answer it.

### In scope

| Feature | Defensible? | Data exists? | Unique? | Spine-native? |
|---|---|---|---|---|
| Flood prediction (physics) | Strong — Rational Method is the NDMA-specified method | Yes, free | Medium | Yes |
| Capacity deficit register | Very strong — pure hydraulics | Derived | **High** | Yes |
| Intervention simulator + CBA | Very strong | Derived | **Very high** | Yes |
| Complaint → asset SLA | Strong | Synthesise + real | Medium | Yes |
| Marathi alerts + safe route | Strong | Yes | Low | Yes |
| Verified citizen reports | Strong | Generated | Medium | Yes |
| Vulnerability + disease window | Medium — lag is literature-based, not calibrated | Partial | **High** | Yes |
| Usability verdict (CPCB/IS/FAO) | **Very strong — statutory** | MPCB/CPCB, sparse | High | Yes |
| Crop advisory (FAO-29/56) | **Very strong — global standard** | Yes | **Very high** | Yes |
| Source attribution + Pench ledger | Strong | Public, sparse | **Very high** | Yes |
| Ask the Twin | Strong if framed correctly | n/a | Medium | Yes |

### Cut, with reasons

| Cut | Why |
|---|---|
| Blockchain water credits | Instant credibility loss with a technical jury |
| AR flood visualisation | Pretty; produces no decision |
| Drone / LiDAR survey | Capex and time we don't have; belongs in the roadmap as the accuracy upgrade path |
| **Full 1D/2D hydraulic model (SWMM, HEC-RAS, MIKE)** | Requires a surveyed pipe network that doesn't exist digitally. **But name it on stage** — see Q19, it's one of your best answers |
| Generic "AI chatbot for water" | Everyone will have one. Ours is a query interface over a real model, and we say so explicitly |
| In-home leak / smart water meter | Different product, different buyer |
| Social-media flood scraping | Noisy, unverifiable; roadmap line only |

---

## 4. Architecture (built to survive "how does this actually run in production")

```
INGEST          Open-Meteo (rain nowcast, no key) · IMD · Sentinel-1/2 (Copernicus)
                OSM Overpass · CPCB/MPCB NWMP · India-WRIS · CGWB · MQTT sensor feed
                   ↓  scheduled DAGs
STORE           PostgreSQL + PostGIS (spatial) + TimescaleDB (time-series)
                object store for rasters/tiles
                   ↓
TWIN BUILD      pysheds / richdem / WhiteboxTools · GDAL · GeoPandas · NetworkX
                → directed catchment graph, versioned per city
                   ↓
COMPUTE         FastAPI + Celery/Redis · physics engine (Rational + Manning + mass balance)
                · risk scoring · ML residual model (gradient boosting) once labels accrue
                   ↓
SERVE           Vector tiles (Martin/pg_tileserv) · React + MapLibre · PWA
                OGC API-Features so state GIS departments can consume it
                   ↓
ACT             Geofenced push · SMS/WhatsApp gateway · IVR (Marathi) · work-order export
                Open public API — consumable by Google, Ola, 108 ambulance, NDRF
```

**Design decisions worth stating out loud, because each one is an answer to a question:**

- **Physics first, ML second.** The system produces useful output on day one in a city with zero historical data. ML only ever refines a physical baseline. *(Answers the cold-start question.)*
- **Degrades gracefully.** No sensor is load-bearing. Lose the whole IoT layer and you still have terrain + rainfall + hydraulics.
- **No proprietary data anywhere.** Every input is free and global. *(Answers scale, and answers "what if NMC won't share data.")*
- **Open standards out.** OGC APIs and SWMM export, so we're a feeder to professional tooling rather than a walled garden.
- **The twin is versioned.** Every intervention simulation is reproducible and auditable — which is what makes it usable to justify public spending.

---

## 5. Scalability — the answer that makes this a startup, not a project

**The pipeline is city-agnostic.** Every input — DEM, OSM, Sentinel, Open-Meteo — is global and free. There is no Nagpur-specific data contract anywhere in the ingestion layer.

> **"Give us a bounding box and we generate that city's water twin in about two hours of compute. Nagpur is the pilot, not the product. There are 2,325 cities under the same NDMA mandate and none of them have this."**

**Do this before you present:** pre-generate a second city — Nashik, Amravati, Chandrapur — and have it as a tab. When someone asks about scale, you don't answer, you *click*. That single click is worth more than a paragraph. (If you're feeling bold, offer to generate a third live during Q&A. Only do this if you've tested it twice.)

---

## 6. Deployment — who runs it, who pays, what it costs

**The failure mode you must pre-empt:** government juries have watched dozens of dashboards get built and then never logged into. Say so before they do.

- **Not a new system — a layer.** Integrates into **Nagpur Smart City's existing ICCC** (Integrated Command & Control Centre) as a data source. Precedent: Shimla's ICCC runs flash-flood monitoring across 34 sensors. Nagpur has the ICCC and doesn't have this layer.
- **Existing owner, already mandated.** The NDMA guidelines require an **Urban Flooding Cell** in every ULB. That's the operator, and it exists on paper already.
- **Output lands in their current workflow** — a work order and a ranked capital plan, not a login. If the only artifact is a PDF the executive engineer prints on 20 March, it still works.
- **Money that already exists:** AMRUT 2.0 · NDMA/SDRF mitigation funds · Smart City O&M budget · the ₹266.63 cr post-2023 Nagpur mitigation package · the ₹70 cr Ambazari–Nag river sanction (Apr 2026).
- **Cost structure:** the twin is compute, not capex — a managed Postgres and a small worker fleet. Sensors are optional densification, not the product. Quote a monthly cloud figure, not a project cost.
- **Phasing:** Phase 0 two zones, one monsoon · Phase 1 all NMC wards · Phase 2 Nagpur district incl. rural/irrigation · Phase 3 licence the pipeline to other ULBs.

**Regulatory posture (nobody else will have thought of this):** the system is **advisory**; NMC/the Urban Flooding Cell remains the issuing authority for any public warning. Alerts carry risk levels and confidence, never instructions. That's how you avoid the liability trap in Q18.

---

## 7. Validation — how you prove it works in 90 seconds

This is what separates first place from third. **Do not skip it.**

1. **Hindcast the 24 September 2023 event.** Feed the model 109 mm and nothing else — no hindsight. Show its predicted inundation next to what actually flooded.
2. **Report real numbers.** Hit rate on known chronic points, precision and recall, false-positive rate. Say the false positives out loud before anyone finds them.
3. **Blind-spot slide.** Where the model fails, and why (pumped drainage, tidal/backwater, sub-30 m features). A team that names its own failure modes is trusted on everything else.
4. **Sentinel-1 SAR corroboration.** SAR sees through monsoon cloud — an independent observation of flood extent, not your own model marking its own homework.

> The line: **"We fed it the 2023 rainfall and nothing else. It found Ambazari, the Nag corridor and the underpasses on its own. We didn't train it on 2023 — there was nothing to train on. That's physics, and it's why this works in a city with no historical data at all."**

---

## 8. Jury Defense Pack

Assign each answer to a specific person. Rehearse cold.

**Q1 · "Google Maps already shows flooded roads."**
Google reports after cars stop moving; we predict three hours before the rain lands. Google's unit is the road; ours is the drain asset, so we output a cause and a work order — *"Sitabuldi floods because Drain #47 carries a 3.2 km² catchment into a channel rated for 40 mm/hr."* Google can never produce that sentence. And we're not a competitor — our risk layer is an open API Google, Ola and the 108 service can consume. We're upstream of them.

**Q2 · "NMC won't give you their drainage data."**
We don't need it. The network is derived from open terrain and map data — that's the entire point. Our output *is* the GIS drainage inventory the NDMA has required since 2010 and the city has never been able to fund. When NMC does share survey data, we ingest it and the model gets sharper. Their data is an upgrade, not a dependency.

**Q3 · "A 30 m DEM can't model street-level flooding."** *(the sharpest technical question — answer it precisely)*
Correct, and we don't claim it does. A 30 m DEM resolves **sub-catchments and depressions** reliably — it tells you *where* water accumulates and *whether* a drain is under-capacity. It does not give hydraulic depth at a specific junction. So we output risk classes, not centimetres. Depth calibration comes from citizen reports, and the accuracy upgrade path is drone/LiDAR survey of the top 50 sites — which is a lakhs-scale spend, not a crores-scale one, precisely because we've already told them which 50.

**Q4 · "Have you validated any of this?"**
Yes — hindcast of 24 September 2023, blind to the outcome. *(Then give your numbers and your false positives.)*

**Q5 · "What happens with no sensors and no historical data?"**
It works. The baseline is physical — Rational Method and Manning's equation, the same methods the NDMA guidelines specify. Machine learning refines it as labels accumulate, but nothing depends on it. That's why this deploys to a city that has never measured anything.

**Q6 · "Who pays for it?"**
B2G, per city, into budgets that already exist — AMRUT 2.0, SDRF mitigation, Smart City O&M. Nagpur has already sanctioned ₹266.63 cr post-2023 and ₹70 cr this April. We are asking for a rounding error on that to make sure it's spent on the right drains.

**Q7 · "Every hackathon builds a dashboard nobody uses."**
Agreed, and that's why we're a layer inside the existing ICCC rather than a new login. Our deliverable is a work order and a ranked capital plan. If the only thing that ever gets used is the PDF an executive engineer prints before the 31 March desilting deadline, the system has still paid for itself.

**Q8 · "Ranking wards will make officials hostile — they'll kill it."**
Real risk, and we designed for it. Two modes: the public view shows service levels by area; the internal view shows assignment and SLA. And the framing is resource justification, not blame — *"this zone needs two more suction machines"* is a budget request an engineer will happily forward upward. Accountability tools that humiliate staff get switched off in a month.

**Q9 · "Citizens will spam or game the reports."**
Reports never trigger an alert on their own — they adjust confidence in a prediction the physics already made. Each is cross-checked against the terrain model: a report from a point the model says is a ridge gets flagged, not published. Plus GPS + EXIF, rate limits, and reporter reputation weighting.

**Q10 · "Privacy?"**
Public layers are aggregated to a 100 m grid, no PII, photos stripped of identifying metadata before display. Compliant with the DPDP Act 2023. Individual complaint records are visible only to the assigned ward officer.

**Q11 · "You have no real water quality data."**
We consume CPCB/MPCB National Water Quality Monitoring Programme station data — real, public, and admittedly sparse. We interpolate along the river graph and **publish a confidence value with every verdict**. We never claim lab-grade precision at an arbitrary point; we claim a *usability class* with stated uncertainty, which is the decision the farmer actually needs. Sensor nodes densify the network later at roughly ₹2,500 per node.

**Q12 · "Why should a farmer trust your irrigation advice?"**
Because it isn't ours. Salt tolerance thresholds are **FAO-29**; evapotranspiration is **FAO-56 Penman-Monteith**. These are the standards ICAR and state agriculture departments already use. We cite the tables; we didn't invent a number.

**Q13 · "Isn't irrigation scope creep on an urban flooding project?"**
It's the same water and the same model. Nagpur city draws 190 MCM a year from the Pench reservoir — over 70% of its supply — and when it took an extra 78 MCM in 2000, the irrigation command area was cut by 8,658 hectares. The city's water security and the farmer's are one accounting problem. Splitting them is exactly why nobody manages either well.

**Q14 · "How is this different from a nicer map?"**
A map shows state. We simulate counterfactuals. Because the city is a graph, an intervention is an edge edit — desilt this drain, remove that encroachment, build a pond here — and we re-run and diff the outcome. The output isn't a picture, it's *"₹X on drain 47 avoids ₹Y in damage; ₹X on drain 12 avoids ₹Y/6. Do 47 first."*

**Q15 · "What's genuinely novel here?"**
Four things. Bootstrapping a drainage network from open data where none was surveyed. Asset-level causal attribution instead of location reporting. Intervention simulation with cost–benefit on a live twin. And coupling flood, quality and irrigation in a single model instead of three departments' spreadsheets.

**Q16 · "Did you really build this in 24 hours?"**
Repo, commit history, live demo — and here's the second city we generated. *(Have the tab open.)*

**Q17 · "Who maintains it? Sensors get stolen and vandalised."**
Which is why nothing depends on them. Nodes are sealed and mounted inside existing NMC assets, and a dead node degrades a confidence value rather than breaking a feature. The core system is managed cloud with no field hardware at all.

**Q18 · "If you predict wrong and someone drowns in an underpass, who is liable?"** *(few teams have thought about this — answering it well is disproportionately impressive)*
The system is advisory. NMC's Urban Flooding Cell remains the issuing authority for public warnings; we supply risk levels with confidence intervals, never instructions. Operationally we tune thresholds to favour false positives over false negatives — an unnecessary warning costs inconvenience, a missed one costs a life — and every alert is logged and auditable.

**Q19 · "Why not just use SWMM or MIKE URBAN — the industry standards?"** *(if a civil engineering professor is on the panel, this is coming)*
Because they need a surveyed pipe network with invert levels, and Nagpur doesn't have one digitally — that's the blocker, not the software. Those tools cost lakhs in licences and months of setup *after* the survey. We're the layer that bootstraps a first-pass network from open data, and **we export to SWMM format**, so when NMC does survey, our output is their input. We're complementary to professional tooling, not a replacement for it.

**Q20 · "What about climate change — your design storms are historical."**
The Rational Method takes a design storm as a parameter, so we re-run the whole city under intensified IDF curves. We can show you the 2023 event under projected 2050 rainfall — and which drains fail that are fine today. That's a capital planning horizon, which is exactly the decision a 30-year drainage asset needs.

**Q21 · "Why hasn't anyone done this already?"**
They have — on paper, in 2010. The NDMA mandated catchment-based flood management and GIS drainage inventories for 2,325 cities. It stalled on survey cost. We removed the survey.

**Q22 · "What's your biggest weakness?"** *(answer honestly — deflecting here loses more points than the weakness costs)*
Vertical accuracy. A 30 m DEM misses features smaller than 30 m — a single choked culvert can flood a street our model calls safe. We mitigate with citizen reports and a targeted survey of the top 50 sites, but we won't claim we've solved it.

---

## 9. Impact & policy mapping

**Verified figures — safe to say on stage**

- 24 Sep 2023: **109 mm**, 4 deaths, ~**10,000 houses** affected, a Nag river bridge collapsed *(Wikipedia, cited)*
- **₹266.63 crore** mitigation package announced 5 Nov 2023 *(same)*
- Nagpur draws **190 MCM/yr (~520 MLD)** from Pench — **>70% of city supply**; the extra 78 MCM in 2000 cut the irrigation command area by **8,658 ha** of a planned 104,476 ha *(MDPI, Water, 2020)*
- NDMA Urban Flooding Guidelines, **September 2010** — watershed basis, Rational Method C up to 0.95, GIS mapping at 0.2–0.5 m contours, desilting by 31 March, ARGs at 1 per 4 km², Urban Flooding Cells in every ULB *(NIDM PDF)*

**Verify before you cite** — headlines I could not open directly:

- ₹70 crore sanctioned for Ambazari Lake / Nag river strengthening (Apr 2026)
- ₹874 crore Pora river sewage initiative
- Gates installed at Ambazari post-2023
- "Nag river cleanup by 2032"

**SDG mapping** — use **6.5 as the headline**, it is literally the definition of what you built:

- **6.5 Integrated Water Resources Management** ← the whole thesis
- 6.3 water quality & wastewater · 6.4 water-use efficiency · 6.6 water-related ecosystems
- **11.5 reduce disaster deaths and economic losses** · 11.b local DRR strategies
- 13.1 climate resilience · 2.4 sustainable agriculture · 3.3 & 3.9 water-borne disease

**Indian policy hooks:** NDMA Urban Flooding Guidelines 2010 · AMRUT 2.0 · Jal Jeevan Mission · Atal Bhujal Yojana · National Water Policy · Smart Cities ICCC · DPDP Act 2023 · Sendai Framework.

---

## 10. Build plan, calibrated to AI-assisted implementation

You're right that code volume isn't the constraint. But recalibrating honestly changes *where* the risk sits, and this is the most useful operational thing in this document:

**AI collapses code-writing time. It does not collapse:**

- Data acquisition — downloads, tiles, API quotas, CRS and projection mismatches
- Geospatial debugging — the classic 3-hour sink, and it hits everyone
- Integration between components that each work alone
- Seeding believable demo data
- Rehearsal

**So the binding constraint is data, integration and rehearsal — not implementation.** Which means:

> **The single highest-leverage thing you can do is acquire and pre-process all data on 16 August, before the clock starts.** DEM tiles, OSM extract, MPCB station values, Sentinel-1 scenes for Sept 2023, hotspot list, crop tolerance tables. Data collection is not coding. Nobody can accuse you of anything, and it converts your riskiest six hours into a pen drive.

| Window | Focus |
|---|---|
| **16 Aug (before)** | All data downloaded and reprojected. Twin build script tested end-to-end on a *small* bounding box. Second city pre-generated. |
| **Hours 0–6** | Full-city twin: catchment graph in PostGIS, capacity table populated |
| **Hours 6–12** | Physics engine + risk scoring + the three consoles wired to real data |
| **Hours 12–18** | Quality/agri modules, alerts, intervention simulator, Ask the Twin |
| **Hour 18** | **Feature freeze. Non-negotiable.** |
| **Hours 18–24** | Hindcast validation run, demo data seeding, deck, and rehearse the 3 minutes at least six times |

**Label every synthetic input on screen.** "Simulated sensor feed — node BOM ₹2,400." Juries forgive simulated data and never forgive being misled, and they always ask.

---

## 11. Three-minute demo structure

| Time | Beat |
|---|---|
| 0:00–0:25 | The NDMA gap. Mandated in 2010, never implemented, stuck behind survey cost. |
| 0:25–0:45 | "We generate that inventory from open data. Here is Nagpur's water twin." *(the graph, on screen)* |
| 0:45–1:35 | **Ask the Twin, live.** One question → risk map → drill into Drain #47 → the causal sentence. |
| 1:35–2:05 | Intervention simulator: edit, re-run, ₹ per damage avoided. Then flip to the crop advisory — one platform, both seasons. |
| 2:05–2:35 | **Validation.** 2023 hindcast, blind. Numbers, including false positives. |
| 2:35–2:50 | Scale: click the second city. 2,325 cities under the same mandate. |
| 2:50–3:00 | Deployment: ICCC layer, Urban Flooding Cell, budgets that already exist. |

Time it. Cut it. Time it again. Teams lose this by being cut off at 3:00 with the validation slide unshown.

---

## Sources

- [NDMA Guidelines on Management of Urban Flooding, Sept 2010 (NIDM)](https://nidm.gov.in/pdf/guidelines/new/management_urban_flooding.pdf) — watershed basis, Rational Method, GIS mandate, 31 March desilting, ARG density, Urban Flooding Cells
- [Urban Floods — NDMA, Government of India](https://ndma.gov.in/Natural-Hazards/Urban-Floods)
- [2023 Nagpur flood — Wikipedia](https://en.wikipedia.org/wiki/2023_Nagpur_flood) — 109 mm, 4 deaths, ~10,000 houses, ₹266.63 cr package
- [Addressing Urban–Rural Water Conflicts in Nagpur through Benefit Sharing — MDPI *Water* 12(11):2979](https://www.mdpi.com/2073-4441/12/11/2979) — 190 MCM, 78 MCM, 8,658 ha, 104,476 ha
- [Integrated Command and Control Centre — Smart Cities Mission](https://iccc.smartcities.gov.in/)
- [Shimla ICCC flash-flood monitoring, 34 sensors — Deccan Herald](https://www.deccanherald.com/india/shimla-iccc-to-help-tackle-landslides-flash-floods-through-34-sensors-across-himachal-1233186) — precedent
- [₹70 Crore for Ambazari Lake & Nag River Strengthening — The Live Nagpur, Apr 2026](https://thelivenagpur.com/2026/04/03/%E2%82%B970-crore-sanctioned-for-ambazari-lake-nag-river-strengthening/) — *verify*
- [Pora River: NMC ₹874 cr sewage initiative — Nagpur Today](https://nagpurtoday.in/pora-river-gets-lifeline-nmcs-rs-874-cr-initiative-to-tackle-sewage-pollution/03151730) — *verify*
- [Nag River revitalization project — PIB](https://www.pib.gov.in/Pressreleaseshare.aspx?PRID=1766914)
- [Heavy Rain Exposes Nagpur's Poor Drainage — The Live Nagpur, Jul 2026](https://thelivenagpur.com/2026/07/29/heavy-rain-exposes-nagpurs-poor-drainage-waterlogs-several-areas/) — *verify*
- Standards to cite directly: **CPCB Designated Best Use (Class A–E)** · **IS 10500** · **FAO Irrigation & Drainage Paper 29** (water quality for agriculture) · **FAO-56** (Penman-Monteith ET₀)
