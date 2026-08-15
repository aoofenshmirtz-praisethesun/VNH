# Team Briefing
## Viksit Nagpur Hackathon 2026 — what we're building and why

*Read time ~10 minutes. This is everything you need. The reasoning is included, not just the conclusions, because you'll be asked "why" by judges and you need to be able to answer without me.*

---

## 1. What we're walking into

- **17–18 August, VNIT Nagpur.** Theme: **Open Innovation** (no fixed problem statement — we define our own).
- Coding starts 10:00 AM on the 17th, ends 10:00 AM on the 18th. **24 hours.**
- Pitch at noon on the 18th: **3 minutes strictly, then 3 minutes of jury Q&A.**
- 5 members. Deck is 6–7 slides maximum.
- Judges will include **VNIT professors** (so technical claims get tested) **and municipal people** (so deployability gets tested). We have to satisfy both.

Three minutes is brutally short. Most teams get cut off mid-demo. We script it and rehearse it.

---

## 2. The topic, in one sentence

> **Water in Nagpur — is it safe to use, who does it affect, and is anyone fixing it.**

---

## 3. The problem — and this is the part that matters

The obvious version of this project is "Nagpur has water problems, nobody has data, we'll build a dashboard." That's what most teams doing water will pitch, and it's wrong.

**Here's what we actually found.** Nagpur's water *is* measured:

- **OCW** (the private operator running the city's supply) publishes water-quality sample results — current, right up to **May 2026**. 99.6% of samples fit.
- **CGWB** (Central Ground Water Board) has sampled groundwater across the whole district — 263 shallow and 84 deep samples, with village names attached.
- **MPCB** monitors the Nag and Pili rivers and mapped every sewage outfall into them.

So the data exists. But:

- OCW publishes **one number for three million people.** No breakdown by zone, reservoir, or sampling point.
- CGWB's results sit as **scattered points in a PDF** that no resident will ever open.
- MPCB's river data is **sparse and from 2009–11**.

**None of it is connected to the water that actually reaches you.**

> ### Our problem statement
> **"Is my water safe?" is unanswerable in Nagpur — not because nobody measures, but because nobody measures *where you are*.**

**Why this framing is important:** it does not accuse anyone of negligence. OCW is testing. CGWB is sampling. The gap is **resolution and connection**, not effort. If we walk in front of a municipal jury sounding like we're calling the utility incompetent, we lose the room in ten seconds. This framing keeps them on our side while still describing a real failure.

---

## 4. What we're building

**Three questions. Q1 is the project; Q2 and Q3 are built around it.**

### Q1 — Is this water safe, and what for? *(the core)*

A person in Nagpur gets water from one of four places, and we cover all four: **municipal tap, borewell/groundwater, river or nala, canal.**

1. **Where does your water come from?** Enter a location → source, treatment plant, reservoir, and whether that area gets 24x7 or intermittent supply.
2. **Usability verdict** — safe for drinking / bathing / irrigation / industrial use, judged against **IS 10500** (the Indian drinking water standard) and **CPCB Class A–E** (the official "what is this water good for" classification).
3. **Crop verdict** — for farmers: water salinity and pH against **FAO** irrigation limits → which crops tolerate this water, estimated yield loss, whether to blend or switch.
4. **A map of what is actually known** — every real sampling point, with **everything unmeasured left grey.**
5. **Why it's bad here** — which sewage outfalls are upstream of the point you asked about.
6. **Citizen sample entry** — anyone with a ₹300 TDS meter can add a reading.

**Point 4 is the sharpest thing we have.** Most of the city will be grey. That's not a hole in our work — **the grey is the finding.** It's a picture of how little of this city's water is actually measured, and it argues for itself better than any slide we could write. We do not fill it in with guesses.

**Point 6 is what makes it scale.** Government monitoring will never be dense enough. Fifty thousand residents with cheap meters would be.

### Q2 — Which areas suffer, and how badly, for a given amount of rain?

Not "will it flood tonight" — that's a promise we can't keep and most areas won't flood anyway. Instead: **a rainfall-response profile per location.** "This junction starts holding water above roughly 40 mm in two hours."

Plus **advance warning for your specific route** — the night before, not once you're standing in it.

> **The argument:** Google Maps can route you around water, but only after it's already there and traffic has stopped. That's too late for someone on a two-wheeler leaving at 7 AM. Nobody warns you the night before that your usual underpass is the one that goes under.

### Q3 — Is anyone fixing it?

NMC's work data isn't public, so this is crowdsourced: **residents report whether work is happening**, and — the important part — **a follow-up 30 days later asking whether it was actually fixed.**

Complaint systems everywhere record that you complained. Almost none record whether the fix worked. That single question is the most original thing in this project.

---

## 5. The facts we stand on

Learn these. They're all from primary sources and they'll carry the pitch.

**Water supply**
- Nagpur draws **190 MCM/year (~520 MLD)** from Pench — **over 70% of city supply**
- Distribution: **68 reservoirs, 2000+ km of pipeline, 3 million+ consumers**
- When the city took an extra 78 MCM in 2000, the **irrigation command area was cut by 8,658 hectares**

**Sewage and the river**
- City generates **345 MLD** of sewage; treatment was **100 MLD** at one plant → roughly **265 MLD untreated** into the Nag and Pili *(2011 figure — capacity has expanded since, verify before quoting)*
- **9 outfalls into the Nag, 3 into the Pili**
- Nag rises at the **Ambazari overflow weir**, runs 17 km through the city, ~68 km to meet the Kanhan at Agargaon, past **31 villages**
- BOD: **4–13 mg/L at the origin, averaging 57 and peaking at 124 at Bhandewadi Bridge.** The river doesn't arrive polluted — the city does that to it over 17 km

**Groundwater (CGWB, district-wide)**
- Nitrate above limit in **35 of 263 shallow** and **17 of 84 deep** samples — the deep aquifer is *worse*, which is the opposite of what everyone assumes
- Fluoride up to **4.4 mg/L** at Sukali Gharapure, Hingna
- Salinity above the irrigation limit in **5.3%** of shallow samples; **4920 µS/cm at Belgaon, Umred** — double the limit
- **65 of 72 stations show falling pre-monsoon water levels**

**Flooding**
- 24 Sept 2023: **109 mm in a night, 4 deaths, ~10,000 houses affected**, a bridge collapsed
- **₹266.63 crore** mitigation package announced afterwards

**Policy**
- The **NDMA Urban Flooding Guidelines (2010)** already require every Indian city to have a GIS drainage inventory, catchment-based planning, and pre-monsoon desilting done by 31 March. Sixteen years on, it hasn't happened — because it assumes a survey no city can afford.

---

## 6. What we are deliberately NOT building

Being able to say what we rejected, and why, is worth points. This is not a list of things we forgot.

| Not building | Why |
|---|---|
| Any ML prediction model | There's no labelled flood dataset for Nagpur. Training on data we generated ourselves would just be our own assumptions with invented error bars — an examiner spots that instantly |
| Disease outbreak forecasting | Not calibrated to local health data. It'd be a guess wearing a lab coat |
| Groundwater recharge site selection | National soil maps are ~1:250,000 scale. You cannot site anything at that resolution |
| Safe-route navigation | Google does it better, and building it invites the comparison |
| Multi-utility "dig once" coordination | Different domain, data we can't get |

If a judge asks about any of these, the answer isn't "we didn't think of it" — it's "we considered it and here's the specific reason it isn't credible."

---

## 7. What we claim, and what we refuse to claim

**This is the most important section for surviving the professors.**

We do **not** say "fluid dynamics" or "simulation of flooding." Nobody does CFD for city drainage, and claiming it starts a fight we lose. The correct term is **screening-level analysis** — the first-pass triage that real consultants do before committing to detailed modelling.

> **"We're not replacing SWMM or a detailed hydraulic model. This is screening — it tells you which twenty locations out of two thousand deserve a proper look. The output is a priority ranking, not a design discharge."**

**We explicitly do not claim:**
- Flood depth in centimetres at any address
- Lab-grade water quality at any point we haven't measured
- Any calibrated health prediction
- Design-grade numbers anyone should build from

**We do claim:** a ranked, reproducible screening of where the water system is most likely to fail, and a consistent basis for comparing one intervention against another.

Smaller claim. Unbreakable. Still useful. That combination is what wins.

**And we volunteer our own weaknesses before anyone finds them.** A team that names its own failure modes gets trusted on everything else.

---

## 8. Where every number comes from

Anyone can be asked "where's that from?" mid-Q&A. Know this table.

| Layer | Source | Status |
|---|---|---|
| Groundwater quality, village-level | CGWB Nagpur District report | ✅ Real, verified |
| Tap water sample fitness → May 2026 | OCW published report | ✅ Real — **city-wide only, which is the point** |
| River outfalls, BOD by station | MPCB Nag River Basin Action Plan | ✅ Real, dated 2009–11 |
| Drains, streams, rivers, canals | OpenStreetMap — 89 drains, 135 streams, 54 rivers, 24 canals | ✅ Confirmed by our own query |
| Terrain | Copernicus / CartoDEM 30 m | ✅ Free |
| Rainfall forecast | Open-Meteo (no API key) | ✅ Free |
| Flood/clog locations | r/nagpur + our own knowledge | ⬜ Collecting 16 Aug |
| Which reservoir serves which area | — | ❓ **Biggest open gap** |

**Golden rule: anything simulated or assumed gets labelled as such, on screen.** Juries forgive simulated data. They never forgive being misled, and they always ask.

Also: with only a handful of real sampling points, **we never draw a smooth colour gradient across the city.** That would imply knowledge we don't have. Real points shown as points; unmeasured areas grey.

---

## 9. Still open

1. **Which reservoir/source serves which part of the city.** Feature 1 of Q1 depends on it and we can't find it published. Highest-value unknown.
2. **How current the sewage treatment figures are** — the 345/100/265 MLD split is from 2011 and capacity has grown since.
3. **How much of OSM's 89 drains is usable** — they're almost all unnamed, and only 9 have a width recorded.
4. **What we use for the flood-damage side of any cost-benefit claim** — nobody publishes per-location damage figures. Likely answer: rank by people affected and how long water stands, not rupees.

---

## 10. Timeline

**16 August — before the clock starts.** Collect everything. Downloads, r/nagpur harvesting, OCW table copied into a spreadsheet, OSM export saved locally, photos of the spots we know clog. **Data collection is not coding and nobody can object to it.** Having it all on a drive at 10 AM on the 17th is worth six hours.

**17 August, hours 0–18.** Build. Q1 first and completely, then Q2, then Q3.

**Hour 18 — feature freeze. Non-negotiable.**

**Hours 18–24.** Integration, seeding demo data, deck, and rehearsing the three minutes at least six times. Teams lose this by still coding at 09:55.

---

## 11. The lines to remember

> **"Nagpur tests its water and publishes one number for three million people."**

> **"The grey areas on our map aren't missing work. They're the finding."**

> **"We're not measuring new things. We're connecting what's already measured to the person it affects."**

> **"99.6% is an excellent result and a useless answer."**
